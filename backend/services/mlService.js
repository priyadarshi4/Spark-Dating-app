/**
 * Spark ML Service
 * ─────────────────────────────────────────────────────────────────
 * Implements:
 *   1. Collaborative filtering recommendation score
 *   2. ELO-based attractiveness scoring
 *   3. Content-based interest similarity (Jaccard)
 *   4. Engagement scoring
 *   5. Fraud / fake account detection heuristics
 *   6. Compatibility score between two users
 */

const User = require('../models/User');
const Swipe = require('../models/Swipe');
const logger = require('../utils/logger');

// ─── ELO Constants ────────────────────────────────────────────
const ELO_K = 32;
const ELO_BASE = 50; // starting score

/**
 * ELO-like attractiveness score update
 * Like = "win" for target, Pass = "loss"
 */
const updateELO = (scoreA, scoreB, outcome) => {
  const expectedA = 1 / (1 + Math.pow(10, (scoreB - scoreA) / 400));
  return Math.max(0, Math.min(100, scoreA + ELO_K * (outcome - expectedA)));
};

/**
 * Jaccard similarity between two interest arrays
 */
const jaccardSimilarity = (a = [], b = []) => {
  if (!a.length && !b.length) return 0;
  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
};

/**
 * Compute compatibility score between two users (0-100)
 */
exports.computeCompatibility = (userA, userB) => {
  let score = 0;

  // 1. Interest similarity (40 pts max)
  const interestSim = jaccardSimilarity(userA.interests, userB.interests);
  score += interestSim * 40;

  // 2. Age proximity (20 pts max) — closer age = higher score
  if (userA.age && userB.age) {
    const ageDiff = Math.abs(userA.age - userB.age);
    score += Math.max(0, 20 - ageDiff * 2);
  }

  // 3. Relationship goal alignment (20 pts)
  if (userA.relationshipGoal && userA.relationshipGoal === userB.relationshipGoal) {
    score += 20;
  }

  // 4. Both active recently (10 pts)
  const hoursSinceActiveA = (Date.now() - new Date(userA.lastActive)) / 3600000;
  const hoursSinceActiveB = (Date.now() - new Date(userB.lastActive)) / 3600000;
  if (hoursSinceActiveA < 24 && hoursSinceActiveB < 24) score += 10;

  // 5. Education proximity (10 pts)
  if (userA.education && userB.education && userA.education === userB.education) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
};

/**
 * Update engagement score after a swipe/match event
 */
exports.updateEngagementScore = async (swiperId, targetId, event) => {
  try {
    const [swiper, target] = await Promise.all([
      User.findById(swiperId).select('stats'),
      User.findById(targetId).select('stats'),
    ]);
    if (!swiper || !target) return;

    let swiperScore = swiper.stats.attractivenessScore || ELO_BASE;
    let targetScore = target.stats.attractivenessScore || ELO_BASE;

    if (event === 'like') {
      targetScore = updateELO(targetScore, swiperScore, 1); // target "wins"
      swiperScore = updateELO(swiperScore, targetScore, 0); // swiper "loses" a tiny bit
    } else if (event === 'pass') {
      targetScore = updateELO(targetScore, swiperScore, 0);
    } else if (event === 'match') {
      targetScore = updateELO(targetScore, swiperScore, 1);
      swiperScore = updateELO(swiperScore, targetScore, 1);
    }

    await Promise.all([
      User.findByIdAndUpdate(swiperId, { 'stats.attractivenessScore': Math.round(swiperScore) }),
      User.findByIdAndUpdate(targetId, { 'stats.attractivenessScore': Math.round(targetScore) }),
    ]);
  } catch (err) {
    logger.warn('ELO update failed:', err.message);
  }
};

/**
 * Fraud / fake account detection
 * Returns { score: 0-100, flags: string[], shouldBan: boolean }
 */
exports.detectFraud = async (userId) => {
  try {
    const user = await User.findById(userId).select(
      'name bio photos age createdAt stats dailySwipes likedBy'
    );
    if (!user) return { score: 0, flags: [], shouldBan: false };

    let fraudScore = 0;
    const flags = [];

    // No photos
    if (!user.photos.length) { fraudScore += 25; flags.push('no_photos'); }

    // Very short bio
    if (!user.bio || user.bio.length < 10) { fraudScore += 10; flags.push('empty_bio'); }

    // Account too new (<1 day) with high activity
    const accountAgeHours = (Date.now() - new Date(user.createdAt)) / 3600000;
    if (accountAgeHours < 24 && user.stats.totalLikes > 100) {
      fraudScore += 30;
      flags.push('new_account_high_activity');
    }

    // Swipe rate anomaly (>200 swipes/day for non-premium)
    if (user.dailySwipes.count > 200) { fraudScore += 20; flags.push('abnormal_swipe_rate'); }

    // Spam-like name patterns (all caps, numbers in weird places)
    if (/^[A-Z\s]+$/.test(user.name) || /\d{3,}/.test(user.name)) {
      fraudScore += 15;
      flags.push('suspicious_name');
    }

    // No age set
    if (!user.age) { fraudScore += 10; flags.push('missing_age'); }

    const shouldBan = fraudScore >= 70;

    if (flags.length > 0) {
      await User.findByIdAndUpdate(userId, {
        'fraud.score': fraudScore,
        'fraud.flags': flags,
        'fraud.isBanned': shouldBan,
        'fraud.bannedAt': shouldBan ? new Date() : undefined,
        'fraud.banReason': shouldBan ? `Auto-banned: ${flags.join(', ')}` : undefined,
      });
    }

    return { score: fraudScore, flags, shouldBan };
  } catch (err) {
    logger.warn('Fraud detection failed:', err.message);
    return { score: 0, flags: [], shouldBan: false };
  }
};

/**
 * Collaborative filtering: find similar users to recommend
 * Based on: "users who liked the same people also liked..."
 */
exports.getCollaborativeRecommendations = async (userId, limit = 20) => {
  try {
    // Users this person liked
    const myLikes = await Swipe.find({
      swiper: userId,
      action: { $in: ['like', 'superlike'] },
    }).select('swiped');
    const likedIds = myLikes.map(s => s.swiped);

    if (likedIds.length < 3) return []; // Need enough history

    // Who else liked those same users
    const similarUsers = await Swipe.aggregate([
      { $match: { swiped: { $in: likedIds }, action: { $in: ['like', 'superlike'] }, swiper: { $ne: userId } } },
      { $group: { _id: '$swiper', score: { $sum: 1 } } },
      { $sort: { score: -1 } },
      { $limit: 100 },
    ]);

    const similarUserIds = similarUsers.map(u => u._id);

    // Who did those similar users also like (that we haven't seen)
    const alreadySwiped = await Swipe.find({ swiper: userId }).select('swiped');
    const swipedIds = alreadySwiped.map(s => s.swiped.toString());

    const recommendations = await Swipe.aggregate([
      { $match: { swiper: { $in: similarUserIds }, action: { $in: ['like', 'superlike'] }, swiped: { $nin: [...swipedIds, userId] } } },
      { $group: { _id: '$swiped', score: { $sum: 1 } } },
      { $sort: { score: -1 } },
      { $limit: limit },
    ]);

    return recommendations.map(r => r._id);
  } catch (err) {
    logger.warn('Collaborative filter failed:', err.message);
    return [];
  }
};

/**
 * Nightly batch job: recompute engagement scores
 */
exports.runNightlyScoring = async () => {
  try {
    logger.info('Running nightly engagement scoring...');
    const users = await User.find({ isActive: true }).select('stats lastActive premium createdAt');

    for (const user of users) {
      const daysActive = Math.max(1, (Date.now() - new Date(user.createdAt)) / (24 * 3600 * 1000));
      const likesPerDay = user.stats.totalLikes / daysActive;
      const matchRate = user.stats.totalLikes > 0
        ? user.stats.totalMatches / user.stats.totalLikes
        : 0;

      const engagementScore = Math.min(100, Math.round(likesPerDay * 5 + matchRate * 50));
      await User.findByIdAndUpdate(user._id, { 'stats.engagementScore': engagementScore });
    }

    logger.info(`Nightly scoring complete for ${users.length} users`);
  } catch (err) {
    logger.error('Nightly scoring failed:', err.message);
  }
};

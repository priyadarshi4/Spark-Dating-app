const User = require('../models/User');
const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const { createNotification } = require('../services/notificationService');
const { getIO } = require('../config/socket');
const { updateEngagementScore } = require('../services/mlService');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const FREE_SWIPES_PER_DAY = parseInt(process.env.FREE_SWIPES_PER_DAY) || 50;


// ─── @POST /api/swipes ────────────────────────────────────────
// Body: { targetUserId, action: 'like'|'pass'|'superlike' }
exports.swipe = async (req, res, next) => {
  try {
    const { targetUserId, action } = req.body;
    const userId = req.user.id;

    if (userId === targetUserId) {
      return res.status(400).json({ success: false, message: "Can't swipe on yourself" });
    }

    // Check if already swiped
    const existing = await Swipe.findOne({ swiper: userId, swiped: targetUserId });
    if (existing && !existing.isRewound) {
      return res.status(400).json({ success: false, message: 'Already swiped on this user' });
    }

    const [swiper, target] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId),
    ]);

    if (!swiper || !target || !target.isActive || target.fraud.isBanned) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ─── Daily swipe limit ────────────────────────────────────
    swiper.resetDailySwipesIfNeeded();
    const isPremium = swiper.premium.isActive;

    if (!isPremium && swiper.dailySwipes.count >= FREE_SWIPES_PER_DAY) {
      return res.status(429).json({
        success: false,
        message: 'Daily swipe limit reached',
        upgradeRequired: true,
      });
    }

    // ─── Superlike limit ──────────────────────────────────────
    if (action === 'superlike' && swiper.premium.superLikesRemaining <= 0) {
      return res.status(429).json({ success: false, message: 'No superlikes remaining today' });
    }

    // ─── Create or update swipe record ───────────────────────
    await Swipe.findOneAndUpdate(
      { swiper: userId, swiped: targetUserId },
      { action, isRewound: false, rewoundAt: null },
      { upsert: true, new: true }
    );

    // ─── Update stats & counts ────────────────────────────────
    swiper.dailySwipes.count += 1;
    if (action === 'superlike') swiper.premium.superLikesRemaining -= 1;

    if (action === 'like' || action === 'superlike') {
      await Promise.all([
        User.findByIdAndUpdate(userId, {
          $inc: { 'stats.totalLikes': 1 },
          dailySwipes: swiper.dailySwipes,
          'premium.superLikesRemaining': swiper.premium.superLikesRemaining,
        }),
        User.findByIdAndUpdate(targetUserId, {
          $addToSet: { likedBy: userId },
        }),
      ]);

      // Notify target of superlike (visible to all)
      if (action === 'superlike') {
        await createNotification({
          recipient: targetUserId,
          type: 'superlike',
          title: '⭐ Super Like!',
          body: `${swiper.name} super liked you!`,
          relatedUser: userId,
        });
        getIO().to(`user:${targetUserId}`).emit('superlike:received', { from: userId, name: swiper.name });
      }
    } else {
      await Promise.all([
        User.findByIdAndUpdate(userId, {
          $inc: { 'stats.totalPasses': 1 },
          dailySwipes: swiper.dailySwipes,
        }),
        User.findByIdAndUpdate(targetUserId, {
          $addToSet: { dislikedBy: userId },
        }),
      ]);
    }

    // ─── Match check ──────────────────────────────────────────
    let matchData = null;
    if (action === 'like' || action === 'superlike') {
      const mutualSwipe = await Swipe.findOne({
        swiper: targetUserId,
        swiped: userId,
        action: { $in: ['like', 'superlike'] },
        isRewound: false,
      });

      if (mutualSwipe) {
        // It's a match! 🎉
        const existingMatch = await Match.findOne({ users: { $all: [userId, targetUserId] } });

        if (!existingMatch) {
          // Compute shared interests for compatibility
          const sharedInterests = swiper.interests.filter(i => target.interests.includes(i));
          const compatScore = Math.min(100, sharedInterests.length * 10 + 50);

          const match = await Match.create({
            users: [userId, targetUserId],
            initiatedBy: userId,
            isSuperMatch: action === 'superlike' || mutualSwipe.action === 'superlike',
            sharedInterests,
            compatibilityScore: compatScore,
          });

          // Update users' matches arrays
          await Promise.all([
            User.findByIdAndUpdate(userId, {
              $addToSet: { matches: targetUserId },
              $inc: { 'stats.totalMatches': 1 },
            }),
            User.findByIdAndUpdate(targetUserId, {
              $addToSet: { matches: userId },
              $inc: { 'stats.totalMatches': 1 },
            }),
          ]);

          // Notify both users
          await Promise.all([
            createNotification({ recipient: userId, type: 'match', title: '💖 It\'s a Match!', body: `You matched with ${target.name}!`, relatedUser: targetUserId, relatedMatch: match._id }),
            createNotification({ recipient: targetUserId, type: 'match', title: '💖 It\'s a Match!', body: `You matched with ${swiper.name}!`, relatedUser: userId, relatedMatch: match._id }),
          ]);

          // Real-time match event
          const io = getIO();
          io.to(`user:${userId}`).emit('match:new', { match, otherUser: target.toPublicProfile() });
          io.to(`user:${targetUserId}`).emit('match:new', { match, otherUser: swiper.toPublicProfile() });

          // Join both to match room
          io.in(`user:${userId}`).socketsJoin(`match:${match._id}`);
          io.in(`user:${targetUserId}`).socketsJoin(`match:${match._id}`);

          matchData = { matched: true, matchId: match._id, compatibilityScore: compatScore, sharedInterests };

          // Update ELO scores
          await updateEngagementScore(userId, targetUserId, 'match');
        }
      }
    }

    // Cache swipe in Redis for fast feed deduplication
    await redisClient.sAdd(`swiped:${userId}`, targetUserId).catch(() => {});
    await redisClient.expire(`swiped:${userId}`, 7 * 24 * 3600).catch(() => {});

    res.json({
      success: true,
      action,
      match: matchData,
      swipesRemaining: isPremium ? Infinity : Math.max(0, FREE_SWIPES_PER_DAY - swiper.dailySwipes.count),
    });

  } catch (err) {
    next(err);
  }
};

// ─── @POST /api/swipes/rewind ─────────────────────────────────
exports.rewind = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.premium.isActive && user.premium.rewindsRemaining <= 0) {
      return res.status(403).json({ success: false, message: 'Premium required for rewinds', upgradeRequired: true });
    }

    // Find last swipe
    const lastSwipe = await Swipe.findOne({ swiper: userId, isRewound: false })
      .sort({ createdAt: -1 });

    if (!lastSwipe) return res.status(404).json({ success: false, message: 'Nothing to rewind' });

    // Check time limit (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    if (lastSwipe.createdAt < oneHourAgo) {
      return res.status(400).json({ success: false, message: 'Rewind window expired (1 hour)' });
    }

    lastSwipe.isRewound = true;
    lastSwipe.rewoundAt = new Date();
    await lastSwipe.save();

    // Remove from target's likedBy / dislikedBy
    if (lastSwipe.action === 'like' || lastSwipe.action === 'superlike') {
      await User.findByIdAndUpdate(lastSwipe.swiped, { $pull: { likedBy: userId } });
    } else {
      await User.findByIdAndUpdate(lastSwipe.swiped, { $pull: { dislikedBy: userId } });
    }

    // Decrement rewinds if not premium
    if (!user.premium.isActive) {
      await User.findByIdAndUpdate(userId, { $inc: { 'premium.rewindsRemaining': -1 } });
    }

    res.json({ success: true, message: 'Rewound last swipe', rewindedUser: lastSwipe.swiped });
  } catch (err) {
    next(err);
  }
};

// ─── @GET /api/swipes/feed ────────────────────────────────────
exports.getDiscoveryFeed = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const {
      page = 1,
      limit = 10,
      maxDistance,
      minAge,
      maxAge,
    } = req.query;

    const prefs = user.preferences;
    const distKm = maxDistance || prefs.maxDistance || 50;
    const ageMin = parseInt(minAge) || prefs.ageMin || 18;
    const ageMax = parseInt(maxAge) || prefs.ageMax || 50;

    // Get IDs to exclude (already swiped)
    const swipedIds = await redisClient.sMembers(`swiped:${userId}`).catch(async () => {
      const swipes = await Swipe.find({ swiper: userId, isRewound: false }).select('swiped');
      return swipes.map(s => s.swiped.toString());
    });

    const excludeIds = [userId, ...swipedIds, ...user.blockedUsers];

    const genderFilter = prefs.genderPreference?.includes('all')
      ? {}
      : { gender: { $in: prefs.genderPreference } };

    const query = {
      _id: { $nin: excludeIds },
      isActive: true,
      'fraud.isBanned': false,
      'preferences.showMe': true,
      age: { $gte: ageMin, $lte: ageMax },
      ...genderFilter,
    };

    // Geo filter if coordinates available
    let users;
    if (user.location?.coordinates?.[0] !== 0) {
      users = await User.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: user.location.coordinates },
            distanceField: 'distance',
            maxDistance: distKm * 1000, // meters
            query,
            spherical: true,
          },
        },
        // Boost premium users and recently active users
        {
          $addFields: {
            rankScore: {
              $add: [
                { $multiply: [{ $cond: ['$premium.boostActiveUntil', 30, 0] }, 1] },
                { $multiply: ['$stats.attractivenessScore', 0.5] },
                {
                  $multiply: [{
                    $divide: [1, { $add: [{ $divide: ['$distance', 1000] }, 1] }]
                  }, 20]
                },
              ]
            }
          }
        },
        { $sort: { rankScore: -1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) },
        {
          $project: {
            name: 1, age: 1, bio: 1, photos: 1, interests: 1,
            occupation: 1, height: 1, relationshipGoal: 1,
            isOnline: 1, lastActive: 1, distance: { $divide: ['$distance', 1000] },
            'premium.isActive': 1, gender: 1, pronouns: 1,
            'stats.attractivenessScore': 1,
          }
        },
      ]);
    } else {
      users = await User.find(query)
        .select('name age bio photos interests occupation height relationshipGoal isOnline lastActive gender pronouns stats.attractivenessScore premium.isActive')
        .sort({ 'premium.boostActiveUntil': -1, 'stats.attractivenessScore': -1, lastActive: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
    }

    res.json({
      success: true,
      data: users,
      page: parseInt(page),
      hasMore: users.length === parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

// ─── @GET /api/swipes/who-liked-me (Premium) ─────────────────
exports.whoLikedMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const { page = 1, limit = 20 } = req.query;

    const likers = await User.find({
      _id: { $in: user.likedBy },
      isActive: true,
      'fraud.isBanned': false,
    })
      .select('name age photos isOnline lastActive interests gender')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    // For free users, blur/hide profile details
    const isPremium = user.premium.isActive;
    const processedLikers = likers.map(liker => {
      if (!isPremium) {
        return { _id: liker._id, isBlurred: true, gender: liker.gender };
      }
      return liker;
    });

    res.json({
      success: true,
      data: processedLikers,
      total: user.likedBy.length,
      isPremium,
    });
  } catch (err) {
    next(err);
  }
};

const cron = require('node-cron');
const { runNightlyScoring } = require('../services/mlService');
const User  = require('../models/User');
const logger = require('../utils/logger');

// ─── Reset daily swipes at midnight ──────────────────────────
cron.schedule('0 0 * * *', async () => {
  logger.info('Cron: Resetting daily swipe counts...');
  try {
    const now = new Date();
    await User.updateMany(
      { 'dailySwipes.resetAt': { $lte: now } },
      { 'dailySwipes.count': 0, 'dailySwipes.resetAt': new Date(Date.now() + 86400000) }
    );

    // Reset super likes for non-premium users
    await User.updateMany(
      { 'premium.isActive': false },
      { 'premium.superLikesRemaining': 1 }
    );

    logger.info('Cron: Daily swipes reset complete');
  } catch (err) {
    logger.error('Cron: Daily reset failed', err.message);
  }
});

// ─── Nightly ML scoring at 2 AM ──────────────────────────────
cron.schedule('0 2 * * *', async () => {
  logger.info('Cron: Running nightly ML scoring...');
  await runNightlyScoring();
});

// ─── Expire boosts every 5 minutes ───────────────────────────
cron.schedule('*/5 * * * *', async () => {
  try {
    await User.updateMany(
      { 'premium.boostActiveUntil': { $lte: new Date() } },
      { $unset: { 'premium.boostActiveUntil': 1 } }
    );
  } catch (err) {
    logger.warn('Cron: Boost expiry failed', err.message);
  }
});

// ─── Weekly: expire premium subscriptions ────────────────────
cron.schedule('0 3 * * 0', async () => {
  logger.info('Cron: Checking expired premium subscriptions...');
  try {
    const result = await User.updateMany(
      { 'premium.isActive': true, 'premium.expiresAt': { $lte: new Date() } },
      { 'premium.isActive': false, 'premium.plan': 'none' }
    );
    if (result.modifiedCount > 0) {
      logger.info(`Cron: Expired ${result.modifiedCount} premium subscriptions`);
    }
  } catch (err) {
    logger.error('Cron: Premium expiry failed', err.message);
  }
});

logger.info('✅ Cron jobs registered');
module.exports = {};

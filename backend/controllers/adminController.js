// controllers/adminController.js
const User = require('../models/User');
const Match = require('../models/Match');
const Swipe = require('../models/Swipe');
const { detectFraud, runNightlyScoring } = require('../services/mlService');


exports.getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalMatches, bannedUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, lastActive: { $gte: new Date(Date.now() - 7 * 86400000) } }),
      Match.countDocuments(),
      User.countDocuments({ 'fraud.isBanned': true }),
    ]);
    res.json({ success: true, data: { totalUsers, activeUsers, totalMatches, bannedUsers } });
  } catch (err) { next(err); }
};

exports.banUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { 'fraud.isBanned': true, 'fraud.bannedAt': new Date(), 'fraud.banReason': req.body.reason || 'Admin ban', isActive: false });
    res.json({ success: true, message: 'User banned' });
  } catch (err) { next(err); }
};

exports.unbanUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { 'fraud.isBanned': false, isActive: true });
    res.json({ success: true, message: 'User unbanned' });
  } catch (err) { next(err); }
};

exports.getReports = async (req, res, next) => {
  try {
    const reported = await User.find({ reportedBy: { $exists: true, $ne: [] } })
      .select('name email reportedBy fraud createdAt').sort({ 'reportedBy.length': -1 });
    res.json({ success: true, data: reported });
  } catch (err) { next(err); }
};

exports.runFraudScan = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true, 'fraud.isBanned': false }).select('_id');
    let scanned = 0, banned = 0;
    for (const u of users) {
      const result = await detectFraud(u._id);
      scanned++;
      if (result.shouldBan) banned++;
    }
    res.json({ success: true, scanned, banned });
  } catch (err) { next(err); }
};

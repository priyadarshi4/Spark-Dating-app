// controllers/matchController.js
const Match = require('../models/Match');
const User = require('../models/User');

exports.getMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ users: req.user.id, isActive: true })
      .populate({ path: 'users', select: 'name age photos isOnline lastActive' })
      .sort({ 'lastMessage.sentAt': -1, createdAt: -1 });
    res.json({ success: true, data: matches });
  } catch (err) { next(err); }
};


exports.getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, users: req.user.id })
      .populate({ path: 'users', select: 'name age photos isOnline lastActive bio interests' });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    res.json({ success: true, data: match });
  } catch (err) { next(err); }
};

exports.unmatch = async (req, res, next) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, users: req.user.id });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    match.isActive = false; match.unmatchedBy = req.user.id; match.unmatchedAt = new Date();
    await match.save();
    const otherId = match.users.find(u => u.toString() !== req.user.id);
    await Promise.all([
      User.findByIdAndUpdate(req.user.id, { $pull: { matches: otherId } }),
      User.findByIdAndUpdate(otherId, { $pull: { matches: req.user.id } }),
    ]);
    res.json({ success: true, message: 'Unmatched' });
  } catch (err) { next(err); }
};

exports.getMatchStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [total, newToday] = await Promise.all([
      Match.countDocuments({ users: userId, isActive: true }),
      Match.countDocuments({ users: userId, isActive: true, createdAt: { $gte: new Date(Date.now() - 86400000) } }),
    ]);
    res.json({ success: true, data: { total, newToday } });
  } catch (err) { next(err); }
};

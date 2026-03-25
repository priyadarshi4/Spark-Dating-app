// controllers/chatController.js
const Message = require('../models/Message');
const Match = require('../models/Match');

exports.getMessages = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const match = await Match.findOne({ _id: matchId, users: req.user.id });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    const messages = await Message.find({ matchId, isDeleted: false })
      .populate('sender', 'name photos')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: messages.reverse(), page: parseInt(page) });
  } catch (err) { next(err); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { content, type = 'text', mediaUrl } = req.body;
    const match = await Match.findOne({ _id: matchId, users: req.user.id, isActive: true });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    const message = await Message.create({ matchId, sender: req.user.id, content, type, mediaUrl });
    await message.populate('sender', 'name photos');
    await Match.findByIdAndUpdate(matchId, { lastMessage: { content, sender: req.user.id, sentAt: new Date(), type } });
    res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const msg = await Message.findOne({ _id: req.params.msgId, sender: req.user.id });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    msg.isDeleted = true; msg.deletedAt = new Date();
    await msg.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const msg = await Message.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ success: false, message: 'Not found' });
    const existing = msg.reactions.findIndex(r => r.user.toString() === req.user.id);
    if (existing >= 0) msg.reactions.splice(existing, 1);
    if (emoji) msg.reactions.push({ user: req.user.id, emoji });
    await msg.save();
    res.json({ success: true, data: msg.reactions });
  } catch (err) { next(err); }
};

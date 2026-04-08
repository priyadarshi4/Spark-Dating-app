// controllers/notificationController.js
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const notifs = await Notification.find({ recipient: req.user.id })
      .populate('relatedUser', 'name photos')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
    res.json({ success: true, data: notifs, unreadCount });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user.id }, { isRead: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

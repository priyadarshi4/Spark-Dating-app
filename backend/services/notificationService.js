// services/notificationService.js
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const logger = require('../utils/logger');

exports.createNotification = async (data) => {
  try {
    const notif = await Notification.create(data);
    // Real-time push
    try {
      getIO().to(`user:${data.recipient}`).emit('notification:new', notif);
    } catch (_) {}
    return notif;
  } catch (err) {
    logger.warn('Notification creation failed:', err.message);
  }
};


exports.getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, isRead: false });
};

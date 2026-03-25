const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Match = require('../models/Match');
const { createNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL, 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth middleware ─────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name mainPhoto isActive fraud');

      if (!user || !user.isActive || user.fraud.isBanned) {
        return next(new Error('Access denied'));
      }

      socket.userId = decoded.id;
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection handler ──────────────────────────────────────
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    logger.info(`Socket connected: ${userId}`);

    // Mark user online
    await User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() });
    socket.join(`user:${userId}`); // Personal room
    io.emit('user:online', { userId }); // Broadcast online status

    // ─── Join match rooms ──────────────────────────────────────
    socket.on('join:matches', async () => {
      const matches = await Match.find({ users: userId, isActive: true }).select('_id');
      matches.forEach(m => socket.join(`match:${m._id}`));
    });

    // ─── Typing indicators ─────────────────────────────────────
    socket.on('typing:start', ({ matchId }) => {
      socket.to(`match:${matchId}`).emit('typing:start', { userId, matchId });
    });

    socket.on('typing:stop', ({ matchId }) => {
      socket.to(`match:${matchId}`).emit('typing:stop', { userId, matchId });
    });

    // ─── Send message ──────────────────────────────────────────
    socket.on('message:send', async (data, callback) => {
      try {
        const { matchId, content, type = 'text', mediaUrl, replyTo } = data;

        // Verify match membership
        const match = await Match.findOne({ _id: matchId, users: userId, isActive: true });
        if (!match) return callback({ error: 'Match not found' });

        // Create message
        const message = await Message.create({
          matchId,
          sender: userId,
          content: content?.trim(),
          type,
          mediaUrl,
          replyTo,
        });

        // Update match last message
        await Match.findByIdAndUpdate(matchId, {
          lastMessage: { content: content || (type === 'image' ? '📷 Photo' : '💌'), sender: userId, sentAt: new Date(), type },
          $inc: { [`unread.${match.getOtherUser(userId)}`]: 1 },
        });

        // Populate sender info
        await message.populate('sender', 'name photos');

        // Emit to match room
        io.to(`match:${matchId}`).emit('message:new', message);

        // Push notification to recipient
        const recipientId = match.getOtherUser(userId);
        await createNotification({
          recipient: recipientId,
          type: 'message',
          title: socket.user.name,
          body: content || '💌 Sent you a message',
          data: { matchId },
          relatedUser: userId,
          relatedMatch: matchId,
        });

        callback({ success: true, message });
      } catch (err) {
        logger.error('message:send error', err);
        callback({ error: 'Failed to send message' });
      }
    });

    // ─── Read receipt ──────────────────────────────────────────
    socket.on('message:read', async ({ matchId }) => {
      await Message.updateMany(
        { matchId, sender: { $ne: userId }, 'readBy.user': { $ne: userId } },
        { $push: { readBy: { user: userId } } }
      );
      // Reset unread count
      await Match.findByIdAndUpdate(matchId, { [`unread.${userId}`]: 0 });
      socket.to(`match:${matchId}`).emit('message:read', { matchId, userId });
    });

    // ─── New match celebration ─────────────────────────────────
    socket.on('match:celebrate', ({ matchId }) => {
      io.to(`match:${matchId}`).emit('match:celebrate', { matchId });
    });

    // ─── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${userId}`);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastActive: new Date() });
      io.emit('user:offline', { userId, lastActive: new Date() });
    });
  });

  logger.info('✅ Socket.io initialized');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };

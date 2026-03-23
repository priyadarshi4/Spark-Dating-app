require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const passport = require('passport');

const connectDB = require('./config/database');
const connectRedis = require('./config/redis');
const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// ─── Route imports ────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const swipeRoutes = require('./routes/swipes');
const matchRoutes = require('./routes/matches');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const mediaRoutes = require('./routes/media');
const premiumRoutes = require('./routes/premium');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// ─── Connect to services ─────────────────────────────────────
connectDB();
if (process.env.REDIS_URL) {
  connectRedis();
} else {
  const logger = require('./utils/logger');
  logger.warn('⚠️  Redis disabled — no REDIS_URL in .env. This is fine for development.');
}

// ─── Initialize Socket.io ────────────────────────────────────
initSocket(server);

// ─── Passport config ─────────────────────────────────────────
require('./config/passport')(passport);

// ─── Core middleware ─────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Global rate limiter ──────────────────────────────────────
app.use('/api/', rateLimiter.general);

// ─── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Spark API', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swipes', swipeRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 handler ─────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ────────────────────────────────────
app.use(errorHandler);

// ─── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Spark API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// ─── Graceful shutdown ───────────────────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

module.exports = { app, server };

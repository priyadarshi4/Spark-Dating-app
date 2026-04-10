const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');


// ─── Token helpers ────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: user.toPublicProfile ? user.toPublicProfile() : user,
  });
};

// ─── @POST /api/auth/register ─────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, age, gender, birthday } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    const user = await User.create({ name, email, password, age, gender, birthday });

    // Send verification email
    const token = crypto.randomBytes(32).toString('hex');
    user.verifyToken = crypto.createHash('sha256').update(token).digest('hex');
    user.verifyTokenExpire = Date.now() + 24 * 3600 * 1000; // 24h
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    await sendEmail({
      to: email,
      subject: '💖 Welcome to Spark – Verify your email',
      template: 'verifyEmail',
      data: { name: user.name, verifyUrl },
    }).catch(err => logger.warn('Verify email failed:', err.message));

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ─── @POST /api/auth/login ────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });
    if (user.fraud.isBanned) return res.status(403).json({ success: false, message: 'Account suspended' });

    user.lastActive = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ─── @GET /api/auth/google ────────────────────────────────────
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

// ─── @GET /api/auth/google/callback ──────────────────────────
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL}/auth?error=oauth_failed`);
    }
    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    // Redirect to frontend with tokens in query (frontend stores in memory / httpOnly cookie)
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&refresh=${refreshToken}`);
  })(req, res, next);
};

// ─── @POST /api/auth/refresh ──────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${refreshToken}`).catch(() => null);
    if (isBlacklisted) return res.status(401).json({ success: false, message: 'Token revoked' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'User not found' });

    const newToken = signToken(user._id);
    res.json({ success: true, token: newToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// ─── @POST /api/auth/logout ───────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      // Blacklist refresh token for 30 days
      await redisClient.setEx(`blacklist:${refreshToken}`, 30 * 24 * 3600, '1').catch(() => {});
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── @GET /api/auth/me ────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('matches', 'name photos lastActive isOnline');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.toPublicProfile() });
  } catch (err) {
    next(err);
  }
};

// ─── @POST /api/auth/verify-email ────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      verifyToken: hashedToken,
      verifyTokenExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── @POST /api/auth/forgot-password ─────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ success: true, message: 'If this email exists, a reset link was sent' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = Date.now() + 3600 * 1000; // 1h
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: '🔑 Reset your Spark password',
      template: 'resetPassword',
      data: { name: user.name, resetUrl },
    });

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    next(err);
  }
};

// ─── @POST /api/auth/reset-password ──────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

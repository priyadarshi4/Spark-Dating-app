// ─── middleware/auth.js ──────────────────────────────────────
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized – no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!req.user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });
    if (req.user.fraud.isBanned) return res.status(403).json({ success: false, message: 'Account suspended' });

    req.user.lastActive = new Date();
    await User.findByIdAndUpdate(decoded.id, { lastActive: new Date() });

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const requirePremium = (req, res, next) => {
  if (!req.user.premium.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required',
      upgradeRequired: true,
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = { protect, requirePremium, requireAdmin };

const express = require('express');
const router = express.Router();
const {
  register, login, logout, getMe, googleAuth, googleCallback,
  refreshToken, verifyEmail, forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { rules, validate } = require('../middleware/validator');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/register', rateLimiter.auth, rules.register, validate, register);
router.post('/login',    rateLimiter.auth, rules.login, validate, login);
router.post('/logout',   protect, logout);
router.post('/refresh',  refreshToken);
router.get('/me',        protect, getMe);
router.get('/google',    googleAuth);
router.get('/google/callback', googleCallback);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', rateLimiter.auth, forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;

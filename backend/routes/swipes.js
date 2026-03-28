// routes/swipes.js
const express = require('express');
const router = express.Router();
const { swipe, rewind, getDiscoveryFeed, whoLikedMe } = require('../controllers/swipeController');
const { protect } = require('../middleware/auth');
const { rules, validate } = require('../middleware/validator');
const rateLimiter = require('../middleware/rateLimiter');

router.use(protect);
router.get('/feed', getDiscoveryFeed);
router.get('/who-liked-me', whoLikedMe);
router.post('/', rateLimiter.swipe, rules.swipe, validate, swipe);
router.post('/rewind', rewind);
module.exports = router;

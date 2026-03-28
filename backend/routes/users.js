const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, updateLocation, updatePreferences,
  deleteAccount, blockUser, reportUser, getUserById,
  searchUsers, updatePushToken,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { rules, validate } = require('../middleware/validator');

router.use(protect); // All user routes require auth

router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.put('/profile', rules.updateProfile, validate, updateProfile);
router.put('/location', updateLocation);
router.put('/preferences', updatePreferences);
router.put('/push-token', updatePushToken);
router.delete('/me', deleteAccount);
router.post('/:id/block', blockUser);
router.post('/:id/report', reportUser);

module.exports = router;

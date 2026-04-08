// ─── routes/swipes.js ─────────────────────────────────────────
const express = require('express');
const swipeRouter = express.Router();
const { swipe, rewind, getDiscoveryFeed, whoLikedMe } = require('../controllers/swipeController');
const { protect } = require('../middleware/auth');
const { rules, validate } = require('../middleware/validator');
const rateLimiter = require('../middleware/rateLimiter');

swipeRouter.use(protect);
swipeRouter.get('/feed', getDiscoveryFeed);
swipeRouter.get('/who-liked-me', whoLikedMe);
swipeRouter.post('/', rateLimiter.swipe, rules.swipe, validate, swipe);
swipeRouter.post('/rewind', rewind);

// ─── routes/matches.js ────────────────────────────────────────
const matchRouter = express.Router();
const { getMatches, getMatchById, unmatch, getMatchStats } = require('../controllers/matchController');

matchRouter.use(protect);
matchRouter.get('/', getMatches);
matchRouter.get('/stats', getMatchStats);
matchRouter.get('/:id', getMatchById);
matchRouter.delete('/:id', unmatch);

// ─── routes/chat.js ───────────────────────────────────────────
const chatRouter = express.Router();
const { getMessages, sendMessage, deleteMessage, reactToMessage } = require('../controllers/chatController');
const rateLimiter2 = require('../middleware/rateLimiter');

chatRouter.use(protect);
chatRouter.get('/:matchId/messages', getMessages);
chatRouter.post('/:matchId/messages', rateLimiter2.message, rules.message, validate, sendMessage);
chatRouter.delete('/:matchId/messages/:msgId', deleteMessage);
chatRouter.post('/:matchId/messages/:msgId/react', reactToMessage);

// ─── routes/notifications.js ──────────────────────────────────
const notifRouter = express.Router();
const { getNotifications, markRead, markAllRead, deleteNotification } = require('../controllers/notificationController');

notifRouter.use(protect);
notifRouter.get('/', getNotifications);
notifRouter.put('/:id/read', markRead);
notifRouter.put('/read-all', markAllRead);
notifRouter.delete('/:id', deleteNotification);

// ─── routes/media.js ──────────────────────────────────────────
const mediaRouter = express.Router();
const { uploadPhoto, deletePhoto, reorderPhotos, setMainPhoto } = require('../controllers/mediaController');
const { upload } = require('../config/cloudinary');
const rateLimiter3 = require('../middleware/rateLimiter');

mediaRouter.use(protect);
mediaRouter.post('/photos', rateLimiter3.upload, upload.single('photo'), uploadPhoto);
mediaRouter.delete('/photos/:photoId', deletePhoto);
mediaRouter.put('/photos/reorder', reorderPhotos);
mediaRouter.put('/photos/:photoId/main', setMainPhoto);

// ─── routes/premium.js ────────────────────────────────────────
const premiumRouter = express.Router();
const { createCheckoutSession, handleWebhook, activateBoost, getPremiumStatus } = require('../controllers/premiumController');

premiumRouter.use(protect);
premiumRouter.get('/status', getPremiumStatus);
premiumRouter.post('/checkout', createCheckoutSession);
premiumRouter.post('/boost', activateBoost);
premiumRouter.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// ─── routes/admin.js ──────────────────────────────────────────
const adminRouter = express.Router();
const { protect: adminProtect, requireAdmin } = require('../middleware/auth');
const { getDashboard, banUser, unbanUser, getReports, runFraudScan } = require('../controllers/adminController');

adminRouter.use(adminProtect, requireAdmin);
adminRouter.get('/dashboard', getDashboard);
adminRouter.post('/users/:id/ban', banUser);
adminRouter.post('/users/:id/unban', unbanUser);
adminRouter.get('/reports', getReports);
adminRouter.post('/fraud-scan', runFraudScan);

module.exports = { swipeRouter, matchRouter, chatRouter, notifRouter, mediaRouter, premiumRouter, adminRouter };

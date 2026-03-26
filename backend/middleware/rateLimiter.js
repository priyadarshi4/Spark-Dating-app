const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
  });

module.exports = {
  general: createLimiter(15 * 60 * 1000, 100, 'Too many requests, please slow down'),
  auth: createLimiter(15 * 60 * 1000, 10, 'Too many auth attempts, try again in 15 minutes'),
  swipe: createLimiter(60 * 1000, 30, 'Swipe rate limit exceeded'),
  message: createLimiter(60 * 1000, 60, 'Message rate limit exceeded'),
  upload: createLimiter(60 * 1000, 10, 'Upload rate limit exceeded'),
};

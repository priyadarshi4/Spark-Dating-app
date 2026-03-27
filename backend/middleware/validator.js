const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const rules = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('age').isInt({ min: 18, max: 100 }).withMessage('Must be 18 or older'),
    body('gender').isIn(['male', 'female', 'nonbinary', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  swipe: [
    body('targetUserId').isMongoId().withMessage('Invalid user ID'),
    body('action').isIn(['like', 'pass', 'superlike']).withMessage('Invalid action'),
  ],
  message: [
    body('content').if(body('type').equals('text')).trim().notEmpty().withMessage('Message cannot be empty').isLength({ max: 2000 }),
    body('type').isIn(['text', 'image', 'gif', 'emoji', 'sticker']).withMessage('Invalid message type'),
  ],
  updateProfile: [
    body('name').optional().trim().isLength({ min: 1, max: 50 }),
    body('bio').optional().isLength({ max: 500 }),
    body('age').optional().isInt({ min: 18, max: 100 }),
    body('interests').optional().isArray({ max: 30 }),
    body('occupation').optional().isLength({ max: 100 }),
  ],
};

module.exports = { validate, rules };

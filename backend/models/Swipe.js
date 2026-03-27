const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
  swiper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  swiped: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: ['like', 'pass', 'superlike', 'rewind'],
    required: true,
  },
  // Used for undo/rewind
  isRewound: { type: Boolean, default: false },
  rewoundAt: Date,
}, {
  timestamps: true,
});

// ─── Indexes ─────────────────────────────────────────────────
swipeSchema.index({ swiper: 1, swiped: 1 }, { unique: true });
swipeSchema.index({ swiper: 1, action: 1, createdAt: -1 });
swipeSchema.index({ swiped: 1, action: 1 }); // who liked a given user

module.exports = mongoose.model('Swipe', swipeSchema);

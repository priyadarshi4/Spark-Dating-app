const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    maxlength: 2000,
    trim: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'gif', 'emoji', 'sticker', 'audio'],
    default: 'text',
  },
  mediaUrl: String,
  
  // Read receipts
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
  
  // Reactions
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, maxlength: 10 },
  }],
  
  // Reply threading
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, {
  timestamps: true,
});

// ─── Indexes ─────────────────────────────────────────────────
messageSchema.index({ matchId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);

const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who liked first
  isSuperMatch: { type: Boolean, default: false }, // superlike involved
  
  // Chat state
  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: Date,
    type: { type: String, enum: ['text', 'image', 'gif', 'emoji'], default: 'text' },
  },
  
  // Unread counts per user
  unread: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  
  // State
  isActive: { type: Boolean, default: true },
  unmatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  unmatchedAt: Date,
  
  // Compatibility (ML-computed)
  compatibilityScore: { type: Number, default: 0 },
  sharedInterests: [String],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ─── Indexes ─────────────────────────────────────────────────
matchSchema.index({ users: 1 });
matchSchema.index({ 'lastMessage.sentAt': -1 });
matchSchema.index({ isActive: 1 });
matchSchema.index({ createdAt: -1 });

// ─── Virtual: other user helper ─────────────────────────────
matchSchema.methods.getOtherUser = function (userId) {
  return this.users.find(u => u.toString() !== userId.toString());
};

module.exports = mongoose.model('Match', matchSchema);

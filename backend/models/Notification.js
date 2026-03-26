const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['match', 'message', 'superlike', 'like', 'boost', 'system', 'profile_view'],
    required: true,
  },
  title: { type: String, maxlength: 100 },
  body: { type: String, maxlength: 300 },
  data: { type: mongoose.Schema.Types.Mixed }, // extra payload
  isRead: { type: Boolean, default: false, index: true },
  readAt: Date,
  
  // Reference to related docs
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

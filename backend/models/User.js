const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String }, // Cloudinary public_id
  isMain: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { _id: true });

const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  city: String,
  country: String,
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

const preferencesSchema = new mongoose.Schema({
  ageMin: { type: Number, default: 18, min: 18, max: 100 },
  ageMax: { type: Number, default: 35, min: 18, max: 100 },
  maxDistance: { type: Number, default: 50 }, // km
  genderPreference: {
    type: [String],
    enum: ['male', 'female', 'nonbinary', 'all'],
    default: ['all'],
  },
  showMe: { type: Boolean, default: true },
}, { _id: false });

const statsSchema = new mongoose.Schema({
  totalLikes: { type: Number, default: 0 },
  totalPasses: { type: Number, default: 0 },
  totalMatches: { type: Number, default: 0 },
  totalSuperLikes: { type: Number, default: 0 },
  profileViews: { type: Number, default: 0 },
  engagementScore: { type: Number, default: 0 },     // ML-computed
  attractivenessScore: { type: Number, default: 50 }, // 0-100 ELO-like
}, { _id: false });

const premiumSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  plan: { type: String, enum: ['none', 'gold', 'platinum'], default: 'none' },
  expiresAt: Date,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  boostActiveUntil: Date,
  superLikesRemaining: { type: Number, default: 1 },
  rewindsRemaining: { type: Number, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Core identity
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    minlength: 6,
    select: false, // Never returned by default
  },
  googleId: { type: String, unique: true, sparse: true },

  // Profile
  name: { type: String, required: true, trim: true, maxlength: 50 },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    maxlength: 30,
  },
  bio: { type: String, maxlength: 500, default: '' },
  age: { type: Number, min: 18, max: 100 },
  birthday: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'nonbinary', 'other', 'prefer_not_to_say'],
  },
  pronouns: { type: String, maxlength: 30 },
  photos: { type: [photoSchema], default: [], validate: { validator: v => v.length <= 9, message: 'Max 9 photos' } },
  
  // About
  interests: { type: [String], default: [], maxlength: 30 },
  occupation: { type: String, maxlength: 100 },
  education: { type: String, maxlength: 100 },
  height: { type: Number, min: 100, max: 250 }, // cm
  relationshipGoal: {
    type: String,
    enum: ['relationship', 'casual', 'friendship', 'figuring_out', 'marriage'],
  },
  sexuality: { type: String, maxlength: 50 },
  
  // Location
  location: { type: locationSchema, default: {} },
  
  // Preferences
  preferences: { type: preferencesSchema, default: {} },
  
  // Discovery / matching
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  superLikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Stats
  stats: { type: statsSchema, default: {} },
  
  // Premium
  premium: { type: premiumSchema, default: {} },
  
  // Daily limits (reset midnight)
  dailySwipes: {
    count: { type: Number, default: 0 },
    resetAt: { type: Date, default: () => new Date(Date.now() + 86400000) },
  },
  
  // Fraud detection
  fraud: {
    score: { type: Number, default: 0 },    // 0-100; >70 = suspicious
    flags: { type: [String], default: [] },
    isBanned: { type: Boolean, default: false },
    bannedAt: Date,
    banReason: String,
  },
  
  // Account
  isVerified: { type: Boolean, default: false },
  verifyToken: String,
  verifyTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastActive: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  pushToken: String, // FCM token
  
  // Soft delete
  isActive: { type: Boolean, default: true },
  deletedAt: Date,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ─── Indexes ─────────────────────────────────────────────────
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ age: 1, gender: 1 });
userSchema.index({ 'stats.attractivenessScore': -1 });
userSchema.index({ 'premium.boostActiveUntil': 1 });
userSchema.index({ isActive: 1, 'fraud.isBanned': 1 });
userSchema.index({ lastActive: -1 });

// ─── Virtual: age from birthday ─────────────────────────────
userSchema.virtual('computedAge').get(function () {
  if (!this.birthday) return this.age;
  const diff = Date.now() - this.birthday.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
});

// ─── Virtual: mainPhoto ─────────────────────────────────────
userSchema.virtual('mainPhoto').get(function () {
  const main = this.photos.find(p => p.isMain);
  return main ? main.url : (this.photos[0]?.url || null);
});

// ─── Pre-save: hash password ─────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Method: compare password ───────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Method: public profile (safe to send to client) ────────
userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  const remove = ['password', 'googleId', 'likedBy', 'dislikedBy', 'blockedUsers',
    'reportedBy', 'fraud', 'verifyToken', 'resetPasswordToken', '__v',
    'dailySwipes', 'premium.stripeCustomerId', 'premium.stripeSubscriptionId'];
  remove.forEach(key => {
    const parts = key.split('.');
    if (parts.length === 1) delete obj[parts[0]];
    else if (obj[parts[0]]) delete obj[parts[0]][parts[1]];
  });
  return obj;
};

// ─── Method: reset daily swipes ─────────────────────────────
userSchema.methods.resetDailySwipesIfNeeded = function () {
  if (new Date() > this.dailySwipes.resetAt) {
    this.dailySwipes.count = 0;
    this.dailySwipes.resetAt = new Date(Date.now() + 86400000);
  }
};

module.exports = mongoose.model('User', userSchema);

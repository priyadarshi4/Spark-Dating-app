// controllers/userController.js
const User = require('../models/User');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user.toPublicProfile() });
  } catch (err) { next(err); }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name age bio photos interests occupation height relationshipGoal isOnline lastActive gender pronouns stats.attractivenessScore');
    if (!user || !user.isActive) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'bio', 'age', 'gender', 'pronouns', 'birthday', 'occupation',
      'education', 'height', 'relationshipGoal', 'sexuality', 'interests'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user.toPublicProfile() });
  } catch (err) { next(err); }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, city, country } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      'location.coordinates': [lng, lat],
      'location.city': city,
      'location.country': country,
      'location.lastUpdated': new Date(),
    });
    res.json({ success: true, message: 'Location updated' });
  } catch (err) { next(err); }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { ageMin, ageMax, maxDistance, genderPreference, showMe } = req.body;
    const updates = {};
    if (ageMin !== undefined) updates['preferences.ageMin'] = ageMin;
    if (ageMax !== undefined) updates['preferences.ageMax'] = ageMax;
    if (maxDistance !== undefined) updates['preferences.maxDistance'] = maxDistance;
    if (genderPreference !== undefined) updates['preferences.genderPreference'] = genderPreference;
    if (showMe !== undefined) updates['preferences.showMe'] = showMe;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({ success: true, data: user.preferences });
  } catch (err) { next(err); }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isActive: false, deletedAt: new Date() });
    res.json({ success: true, message: 'Account deactivated' });
  } catch (err) { next(err); }
};

exports.blockUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { blockedUsers: req.params.id } });
    res.json({ success: true, message: 'User blocked' });
  } catch (err) { next(err); }
};

exports.reportUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { $addToSet: { reportedBy: req.user.id } });
    res.json({ success: true, message: 'User reported' });
  } catch (err) { next(err); }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const users = await User.find({
      name: { $regex: q, $options: 'i' },
      isActive: true, 'fraud.isBanned': false,
    }).select('name age photos').limit(20);
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

exports.updatePushToken = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { pushToken: req.body.token });
    res.json({ success: true });
  } catch (err) { next(err); }
};

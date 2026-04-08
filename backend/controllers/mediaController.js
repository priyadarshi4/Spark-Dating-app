// controllers/mediaController.js
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const user = await User.findById(req.user.id);
    if (user.photos.length >= 9) return res.status(400).json({ success: false, message: 'Max 9 photos allowed' });
    const photo = { url: req.file.path, publicId: req.file.filename, isMain: user.photos.length === 0, order: user.photos.length };
    user.photos.push(photo);
    await user.save();
    res.status(201).json({ success: true, data: photo });
  } catch (err) { next(err); }
};

exports.deletePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const photo = user.photos.id(req.params.photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });
    if (photo.publicId) await cloudinary.uploader.destroy(photo.publicId).catch(() => {});
    user.photos.pull(req.params.photoId);
    if (!user.photos.find(p => p.isMain) && user.photos.length > 0) user.photos[0].isMain = true;
    await user.save();
    res.json({ success: true, message: 'Photo deleted' });
  } catch (err) { next(err); }
};

exports.reorderPhotos = async (req, res, next) => {
  try {
    const { order } = req.body; // array of photo IDs in new order
    const user = await User.findById(req.user.id);
    order.forEach((id, idx) => {
      const p = user.photos.id(id);
      if (p) p.order = idx;
    });
    user.photos.sort((a, b) => a.order - b.order);
    await user.save();
    res.json({ success: true, data: user.photos });
  } catch (err) { next(err); }
};

exports.setMainPhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.photos.forEach(p => { p.isMain = p._id.toString() === req.params.photoId; });
    await user.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

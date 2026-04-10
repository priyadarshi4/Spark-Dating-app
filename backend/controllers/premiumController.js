// controllers/premiumController.js
const User = require('../models/User');

exports.getPremiumStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('premium');
    res.json({ success: true, data: user.premium });
  } catch (err) { next(err); }
};


exports.activateBoost = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.premium.isActive) return res.status(403).json({ success: false, message: 'Premium required', upgradeRequired: true });
    const boostUntil = new Date(Date.now() + parseInt(process.env.BOOST_DURATION_MIN || 30) * 60000);
    await User.findByIdAndUpdate(req.user.id, { 'premium.boostActiveUntil': boostUntil });
    res.json({ success: true, boostActiveUntil: boostUntil });
  } catch (err) { next(err); }
};

exports.createCheckoutSession = async (req, res, next) => {
  // Stripe integration placeholder
  res.json({ success: true, message: 'Stripe checkout session - integrate with your Stripe key', url: 'https://checkout.stripe.com/...' });
};

exports.handleWebhook = async (req, res, next) => {
  // Stripe webhook placeholder
  res.json({ received: true });
};

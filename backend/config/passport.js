const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = (passport) => {
  // ─── JWT Strategy ────────────────────────────────────────────
  passport.use(new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (jwtPayload, done) => {
      try {
        const user = await User.findById(jwtPayload.id).select('-password');
        if (!user || !user.isActive || user.fraud.isBanned) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  ));

  // ─── Google OAuth2 Strategy ──────────────────────────────────
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update last active
          user.lastActive = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if email already exists (link account)
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            if (!user.photos.length && profile.photos?.[0]?.value) {
              user.photos.push({ url: profile.photos[0].value, isMain: true });
            }
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
          email: email || `google_${profile.id}@spark.app`,
          photos: profile.photos?.[0]?.value
            ? [{ url: profile.photos[0].value, isMain: true }]
            : [],
          isVerified: true, // Google users are pre-verified
        });

        logger.info(`New Google user created: ${newUser.email}`);
        return done(null, newUser);
      } catch (err) {
        logger.error('Google OAuth error:', err);
        return done(err, false);
      }
    }
  ));
};

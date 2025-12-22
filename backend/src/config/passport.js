const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// JWT Strategy (for protected routes)
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const { rows } = await global.pgPool.query(
      'SELECT id, email, role FROM users WHERE id = $1 AND status = $2',
      [payload.id, 'active']
    );

    if (rows.length === 0) {
      return done(null, false);
    }

    return done(null, rows[0]);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const googleId = profile.id;
      const full_name = profile.displayName;
      const avatar_url = profile.photos[0]?.value;

      // Check if user exists
      let result = await global.pgPool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      let user;

      if (result.rows.length === 0) {
        // Create new user
        const userResult = await global.pgPool.query(
          `INSERT INTO users (email, role, status, email_verified, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, NOW(), NOW()) 
           RETURNING *`,
          [email, 'user', 'active', true]
        );

        user = userResult.rows[0];

        // Create user profile
        await global.pgPool.query(
          `INSERT INTO user_profiles (user_id, username, full_name, avatar_url, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [user.id, email.split('@')[0], full_name, avatar_url]
        );
      } else {
        user = result.rows[0];

        // Update last login
        await global.pgPool.query(
          'UPDATE users SET last_login_at = NOW(), email_verified = TRUE WHERE id = $1',
          [user.id]
        );

        // Update profile if avatar changed
        if (avatar_url) {
          await global.pgPool.query(
            'UPDATE user_profiles SET avatar_url = $1 WHERE user_id = $2',
            [avatar_url, user.id]
          );
        }
      }

      return done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }
));

module.exports = passport;

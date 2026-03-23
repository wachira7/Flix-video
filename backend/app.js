// backend/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const { metricsMiddleware, metricsHandler } = require('./src/config/metrics');
const logger = require('./src/utils/logger');
const { apiLimiter, authLimiter, paymentLimiter, searchLimiter } = require('./src/api/middlewares/rate-limiter.middleware');
const { errorHandler, notFoundHandler } = require('./src/api/middlewares/error-handler.middleware');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(compression());

// ─── Request Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ───────────────────────────────────────────────────────
app.use(morgan('combined', { stream: logger.stream }));

// ─── Metrics ───────────────────────────────────────────────────────
app.use(metricsMiddleware);

// ─── Passport ──────────────────────────────────────────────────────
const passport = require('./src/config/passport');
app.use(passport.initialize());

// ─── API Docs ──────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FlixVideo API Docs'
}));

// ─── Global Rate Limiting ──────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── Import Routes ─────────────────────────────────────────────────
const authRoutes = require('./src/api/routes/auth.routes');
const userRoutes = require('./src/api/routes/user.routes');
const movieRoutes = require('./src/api/routes/movie.routes');
const tvRoutes = require('./src/api/routes/tv.routes');
const favoritesRoutes = require('./src/api/routes/favorites.routes');
const watchlistRoutes = require('./src/api/routes/watchlist.routes');
const ratingsRoutes = require('./src/api/routes/ratings.routes');
const searchRoutes = require('./src/api/routes/search.routes');
const reviewsRoutes = require('./src/api/routes/reviews.routes');
const listsRoutes = require('./src/api/routes/lists.routes');
const recommendationsRoutes = require('./src/api/routes/recommendations.routes');
const watchPartyRoutes = require('./src/api/routes/watchParty.routes');
const streamingRoutes = require('./src/api/routes/streaming.routes');
const adminRoutes = require('./src/api/routes/admin.routes');
const analyticsRoutes = require('./src/api/routes/analytics.routes');
const moderatorRoutes = require('./src/api/routes/moderator.routes');
const paymentRoutes = require('./src/api/routes/payment.routes');
const subscriptionRoutes = require('./src/api/routes/subscription.routes');
const currencyRoutes = require('./src/api/routes/currency.routes');
const notificationRoutes = require('./src/api/routes/notification.routes');
const socialRoutes = require('./src/api/routes/social.routes');
const contentRoutes = require('./src/api/routes/content.routes');
const aiRoutes = require('./src/api/routes/ai.routes');

// ─── Routes with specific rate limiters ────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/search', searchLimiter, searchRoutes);

// ─── Regular Routes ────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/tv', tvRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/watch-party', watchPartyRoutes);
app.use('/api/streaming', streamingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/moderator', moderatorRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ai', aiRoutes);

// ─── Base Routes ───────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🎬 FlixVideo API - AI-Powered Movie Discovery Platform',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api-docs'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/metrics', metricsHandler);

app.get('/api', (req, res) => {
  res.json({
    message: 'FlixVideo API v1',
    documentation: '/api-docs',
    endpoints: [
      '/api/auth',
      '/api/movies',
      '/api/tv',
      '/api/users',
      '/api/payments',
      '/api/subscriptions',
      '/api/social',
      '/api/content',
    ]
  });
});

// ─── Error Handling ────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
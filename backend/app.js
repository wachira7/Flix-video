// backend/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Initialize Passport
const passport = require('./src/config/passport');
app.use(passport.initialize());

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FlixVideo API Docs'
}));

// Import routes
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
const adminRoutes = require('./src/api/routes/admin.routes');
const analyticsRoutes = require('./src/api/routes/analytics.routes'); 
const moderatorRoutes = require('./src/api/routes/moderator.routes');
const paymentRoutes = require('./src/api/routes/payment.routes');
const subscriptionRoutes = require('./src/api/routes/subscription.routes'); 
const currencyRoutes = require('./src/api/routes/currency.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/tv', tvRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/watch-party', watchPartyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/moderator', moderatorRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/currency', currencyRoutes);


// Basic routes
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

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'FlixVideo API v1',
    documentation: '/api-docs',
    endpoints: [
      '/api/auth',
      '/api/movies',
      '/api/tv-shows',
      '/api/users',
      '/api/payments',
      '/api/subscriptions'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
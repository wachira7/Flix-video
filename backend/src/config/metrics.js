//backend/src/config/metrics.js
const client = require('prom-client');

// Collect default metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'flixvideo_' });

// ============================================
// HTTP METRICS
// ============================================
const httpRequestDuration = new client.Histogram({
  name: 'flixvideo_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'flixvideo_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// ============================================
// USER METRICS
// ============================================
const activeUsers = new client.Gauge({
  name: 'flixvideo_active_users',
  help: 'Number of active users'
});

const newRegistrations = new client.Counter({
  name: 'flixvideo_registrations_total',
  help: 'Total number of user registrations'
});

const registrationsByMethod = new client.Counter({
  name: 'flixvideo_registrations_by_method_total',
  help: 'Registrations by auth method',
  labelNames: ['method'] // email, google
});

const failedLogins = new client.Counter({
  name: 'flixvideo_failed_logins_total',
  help: 'Total failed login attempts'
});

// ============================================
// CONTENT METRICS
// ============================================
const reviewsTotal = new client.Counter({
  name: 'flixvideo_reviews_total',
  help: 'Total reviews posted'
});

const ratingsTotal = new client.Counter({
  name: 'flixvideo_ratings_total',
  help: 'Total ratings submitted'
});

const watchlistAdds = new client.Counter({
  name: 'flixvideo_watchlist_adds_total',
  help: 'Total watchlist additions'
});

const favoritesTotal = new client.Counter({
  name: 'flixvideo_favorites_total',
  help: 'Total favorites added',
  labelNames: ['content_type'] // movie, tv
});

const searchesTotal = new client.Counter({
  name: 'flixvideo_searches_total',
  help: 'Total searches performed'
});

const recommendationsServed = new client.Counter({
  name: 'flixvideo_recommendations_served_total',
  help: 'Total AI recommendations served'
});

// ============================================
// WATCH PARTY METRICS
// ============================================
const watchPartiesTotal = new client.Counter({
  name: 'flixvideo_watch_parties_total',
  help: 'Total watch parties created'
});

const watchPartyParticipants = new client.Gauge({
  name: 'flixvideo_watch_party_participants',
  help: 'Current watch party participants'
});

// ============================================
// PAYMENT METRICS
// ============================================
const paymentsTotal = new client.Counter({
  name: 'flixvideo_payments_total',
  help: 'Total payments processed',
  labelNames: ['status', 'provider']
});

const failedPayments = new client.Counter({
  name: 'flixvideo_failed_payments_total',
  help: 'Total failed payments',
  labelNames: ['provider']
});

const revenueTotal = new client.Counter({
  name: 'flixvideo_revenue_total',
  help: 'Total revenue',
  labelNames: ['provider']
});

const subscriptionsByTier = new client.Gauge({
  name: 'flixvideo_subscriptions_by_tier',
  help: 'Active subscriptions per tier',
  labelNames: ['tier'] // free, basic, premium
});

const subscriptionChanges = new client.Counter({
  name: 'flixvideo_subscription_changes_total',
  help: 'Subscription plan changes',
  labelNames: ['from_tier', 'to_tier']
});

// ============================================
// DB METRICS
// ============================================
const dbQueryDuration = new client.Histogram({
  name: 'flixvideo_db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1]
});

// ============================================
// MIDDLEWARE
// ============================================
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });

  next();
};

// Metrics endpoint
const metricsHandler = async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
};

module.exports = {
  metricsMiddleware,
  metricsHandler,
  httpRequestDuration,
  httpRequestTotal,
  activeUsers,
  newRegistrations,
  registrationsByMethod,
  failedLogins,
  reviewsTotal,
  ratingsTotal,
  watchlistAdds,
  favoritesTotal,
  searchesTotal,
  recommendationsServed,
  watchPartiesTotal,
  watchPartyParticipants,
  paymentsTotal,
  failedPayments,
  revenueTotal,
  subscriptionsByTier,
  subscriptionChanges,
  dbQueryDuration,
  register: client.register
};
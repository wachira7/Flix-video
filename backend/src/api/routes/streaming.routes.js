// backend/src/api/routes/streaming.routes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');
const {
  getMovieStreamingAvailability,
  getTVStreamingAvailability,
  getStreamingPlatforms,
  addStreamingAvailability,
  bulkImportStreamingAvailability
} = require('../controllers/streaming.controller');

/**
 * @swagger
 * /api/streaming/movie/{movieId}:
 *   get:
 *     tags: [Streaming]
 *     summary: Get streaming availability for a movie
 *     description: Get all platforms where a movie is available to stream/rent/buy
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 550
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: ISO 3166-1 alpha-2 country code
 *         example: KE
 *     responses:
 *       200:
 *         description: Streaming availability data
 */
router.get('/movie/:movieId', getMovieStreamingAvailability);

/**
 * @swagger
 * /api/streaming/tv/{tvShowId}:
 *   get:
 *     tags: [Streaming]
 *     summary: Get streaming availability for a TV show
 *     parameters:
 *       - in: path
 *         name: tvShowId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         example: KE
 *     responses:
 *       200:
 *         description: Streaming availability data
 */
router.get('/tv/:tvShowId', getTVStreamingAvailability);

/**
 * @swagger
 * /api/streaming/platforms:
 *   get:
 *     tags: [Streaming]
 *     summary: Get all streaming platforms
 *     parameters:
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of streaming platforms
 */
router.get('/platforms', getStreamingPlatforms);

/**
 * @swagger
 * /api/streaming/availability:
 *   post:
 *     tags: [Streaming]
 *     summary: Add streaming availability (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content_type
 *               - content_id
 *               - platform_id
 *               - country_code
 *               - availability_type
 *             properties:
 *               content_type:
 *                 type: string
 *                 enum: [movie, tv]
 *               content_id:
 *                 type: integer
 *               platform_id:
 *                 type: string
 *                 format: uuid
 *               country_code:
 *                 type: string
 *                 example: KE
 *               availability_type:
 *                 type: string
 *                 enum: [stream, rent, buy, free]
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               quality:
 *                 type: string
 *               url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Availability added
 */
router.post('/availability', protect, requireAdmin, addStreamingAvailability);

/**
 * @swagger
 * /api/streaming/bulk-import:
 *   post:
 *     tags: [Streaming]
 *     summary: Bulk import streaming availability (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Import results
 */
router.post('/bulk-import', protect, requireAdmin, bulkImportStreamingAvailability);


module.exports = router;
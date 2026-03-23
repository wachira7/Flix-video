//./api/routes/user.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  upload,
  deleteAvatar,
  changePassword,
  updateWatchProgress,
  getWatchHistory,
  getContinueWatching,
  getWatchProgress,
  deleteWatchHistory,
  clearWatchHistory
} = require('../controllers/user.controller');

// ─── Existing Routes ──────────────────────────────────────────────

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/me', protect, getMyProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               full_name:
 *                 type: string
 *               bio:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               country:
 *                 type: string
 *               city:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or username taken
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload user avatar to AWS S3
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPG, PNG). Max 5MB.
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 */
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

/**
 * @swagger
 * /api/users/avatar:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user avatar from AWS S3
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       404:
 *         description: No avatar to delete
 *       401:
 *         description: Unauthorized
 */
router.delete('/avatar', protect, deleteAvatar);

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     tags: [Users]
 *     summary: Change user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *               new_password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Missing fields or password too short
 *       401:
 *         description: Current password incorrect
 */
router.put('/password', protect, changePassword);

// ─── Watch History Routes ─────────────────────────────────────────

/**
 * @swagger
 * /api/users/watch-progress:
 *   post:
 *     tags: [Watch History]
 *     summary: Save or update watch progress for a content item
 *     description: Called by the frontend player every 30 seconds during playback and on pause/close. Stores progress in MongoDB.
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
 *               - progress_seconds
 *             properties:
 *               content_type:
 *                 type: string
 *                 enum: [movie, tv]
 *                 description: Type of content being watched
 *               content_id:
 *                 type: integer
 *                 description: TMDB content ID
 *                 example: 550
 *               progress_seconds:
 *                 type: integer
 *                 description: How many seconds the user has watched
 *                 example: 1800
 *               duration_seconds:
 *                 type: integer
 *                 description: Total duration of the content in seconds
 *                 example: 7200
 *               completed:
 *                 type: boolean
 *                 description: Whether the user finished watching
 *                 default: false
 *               season_number:
 *                 type: integer
 *                 description: Season number (TV only)
 *                 nullable: true
 *               episode_number:
 *                 type: integer
 *                 description: Episode number (TV only)
 *                 nullable: true
 *               quality:
 *                 type: string
 *                 description: Playback quality
 *                 example: HD
 *     responses:
 *       200:
 *         description: Watch progress saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 watch_progress:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/watch-progress', protect, updateWatchProgress);

/**
 * @swagger
 * /api/users/watch-history:
 *   get:
 *     tags: [Watch History]
 *     summary: Get user's full watch history
 *     description: Returns all content the user has watched, sorted by most recent. Fetched from MongoDB.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records to return
 *       - in: query
 *         name: content_type
 *         schema:
 *           type: string
 *           enum: [movie, tv]
 *         description: Filter by content type
 *     responses:
 *       200:
 *         description: Watch history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/watch-history', protect, getWatchHistory);

/**
 * @swagger
 * /api/users/continue-watching:
 *   get:
 *     tags: [Watch History]
 *     summary: Get continue watching list
 *     description: Returns content the user started but hasn't finished. Used for the Continue Watching row on the dashboard.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Continue watching list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 continue_watching:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/continue-watching', protect, getContinueWatching);

/**
 * @swagger
 * /api/users/watch-progress/{contentType}/{contentId}:
 *   get:
 *     tags: [Watch History]
 *     summary: Get watch progress for a specific content item
 *     description: Returns the user's progress for a specific movie or TV episode. Used to show resume position when opening content.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [movie, tv]
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB content ID
 *     responses:
 *       200:
 *         description: Watch progress retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 progress:
 *                   type: object
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */
router.get('/watch-progress/:contentType/:contentId', protect, getWatchProgress);

/**
 * @swagger
 * /api/users/watch-history/{contentType}/{contentId}:
 *   delete:
 *     tags: [Watch History]
 *     summary: Remove a specific item from watch history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [movie, tv]
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Watch history entry removed
 *       401:
 *         description: Unauthorized
 */
router.delete('/watch-history/:contentType/:contentId', protect, deleteWatchHistory);

/**
 * @swagger
 * /api/users/watch-history:
 *   delete:
 *     tags: [Watch History]
 *     summary: Clear all watch history
 *     description: Permanently deletes the user's entire watch history from MongoDB.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Watch history cleared successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/watch-history', protect, clearWatchHistory);

module.exports = router;
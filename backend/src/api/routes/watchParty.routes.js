const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createWatchParty,
  joinWatchParty,
  leaveWatchParty,
  getWatchParty,
  getMyWatchParties,
  endWatchParty
} = require('../controllers/watchParty.controller');

/**
 * @swagger
 * /api/watch-party:
 *   post:
 *     tags: [Watch Party]
 *     summary: Create a watch party
 *     description: Create a new watch party session for synchronized viewing
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
 *               - title
 *             properties:
 *               content_type:
 *                 type: string
 *                 enum: [movie, tv]
 *                 example: movie
 *               content_id:
 *                 type: integer
 *                 example: 550
 *               title:
 *                 type: string
 *                 example: "Fight Club"
 *               episode_number:
 *                 type: integer
 *                 example: 1
 *               season_number:
 *                 type: integer
 *                 example: 1
 *               is_public:
 *                 type: boolean
 *                 default: false
 *               max_participants:
 *                 type: integer
 *                 default: 50
 *     responses:
 *       201:
 *         description: Watch party created successfully
 */
router.post('/', protect, createWatchParty);

/**
 * @swagger
 * /api/watch-party/my-parties:
 *   get:
 *     tags: [Watch Party]
 *     summary: Get my watch parties
 *     description: Get all watch parties hosted by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, waiting, playing, paused, ended]
 *           default: all
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of watch parties
 */
router.get('/my-parties', protect, getMyWatchParties);

/**
 * @swagger
 * /api/watch-party/{partyCode}:
 *   get:
 *     tags: [Watch Party]
 *     summary: Get watch party details
 *     description: Get details of a specific watch party by its code
 *     parameters:
 *       - in: path
 *         name: partyCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 8-character party code
 *         example: ABC12345
 *     responses:
 *       200:
 *         description: Watch party details
 *       404:
 *         description: Watch party not found
 */
router.get('/:partyCode', getWatchParty);

/**
 * @swagger
 * /api/watch-party/{partyCode}/join:
 *   post:
 *     tags: [Watch Party]
 *     summary: Join a watch party
 *     description: Join an existing watch party using its code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyCode
 *         required: true
 *         schema:
 *           type: string
 *         example: ABC12345
 *     responses:
 *       200:
 *         description: Joined watch party successfully
 *       404:
 *         description: Watch party not found
 *       400:
 *         description: Watch party is full
 */
router.post('/:partyCode/join', protect, joinWatchParty);

/**
 * @swagger
 * /api/watch-party/{partyId}/leave:
 *   post:
 *     tags: [Watch Party]
 *     summary: Leave a watch party
 *     description: Leave a watch party you are participating in
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Left watch party successfully
 */
router.post('/:partyId/leave', protect, leaveWatchParty);

/**
 * @swagger
 * /api/watch-party/{partyId}/end:
 *   put:
 *     tags: [Watch Party]
 *     summary: End a watch party
 *     description: End a watch party (host only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Watch party ended successfully
 *       403:
 *         description: Only host can end the party
 */
router.put('/:partyId/end', protect, endWatchParty);

module.exports = router;

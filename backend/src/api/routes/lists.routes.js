const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createList,
  getMyLists,
  getUserLists,
  getListDetails,
  updateList,
  deleteList,
  addListItem,
  addListItemsBatch,
  removeListItem,
  toggleListLike
} = require('../controllers/lists.controller');

/**
 * @swagger
 * /api/lists:
 *   post:
 *     tags: [Lists]
 *     summary: Create a list
 *     description: Create a new custom list
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My Favorite Sci-Fi Movies"
 *               description:
 *                 type: string
 *                 example: "A collection of the best science fiction films ever made"
 *               is_public:
 *                 type: boolean
 *                 default: true
 *               is_ranked:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: List created
 */
router.post('/', protect, createList);

/**
 * @swagger
 * /api/lists/me:
 *   get:
 *     tags: [Lists]
 *     summary: Get my lists
 *     description: Get all lists created by the authenticated user (public and private)
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: User's lists
 */
router.get('/me', protect, getMyLists);

/**
 * @swagger
 * /api/lists/user/{userId}:
 *   get:
 *     tags: [Lists]
 *     summary: Get user's public lists
 *     description: Get all public lists created by a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: User's public lists
 */
router.get('/user/:userId', getUserLists);

/**
 * @swagger
 * /api/lists/{listId}/items:
 *   post:
 *     tags: [Lists]
 *     summary: Add item to list
 *     description: Add a movie or TV show to your list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - contentId
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [movie, tv]
 *                 example: movie
 *               contentId:
 *                 type: integer
 *                 example: 550
 *               notes:
 *                 type: string
 *                 example: "Must watch this again!"
 *               rank_order:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Item added to list
 */
router.post('/:listId/items', protect, addListItem);

/**
 * @swagger
 * /api/lists/{listId}/items/batch:
 *   post:
 *     tags: [Lists]
 *     summary: Add multiple items to list (batch)
 *     description: Add multiple movies or TV shows to your list in one request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                   required:
 *                     - contentType
 *                     - contentId
 *                   properties:
 *                     contentType:
 *                       type: string
 *                       enum: [movie, tv]
 *                       example: movie
 *                     contentId:
 *                       type: integer
 *                       example: 550
 *                     notes:
 *                       type: string
 *                       example: "Must watch this again!"
 *                     rank_order:
 *                       type: integer
 *                       example: 1
 *                 example:
 *                   - contentType: movie
 *                     contentId: 27205
 *                     notes: "Inception - Mind-bending masterpiece"
 *                     rank_order: 1
 *                   - contentType: movie
 *                     contentId: 157336
 *                     notes: "Interstellar - Epic space journey"
 *                     rank_order: 2
 *                   - contentType: movie
 *                     contentId: 603
 *                     notes: "The Matrix - Revolutionary action sci-fi"
 *                     rank_order: 3
 *     responses:
 *       201:
 *         description: Items added to list
 */
router.post('/:listId/items/batch', protect, addListItemsBatch);

/**
 * @swagger
 * /api/lists/{listId}/items/{itemId}:
 *   delete:
 *     tags: [Lists]
 *     summary: Remove item from list
 *     description: Remove a movie or TV show from your list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Item removed from list
 */
router.delete('/:listId/items/:itemId', protect, removeListItem);

/**
 * @swagger
 * /api/lists/{listId}/like:
 *   post:
 *     tags: [Lists]
 *     summary: Like/Unlike a list
 *     description: Toggle like on a list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Like toggled
 */
router.post('/:listId/like', protect, toggleListLike);

/**
 * @swagger
 * /api/lists/{listId}:
 *   get:
 *     tags: [Lists]
 *     summary: Get list details
 *     description: Get detailed information about a list including all items
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List details with items
 *       403:
 *         description: List is private
 *       404:
 *         description: List not found
 */
router.get('/:listId', getListDetails);

/**
 * @swagger
 * /api/lists/{listId}:
 *   put:
 *     tags: [Lists]
 *     summary: Update a list
 *     description: Update your own list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *               is_ranked:
 *                 type: boolean
 *               cover_image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: List updated
 */
router.put('/:listId', protect, updateList);

/**
 * @swagger
 * /api/lists/{listId}:
 *   delete:
 *     tags: [Lists]
 *     summary: Delete a list
 *     description: Delete your own list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List deleted
 */
router.delete('/:listId', protect, deleteList);

module.exports = router;
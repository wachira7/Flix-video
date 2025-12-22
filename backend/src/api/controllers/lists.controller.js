const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');

// Helper to convert 'tv' to 'tv_show' for database
const normalizeContentType = (type) => {
  return type === 'tv' ? 'tv_show' : type;
};

// @desc    Create a list
// @route   POST /api/lists
// @access  Private
const createList = async (req, res) => {
  try {
    const { title, description, is_public = true, is_ranked = false } = req.body;
    const userId = req.user.id;

    if (!title || title.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'List title is required'
      });
    }

    const result = await global.pgPool.query(
      `INSERT INTO lists (user_id, title, description, is_public, is_ranked, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [userId, title, description || null, is_public, is_ranked]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'List created successfully',
      list: result.rows[0]
    });
  } catch (error) {
    console.error('Create list error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get my lists
// @route   GET /api/lists/me
// @access  Private
const getMyLists = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await global.pgPool.query(
      `SELECT * FROM lists 
       WHERE user_id = $1 
       ORDER BY updated_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await global.pgPool.query(
      'SELECT COUNT(*) FROM lists WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
      lists: result.rows
    });
  } catch (error) {
    console.error('Get my lists error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get user's public lists
// @route   GET /api/lists/user/:userId
// @access  Public
const getUserLists = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await global.pgPool.query(
      `SELECT l.*, up.username, up.full_name
       FROM lists l
       LEFT JOIN user_profiles up ON l.user_id = up.user_id
       WHERE l.user_id = $1 AND l.is_public = true
       ORDER BY l.updated_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await global.pgPool.query(
      'SELECT COUNT(*) FROM lists WHERE user_id = $1 AND is_public = true',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
      lists: result.rows
    });
  } catch (error) {
    console.error('Get user lists error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get list details with items
// @route   GET /api/lists/:listId
// @access  Public (if public list)
const getListDetails = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user?.id; // Optional auth

    // Get list
    const listResult = await global.pgPool.query(
      `SELECT l.*, up.username, up.full_name, up.avatar_url
       FROM lists l
       LEFT JOIN user_profiles up ON l.user_id = up.user_id
       WHERE l.id = $1`,
      [listId]
    );

    if (listResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'List not found'
      });
    }

    const list = listResult.rows[0];

    // Check if user can access (must be public OR own list)
    if (!list.is_public && (!userId || list.user_id !== userId)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'This list is private'
      });
    }

    // Get list items
    const itemsResult = await global.pgPool.query(
      `SELECT * FROM list_items 
       WHERE list_id = $1 
       ORDER BY ${list.is_ranked ? 'rank_order ASC' : 'added_at DESC'}`,
      [listId]
    );

    res.json({
      success: true,
      list: {
        ...list,
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Get list details error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Update a list
// @route   PUT /api/lists/:listId
// @access  Private
const updateList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { title, description, is_public, is_ranked, cover_image_url } = req.body;
    const userId = req.user.id;

    // Check ownership
    const existing = await global.pgPool.query(
      'SELECT user_id FROM lists WHERE id = $1',
      [listId]
    );

    if (existing.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'List not found'
      });
    }

    if (existing.rows[0].user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'You can only update your own lists'
      });
    }

    // Update list
    const result = await global.pgPool.query(
      `UPDATE lists 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           is_public = COALESCE($3, is_public),
           is_ranked = COALESCE($4, is_ranked),
           cover_image_url = COALESCE($5, cover_image_url),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, description, is_public, is_ranked, cover_image_url, listId]
    );

    res.json({
      success: true,
      message: 'List updated successfully',
      list: result.rows[0]
    });
  } catch (error) {
    console.error('Update list error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete a list
// @route   DELETE /api/lists/:listId
// @access  Private
const deleteList = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;

    // Check ownership
    const existing = await global.pgPool.query(
      'SELECT user_id FROM lists WHERE id = $1',
      [listId]
    );

    if (existing.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'List not found'
      });
    }

    if (existing.rows[0].user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'You can only delete your own lists'
      });
    }

    // Delete list (cascade will delete items and likes)
    await global.pgPool.query('DELETE FROM lists WHERE id = $1', [listId]);

    res.json({
      success: true,
      message: 'List deleted successfully'
    });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Add item to list
// @route   POST /api/lists/:listId/items
// @access  Private
const addListItem = async (req, res) => {
  try {
    const { listId } = req.params;
    const { contentType, contentId, notes, rank_order } = req.body;
    const userId = req.user.id;

    if (!['movie', 'tv'].includes(contentType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Content type must be either "movie" or "tv"'
      });
    }

    // Check ownership
    const listExists = await global.pgPool.query(
      'SELECT user_id FROM lists WHERE id = $1',
      [listId]
    );

    if (listExists.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'List not found'
      });
    }

    if (listExists.rows[0].user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'You can only modify your own lists'
      });
    }

    const dbContentType = normalizeContentType(contentType);

    // Check if already in list
    const existing = await global.pgPool.query(
      'SELECT id FROM list_items WHERE list_id = $1 AND content_type = $2 AND content_id = $3',
      [listId, dbContentType, contentId]
    );

    if (existing.rows.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Item already in list'
      });
    }

    // Add item
    const result = await global.pgPool.query(
      `INSERT INTO list_items (list_id, content_type, content_id, notes, rank_order, added_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [listId, dbContentType, contentId, notes || null, rank_order || null]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Item added to list',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Add list item error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Add multiple items to list (batch)
// @route   POST /api/lists/:listId/items/batch
// @access  Private
const addListItemsBatch = async (req, res) => {
  try {
    const { listId } = req.params;
    const { items } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Items array is required and must not be empty'
      });
    }

    // Check ownership
    const listExists = await global.pgPool.query(
      'SELECT user_id FROM lists WHERE id = $1',
      [listId]
    );

    if (listExists.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'List not found'
      });
    }

    if (listExists.rows[0].user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'You can only modify your own lists'
      });
    }

    // Validate all items
    const errors = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.contentType || !['movie', 'tv'].includes(item.contentType)) {
        errors.push(`Item ${i + 1}: contentType must be either "movie" or "tv"`);
      }
      if (!item.contentId) {
        errors.push(`Item ${i + 1}: contentId is required`);
      }
    }

    if (errors.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Validation errors',
        errors
      });
    }

    // Begin transaction
    const client = await global.pgPool.connect();
    try {
      await client.query('BEGIN');

      const addedItems = [];
      const skippedItems = [];

      for (const item of items) {
        const dbContentType = normalizeContentType(item.contentType);

        // Check if already in list
        const existing = await client.query(
          'SELECT id FROM list_items WHERE list_id = $1 AND content_type = $2 AND content_id = $3',
          [listId, dbContentType, item.contentId]
        );

        if (existing.rows.length > 0) {
          skippedItems.push({
            contentType: item.contentType,
            contentId: item.contentId,
            reason: 'Already in list'
          });
          continue;
        }

        // Add item
        const result = await client.query(
          `INSERT INTO list_items (list_id, content_type, content_id, notes, rank_order, added_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [listId, dbContentType, item.contentId, item.notes || null, item.rank_order || null]
        );

        addedItems.push(result.rows[0]);
      }

      await client.query('COMMIT');

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: `Added ${addedItems.length} items to list`,
        added: addedItems.length,
        skipped: skippedItems.length,
        addedItems,
        skippedItems
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Add list items batch error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};
// @desc    Remove item from list
// @route   DELETE /api/lists/:listId/items/:itemId
// @access  Private
const removeListItem = async (req, res) => {
  try {
    const { listId, itemId } = req.params;
    const userId = req.user.id;

    // Check ownership
    const listExists = await global.pgPool.query(
      'SELECT user_id FROM lists WHERE id = $1',
      [listId]
    );

    if (listExists.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'List not found'
      });
    }

    if (listExists.rows[0].user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'You can only modify your own lists'
      });
    }

    // Delete item
    const result = await global.pgPool.query(
      'DELETE FROM list_items WHERE id = $1 AND list_id = $2 RETURNING *',
      [itemId, listId]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Item not found in list'
      });
    }

    res.json({
      success: true,
      message: 'Item removed from list'
    });
  } catch (error) {
    console.error('Remove list item error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Like/Unlike a list
// @route   POST /api/lists/:listId/like
// @access  Private
const toggleListLike = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;

    // Check if list exists
    const listExists = await global.pgPool.query(
      'SELECT id FROM lists WHERE id = $1',
      [listId]
    );

    if (listExists.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'List not found'
      });
    }

    // Check if already liked
    const existing = await global.pgPool.query(
      'SELECT id FROM list_likes WHERE list_id = $1 AND user_id = $2',
      [listId, userId]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await global.pgPool.query(
        'DELETE FROM list_likes WHERE list_id = $1 AND user_id = $2',
        [listId, userId]
      );

      res.json({
        success: true,
        message: 'List unliked',
        liked: false
      });
    } else {
      // Like
      await global.pgPool.query(
        'INSERT INTO list_likes (list_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [listId, userId]
      );

      res.json({
        success: true,
        message: 'List liked',
        liked: true
      });
    }
  } catch (error) {
    console.error('Toggle list like error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
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
};

// ============================================
// BACKEND: user.controller.js
// ============================================

const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const { uploadToS3, deleteFromS3, generateUniqueFilename } = require('../../utils/s3');
const multer = require('multer');
const WatchHistory = require('../../models/watchHistory.model');
const logger = require('../../utils/logger');
// const { createClient } = require('@supabase/supabase-js');

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_KEY
// );

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await global.pgPool.query(
      'SELECT id, email, email_verified, phone, role, status, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'User not found'
      });
    }

    //  Cast date_of_birth to text to avoid timezone conversion
    const profileResult = await global.pgPool.query(
      `SELECT 
        id, user_id, username, full_name, avatar_url, bio,
        date_of_birth::text as date_of_birth,
        gender, country, city, timezone, language, is_public,
        created_at, updated_at
       FROM user_profiles 
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      user: userResult.rows[0],
      profile: profileResult.rows[0] || null
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    // A field left out of the request keeps its value; a field sent empty
    // (or null) is cleared. Previously COALESCE made clearing impossible.
    const TEXT_FIELDS = ['username', 'full_name', 'bio', 'date_of_birth', 'gender', 'country', 'city', 'timezone'];
    const sanitizedData = {};
    for (const field of TEXT_FIELDS) {
      if (!(field in req.body)) continue;
      const value = req.body[field];
      sanitizedData[field] = typeof value === 'string' ? value.trim() || null : null;
    }
    if ('language' in req.body) sanitizedData.language = req.body.language || 'en';
    if ('is_public' in req.body) sanitizedData.is_public = Boolean(req.body.is_public);

    // Check if profile exists
    const existing = await global.pgPool.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existing.rows.length === 0) {
      // Create new profile
      result = await global.pgPool.query(
        `INSERT INTO user_profiles (
          user_id, username, full_name, bio, date_of_birth, gender, 
          country, city, timezone, language, is_public, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING 
          id, user_id, username, full_name, avatar_url, bio,
          date_of_birth::text as date_of_birth,
          gender, country, city, timezone, language, is_public,
          created_at, updated_at`,
        [
          userId, 
          sanitizedData.username, 
          sanitizedData.full_name, 
          sanitizedData.bio, 
          sanitizedData.date_of_birth, 
          sanitizedData.gender, 
          sanitizedData.country, 
          sanitizedData.city, 
          sanitizedData.timezone, 
          sanitizedData.language ?? 'en', 
          sanitizedData.is_public ?? true
        ]
      );
    } else {
      // Update only the fields the request included
      const fields = Object.keys(sanitizedData);
      const assignments = fields.map((field, i) =>
        field === 'date_of_birth' ? `${field} = $${i + 2}::date` : `${field} = $${i + 2}`
      );
      result = await global.pgPool.query(
        `UPDATE user_profiles SET
          ${[...assignments, 'updated_at = NOW()'].join(',\n          ')}
        WHERE user_id = $1
        RETURNING 
          id, user_id, username, full_name, avatar_url, bio,
          date_of_birth::text as date_of_birth,
          gender, country, city, timezone, language, is_public,
          created_at, updated_at`,
        [userId, ...fields.map((field) => sanitizedData[field])]
      );
    }

    //console.log('📅 Database returned:', result.rows[0].date_of_birth);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === '23505') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Username already taken'
      });
    }

    if (error.code === '22007' || error.code === '22008') {
      console.error('Invalid date format received:', req.body.date_of_birth);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid date format. Please use YYYY-MM-DD'
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Upload user avatar to S3(Amazon S3),instead of Supabase Storage
// @route   POST /api/users/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Get old avatar URL
    const oldAvatarResult = await global.pgPool.query(
      'SELECT avatar_url FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    const oldAvatarUrl = oldAvatarResult.rows[0]?.avatar_url;

    // Generate unique filename
    const filename = generateUniqueFilename(req.file.originalname);
    const s3Key = `avatars/${userId}/${filename}`;

    // Upload to S3
    const avatarUrl = await uploadToS3(
      req.file.buffer,
      s3Key,
      req.file.mimetype
    );

    // Update database
    await global.pgPool.query(
      `UPDATE user_profiles 
       SET avatar_url = $1, updated_at = NOW() 
       WHERE user_id = $2`,
      [avatarUrl, userId]
    );

    // Delete old avatar from S3
    if (oldAvatarUrl && oldAvatarUrl.includes('s3.amazonaws.com')) {
      try {
        const urlParts = oldAvatarUrl.split('.com/');
        if (urlParts[1]) {
          await deleteFromS3(urlParts[1]);
        }
      } catch (deleteError) {
        console.error('Failed to delete old avatar:', deleteError);
      }
    }

    res.json({
      success: true,
      avatar_url: avatarUrl,
      message: 'Avatar uploaded successfully'
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar'
    });
  }
};

// @desc    Delete avatar from S3
// @route   DELETE /api/users/avatar
// @access  Private
const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileResult = await global.pgPool.query(
      'SELECT avatar_url FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0 || !profileResult.rows[0].avatar_url) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'No avatar to delete'
      });
    }

    const avatarUrl = profileResult.rows[0].avatar_url;
    
    // Delete from S3 (not Supabase!)
    if (avatarUrl.includes('s3.amazonaws.com')) {
      try {
        const urlParts = avatarUrl.split('.com/');
        if (urlParts[1]) {
          await deleteFromS3(urlParts[1]);
        }
      } catch (deleteError) {
        console.error('Failed to delete from S3:', deleteError);
      }
    }

    // Update database
    await global.pgPool.query(
      'UPDATE user_profiles SET avatar_url = NULL, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Avatar deleted successfully'
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (new_password.length < 8) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'New password must be at least 8 characters'
      });
    }

    const userResult = await global.pgPool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'User not found'
      });
    }

    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);

    if (!isMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    const newPasswordHash = await bcrypt.hash(new_password, 10);

    await global.pgPool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Save/update watch progress
// @route   POST /api/users/watch-progress
// @access  Private
const updateWatchProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      content_type,
      content_id,
      progress_seconds,
      duration_seconds,
      completed = false,
      season_number = null,
      episode_number = null,
      quality = 'HD'
    } = req.body;
 
    if (!content_type || !content_id || progress_seconds === undefined) {
      return res.status(400).json({
        success: false,
        error: 'content_type, content_id and progress_seconds are required'
      });
    }
 
    const record = await WatchHistory.upsert({
      userId,
      contentType: content_type,
      contentId: content_id,
      progressSeconds: progress_seconds,
      durationSeconds: duration_seconds,
      completed,
      seasonNumber: season_number,
      episodeNumber: episode_number,
      quality
    });
 
    res.json({ success: true, watch_progress: record });
 
  } catch (error) {
    logger.error('Update watch progress error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to update watch progress' });
  }
};
 
// @desc    Get user's watch history
// @route   GET /api/users/watch-history
// @access  Private
const getWatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, content_type } = req.query;
 
    const history = await WatchHistory.getByUser(userId, {
      limit: parseInt(limit),
      contentType: content_type || null
    });
 
    res.json({ success: true, history });
 
  } catch (error) {
    logger.error('Get watch history error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to get watch history' });
  }
};
 
// @desc    Get continue watching list
// @route   GET /api/users/continue-watching
// @access  Private
const getContinueWatching = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
 
    const list = await WatchHistory.getContinueWatching(userId, parseInt(limit));
 
    res.json({ success: true, continue_watching: list });
 
  } catch (error) {
    logger.error('Get continue watching error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to get continue watching list' });
  }
};
 
// @desc    Get watch progress for a specific content
// @route   GET /api/users/watch-progress/:contentType/:contentId
// @access  Private
const getWatchProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentType, contentId } = req.params;
 
    const progress = await WatchHistory.getProgress(userId, contentId, contentType);
 
    res.json({ success: true, progress: progress || null });
 
  } catch (error) {
    logger.error('Get watch progress error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to get watch progress' });
  }
};
 
// @desc    Delete a watch history entry
// @route   DELETE /api/users/watch-history/:contentType/:contentId
// @access  Private
const deleteWatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentType, contentId } = req.params;
 
    await WatchHistory.delete(userId, contentId, contentType);
 
    res.json({ success: true, message: 'Watch history entry removed' });
 
  } catch (error) {
    logger.error('Delete watch history error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to delete watch history' });
  }
};
 
// @desc    Clear all watch history
// @route   DELETE /api/users/watch-history
// @access  Private
const clearWatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await WatchHistory.clearAll(userId);
    res.json({ success: true, message: 'Watch history cleared' });
 
  } catch (error) {
    logger.error('Clear watch history error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to clear watch history' });
  }
};


module.exports = {
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
};
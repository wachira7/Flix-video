// ============================================
// COMPLETE FIX FOR TIMEZONE ISSUE
// ============================================

// ============================================
// BACKEND: user.controller.js
// ============================================

const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
    const {
      username,
      full_name,
      bio,
      date_of_birth,
      gender,
      country,
      city,
      timezone,
      language,
      is_public
    } = req.body;

    // Sanitize data
    const sanitizedData = {
      username: username?.trim() || null,
      full_name: full_name?.trim() || null,
      bio: bio?.trim() || null,
      date_of_birth: date_of_birth?.trim() || null,
      gender: gender?.trim() || null,
      country: country?.trim() || null,
      city: city?.trim() || null,
      timezone: timezone?.trim() || null,
      language: language || 'en',
      is_public: is_public !== undefined ? is_public : null
    };

    // console.log('📅 Received date_of_birth:', date_of_birth);
    // console.log('📅 After sanitization:', sanitizedData.date_of_birth);

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
          sanitizedData.language, 
          sanitizedData.is_public
        ]
      );
    } else {
      // Update with explicit date cast and return date as text
      result = await global.pgPool.query(
        `UPDATE user_profiles SET
          username = COALESCE($2, username),
          full_name = COALESCE($3, full_name),
          bio = COALESCE($4, bio),
          date_of_birth = COALESCE($5::date, date_of_birth),
          gender = COALESCE($6, gender),
          country = COALESCE($7, country),
          city = COALESCE($8, city),
          timezone = COALESCE($9, timezone),
          language = COALESCE($10, language),
          is_public = COALESCE($11, is_public),
          updated_at = NOW()
        WHERE user_id = $1
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
          sanitizedData.language, 
          sanitizedData.is_public
        ]
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

// @desc    Upload avatar to Supabase
// @route   POST /api/users/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
      .from('flixvideo-bucket')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to upload avatar'
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('flixvideo-bucket')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    await global.pgPool.query(
      `INSERT INTO user_profiles (user_id, avatar_url, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET avatar_url = $2, updated_at = NOW()`,
      [userId, avatarUrl]
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete avatar
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
    
    const urlParts = avatarUrl.split('/avatars/');
    if (urlParts.length > 1) {
      const filePath = `avatars/${urlParts[1]}`;
      await supabase.storage.from('flixvideo-bucket').remove([filePath]);
    }

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

module.exports = {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword
};
// backend/src/api/controllers/streaming.controller.js

const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');

// @desc    Get streaming availability for a movie
// @route   GET /api/streaming/movie/:movieId
// @access  Public
const getMovieStreamingAvailability = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { country = 'KE' } = req.query; // Default to Kenya

    const result = await global.pgPool.query(
      `SELECT 
        msa.*,
        sp.name as platform_name,
        sp.slug as platform_slug,
        sp.logo_url,
        sp.website_url
       FROM movie_streaming_availability msa
       JOIN streaming_platforms sp ON msa.platform_id = sp.id
       WHERE msa.movie_id = $1 
         AND msa.country_code = $2 
         AND msa.is_available = true
         AND sp.is_active = true
       ORDER BY 
         CASE msa.availability_type
           WHEN 'free' THEN 1
           WHEN 'stream' THEN 2
           WHEN 'rent' THEN 3
           WHEN 'buy' THEN 4
         END,
         sp.display_order`,
      [movieId, country]
    );

    // Group by availability type
    const grouped = {
      stream: [],
      rent: [],
      buy: [],
      free: []
    };

    result.rows.forEach(row => {
      const option = {
        id: row.id,
        platform: row.platform_name,
        platformSlug: row.platform_slug,
        logo: row.logo_url,
        websiteUrl: row.website_url,
        type: row.availability_type,
        price: row.price ? parseFloat(row.price) : null,
        currency: row.currency,
        quality: row.quality,
        url: row.url,
        availableFrom: row.available_from,
        availableUntil: row.available_until,
        lastChecked: row.last_checked_at
      };

      if (grouped[row.availability_type]) {
        grouped[row.availability_type].push(option);
      }
    });

    res.json({
      success: true,
      country,
      contentType: 'movie',
      contentId: movieId,
      totalOptions: result.rows.length,
      options: grouped
    });

  } catch (error) {
    console.error('Get movie streaming error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get streaming availability for a TV show
// @route   GET /api/streaming/tv/:tvShowId
// @access  Public
const getTVStreamingAvailability = async (req, res) => {
  try {
    const { tvShowId } = req.params;
    const { country = 'KE' } = req.query;

    const result = await global.pgPool.query(
      `SELECT 
        tsa.*,
        sp.name as platform_name,
        sp.slug as platform_slug,
        sp.logo_url,
        sp.website_url
       FROM tv_show_streaming_availability tsa
       JOIN streaming_platforms sp ON tsa.platform_id = sp.id
       WHERE tsa.tv_show_id = $1 
         AND tsa.country_code = $2 
         AND tsa.is_available = true
         AND sp.is_active = true
       ORDER BY 
         CASE tsa.availability_type
           WHEN 'free' THEN 1
           WHEN 'stream' THEN 2
           WHEN 'rent' THEN 3
           WHEN 'buy' THEN 4
         END,
         sp.display_order`,
      [tvShowId, country]
    );

    const grouped = {
      stream: [],
      rent: [],
      buy: [],
      free: []
    };

    result.rows.forEach(row => {
      const option = {
        id: row.id,
        platform: row.platform_name,
        platformSlug: row.platform_slug,
        logo: row.logo_url,
        websiteUrl: row.website_url,
        type: row.availability_type,
        price: row.price ? parseFloat(row.price) : null,
        currency: row.currency,
        quality: row.quality,
        url: row.url,
        availableFrom: row.available_from,
        availableUntil: row.available_until,
        lastChecked: row.last_checked_at
      };

      if (grouped[row.availability_type]) {
        grouped[row.availability_type].push(option);
      }
    });

    res.json({
      success: true,
      country,
      contentType: 'tv',
      contentId: tvShowId,
      totalOptions: result.rows.length,
      options: grouped
    });

  } catch (error) {
    console.error('Get TV streaming error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get all streaming platforms
// @route   GET /api/streaming/platforms
// @access  Public
const getStreamingPlatforms = async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;

    let query = 'SELECT * FROM streaming_platforms';
    const params = [];

    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY display_order, name';

    const result = await global.pgPool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      platforms: result.rows
    });

  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Add streaming availability (Admin only)
// @route   POST /api/streaming/availability
// @access  Private/Admin
const addStreamingAvailability = async (req, res) => {
  try {
    const {
      content_type,
      content_id,
      platform_id,
      country_code,
      availability_type,
      price,
      currency,
      quality,
      url
    } = req.body;

    // Validate required fields
    if (!content_type || !content_id || !platform_id || !country_code || !availability_type) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Determine which table to insert into
    const table = content_type === 'movie' 
      ? 'movie_streaming_availability' 
      : 'tv_show_streaming_availability';
    
    const idColumn = content_type === 'movie' ? 'movie_id' : 'tv_show_id';

    const result = await global.pgPool.query(
      `INSERT INTO ${table} (
        ${idColumn}, platform_id, country_code, availability_type,
        price, currency, quality, url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (${idColumn}, platform_id, country_code, availability_type)
      DO UPDATE SET
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        quality = EXCLUDED.quality,
        url = EXCLUDED.url,
        is_available = true,
        last_checked_at = NOW(),
        updated_at = NOW()
      RETURNING *`,
      [content_id, platform_id, country_code, availability_type, price, currency, quality, url]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Streaming availability added/updated',
      availability: result.rows[0]
    });

  } catch (error) {
    console.error('Add streaming availability error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Bulk import streaming availability
// @route   POST /api/streaming/bulk-import
// @access  Private/Admin
const bulkImportStreamingAvailability = async (req, res) => {
  try {
    const { items } = req.body; // Array of availability items

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Items array is required'
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const item of items) {
      try {
        const {
          content_type,
          content_id,
          platform_id,
          country_code,
          availability_type,
          price,
          currency,
          quality,
          url
        } = item;

        const table = content_type === 'movie' 
          ? 'movie_streaming_availability' 
          : 'tv_show_streaming_availability';
        
        const idColumn = content_type === 'movie' ? 'movie_id' : 'tv_show_id';

        await global.pgPool.query(
          `INSERT INTO ${table} (
            ${idColumn}, platform_id, country_code, availability_type,
            price, currency, quality, url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (${idColumn}, platform_id, country_code, availability_type)
          DO UPDATE SET
            price = EXCLUDED.price,
            currency = EXCLUDED.currency,
            quality = EXCLUDED.quality,
            url = EXCLUDED.url,
            is_available = true,
            last_checked_at = NOW(),
            updated_at = NOW()`,
          [content_id, platform_id, country_code, availability_type, price, currency, quality, url]
        );

        successCount++;
      } catch (itemError) {
        errorCount++;
        errors.push({
          item,
          error: itemError.message
        });
      }
    }

    res.json({
      success: true,
      message: `Imported ${successCount} items, ${errorCount} errors`,
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // Return first 10 errors only
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  getMovieStreamingAvailability,
  getTVStreamingAvailability,
  getStreamingPlatforms,
  addStreamingAvailability,
  bulkImportStreamingAvailability
};
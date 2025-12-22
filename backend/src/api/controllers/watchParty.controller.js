const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');

// Helper to normalize content type
const normalizeContentType = (type) => {
  return type === 'tv' ? 'tv_show' : type;
};

// Helper to generate unique party code
const generatePartyCode = async () => {
  const result = await global.pgPool.query('SELECT generate_party_code() as code');
  return result.rows[0].code;
};

// @desc    Create a watch party
// @route   POST /api/watch-party
// @access  Private
const createWatchParty = async (req, res) => {
  try {
    const { 
      content_type, 
      content_id, 
      title, 
      episode_number, 
      season_number,
      is_public = false,
      max_participants = 50 
    } = req.body;
    const userId = req.user.id;

    if (!['movie', 'tv'].includes(content_type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Content type must be either "movie" or "tv"'
      });
    }

    if (!content_id || !title) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Content ID and title are required'
      });
    }

    const dbContentType = normalizeContentType(content_type);
    const partyCode = await generatePartyCode();

    // Create watch party
    const partyResult = await global.pgPool.query(
      `INSERT INTO watch_parties (
        host_user_id, content_type, content_id, title, 
        episode_number, season_number, is_public, max_participants, party_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [userId, dbContentType, content_id, title, episode_number, season_number, is_public, max_participants, partyCode]
    );

    const party = partyResult.rows[0];

    // Add host as participant
    await global.pgPool.query(
      `INSERT INTO watch_party_participants (party_id, user_id, is_host, is_active)
       VALUES ($1, $2, true, true)`,
      [party.id, userId]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Watch party created successfully',
      party: {
        ...party,
        join_url: `/watch-party/${party.party_code}`
      }
    });

  } catch (error) {
    console.error('Create watch party error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Join a watch party
// @route   POST /api/watch-party/:partyCode/join
// @access  Private
const joinWatchParty = async (req, res) => {
  try {
    const { partyCode } = req.params;
    const userId = req.user.id;

    // Get party details
    const partyResult = await global.pgPool.query(
      `SELECT * FROM watch_parties WHERE party_code = $1 AND status != 'ended'`,
      [partyCode]
    );

    if (partyResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Watch party not found or has ended'
      });
    }

    const party = partyResult.rows[0];

    // Check if party is full
    const participantCount = await global.pgPool.query(
      'SELECT COUNT(*) FROM watch_party_participants WHERE party_id = $1 AND is_active = true',
      [party.id]
    );

    if (parseInt(participantCount.rows[0].count) >= party.max_participants) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Watch party is full'
      });
    }

    // Check if already in party
    const existing = await global.pgPool.query(
      'SELECT * FROM watch_party_participants WHERE party_id = $1 AND user_id = $2',
      [party.id, userId]
    );

    if (existing.rows.length > 0) {
      // Reactivate if previously left
      await global.pgPool.query(
        'UPDATE watch_party_participants SET is_active = true, left_at = NULL WHERE party_id = $1 AND user_id = $2',
        [party.id, userId]
      );
    } else {
      // Add as new participant
      await global.pgPool.query(
        `INSERT INTO watch_party_participants (party_id, user_id, is_host, is_active)
         VALUES ($1, $2, false, true)`,
        [party.id, userId]
      );
    }

    // Get participant count
    const updatedCount = await global.pgPool.query(
      'SELECT COUNT(*) FROM watch_party_participants WHERE party_id = $1 AND is_active = true',
      [party.id]
    );

    res.json({
      success: true,
      message: 'Joined watch party successfully',
      party: {
        ...party,
        participant_count: parseInt(updatedCount.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Join watch party error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Leave a watch party
// @route   POST /api/watch-party/:partyId/leave
// @access  Private
const leaveWatchParty = async (req, res) => {
  try {
    const { partyId } = req.params;
    const userId = req.user.id;

    // Mark as inactive
    const result = await global.pgPool.query(
      `UPDATE watch_party_participants 
       SET is_active = false, left_at = NOW() 
       WHERE party_id = $1 AND user_id = $2
       RETURNING *`,
      [partyId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'You are not in this watch party'
      });
    }

    res.json({
      success: true,
      message: 'Left watch party successfully'
    });

  } catch (error) {
    console.error('Leave watch party error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get watch party details
// @route   GET /api/watch-party/:partyCode
// @access  Public
const getWatchParty = async (req, res) => {
  try {
    const { partyCode } = req.params;

    // Get party
    const partyResult = await global.pgPool.query(
      `SELECT wp.*, u.email as host_email, up.username as host_username, up.full_name as host_name
       FROM watch_parties wp
       JOIN users u ON wp.host_user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE wp.party_code = $1`,
      [partyCode]
    );

    if (partyResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Watch party not found'
      });
    }

    const party = partyResult.rows[0];

    // Get active participants
    const participantsResult = await global.pgPool.query(
      `SELECT wpp.*, u.email, up.username, up.full_name, up.avatar_url
       FROM watch_party_participants wpp
       JOIN users u ON wpp.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE wpp.party_id = $1 AND wpp.is_active = true
       ORDER BY wpp.joined_at ASC`,
      [party.id]
    );

    res.json({
      success: true,
      party: {
        ...party,
        participants: participantsResult.rows,
        participant_count: participantsResult.rows.length
      }
    });

  } catch (error) {
    console.error('Get watch party error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get my watch parties
// @route   GET /api/watch-party/my-parties
// @access  Private
const getMyWatchParties = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build base query
    let query = `
      SELECT 
        wp.*,
        COUNT(DISTINCT wpp.id) FILTER (WHERE wpp.is_active = true) as participant_count
      FROM watch_parties wp
      LEFT JOIN watch_party_participants wpp ON wpp.party_id = wp.id
      WHERE wp.host_user_id = $1
    `;

    const params = [userId];

    if (status !== 'all') {
      query += ' AND wp.status = $2';
      params.push(status);
    }

    query += ` 
      GROUP BY wp.id 
      ORDER BY wp.created_at DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);

    const result = await global.pgPool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM watch_parties WHERE host_user_id = $1';
    const countParams = [userId];
    
    if (status !== 'all') {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }
    
    const countResult = await global.pgPool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
      parties: result.rows
    });

  } catch (error) {
    console.error('Get my watch parties error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    End a watch party
// @route   PUT /api/watch-party/:partyId/end
// @access  Private (Host only)
const endWatchParty = async (req, res) => {
  try {
    const { partyId } = req.params;
    const userId = req.user.id;

    // Check if user is host
    const partyResult = await global.pgPool.query(
      'SELECT * FROM watch_parties WHERE id = $1',
      [partyId]
    );

    if (partyResult.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Watch party not found'
      });
    }

    const party = partyResult.rows[0];

    if (party.host_user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Only the host can end the watch party'
      });
    }

    // End party
    await global.pgPool.query(
      `UPDATE watch_parties SET status = 'ended', ended_at = NOW() WHERE id = $1`,
      [partyId]
    );

    // Mark all participants as inactive
    await global.pgPool.query(
      `UPDATE watch_party_participants SET is_active = false, left_at = NOW() WHERE party_id = $1`,
      [partyId]
    );

    res.json({
      success: true,
      message: 'Watch party ended successfully'
    });

  } catch (error) {
    console.error('End watch party error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  createWatchParty,
  joinWatchParty,
  leaveWatchParty,
  getWatchParty,
  getMyWatchParties,
  endWatchParty
};

// backend/src/api/controllers/account.controller.js
/**
 * Account settings, sign-in sessions, data export and account deletion.
 */
const bcrypt = require('bcrypt');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const { getCollection } = require('../../config/database');
const { withDefaults, validatePatch, merge } = require('../../config/user-settings');
const logger = require('../../utils/logger');

const mongo = (name) => {
  try {
    return getCollection(name);
  } catch {
    return null; // Mongo not connected
  }
};

// =============================================================================
// SETTINGS
// =============================================================================

// @desc    Get my settings (defaults filled in)
// @route   GET /api/users/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const { rows } = await global.pgPool.query('SELECT settings FROM users WHERE id = $1', [req.user.id]);
    res.json({ success: true, settings: withDefaults(rows[0]?.settings) });
  } catch (error) {
    logger.error('Get settings error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

// @desc    Update some of my settings
// @route   PATCH /api/users/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const { settings: patch, error } = validatePatch(req.body?.settings ?? req.body);
    if (error) return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error });

    const { rows } = await global.pgPool.query('SELECT settings FROM users WHERE id = $1', [req.user.id]);
    const next = merge(rows[0]?.settings || {}, patch);
    await global.pgPool.query('UPDATE users SET settings = $2, updated_at = NOW() WHERE id = $1', [req.user.id, next]);

    res.json({ success: true, settings: withDefaults(next) });
  } catch (error) {
    logger.error('Update settings error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

// =============================================================================
// SESSIONS (signed-in devices)
// =============================================================================

// @desc    List my signed-in devices
// @route   GET /api/users/sessions
// @access  Private
const listSessions = async (req, res) => {
  try {
    const { rows } = await global.pgPool.query(
      `SELECT id, device_name, device_type, os_name, last_active_at, last_ip, created_at
       FROM devices
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY last_active_at DESC NULLS LAST
       LIMIT 50`,
      [req.user.id]
    );
    res.json({
      success: true,
      current_session_id: req.sessionId,
      sessions: rows.map((r) => ({ ...r, current: r.id === req.sessionId })),
    });
  } catch (error) {
    logger.error('List sessions error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

// @desc    Sign out one device
// @route   DELETE /api/users/sessions/:sessionId
// @access  Private
const revokeSession = async (req, res) => {
  try {
    const result = await global.pgPool.query(
      'UPDATE devices SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND user_id = $2 AND is_active = TRUE',
      [req.params.sessionId, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, signed_out_current: req.params.sessionId === req.sessionId });
  } catch (error) {
    logger.error('Revoke session error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

// @desc    Sign out every device except this one
// @route   POST /api/users/sessions/revoke-others
// @access  Private
const revokeOtherSessions = async (req, res) => {
  try {
    const result = await global.pgPool.query(
      'UPDATE devices SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1 AND is_active = TRUE AND id IS DISTINCT FROM $2',
      [req.user.id, req.sessionId]
    );
    // Tokens issued before sessions existed carry no session id; this cuts
    // them off too (the middleware applies it only to session-less tokens).
    // Skipped if the caller itself is on a session-less token, so they stay
    // signed in here.
    if (req.sessionId) {
      await global.pgPool.query('UPDATE users SET sessions_valid_after = NOW() WHERE id = $1', [req.user.id]);
    }
    res.json({ success: true, signed_out: result.rowCount });
  } catch (error) {
    logger.error('Revoke other sessions error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

// =============================================================================
// DATA EXPORT
// =============================================================================

// @desc    Download everything we store about me, as JSON
// @route   GET /api/users/me/export
// @access  Private
const exportMyData = async (req, res) => {
  try {
    const userId = req.user.id;
    const q = (sql) => global.pgPool.query(sql, [userId]).then((r) => r.rows).catch(() => []);

    const [account, profile, watchlist, favorites, ratings, reviews, comments, lists, subscriptions, payments, sessions] =
      await Promise.all([
        q('SELECT id, email, email_verified, phone, role, plan_type, settings, provider, created_at, last_login_at FROM users WHERE id = $1'),
        q('SELECT username, full_name, avatar_url, bio, date_of_birth, gender, country, city, timezone, language, is_public, created_at FROM user_profiles WHERE user_id = $1'),
        q('SELECT content_type, content_id, added_at FROM watchlist WHERE user_id = $1'),
        q('SELECT content_type, content_id, added_at FROM favorites WHERE user_id = $1'),
        q('SELECT content_type, content_id, rating, created_at FROM ratings WHERE user_id = $1'),
        q('SELECT content_type, content_id, title, content, contains_spoilers, is_public, created_at FROM reviews WHERE user_id = $1'),
        q('SELECT review_id, content, created_at FROM review_comments WHERE user_id = $1'),
        q(`SELECT l.id, l.title, l.description, l.is_public, l.created_at,
                  COALESCE(json_agg(json_build_object('content_type', i.content_type, 'content_id', i.content_id)) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
           FROM lists l LEFT JOIN list_items i ON i.list_id = l.id
           WHERE l.user_id = $1 GROUP BY l.id`),
        q('SELECT plan_type, status, current_period_start, current_period_end, created_at FROM subscriptions WHERE user_id = $1'),
        q('SELECT amount, currency, payment_method, status, plan_type, created_at FROM payments WHERE user_id = $1'),
        q('SELECT device_name, device_type, os_name, last_active_at, created_at FROM devices WHERE user_id = $1'),
      ]);

    const fromMongo = async (name, projection) => {
      const col = mongo(name);
      if (!col) return [];
      return col.find({ userId }, { projection: { _id: 0, userId: 0, ...projection } }).limit(5000).toArray().catch(() => []);
    };
    const [watchHistory, aiConversations, partyMessages] = await Promise.all([
      fromMongo('watch_history', {}),
      fromMongo('ai_conversations', {}),
      fromMongo('watch_party_messages', {}),
    ]);

    const data = {
      exported_at: new Date().toISOString(),
      account: account[0] || null,
      profile: profile[0] || null,
      watchlist,
      favorites,
      ratings,
      reviews,
      review_comments: comments,
      lists,
      watch_history: watchHistory,
      ai_conversations: aiConversations,
      watch_party_messages: partyMessages,
      subscriptions,
      payments,
      signed_in_devices: sessions,
    };

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="flixvideo-data-${date}.json"`);
    res.json(data);
  } catch (error) {
    logger.error('Export data error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

// =============================================================================
// ACCOUNT DELETION
// =============================================================================

// @desc    Delete my account
// @route   POST /api/users/me/delete
// @access  Private
// @body    { confirm: "DELETE", password? }  password is required for email accounts
//
// Personal data and activity are removed. Payment and subscription rows are
// kept for accounting but are no longer linked to any personal details,
// because the user row is anonymised rather than deleted (its foreign keys
// cascade, which would erase financial records).
const deleteMyAccount = async (req, res) => {
  const userId = req.user.id;
  const { confirm, password } = req.body || {};

  if (confirm !== 'DELETE') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Type DELETE to confirm' });
  }

  const client = await global.pgPool.connect();
  try {
    const { rows } = await client.query('SELECT password_hash, provider FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, error: ERROR_MESSAGES.USER_NOT_FOUND });

    // Email accounts must re-enter their password
    if (user.password_hash) {
      const ok = password && (await bcrypt.compare(password, user.password_hash));
      if (!ok) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: 'That password is not right' });
    }

    await client.query('BEGIN');

    // Personal activity
    for (const sql of [
      'DELETE FROM watchlist WHERE user_id = $1',
      'DELETE FROM favorites WHERE user_id = $1',
      'DELETE FROM ratings WHERE user_id = $1',
      'DELETE FROM review_comments WHERE user_id = $1',
      'DELETE FROM reviews WHERE user_id = $1',
      'DELETE FROM lists WHERE user_id = $1',
      'DELETE FROM notifications WHERE user_id = $1',
      'DELETE FROM follows WHERE follower_id = $1 OR following_id = $1',
    ]) {
      await client.query('SAVEPOINT step');
      try {
        await client.query(sql, [userId]);
        await client.query('RELEASE SAVEPOINT step');
      } catch (e) {
        // A table or column that doesn't exist in this database shouldn't block deletion
        await client.query('ROLLBACK TO SAVEPOINT step');
        logger.warn('Account deletion step skipped', { sql, error: e.message });
      }
    }

    // End parties they host, cancel subscriptions, sign out everywhere
    await client.query("UPDATE watch_parties SET status = 'ended' WHERE host_user_id = $1 AND status <> 'ended'", [userId]);
    await client.query("UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')", [userId]);
    await client.query('UPDATE devices SET is_active = FALSE WHERE user_id = $1', [userId]);

    // Anonymise the profile and the account
    await client.query(
      `UPDATE user_profiles
       SET username = NULL, full_name = NULL, avatar_url = NULL, bio = NULL, date_of_birth = NULL,
           gender = NULL, country = NULL, city = NULL, is_public = FALSE, updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
    await client.query(
      `UPDATE users
       SET email = 'deleted-' || id || '@deleted.invalid',
           password_hash = NULL, google_id = NULL, phone = NULL, avatar_url = NULL,
           verification_token = NULL, password_reset_token = NULL,
           settings = '{}'::jsonb, plan_type = 'free',
           status = 'deleted', deleted_at = NOW(), sessions_valid_after = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('Delete account error', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  } finally {
    client.release();
  }

  // Mongo data (best effort; the account is already deleted)
  await Promise.all(
    ['watch_history', 'ai_conversations', 'watch_party_messages', 'notifications'].map((name) =>
      mongo(name)?.deleteMany({ userId }).catch((e) => logger.warn('Mongo cleanup failed', { name, error: e.message }))
    )
  );

  logger.info('Account deleted', { userId });
  res.json({ success: true, message: 'Your account has been deleted' });
};

module.exports = {
  getSettings,
  updateSettings,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  exportMyData,
  deleteMyAccount,
};

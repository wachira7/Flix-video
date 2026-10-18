// backend/src/services/account-deletion.service.js
/**
 * Delete an account without losing financial records.
 *
 * Personal activity is deleted and the user + profile are anonymised. The
 * users row itself is kept because payments and subscriptions reference it
 * with ON DELETE CASCADE, so a real DELETE would erase them.
 *
 * Used by POST /api/users/me/delete and DELETE /api/admin/users/:id.
 */
const { getCollection } = require('../config/database');
const logger = require('../utils/logger');

const PERSONAL_DATA = [
  'DELETE FROM watchlist WHERE user_id = $1',
  'DELETE FROM favorites WHERE user_id = $1',
  'DELETE FROM ratings WHERE user_id = $1',
  'DELETE FROM review_comments WHERE user_id = $1',
  'DELETE FROM reviews WHERE user_id = $1',
  'DELETE FROM lists WHERE user_id = $1',
  'DELETE FROM notifications WHERE user_id = $1',
  'DELETE FROM follows WHERE follower_id = $1 OR following_id = $1',
];

const MONGO_COLLECTIONS = ['watch_history', 'ai_conversations', 'watch_party_messages', 'notifications'];

async function deleteAccount(userId) {
  const client = await global.pgPool.connect();
  try {
    await client.query('BEGIN');

    for (const sql of PERSONAL_DATA) {
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
    throw error;
  } finally {
    client.release();
  }

  // Mongo data (best effort; the account is already deleted)
  await Promise.all(
    MONGO_COLLECTIONS.map(async (name) => {
      try {
        await getCollection(name).deleteMany({ userId });
      } catch (e) {
        logger.warn('Mongo cleanup failed', { name, error: e.message });
      }
    })
  );

  logger.info('Account deleted', { userId });
}

module.exports = { deleteAccount };

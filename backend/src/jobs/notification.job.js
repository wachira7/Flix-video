// src/jobs/notification.job.js
const { Worker } = require('bullmq');
const logger = require('../utils/logger');
const { Resend } = require('resend');
const Notification = require('../models/notification.model');

const { connection } = require('./queues');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'FlixVideo <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    logger.info(`📧 Processing notification: ${job.data.type}`, { userId: job.data.userId });

    const { type, userId, data } = job.data;

    try {
      switch (type) {
        case 'payment_success':
          await sendPaymentSuccessEmail(userId, data);
          break;
        case 'payment_failed':
          await sendPaymentFailedEmail(userId, data);
          break;
        case 'subscription_expiring':
          await sendSubscriptionExpiringEmail(userId, data);
          break;
        case 'watch_party_invite':
          await sendWatchPartyInvite(userId, data);
          break;
        case 'new_review':
          await sendNewReviewNotification(userId, data);
          break;
        default:
          logger.warn(`Unknown notification type: ${type}`, { userId });
      }

      return { sent: true, type, userId };

    } catch (error) {
      logger.error('Notification job error', { error: error.message, type, userId });
      throw error;
    }
  },
  {
    connection,
    stalledInterval: 300000,
    drainDelay: 30,
    lockDuration: 60000,
  }
);

// ── Email implementations ─────────────────────────────────────────

async function sendPaymentSuccessEmail(userId, data) {
  logger.info('Sending payment success email', { userId });

   await Notification.create({
      userId,
      type: 'payment_success',
      title: 'Payment Successful ✅',
      message: `Your ${data.plan || 'FlixVideo'} subscription is now active.`,
      data: { amount: data.amount, currency: data.currency, plan: data.plan, transaction_id: data.transaction_id }
    });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: '✅ Payment Successful - FlixVideo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">🎬 FlixVideo</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Payment Successful!</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${data.username || 'there'},</p>
          <p>Your payment was processed successfully. Here are your details:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
            <p><strong>Plan:</strong> ${data.plan || 'FlixVideo Subscription'}</p>
            <p><strong>Amount:</strong> ${data.currency || 'KES'} ${data.amount}</p>
            <p><strong>Payment Method:</strong> ${data.payment_method || 'Card'}</p>
            <p><strong>Transaction ID:</strong> ${data.transaction_id || 'N/A'}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          <p>Thank you for subscribing to FlixVideo! 🍿</p>
          <p><strong>The FlixVideo Team</strong></p>
        </div>
      </div>
    `
  });
  if (error) logger.error('Payment success email failed', { error: error.message, userId });
}

async function sendPaymentFailedEmail(userId, data) {
  logger.info('Sending payment failed email', { userId });

    await Notification.create({
      userId,
      type: 'payment_failed',
      title: 'Payment Failed ❌',
      message: `Your payment of ${data.currency} ${data.amount} could not be processed.`,
      data: { amount: data.amount, currency: data.currency, reason: data.reason }
    });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: '❌ Payment Failed - FlixVideo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">🎬 FlixVideo</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Payment Failed</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${data.username || 'there'},</p>
          <p>Unfortunately your payment could not be processed.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <p><strong>Plan:</strong> ${data.plan || 'FlixVideo Subscription'}</p>
            <p><strong>Amount:</strong> ${data.currency || 'KES'} ${data.amount}</p>
            <p><strong>Reason:</strong> ${data.reason || 'Payment could not be completed'}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/subscription" style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Try Again
            </a>
          </div>
          <p>If you continue to experience issues, please contact our support team.</p>
          <p><strong>The FlixVideo Team</strong></p>
        </div>
      </div>
    `
  });
  if (error) logger.error('Payment failed email send error', { error: error.message, userId });
}

async function sendSubscriptionExpiringEmail(userId, data) {
  logger.info('Sending subscription expiring email', { userId });

    await Notification.create({
      userId,
      type: 'subscription_expiring',
      title: '⏰ Subscription Expiring Soon',
      message: `Your ${data.plan} plan expires in ${data.days_remaining} days.`,
      data:{ plan: data.plan, expiry_date: data.expiry_date, days_remaining: data.days_remaining }
    });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: '⏰ Your FlixVideo Subscription is Expiring Soon',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">🎬 FlixVideo</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Subscription Expiring Soon</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${data.username || 'there'},</p>
          <p>Your FlixVideo subscription is expiring in <strong>${data.days_remaining || 3} days</strong>.</p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p><strong>Plan:</strong> ${data.plan || 'FlixVideo Subscription'}</p>
            <p><strong>Expires:</strong> ${data.expiry_date || 'Soon'}</p>
          </div>
          <p>Renew now to keep enjoying unlimited movies and TV shows without interruption.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/subscription" style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Renew Subscription
            </a>
          </div>
          <p><strong>The FlixVideo Team</strong></p>
        </div>
      </div>
    `
  });
  if (error) logger.error('Subscription expiring email failed', { error: error.message, userId });
}

async function sendWatchPartyInvite(userId, data) {
  logger.info('Sending watch party invite', { userId });

    await Notification.create({
      userId,
      type: 'watch_party_invite',
      title: '🎉 Watch Party Invite',
      message: `${data.host_name} invited you to watch ${data.content_title}`,
      data:{ party_code: data.party_code, host_name: data.host_name, content_title: data.content_title }
    });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: `🎉 ${data.host_name || 'Someone'} invited you to a Watch Party on FlixVideo!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">🎬 FlixVideo</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">You're Invited to a Watch Party!</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${data.username || 'there'},</p>
          <p><strong>${data.host_name || 'A friend'}</strong> has invited you to watch together on FlixVideo!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p><strong>Movie/Show:</strong> ${data.content_title || 'A great title'}</p>
            <p><strong>Party Code:</strong> <span style="font-size: 24px; font-weight: bold; color: #667eea;">${data.party_code || 'N/A'}</span></p>
            <p><strong>Starts:</strong> ${data.start_time || 'Now'}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/watch-party/${data.party_code}" style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Join Watch Party 🍿
            </a>
          </div>
          <p><strong>The FlixVideo Team</strong></p>
        </div>
      </div>
    `
  });
  if (error) logger.error('Watch party invite email failed', { error: error.message, userId });
}

async function sendNewReviewNotification(userId, data) {
  logger.info('Sending new review notification', { userId });

      await Notification.create({
        userId,
        type: 'new_review',    
        title: '💬 New Review',
        message: `${data.reviewer_name} just reviewed ${data.content_title}`,
        data: { content_id: data.content_id, content_title: data.content_title, reviewer_name: data.reviewer_name, rating: data.rating }
      });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: `💬 New review on ${data.content_title || 'a title'} you follow`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">🎬 FlixVideo</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">New Review Posted</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${data.username || 'there'},</p>
          <p><strong>${data.reviewer_name || 'Someone'}</strong> just reviewed <strong>${data.content_title || 'a title'}</strong> you follow.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p><strong>Rating:</strong> ${'⭐'.repeat(data.rating || 5)}</p>
            <p><em>"${data.review_excerpt || ''}"</em></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/movie/${data.content_id}" style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Read Full Review
            </a>
          </div>
          <p><strong>The FlixVideo Team</strong></p>
        </div>
      </div>
    `
  });
  if (error) logger.error('New review notification email failed', { error: error.message, userId });
}

notificationWorker.on('completed', (job) => {
  logger.info('✅ Notification sent', job.returnvalue);
});

notificationWorker.on('failed', (job, err) => {
  logger.error('❌ Notification failed', { error: err.message });
});

module.exports = notificationWorker;
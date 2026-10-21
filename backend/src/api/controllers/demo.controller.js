// src/api/controllers/demo.controller.js
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const logger = require('../../utils/logger');
const { createDemoAccount } = require('../../services/demo.service');

// @desc    Start a one-click demo: a private, pre-filled account for a day
// @route   POST /api/demo
// @access  Public (rate limited)
const startDemo = async (req, res) => {
  try {
    const demo = await createDemoAccount(req);
    res.status(HTTP_STATUS.CREATED).json({ success: true, ...demo });
  } catch (error) {
    if (error.code === 'DEMO_CAPACITY') {
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({ success: false, error: error.message });
    }
    logger.error('Start demo error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

module.exports = { startDemo };

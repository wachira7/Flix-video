const express = require('express');
const router = express.Router();
const { 
  getExchangeRates,
  convertFromKES,
  convertToKES,
  getAvailableCurrencies 
} = require('../../utils/currency');
const { HTTP_STATUS } = require('../../utils/constants');

/**
 * @swagger
 * /api/currency/rates:
 *   get:
 *     tags: [Currency]
 *     summary: Get current exchange rates
 *     description: Get all available exchange rates with KES as base currency
 *     responses:
 *       200:
 *         description: Exchange rates retrieved
 */
router.get('/rates', async (req, res) => {
  try {
    const rates = await getExchangeRates();
    
    res.json({
      success: true,
      ...rates
    });
    
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/currency/convert:
 *   get:
 *     tags: [Currency]
 *     summary: Convert currency
 *     description: Convert between KES and other currencies
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         example: 1000
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         example: KES
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         example: USD
 *     responses:
 *       200:
 *         description: Conversion result
 */
router.get('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.query;
    
    if (!amount || !from || !to) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Missing required parameters: amount, from, to'
      });
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    let result;
    
    if (from.toUpperCase() === 'KES') {
      result = await convertFromKES(numAmount, to.toUpperCase());
    } else if (to.toUpperCase() === 'KES') {
      result = await convertToKES(numAmount, from.toUpperCase());
    } else {
      // Convert from X to Y via KES
      const toKES = await convertToKES(numAmount, from.toUpperCase());
      result = await convertFromKES(toKES.amount_kes, to.toUpperCase());
    }
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/currency/list:
 *   get:
 *     tags: [Currency]
 *     summary: Get available currencies
 *     description: Get list of all supported currencies
 *     responses:
 *       200:
 *         description: Currency list
 */
router.get('/list', async (req, res) => {
  try {
    const currencies = await getAvailableCurrencies();
    
    res.json({
      success: true,
      ...currencies
    });
    
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
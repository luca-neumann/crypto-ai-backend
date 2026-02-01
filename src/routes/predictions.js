/**
 * Predictions API Routes
 * Endpoints for generating and retrieving cryptocurrency predictions
 */

const express = require('express');
const router = express.Router();
const predictionService = require('../services/predictionService');

/**
 * GET /api/predictions
 * Get all latest predictions for cryptocurrencies
 * Query params:
 *   - limit: Maximum number of predictions (default: 50)
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const predictions = await predictionService.getAllLatestPredictions(limit);
    
    res.json({
      success: true,
      count: predictions.length,
      data: predictions,
    });
  } catch (error) {
    console.error('Error fetching predictions:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/predictions/:symbol
 * Get latest prediction for a specific cryptocurrency
 * Params:
 *   - symbol: Cryptocurrency symbol (BTC, ETH, etc.)
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const prediction = await predictionService.getLatestPrediction(symbol.toUpperCase());
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: `No prediction found for ${symbol}`,
      });
    }
    
    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('Error fetching prediction:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/predictions/generate/:cryptoId
 * Generate a new prediction for a cryptocurrency
 * Params:
 *   - cryptoId: CoinGecko cryptocurrency ID (bitcoin, ethereum, etc.)
 */
router.post('/generate/:cryptoId', async (req, res) => {
  try {
    const { cryptoId } = req.params;
    const prediction = await predictionService.generatePrediction(
      cryptoId.toLowerCase(),
      cryptoId.toUpperCase()
    );
    
    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('Error generating prediction:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/predictions/batch
 * Generate predictions for multiple cryptocurrencies
 * Body:
 *   - cryptoIds: Array of CoinGecko cryptocurrency IDs
 */
router.post('/batch', async (req, res) => {
  try {
    const { cryptoIds } = req.body;
    
    if (!Array.isArray(cryptoIds) || cryptoIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'cryptoIds must be a non-empty array',
      });
    }
    
    const predictions = await predictionService.generateBatchPredictions(
      cryptoIds.map(id => id.toLowerCase())
    );
    
    res.json({
      success: true,
      count: predictions.length,
      data: predictions,
    });
  } catch (error) {
    console.error('Error generating batch predictions:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

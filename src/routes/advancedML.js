/**
 * Advanced ML Routes ("/api/ml")
 *
 * This router exposes the advanced ML/feature-engineering utilities from
 * src/services/advancedMLService.js.
 *
 * Design goals:
 * - Keep controllers small and predictable.
 * - Validate inputs, then delegate to service functions.
 */

const express = require('express');
const router = express.Router();

const advancedMLService = require('../services/advancedMLService');
const { coingeckoService } = require('../services/coingeckoService');

/**
 * POST /api/ml/engineer-features
 *
 * Body:
 * {
 *   "priceHistory": [{"price":45000,"volume":123,"timestamp":"..."}, ...]
 * }
 */
router.post('/engineer-features', (req, res) => {
  try {
    const { priceHistory } = req.body;

    if (!Array.isArray(priceHistory) || priceHistory.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Required: priceHistory (non-empty array of {price, volume?})'
      });
    }

    const features = advancedMLService.engineerFeatures(priceHistory);

    if (!features) {
      return res.status(400).json({
        success: false,
        error: 'Not enough data points to engineer features (need ~20+)'
      });
    }

    res.json({ success: true, data: features });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ml/ensemble-prediction
 *
 * Body:
 * {
 *   "priceHistory": [{"price":45000,"volume":123}, ...],
 *   "sentiment": {"score":0.62},
 *   "technicalAnalysis": {"trend":"bullish"}
 * }
 */
router.post('/ensemble-prediction', (req, res) => {
  try {
    const { priceHistory, sentiment = { score: 0.5 }, technicalAnalysis = {} } = req.body;

    if (!Array.isArray(priceHistory) || priceHistory.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Required: priceHistory (non-empty array)'
      });
    }

    const features = advancedMLService.engineerFeatures(priceHistory);
    if (!features) {
      return res.status(400).json({
        success: false,
        error: 'Not enough data points to engineer features (need ~20+)'
      });
    }

    const prediction = advancedMLService.ensemblePrediction(features, sentiment, technicalAnalysis);

    res.json({
      success: true,
      data: {
        prediction,
        features
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ml/price-targets
 *
 * Body:
 * {
 *   "currentPrice": 45000,
 *   "features": { ... },
 *   "prediction": {"signal":"BUY","confidence":0.78,"score":0.74}
 * }
 */
router.post('/price-targets', (req, res) => {
  try {
    const { currentPrice, features, prediction } = req.body;

    if (typeof currentPrice !== 'number' || !features || !prediction) {
      return res.status(400).json({
        success: false,
        error: 'Required: currentPrice (number), features (object), prediction (object)'
      });
    }

    const targets = advancedMLService.calculatePriceTargets(currentPrice, features, prediction);
    res.json({ success: true, data: targets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ml/track-performance
 *
 * Body:
 * {
 *   "symbol": "BTC",
 *   "prediction": {"signal":"BUY","confidence":0.78,"priceTarget":45500},
 *   "actualPrice": 45200
 * }
 */
router.post('/track-performance', async (req, res) => {
  try {
    const { symbol, prediction, actualPrice } = req.body;

    if (!symbol || !prediction || typeof actualPrice !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Required: symbol (string), prediction (object), actualPrice (number)'
      });
    }

    const perf = await advancedMLService.trackModelPerformance(symbol, prediction, actualPrice);
    res.json({ success: true, data: perf });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ml/model-accuracy/:symbol?days=30
 */
router.get('/model-accuracy/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const days = req.query.days ? Number(req.query.days) : 30;

    const data = await advancedMLService.getModelAccuracy(symbol, Number.isFinite(days) ? days : 30);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ml/technical-indicators/:cryptoId?days=90
 *
 * Fetches historical prices (via CoinGecko service) and computes indicators/features.
 */
router.get('/technical-indicators/:cryptoId', async (req, res) => {
  try {
    const { cryptoId } = req.params;
    const days = req.query.days ? Number(req.query.days) : 90;

    const history = await coingeckoService.getHistoricalPrices(cryptoId, Number.isFinite(days) ? days : 90);

    // Map to the shape engineerFeatures expects.
    const priceHistory = (history?.prices || []).map(([ts, price], idx) => ({
      timestamp: new Date(ts).toISOString(),
      price,
      // CoinGecko includes volumes as a separate array; best-effort alignment.
      volume: history?.total_volumes?.[idx]?.[1] ?? 0
    }));

    const features = advancedMLService.engineerFeatures(priceHistory);

    if (!features) {
      return res.status(400).json({
        success: false,
        error: 'Not enough history returned from CoinGecko to compute indicators'
      });
    }

    res.json({
      success: true,
      data: {
        cryptoId,
        days: Number.isFinite(days) ? days : 90,
        indicators: {
          sma20: features.sma20,
          sma50: features.sma50,
          ema12: features.ema12,
          ema26: features.ema26,
          rsi: features.rsi,
          macd: {
            macd: features.macd,
            signal: features.macdSignal,
            histogram: features.macdHistogram
          },
          bollinger: {
            upper: features.bollingerUpper,
            middle: features.bollingerMiddle,
            lower: features.bollingerLower,
            width: features.bollingerWidth
          },
          volatility: features.volatility,
          momentum: features.momentum
        },
        features
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

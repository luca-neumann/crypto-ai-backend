/**
 * Backtesting API Routes
 * Endpoints for backtesting trading strategies and validating predictions
 */

const express = require('express');
const router = express.Router();
const backtestingService = require('../services/backtestingService');

/**
 * POST /api/backtest/run
 * Run a backtest on historical data
 * Body:
 *   - cryptoId: cryptocurrency ID (e.g., 'bitcoin')
 *   - days: number of days to backtest (default: 90)
 *   - initialCapital: starting capital (default: 10000)
 */
router.post('/run', async (req, res) => {
  try {
    const { cryptoId, days = 90, initialCapital = 10000 } = req.body;

    if (!cryptoId) {
      return res.status(400).json({
        success: false,
        error: 'cryptoId is required'
      });
    }

    const result = await backtestingService.runBacktest(cryptoId, days, initialCapital);

    res.json(result);
  } catch (error) {
    console.error('Error running backtest:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/backtest/compare-strategies
 * Compare multiple trading strategies
 * Body:
 *   - cryptoId: cryptocurrency ID
 *   - days: number of days to backtest (default: 90)
 */
router.post('/compare-strategies', async (req, res) => {
  try {
    const { cryptoId, days = 90 } = req.body;

    if (!cryptoId) {
      return res.status(400).json({
        success: false,
        error: 'cryptoId is required'
      });
    }

    const results = await backtestingService.compareStrategies(cryptoId, days);

    res.json({
      success: true,
      cryptoId,
      days,
      strategies: results
    });
  } catch (error) {
    console.error('Error comparing strategies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/backtest/optimize
 * Optimize strategy parameters
 * Body:
 *   - cryptoId: cryptocurrency ID
 *   - days: number of days to backtest (default: 90)
 */
router.post('/optimize', async (req, res) => {
  try {
    const { cryptoId, days = 90 } = req.body;

    if (!cryptoId) {
      return res.status(400).json({
        success: false,
        error: 'cryptoId is required'
      });
    }

    const result = await backtestingService.optimizeStrategy(cryptoId, days);

    res.json({
      success: true,
      cryptoId,
      ...result
    });
  } catch (error) {
    console.error('Error optimizing strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/backtest/validate/:symbol
 * Validate prediction accuracy
 * Params:
 *   - symbol: cryptocurrency symbol (e.g., BTC, ETH)
 * Query params:
 *   - days: number of days to validate (default: 30)
 */
router.get('/validate/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days) || 30;

    const result = await backtestingService.validatePredictions(symbol, days);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error validating predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/backtest/report
 * Generate backtest report
 * Body:
 *   - cryptoId: cryptocurrency ID
 *   - days: number of days to backtest (default: 90)
 *   - initialCapital: starting capital (default: 10000)
 */
router.post('/report', async (req, res) => {
  try {
    const { cryptoId, days = 90, initialCapital = 10000 } = req.body;

    if (!cryptoId) {
      return res.status(400).json({
        success: false,
        error: 'cryptoId is required'
      });
    }

    // Run backtest
    const backtestResult = await backtestingService.runBacktest(cryptoId, days, initialCapital);

    if (!backtestResult.success) {
      return res.status(400).json(backtestResult);
    }

    // Generate report
    const report = backtestingService.generateBacktestReport(backtestResult);

    res.json({
      success: true,
      report,
      metrics: backtestResult.metrics
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/backtest/metrics/:cryptoId
 * Get backtest metrics for a cryptocurrency
 * Params:
 *   - cryptoId: cryptocurrency ID
 * Query params:
 *   - days: number of days (default: 90)
 *   - initialCapital: starting capital (default: 10000)
 */
router.get('/metrics/:cryptoId', async (req, res) => {
  try {
    const cryptoId = req.params.cryptoId;
    const days = parseInt(req.query.days) || 90;
    const initialCapital = parseInt(req.query.initialCapital) || 10000;

    const result = await backtestingService.runBacktest(cryptoId, days, initialCapital);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      cryptoId,
      metrics: result.metrics,
      summary: {
        initialCapital,
        finalEquity: result.finalEquity,
        totalReturn: result.metrics.totalReturn,
        sharpeRatio: result.metrics.sharpeRatio,
        maxDrawdown: result.metrics.maxDrawdown,
        winRate: result.metrics.winRate
      }
    });
  } catch (error) {
    console.error('Error getting backtest metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

/**
 * Risk Management Routes
 *
 * Notes on design:
 * - These endpoints are thin controllers. They validate inputs, call the service layer,
 *   and normalize responses.
 * - The service implementation lives in src/services/riskManagementService.js
 */

const express = require('express');
const router = express.Router();

// riskManagementService exports an instance (module.exports = new RiskManagementService())
const riskManagementService = require('../services/riskManagementService');

/**
 * Scenario catalog used by /stress-test and /scenarios.
 * Kept here to avoid changing service internals.
 */
const STRESS_SCENARIOS = {
  crash_20: {
    name: 'crash_20',
    description: '20% market crash across portfolio',
    priceChange: -20,
    volatilityChange: +40,
    severity: 'medium'
  },
  crash_50: {
    name: 'crash_50',
    description: '50% market crash across portfolio',
    priceChange: -50,
    volatilityChange: +90,
    severity: 'critical'
  },
  volatility_spike: {
    name: 'volatility_spike',
    description: 'Extreme volatility spike with smaller directional move',
    priceChange: -5,
    volatilityChange: +150,
    severity: 'high'
  },
  melt_up_25: {
    name: 'melt_up_25',
    description: '25% rapid upside move (risk for shorts / leverage)',
    priceChange: +25,
    volatilityChange: +60,
    severity: 'high'
  }
};

/**
 * POST /api/risk/position-size
 *
 * Calculate optimal position size using Kelly Criterion (+ conservative caps).
 */
router.post('/position-size', (req, res) => {
  try {
    const { accountSize, winRate, avgWin, avgLoss, riskPerTrade } = req.body;

    if (
      typeof accountSize !== 'number' ||
      typeof winRate !== 'number' ||
      typeof avgWin !== 'number' ||
      typeof avgLoss !== 'number'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Required: accountSize, winRate, avgWin, avgLoss (numbers)'
      });
    }

    const result = riskManagementService.calculatePositionSize({
      accountSize,
      winRate,
      avgWin,
      avgLoss,
      riskPerTrade: typeof riskPerTrade === 'number' ? riskPerTrade : undefined
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/risk/stop-loss
 *
 * Calculate stop-loss / take-profit levels.
 */
router.post('/stop-loss', (req, res) => {
  try {
    const { entryPrice, accountSize, riskAmount, riskRewardRatio, volatility } = req.body;

    if (
      typeof entryPrice !== 'number' ||
      typeof accountSize !== 'number' ||
      typeof riskAmount !== 'number'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Required: entryPrice, accountSize, riskAmount (numbers)'
      });
    }

    const result = riskManagementService.calculateStopLossAndTakeProfit({
      entryPrice,
      accountSize,
      riskAmount,
      riskRewardRatio: typeof riskRewardRatio === 'number' ? riskRewardRatio : undefined,
      volatility: typeof volatility === 'number' ? volatility : undefined
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/risk/exposure
 *
 * Portfolio risk exposure analysis.
 */
router.post('/exposure', (req, res) => {
  try {
    const { holdings, totalCapital, correlationMatrix } = req.body;

    if (!Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Required: holdings (non-empty array)'
      });
    }

    const result = riskManagementService.analyzeRiskExposure({
      holdings,
      totalCapital: typeof totalCapital === 'number' ? totalCapital : undefined,
      correlationMatrix: correlationMatrix && typeof correlationMatrix === 'object' ? correlationMatrix : undefined
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/risk/stress-test
 *
 * Runs predefined stress scenarios against holdings.
 *
 * Body:
 * {
 *   "holdings": [{"symbol":"BTC","amount":0.5,"currentPrice":45000}],
 *   "scenarioIds": ["crash_20","volatility_spike"]
 * }
 */
router.post('/stress-test', (req, res) => {
  try {
    const { holdings, scenarioIds } = req.body;

    if (!Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Required: holdings (non-empty array)'
      });
    }

    const ids = Array.isArray(scenarioIds) && scenarioIds.length > 0
      ? scenarioIds
      : ['crash_20', 'crash_50', 'volatility_spike'];

    const scenarios = ids
      .map((id) => STRESS_SCENARIOS[id])
      .filter(Boolean);

    if (scenarios.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid scenarioIds provided. Use GET /api/risk/scenarios.'
      });
    }

    const result = riskManagementService.runStressTest(
      { holdings },
      scenarios
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/risk/scenarios
 *
 * Lists available stress test scenarios.
 */
router.get('/scenarios', (_req, res) => {
  const data = Object.values(STRESS_SCENARIOS).map(({ name, description, priceChange, volatilityChange, severity }) => ({
    id: name,
    name,
    description,
    priceChange,
    volatilityChange,
    severity
  }));

  res.json({ success: true, count: data.length, data });
});

/**
 * POST /api/risk/hedging-recommendation
 *
 * Returns hedging recommendations based on portfolio composition.
 */
router.post('/hedging-recommendation', (req, res) => {
  try {
    const { holdings } = req.body;

    if (!Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Required: holdings (non-empty array)'
      });
    }

    const recommendations = riskManagementService.generateHedgingRecommendations({ holdings });

    res.json({
      success: true,
      data: {
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

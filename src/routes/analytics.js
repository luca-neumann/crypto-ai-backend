/**
 * Advanced Analytics Routes
 * Endpoints for comprehensive analytics, metrics, and insights
 * 
 * Features:
 * - Portfolio performance analytics
 * - Risk metrics and analysis
 * - Trading statistics
 * - Market correlation analysis
 * - Performance attribution
 * - Custom dashboards
 */

const express = require('express');
const router = express.Router();
const advancedAnalyticsService = require('../services/advancedAnalyticsService');

/**
 * POST /api/analytics/performance
 * Calculate portfolio performance metrics
 * Body:
 *   - portfolioHistory: array of portfolio values over time
 *   - riskFreeRate: risk-free rate (default 0.02)
 */
router.post('/performance', (req, res) => {
  try {
    const { portfolioHistory, riskFreeRate = 0.02 } = req.body;

    if (!Array.isArray(portfolioHistory) || portfolioHistory.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Required: portfolioHistory (array with at least 2 values)'
      });
    }

    const metrics = advancedAnalyticsService.calculatePerformanceMetrics(
      portfolioHistory,
      riskFreeRate
    );

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/correlations
 * Analyze market correlations between cryptocurrencies
 * Body:
 *   - priceData: object with symbol -> price array mapping
 */
router.post('/correlations', (req, res) => {
  try {
    const { priceData } = req.body;

    if (!priceData || typeof priceData !== 'object' || Object.keys(priceData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Required: priceData (object with symbol -> price array mapping)'
      });
    }

    const analysis = advancedAnalyticsService.analyzeMarketCorrelations(priceData);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/value-at-risk
 * Calculate Value at Risk (VaR) - maximum potential loss
 * Body:
 *   - returns: array of historical returns
 *   - confidenceLevel: confidence level (default 0.95 for 95%)
 */
router.post('/value-at-risk', (req, res) => {
  try {
    const { returns, confidenceLevel = 0.95 } = req.body;

    if (!Array.isArray(returns) || returns.length < 30) {
      return res.status(400).json({
        success: false,
        error: 'Required: returns (array with at least 30 values)'
      });
    }

    const varMetrics = advancedAnalyticsService.calculateValueAtRisk(
      returns,
      confidenceLevel
    );

    res.json({
      success: true,
      data: varMetrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/trading-statistics
 * Generate trading statistics and insights
 * Body:
 *   - trades: array of trade objects with profit property
 */
router.post('/trading-statistics', (req, res) => {
  try {
    const { trades } = req.body;

    if (!Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Required: trades (non-empty array of trade objects)'
      });
    }

    const statistics = advancedAnalyticsService.generateTradingStatistics(trades);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/performance-attribution
 * Generate performance attribution analysis
 * Shows which holdings contributed most to returns
 * Body:
 *   - holdings: array of holdings with value and return
 */
router.post('/performance-attribution', (req, res) => {
  try {
    const { holdings } = req.body;

    if (!Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Required: holdings (non-empty array)'
      });
    }

    const attribution = advancedAnalyticsService.generatePerformanceAttribution(holdings);

    res.json({
      success: true,
      data: attribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/dashboard
 * Generate comprehensive dashboard data
 * Aggregates multiple analytics for dashboard display
 * Body:
 *   - portfolioData: portfolio history and returns
 *   - trades: trade history
 */
router.post('/dashboard', (req, res) => {
  try {
    const { portfolioData, trades } = req.body;

    if (!portfolioData || !Array.isArray(portfolioData.history)) {
      return res.status(400).json({
        success: false,
        error: 'Required: portfolioData with history array'
      });
    }

    const dashboardData = advancedAnalyticsService.generateDashboardData(
      portfolioData,
      trades || []
    );

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/risk-metrics
 * Calculate comprehensive risk metrics
 * Body:
 *   - portfolioHistory: array of portfolio values
 *   - returns: array of returns
 */
router.post('/risk-metrics', (req, res) => {
  try {
    const { portfolioHistory, returns } = req.body;

    if (!Array.isArray(portfolioHistory) || portfolioHistory.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Required: portfolioHistory (array with at least 2 values)'
      });
    }

    // Calculate multiple risk metrics
    const maxDrawdown = advancedAnalyticsService.calculateMaxDrawdown(portfolioHistory);
    const varMetrics = returns && returns.length >= 30
      ? advancedAnalyticsService.calculateValueAtRisk(returns)
      : null;

    res.json({
      success: true,
      data: {
        maxDrawdown,
        valueAtRisk: varMetrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/compare-strategies
 * Compare performance of different trading strategies
 * Body:
 *   - strategies: array of strategy results with returns
 */
router.post('/compare-strategies', (req, res) => {
  try {
    const { strategies } = req.body;

    if (!Array.isArray(strategies) || strategies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Required: strategies (non-empty array)'
      });
    }

    // Calculate performance metrics for each strategy
    const comparison = strategies.map(strategy => ({
      name: strategy.name,
      metrics: advancedAnalyticsService.calculatePerformanceMetrics(
        strategy.returns || []
      ),
      trades: strategy.trades ? advancedAnalyticsService.generateTradingStatistics(strategy.trades) : null
    }));

    res.json({
      success: true,
      data: {
        strategies: comparison,
        bestPerformer: comparison.reduce((best, current) => {
          const bestReturn = parseFloat(best.metrics.totalReturn);
          const currentReturn = parseFloat(current.metrics.totalReturn);
          return currentReturn > bestReturn ? current : best;
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

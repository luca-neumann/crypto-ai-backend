/**
 * Portfolio Optimization Routes
 * 
 * Provides endpoints for portfolio analysis and optimization using:
 * - Modern Portfolio Theory (MPT)
 * - Diversification metrics (Herfindahl index)
 * - Risk metrics (VaR, CVaR, Sharpe, Sortino ratios)
 * - Monte Carlo simulations
 * - Rebalancing recommendations
 * 
 * @module routes/portfolio
 */

const express = require('express');
const router = express.Router();
const portfolioOptimizationService = require('../services/portfolioOptimizationService');

/**
 * POST /api/portfolio/analyze
 * 
 * Analyze a portfolio's risk and return characteristics
 * 
 * Request body:
 * {
 *   "holdings": [
 *     { "symbol": "BTC", "amount": 0.5, "currentPrice": 45000 },
 *     { "symbol": "ETH", "amount": 5, "currentPrice": 2500 },
 *     { "symbol": "SOL", "amount": 100, "currentPrice": 150 }
 *   ],
 *   "historicalPrices": {
 *     "BTC": [44000, 44500, 45000, 45100, 45200],
 *     "ETH": [2400, 2450, 2500, 2520, 2550],
 *     "SOL": [140, 145, 150, 152, 155]
 *   },
 *   "riskFreeRate": 0.05
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalValue": 50000,
 *     "allocation": {
 *       "BTC": 0.45,
 *       "ETH": 0.25,
 *       "SOL": 0.30
 *     },
 *     "metrics": {
 *       "expectedReturn": 0.15,
 *       "volatility": 0.25,
 *       "sharpeRatio": 0.40,
 *       "sortinoRatio": 0.65,
 *       "var95": 5000,
 *       "cvar95": 7500
 *     },
 *     "diversification": {
 *       "herfindahlIndex": 0.35,
 *       "diversificationScore": 0.65,
 *       "concentration": "moderate"
 *     }
 *   }
 * }
 */
router.post('/analyze', (req, res) => {
  try {
    const { holdings, historicalPrices, riskFreeRate = 0.05 } = req.body;
    
    // Validate required fields
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Holdings array is required and must not be empty'
      });
    }
    
    // Analyze portfolio using service
    const analysis = portfolioOptimizationService.analyzePortfolio({
      holdings,
      historicalPrices: historicalPrices || {},
      riskFreeRate
    });
    
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
 * POST /api/portfolio/optimize
 * 
 * Generate optimal portfolio allocation using Modern Portfolio Theory
 * 
 * Request body:
 * {
 *   "symbols": ["BTC", "ETH", "SOL", "ADA"],
 *   "historicalPrices": {
 *     "BTC": [44000, 44500, 45000, ...],
 *     "ETH": [2400, 2450, 2500, ...],
 *     ...
 *   },
 *   "constraints": {
 *     "minAllocation": 0.05,
 *     "maxAllocation": 0.50,
 *     "targetReturn": 0.15
 *   },
 *   "riskFreeRate": 0.05
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "optimalAllocation": {
 *       "BTC": 0.35,
 *       "ETH": 0.30,
 *       "SOL": 0.20,
 *       "ADA": 0.15
 *     },
 *     "expectedReturn": 0.16,
 *     "expectedVolatility": 0.22,
 *     "sharpeRatio": 0.50,
 *     "efficientFrontier": [
 *       { "return": 0.08, "volatility": 0.10, "allocation": {...} },
 *       { "return": 0.12, "volatility": 0.15, "allocation": {...} },
 *       ...
 *     ]
 *   }
 * }
 */
router.post('/optimize', (req, res) => {
  try {
    const { symbols, historicalPrices, constraints = {}, riskFreeRate = 0.05 } = req.body;
    
    // Validate required fields
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Symbols array is required and must not be empty'
      });
    }
    
    if (!historicalPrices || Object.keys(historicalPrices).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Historical prices are required'
      });
    }
    
    // Optimize portfolio using service
    const optimization = portfolioOptimizationService.optimizePortfolio({
      symbols,
      historicalPrices,
      constraints,
      riskFreeRate
    });
    
    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/portfolio/rebalance
 * 
 * Generate rebalancing recommendations for a portfolio
 * 
 * Request body:
 * {
 *   "currentHoldings": [
 *     { "symbol": "BTC", "amount": 0.5, "currentPrice": 45000 },
 *     { "symbol": "ETH", "amount": 5, "currentPrice": 2500 }
 *   ],
 *   "targetAllocation": {
 *     "BTC": 0.40,
 *     "ETH": 0.35,
 *     "SOL": 0.25
 *   },
 *   "rebalancingThreshold": 0.05
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "needsRebalancing": true,
 *     "currentAllocation": {
 *       "BTC": 0.45,
 *       "ETH": 0.55
 *     },
 *     "recommendations": [
 *       {
 *         "symbol": "BTC",
 *         "action": "sell",
 *         "amount": 0.05,
 *         "value": 2250,
 *         "reason": "Reduce overweight position"
 *       },
 *       {
 *         "symbol": "SOL",
 *         "action": "buy",
 *         "amount": 37.5,
 *         "value": 5625,
 *         "reason": "Add underweight position"
 *       }
 *     ],
 *     "estimatedCost": 50
 *   }
 * }
 */
router.post('/rebalance', (req, res) => {
  try {
    const { currentHoldings, targetAllocation, rebalancingThreshold = 0.05 } = req.body;
    
    // Validate required fields
    if (!currentHoldings || !Array.isArray(currentHoldings)) {
      return res.status(400).json({
        success: false,
        error: 'Current holdings array is required'
      });
    }
    
    if (!targetAllocation || Object.keys(targetAllocation).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Target allocation is required'
      });
    }
    
    // Generate rebalancing recommendations
    const recommendations = portfolioOptimizationService.generateRebalancingRecommendations({
      currentHoldings,
      targetAllocation,
      rebalancingThreshold
    });
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/portfolio/monte-carlo
 * 
 * Run Monte Carlo simulation for portfolio projections
 * 
 * Request body:
 * {
 *   "holdings": [
 *     { "symbol": "BTC", "amount": 0.5, "currentPrice": 45000 },
 *     { "symbol": "ETH", "amount": 5, "currentPrice": 2500 }
 *   ],
 *   "historicalPrices": {
 *     "BTC": [44000, 44500, 45000, ...],
 *     "ETH": [2400, 2450, 2500, ...]
 *   },
 *   "simulations": 10000,
 *   "days": 30
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "simulations": 10000,
 *     "days": 30,
 *     "initialValue": 50000,
 *     "projections": {
 *       "mean": 52500,
 *       "median": 52000,
 *       "std": 5000,
 *       "min": 35000,
 *       "max": 75000,
 *       "percentile5": 40000,
 *       "percentile25": 48000,
 *       "percentile75": 57000,
 *       "percentile95": 65000
 *     },
 *     "probabilityOfGain": 0.65,
 *     "probabilityOfLoss": 0.35,
 *     "expectedReturn": 0.05,
 *     "riskMetrics": {
 *       "var95": 10000,
 *       "cvar95": 15000,
 *       "maxDrawdown": 0.30
 *     }
 *   }
 * }
 */
router.post('/monte-carlo', (req, res) => {
  try {
    const { holdings, historicalPrices, simulations = 10000, days = 30 } = req.body;
    
    // Validate required fields
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Holdings array is required'
      });
    }
    
    if (!historicalPrices || Object.keys(historicalPrices).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Historical prices are required'
      });
    }
    
    // Run Monte Carlo simulation
    const simulation = portfolioOptimizationService.runMonteCarloSimulation({
      holdings,
      historicalPrices,
      simulations,
      days
    });
    
    res.json({
      success: true,
      data: simulation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/portfolio/diversification
 * 
 * Analyze portfolio diversification metrics
 * 
 * Request body:
 * {
 *   "holdings": [
 *     { "symbol": "BTC", "amount": 0.5, "currentPrice": 45000 },
 *     { "symbol": "ETH", "amount": 5, "currentPrice": 2500 },
 *     { "symbol": "SOL", "amount": 100, "currentPrice": 150 }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalValue": 50000,
 *     "allocation": {
 *       "BTC": 0.45,
 *       "ETH": 0.25,
 *       "SOL": 0.30
 *     },
 *     "herfindahlIndex": 0.35,
 *     "diversificationScore": 0.65,
 *     "concentration": "moderate",
 *     "recommendations": [
 *       "Consider reducing BTC allocation to improve diversification",
 *       "SOL allocation is well-balanced"
 *     ]
 *   }
 * }
 */
router.post('/diversification', (req, res) => {
  try {
    const { holdings } = req.body;
    
    // Validate required fields
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Holdings array is required'
      });
    }
    
    // Analyze diversification
    const analysis = portfolioOptimizationService.analyzeDiversification(holdings);
    
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
 * POST /api/portfolio/risk-metrics
 * 
 * Calculate comprehensive risk metrics for a portfolio
 * 
 * Request body:
 * {
 *   "holdings": [
 *     { "symbol": "BTC", "amount": 0.5, "currentPrice": 45000 },
 *     { "symbol": "ETH", "amount": 5, "currentPrice": 2500 }
 *   ],
 *   "historicalPrices": {
 *     "BTC": [44000, 44500, 45000, ...],
 *     "ETH": [2400, 2450, 2500, ...]
 *   },
 *   "riskFreeRate": 0.05,
 *   "confidenceLevel": 0.95
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "volatility": 0.25,
 *     "sharpeRatio": 0.40,
 *     "sortinoRatio": 0.65,
 *     "var": 5000,
 *     "cvar": 7500,
 *     "maxDrawdown": 0.35,
 *     "beta": 1.2,
 *     "correlation": {
 *       "BTC_ETH": 0.75,
 *       "BTC_SOL": 0.65,
 *       "ETH_SOL": 0.70
 *     }
 *   }
 * }
 */
router.post('/risk-metrics', (req, res) => {
  try {
    const { holdings, historicalPrices, riskFreeRate = 0.05, confidenceLevel = 0.95 } = req.body;
    
    // Validate required fields
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Holdings array is required'
      });
    }
    
    if (!historicalPrices || Object.keys(historicalPrices).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Historical prices are required'
      });
    }
    
    // Calculate risk metrics
    const metrics = portfolioOptimizationService.calculateRiskMetrics({
      holdings,
      historicalPrices,
      riskFreeRate,
      confidenceLevel
    });
    
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
 * GET /api/portfolio/efficient-frontier
 * 
 * Get the efficient frontier for a set of assets
 * 
 * Query parameters:
 * - symbols: Comma-separated list of symbols (e.g., "BTC,ETH,SOL")
 * - points: Number of points on frontier (default: 50)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "frontier": [
 *       { "return": 0.08, "volatility": 0.10, "allocation": {...} },
 *       { "return": 0.10, "volatility": 0.12, "allocation": {...} },
 *       ...
 *     ],
 *     "capitalMarketLine": {
 *       "slope": 0.5,
 *       "intercept": 0.05
 *     },
 *     "optimalPortfolio": {
 *       "return": 0.15,
 *       "volatility": 0.20,
 *       "sharpeRatio": 0.50
 *     }
 *   }
 * }
 */
router.get('/efficient-frontier', (req, res) => {
  try {
    const { symbols, points = 50 } = req.query;
    
    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: 'Symbols parameter is required'
      });
    }
    
    const symbolArray = symbols.split(',').map(s => s.trim());
    
    // Get efficient frontier
    const frontier = portfolioOptimizationService.getEfficientFrontier(
      symbolArray,
      parseInt(points)
    );
    
    res.json({
      success: true,
      data: frontier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

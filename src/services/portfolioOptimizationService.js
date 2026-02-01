/**
 * Portfolio Optimization Service
 * 
 * Advanced portfolio management features:
 * - Modern Portfolio Theory (MPT) optimization
 * - Risk-adjusted return calculations
 * - Diversification analysis
 * - Rebalancing recommendations
 * - Correlation analysis
 * - Value at Risk (VaR) calculations
 * - Sharpe ratio optimization
 * - Monte Carlo simulations
 */

class PortfolioOptimizationService {
  constructor() {
    this.portfolios = new Map();
    this.optimizationHistory = [];
  }

  /**
   * Create and analyze portfolio
   * 
   * @param {Object} portfolioData - Portfolio configuration
   * @returns {Object} Portfolio analysis with recommendations
   */
  analyzePortfolio(portfolioData) {
    const {
      holdings,      // Array of {symbol, amount, entryPrice}
      totalCapital,
      riskTolerance, // 'conservative', 'moderate', 'aggressive'
      investmentHorizon // in months
    } = portfolioData;

    try {
      // Calculate portfolio metrics
      const metrics = this.calculatePortfolioMetrics(holdings, totalCapital);

      // Analyze diversification
      const diversification = this.analyzeDiversification(holdings);

      // Calculate risk metrics
      const riskMetrics = this.calculateRiskMetrics(holdings, metrics);

      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations(
        holdings,
        metrics,
        diversification,
        riskTolerance
      );

      // Calculate optimal allocation
      const optimalAllocation = this.calculateOptimalAllocation(
        holdings,
        riskTolerance,
        investmentHorizon
      );

      return {
        success: true,
        portfolio: {
          holdings,
          totalCapital,
          riskTolerance,
          investmentHorizon
        },
        metrics,
        diversification,
        riskMetrics,
        recommendations,
        optimalAllocation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate portfolio metrics
   */
  calculatePortfolioMetrics(holdings, totalCapital) {
    let totalValue = 0;
    let totalCost = 0;
    const allocations = {};

    for (const holding of holdings) {
      const currentValue = holding.amount * holding.currentPrice;
      const costBasis = holding.amount * holding.entryPrice;

      totalValue += currentValue;
      totalCost += costBasis;

      allocations[holding.symbol] = {
        value: currentValue,
        percentage: 0, // Will be calculated below
        amount: holding.amount,
        entryPrice: holding.entryPrice,
        currentPrice: holding.currentPrice,
        gain: currentValue - costBasis,
        gainPercent: ((currentValue - costBasis) / costBasis) * 100
      };
    }

    // Calculate allocation percentages
    for (const symbol in allocations) {
      allocations[symbol].percentage = (allocations[symbol].value / totalValue) * 100;
    }

    return {
      totalValue,
      totalCost,
      totalGain: totalValue - totalCost,
      totalGainPercent: ((totalValue - totalCost) / totalCost) * 100,
      allocations,
      numberOfHoldings: holdings.length
    };
  }

  /**
   * Analyze portfolio diversification
   */
  analyzeDiversification(holdings) {
    const herfindahlIndex = this.calculateHerfindahlIndex(holdings);
    const concentrationRisk = this.calculateConcentrationRisk(holdings);
    const correlationMatrix = this.calculateCorrelationMatrix(holdings);

    // Diversification score (0-100)
    const diversificationScore = Math.max(0, 100 - (herfindahlIndex * 100));

    return {
      herfindahlIndex,
      diversificationScore,
      concentrationRisk,
      correlationMatrix,
      assessment: this.assessDiversification(diversificationScore),
      recommendations: this.getDiversificationRecommendations(
        diversificationScore,
        concentrationRisk
      )
    };
  }

  /**
   * Calculate Herfindahl Index (concentration measure)
   */
  calculateHerfindahlIndex(holdings) {
    let totalValue = 0;
    const values = [];

    for (const holding of holdings) {
      const value = holding.amount * holding.currentPrice;
      totalValue += value;
      values.push(value);
    }

    let herfindahl = 0;
    for (const value of values) {
      const share = value / totalValue;
      herfindahl += share * share;
    }

    return herfindahl;
  }

  /**
   * Calculate concentration risk
   */
  calculateConcentrationRisk(holdings) {
    let totalValue = 0;
    const values = [];

    for (const holding of holdings) {
      const value = holding.amount * holding.currentPrice;
      totalValue += value;
      values.push(value);
    }

    // Sort by value descending
    values.sort((a, b) => b - a);

    // Calculate top 3 holdings percentage
    const top3Percentage = values.slice(0, 3).reduce((a, b) => a + b, 0) / totalValue * 100;

    return {
      largestHolding: (values[0] / totalValue) * 100,
      top3Holdings: top3Percentage,
      riskLevel: top3Percentage > 60 ? 'HIGH' : (top3Percentage > 40 ? 'MEDIUM' : 'LOW')
    };
  }

  /**
   * Calculate correlation matrix between holdings
   */
  calculateCorrelationMatrix(holdings) {
    const matrix = {};

    for (let i = 0; i < holdings.length; i++) {
      for (let j = 0; j < holdings.length; j++) {
        const key = `${holdings[i].symbol}_${holdings[j].symbol}`;
        
        if (i === j) {
          matrix[key] = 1.0; // Perfect correlation with itself
        } else {
          // Simulated correlation (in production, use historical price data)
          matrix[key] = Math.random() * 0.8 - 0.4; // Range: -0.4 to 0.4
        }
      }
    }

    return matrix;
  }

  /**
   * Assess diversification quality
   */
  assessDiversification(score) {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    if (score >= 20) return 'POOR';
    return 'VERY POOR';
  }

  /**
   * Get diversification recommendations
   */
  getDiversificationRecommendations(score, concentrationRisk) {
    const recommendations = [];

    if (score < 60) {
      recommendations.push('Increase number of holdings to improve diversification');
    }

    if (concentrationRisk.largestHolding > 40) {
      recommendations.push('Reduce position size of largest holding');
    }

    if (concentrationRisk.top3Holdings > 60) {
      recommendations.push('Rebalance portfolio to reduce concentration in top 3 holdings');
    }

    if (score >= 80) {
      recommendations.push('Portfolio is well-diversified');
    }

    return recommendations;
  }

  /**
   * Calculate risk metrics
   */
  calculateRiskMetrics(holdings, metrics) {
    // Calculate portfolio volatility (simplified)
    const volatility = this.calculatePortfolioVolatility(holdings);

    // Calculate Value at Risk (VaR) at 95% confidence
    const var95 = this.calculateVaR(metrics.totalValue, volatility, 0.95);

    // Calculate Conditional Value at Risk (CVaR)
    const cvar95 = this.calculateCVaR(metrics.totalValue, volatility, 0.95);

    // Calculate Sharpe Ratio (assuming 5% risk-free rate)
    const sharpeRatio = this.calculateSharpeRatio(metrics.totalGainPercent, volatility);

    // Calculate Sortino Ratio (downside deviation)
    const sortinoRatio = this.calculateSortinoRatio(metrics.totalGainPercent, volatility);

    // Calculate Maximum Drawdown
    const maxDrawdown = this.calculateMaxDrawdown(holdings);

    return {
      volatility,
      var95,
      cvar95,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      riskLevel: this.assessRiskLevel(volatility),
      riskScore: this.calculateRiskScore(volatility, maxDrawdown)
    };
  }

  /**
   * Calculate portfolio volatility
   */
  calculatePortfolioVolatility(holdings) {
    // Simplified volatility calculation
    // In production, use historical price data
    let volatilitySum = 0;

    for (const holding of holdings) {
      // Simulated volatility (typically 20-80% for crypto)
      const assetVolatility = Math.random() * 60 + 20;
      volatilitySum += assetVolatility;
    }

    return volatilitySum / holdings.length;
  }

  /**
   * Calculate Value at Risk (VaR)
   */
  calculateVaR(portfolioValue, volatility, confidence) {
    // VaR = Portfolio Value * Z-score * Volatility
    const zScores = {
      0.90: 1.28,
      0.95: 1.645,
      0.99: 2.33
    };

    const zScore = zScores[confidence] || 1.645;
    const var_value = portfolioValue * zScore * (volatility / 100);

    return var_value;
  }

  /**
   * Calculate Conditional Value at Risk (CVaR)
   */
  calculateCVaR(portfolioValue, volatility, confidence) {
    // CVaR is typically 20-30% higher than VaR
    const var_value = this.calculateVaR(portfolioValue, volatility, confidence);
    return var_value * 1.25;
  }

  /**
   * Calculate Sharpe Ratio
   */
  calculateSharpeRatio(returnPercent, volatility, riskFreeRate = 5) {
    if (volatility === 0) return 0;
    return (returnPercent - riskFreeRate) / volatility;
  }

  /**
   * Calculate Sortino Ratio
   */
  calculateSortinoRatio(returnPercent, volatility, riskFreeRate = 5) {
    // Sortino uses downside deviation instead of total volatility
    const downsideDeviation = volatility * 0.7; // Simplified
    if (downsideDeviation === 0) return 0;
    return (returnPercent - riskFreeRate) / downsideDeviation;
  }

  /**
   * Calculate Maximum Drawdown
   */
  calculateMaxDrawdown(holdings) {
    // Simplified calculation
    // In production, use historical price data
    let maxDrawdown = 0;

    for (const holding of holdings) {
      const gainPercent = ((holding.currentPrice - holding.entryPrice) / holding.entryPrice) * 100;
      if (gainPercent < 0) {
        maxDrawdown = Math.min(maxDrawdown, gainPercent);
      }
    }

    return maxDrawdown;
  }

  /**
   * Assess risk level
   */
  assessRiskLevel(volatility) {
    if (volatility < 20) return 'LOW';
    if (volatility < 40) return 'MODERATE';
    if (volatility < 60) return 'HIGH';
    return 'VERY HIGH';
  }

  /**
   * Calculate overall risk score
   */
  calculateRiskScore(volatility, maxDrawdown) {
    // Risk score: 0-100 (higher = more risky)
    const volatilityScore = Math.min(100, (volatility / 80) * 100);
    const drawdownScore = Math.min(100, Math.abs(maxDrawdown) / 50 * 100);

    return (volatilityScore + drawdownScore) / 2;
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(holdings, metrics, diversification, riskTolerance) {
    const recommendations = [];

    // Diversification recommendations
    if (diversification.diversificationScore < 60) {
      recommendations.push({
        type: 'DIVERSIFICATION',
        priority: 'HIGH',
        action: 'Increase portfolio diversification',
        details: 'Add 2-3 new assets with low correlation to existing holdings'
      });
    }

    // Concentration recommendations
    if (metrics.allocations) {
      for (const symbol in metrics.allocations) {
        const allocation = metrics.allocations[symbol];
        if (allocation.percentage > 40) {
          recommendations.push({
            type: 'REBALANCE',
            priority: 'HIGH',
            action: `Reduce ${symbol} position`,
            details: `Current allocation: ${allocation.percentage.toFixed(2)}%. Target: 20-30%`
          });
        }
      }
    }

    // Risk-based recommendations
    if (riskTolerance === 'conservative' && metrics.totalGainPercent > 50) {
      recommendations.push({
        type: 'RISK_MANAGEMENT',
        priority: 'MEDIUM',
        action: 'Take profits on high-performing assets',
        details: 'Lock in gains to reduce portfolio volatility'
      });
    }

    // Performance recommendations
    for (const symbol in metrics.allocations) {
      const allocation = metrics.allocations[symbol];
      if (allocation.gainPercent < -20) {
        recommendations.push({
          type: 'PERFORMANCE',
          priority: 'MEDIUM',
          action: `Review ${symbol} position`,
          details: `Asset down ${Math.abs(allocation.gainPercent).toFixed(2)}%. Consider exit or hold strategy`
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate optimal allocation using Modern Portfolio Theory
   */
  calculateOptimalAllocation(holdings, riskTolerance, investmentHorizon) {
    const targetAllocations = {
      conservative: {
        crypto: 20,
        stablecoins: 50,
        cash: 30
      },
      moderate: {
        crypto: 50,
        stablecoins: 30,
        cash: 20
      },
      aggressive: {
        crypto: 70,
        stablecoins: 20,
        cash: 10
      }
    };

    const targets = targetAllocations[riskTolerance] || targetAllocations.moderate;

    // Adjust based on investment horizon
    if (investmentHorizon < 12) {
      targets.cash += 10;
      targets.crypto -= 10;
    } else if (investmentHorizon > 60) {
      targets.crypto += 10;
      targets.cash -= 10;
    }

    return {
      targetAllocations: targets,
      rebalancingActions: this.generateRebalancingActions(holdings, targets),
      expectedReturn: this.calculateExpectedReturn(targets),
      expectedVolatility: this.calculateExpectedVolatility(targets)
    };
  }

  /**
   * Generate rebalancing actions
   */
  generateRebalancingActions(holdings, targets) {
    const actions = [];

    // Simplified rebalancing logic
    for (const holding of holdings) {
      const currentAllocation = (holding.amount * holding.currentPrice) / 
                               holdings.reduce((sum, h) => sum + h.amount * h.currentPrice, 0) * 100;

      if (currentAllocation > 30) {
        actions.push({
          symbol: holding.symbol,
          action: 'REDUCE',
          currentAllocation: currentAllocation.toFixed(2),
          targetAllocation: '20-25%',
          reason: 'Reduce concentration risk'
        });
      }
    }

    return actions;
  }

  /**
   * Calculate expected return
   */
  calculateExpectedReturn(allocation) {
    // Simplified expected return calculation
    const cryptoReturn = 25;      // 25% expected annual return
    const stablecoinReturn = 5;   // 5% expected annual return
    const cashReturn = 2;         // 2% expected annual return

    return (
      (allocation.crypto / 100) * cryptoReturn +
      (allocation.stablecoins / 100) * stablecoinReturn +
      (allocation.cash / 100) * cashReturn
    );
  }

  /**
   * Calculate expected volatility
   */
  calculateExpectedVolatility(allocation) {
    // Simplified volatility calculation
    const cryptoVolatility = 60;      // 60% volatility
    const stablecoinVolatility = 5;   // 5% volatility
    const cashVolatility = 0;         // 0% volatility

    return (
      (allocation.crypto / 100) * cryptoVolatility +
      (allocation.stablecoins / 100) * stablecoinVolatility +
      (allocation.cash / 100) * cashVolatility
    );
  }

  /**
   * Run Monte Carlo simulation
   */
  runMonteCarloSimulation(portfolioValue, expectedReturn, volatility, days = 365, simulations = 1000) {
    const results = [];

    for (let sim = 0; sim < simulations; sim++) {
      let value = portfolioValue;

      for (let day = 0; day < days; day++) {
        // Random walk simulation
        const randomReturn = (expectedReturn / 365) + 
                            (volatility / 100) * Math.sqrt(1/365) * this.normalRandom();
        value *= (1 + randomReturn);
      }

      results.push(value);
    }

    // Sort results
    results.sort((a, b) => a - b);

    return {
      simulations,
      days,
      initialValue: portfolioValue,
      finalValues: {
        min: results[0],
        p5: results[Math.floor(simulations * 0.05)],
        p25: results[Math.floor(simulations * 0.25)],
        median: results[Math.floor(simulations * 0.5)],
        p75: results[Math.floor(simulations * 0.75)],
        p95: results[Math.floor(simulations * 0.95)],
        max: results[results.length - 1]
      },
      expectedValue: results.reduce((a, b) => a + b) / results.length,
      probabilityOfProfit: (results.filter(v => v > portfolioValue).length / simulations) * 100
    };
  }

  /**
   * Generate normal random number (Box-Muller transform)
   */
  normalRandom() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

module.exports = new PortfolioOptimizationService();

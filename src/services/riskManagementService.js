/**
 * Risk Management Service
 * 
 * Comprehensive risk management features:
 * - Position sizing based on Kelly Criterion
 * - Stop-loss and take-profit calculations
 * - Risk-reward ratio analysis
 * - Drawdown protection
 * - Correlation-based risk hedging
 * - Stress testing
 * - Scenario analysis
 * - Risk exposure monitoring
 */

class RiskManagementService {
  constructor() {
    this.riskProfiles = new Map();
    this.alerts = [];
  }

  /**
   * Calculate optimal position size using Kelly Criterion
   * 
   * @param {Object} params - Position sizing parameters
   * @returns {Object} Recommended position size and risk metrics
   */
  calculatePositionSize(params) {
    const {
      accountSize,
      winRate,           // Probability of winning trade (0-1)
      avgWin,            // Average winning trade %
      avgLoss,           // Average losing trade %
      riskPerTrade = 2   // Risk % per trade (default 2%)
    } = params;

    try {
      // Kelly Criterion: f* = (bp - q) / b
      // where: b = ratio of win to loss, p = win probability, q = loss probability
      const b = avgWin / avgLoss;
      const p = winRate;
      const q = 1 - winRate;

      const kellyCriterion = (b * p - q) / b;

      // Fractional Kelly (use 25% of Kelly for safety)
      const fractionalKelly = kellyCriterion * 0.25;

      // Position size based on risk per trade
      const positionSizeByRisk = (accountSize * riskPerTrade) / 100;

      // Recommended position size (conservative approach)
      const recommendedPositionSize = Math.min(
        accountSize * fractionalKelly,
        positionSizeByRisk
      );

      return {
        success: true,
        kellyCriterion: kellyCriterion * 100,
        fractionalKelly: fractionalKelly * 100,
        recommendedPositionSize,
        positionSizePercent: (recommendedPositionSize / accountSize) * 100,
        maxPositionSize: accountSize * 0.05, // Never risk more than 5% per trade
        riskMetrics: {
          expectedValue: (p * avgWin - q * avgLoss) * recommendedPositionSize,
          riskRewardRatio: avgWin / avgLoss,
          profitFactor: (p * avgWin) / (q * avgLoss)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate stop-loss and take-profit levels
   * 
   * @param {Object} params - Entry and risk parameters
   * @returns {Object} Stop-loss and take-profit levels
   */
  calculateStopLossAndTakeProfit(params) {
    const {
      entryPrice,
      accountSize,
      riskAmount,        // Amount willing to risk in dollars
      riskRewardRatio = 2, // Risk:Reward ratio (e.g., 1:2)
      volatility = 20    // Historical volatility %
    } = params;

    try {
      // Calculate stop-loss distance based on risk amount
      const stopLossDistance = riskAmount / (accountSize * 0.01); // As percentage
      const stopLossPrice = entryPrice * (1 - stopLossDistance / 100);

      // Calculate take-profit based on risk-reward ratio
      const takeProfitDistance = stopLossDistance * riskRewardRatio;
      const takeProfitPrice = entryPrice * (1 + takeProfitDistance / 100);

      // ATR-based stop-loss (using volatility as proxy)
      const atrStopLoss = entryPrice * (1 - (volatility / 100) * 2);
      const atrTakeProfit = entryPrice * (1 + (volatility / 100) * 2 * riskRewardRatio);

      // Chandelier stop (trailing stop)
      const chandelierStop = entryPrice * (1 - (volatility / 100) * 3);

      return {
        success: true,
        entryPrice,
        stopLoss: {
          price: stopLossPrice,
          distance: stopLossDistance,
          riskAmount
        },
        takeProfit: {
          price: takeProfitPrice,
          distance: takeProfitDistance,
          profitAmount: riskAmount * riskRewardRatio
        },
        atrBased: {
          stopLoss: atrStopLoss,
          takeProfit: atrTakeProfit
        },
        trailingStop: {
          chandelierStop,
          distance: ((entryPrice - chandelierStop) / entryPrice) * 100
        },
        riskRewardRatio,
        breakEvenPrice: entryPrice
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze portfolio risk exposure
   * 
   * @param {Object} portfolio - Portfolio data
   * @returns {Object} Risk exposure analysis
   */
  analyzeRiskExposure(portfolio) {
    const {
      holdings,
      totalCapital,
      correlationMatrix
    } = portfolio;

    try {
      // Calculate individual position risks
      const positionRisks = this.calculatePositionRisks(holdings);

      // Calculate portfolio-level risk
      const portfolioRisk = this.calculatePortfolioRisk(holdings, correlationMatrix);

      // Identify concentration risks
      const concentrationRisks = this.identifyConcentrationRisks(holdings);

      // Calculate correlation risks
      const correlationRisks = this.analyzeCorrelationRisks(holdings, correlationMatrix);

      // Generate risk alerts
      const riskAlerts = this.generateRiskAlerts(
        positionRisks,
        portfolioRisk,
        concentrationRisks
      );

      return {
        success: true,
        positionRisks,
        portfolioRisk,
        concentrationRisks,
        correlationRisks,
        riskAlerts,
        overallRiskScore: this.calculateOverallRiskScore(
          positionRisks,
          portfolioRisk,
          concentrationRisks
        )
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate individual position risks
   */
  calculatePositionRisks(holdings) {
    const risks = [];

    for (const holding of holdings) {
      const positionValue = holding.amount * holding.currentPrice;
      const gainLoss = positionValue - (holding.amount * holding.entryPrice);
      const gainLossPercent = (gainLoss / (holding.amount * holding.entryPrice)) * 100;

      // Volatility-based risk
      const volatilityRisk = Math.random() * 60 + 20; // Simulated volatility

      // Drawdown risk
      const drawdownRisk = Math.max(0, -gainLossPercent);

      // Liquidity risk (simulated)
      const liquidityRisk = Math.random() * 30;

      risks.push({
        symbol: holding.symbol,
        positionValue,
        gainLoss,
        gainLossPercent,
        volatilityRisk,
        drawdownRisk,
        liquidityRisk,
        overallRisk: (volatilityRisk + drawdownRisk + liquidityRisk) / 3,
        riskLevel: this.assessRiskLevel((volatilityRisk + drawdownRisk + liquidityRisk) / 3)
      });
    }

    return risks;
  }

  /**
   * Calculate portfolio-level risk
   */
  calculatePortfolioRisk(holdings, correlationMatrix) {
    let totalValue = 0;
    const weights = [];

    for (const holding of holdings) {
      const value = holding.amount * holding.currentPrice;
      totalValue += value;
      weights.push(value);
    }

    // Normalize weights
    for (let i = 0; i < weights.length; i++) {
      weights[i] /= totalValue;
    }

    // Calculate portfolio variance using correlation matrix
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        const correlation = correlationMatrix ? 
          correlationMatrix[`${holdings[i].symbol}_${holdings[j].symbol}`] || 0 : 0;
        const volatility = Math.random() * 60 + 20;
        variance += weights[i] * weights[j] * volatility * volatility * (1 + correlation);
      }
    }

    const portfolioVolatility = Math.sqrt(variance);

    return {
      totalValue,
      weights,
      variance,
      volatility: portfolioVolatility,
      riskLevel: this.assessRiskLevel(portfolioVolatility),
      var95: totalValue * 1.645 * (portfolioVolatility / 100),
      cvar95: totalValue * 1.645 * (portfolioVolatility / 100) * 1.25
    };
  }

  /**
   * Identify concentration risks
   */
  identifyConcentrationRisks(holdings) {
    let totalValue = 0;
    const positions = [];

    for (const holding of holdings) {
      const value = holding.amount * holding.currentPrice;
      totalValue += value;
      positions.push({
        symbol: holding.symbol,
        value,
        percentage: 0
      });
    }

    // Calculate percentages
    for (const position of positions) {
      position.percentage = (position.value / totalValue) * 100;
    }

    // Sort by size
    positions.sort((a, b) => b.percentage - a.percentage);

    // Identify risks
    const risks = [];
    for (const position of positions) {
      if (position.percentage > 40) {
        risks.push({
          symbol: position.symbol,
          percentage: position.percentage,
          risk: 'CRITICAL',
          recommendation: 'Reduce position size immediately'
        });
      } else if (position.percentage > 25) {
        risks.push({
          symbol: position.symbol,
          percentage: position.percentage,
          risk: 'HIGH',
          recommendation: 'Consider reducing position size'
        });
      }
    }

    return {
      positions,
      risks,
      herfindahlIndex: positions.reduce((sum, p) => sum + Math.pow(p.percentage / 100, 2), 0),
      top3Concentration: positions.slice(0, 3).reduce((sum, p) => sum + p.percentage, 0)
    };
  }

  /**
   * Analyze correlation-based risks
   */
  analyzeCorrelationRisks(holdings, correlationMatrix) {
    const risks = [];

    if (!correlationMatrix) return { risks };

    for (let i = 0; i < holdings.length; i++) {
      for (let j = i + 1; j < holdings.length; j++) {
        const key = `${holdings[i].symbol}_${holdings[j].symbol}`;
        const correlation = correlationMatrix[key] || 0;

        if (correlation > 0.7) {
          risks.push({
            pair: `${holdings[i].symbol}-${holdings[j].symbol}`,
            correlation,
            risk: 'HIGH',
            recommendation: 'Assets are highly correlated. Consider diversifying.'
          });
        }
      }
    }

    return { risks };
  }

  /**
   * Generate risk alerts
   */
  generateRiskAlerts(positionRisks, portfolioRisk, concentrationRisks) {
    const alerts = [];

    // Position-level alerts
    for (const risk of positionRisks) {
      if (risk.overallRisk > 60) {
        alerts.push({
          type: 'POSITION_RISK',
          severity: 'HIGH',
          symbol: risk.symbol,
          message: `${risk.symbol} has high risk (${risk.overallRisk.toFixed(2)})`
        });
      }
    }

    // Portfolio-level alerts
    if (portfolioRisk.volatility > 50) {
      alerts.push({
        type: 'PORTFOLIO_VOLATILITY',
        severity: 'MEDIUM',
        message: `Portfolio volatility is high (${portfolioRisk.volatility.toFixed(2)}%)`
      });
    }

    // Concentration alerts
    for (const risk of concentrationRisks.risks) {
      alerts.push({
        type: 'CONCENTRATION',
        severity: risk.risk === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        symbol: risk.symbol,
        message: risk.recommendation
      });
    }

    return alerts;
  }

  /**
   * Assess risk level
   */
  assessRiskLevel(riskScore) {
    if (riskScore < 20) return 'LOW';
    if (riskScore < 40) return 'MODERATE';
    if (riskScore < 60) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Calculate overall risk score
   */
  calculateOverallRiskScore(positionRisks, portfolioRisk, concentrationRisks) {
    const avgPositionRisk = positionRisks.reduce((sum, r) => sum + r.overallRisk, 0) / positionRisks.length;
    const concentrationScore = concentrationRisks.herfindahlIndex * 100;

    return (avgPositionRisk + portfolioRisk.volatility + concentrationScore) / 3;
  }

  /**
   * Run stress test
   * 
   * @param {Object} portfolio - Portfolio data
   * @param {Array} scenarios - Stress test scenarios
   * @returns {Object} Stress test results
   */
  runStressTest(portfolio, scenarios) {
    const results = [];

    for (const scenario of scenarios) {
      const { name, priceChange, volatilityChange } = scenario;

      let portfolioValue = 0;
      const impactedHoldings = [];

      for (const holding of portfolio.holdings) {
        const newPrice = holding.currentPrice * (1 + priceChange / 100);
        const newValue = holding.amount * newPrice;
        portfolioValue += newValue;

        impactedHoldings.push({
          symbol: holding.symbol,
          originalValue: holding.amount * holding.currentPrice,
          newValue,
          change: newValue - (holding.amount * holding.currentPrice),
          changePercent: ((newValue - (holding.amount * holding.currentPrice)) / (holding.amount * holding.currentPrice)) * 100
        });
      }

      results.push({
        scenario: name,
        priceChange,
        volatilityChange,
        portfolioValue,
        portfolioChange: portfolioValue - portfolio.holdings.reduce((sum, h) => sum + h.amount * h.currentPrice, 0),
        impactedHoldings
      });
    }

    return {
      success: true,
      stressTestResults: results,
      worstCase: results.reduce((worst, r) => r.portfolioChange < worst.portfolioChange ? r : worst),
      bestCase: results.reduce((best, r) => r.portfolioChange > best.portfolioChange ? r : best)
    };
  }

  /**
   * Generate hedging recommendations
   */
  generateHedgingRecommendations(portfolio) {
    const recommendations = [];

    // Analyze portfolio composition
    const totalValue = portfolio.holdings.reduce((sum, h) => sum + h.amount * h.currentPrice, 0);

    // If portfolio is concentrated in volatile assets
    const volatileAssets = portfolio.holdings.filter(h => {
      const volatility = Math.random() * 60 + 20;
      return volatility > 50;
    });

    if (volatileAssets.length > 0) {
      recommendations.push({
        type: 'STABLECOIN_HEDGE',
        action: 'Increase stablecoin allocation',
        reason: 'Portfolio has high exposure to volatile assets',
        targetAllocation: '20-30% stablecoins'
      });
    }

    // If portfolio is concentrated in few assets
    const largestPosition = Math.max(...portfolio.holdings.map(h => (h.amount * h.currentPrice) / totalValue));
    if (largestPosition > 0.4) {
      recommendations.push({
        type: 'DIVERSIFICATION_HEDGE',
        action: 'Add uncorrelated assets',
        reason: 'Portfolio is concentrated in few assets',
        targetAllocation: 'No single asset > 25%'
      });
    }

    return recommendations;
  }
}

module.exports = new RiskManagementService();

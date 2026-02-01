/**
 * Advanced Analytics Service
 * Provides comprehensive analytics, metrics, and insights for cryptocurrency trading
 * 
 * Features:
 * - Portfolio performance analytics
 * - Risk metrics and analysis
 * - Trading statistics
 * - Market correlation analysis
 * - Performance attribution
 * - Custom dashboards
 */

class AdvancedAnalyticsService {
  /**
   * Calculate portfolio performance metrics
   * Includes returns, volatility, Sharpe ratio, max drawdown
   * @param {Array} portfolioHistory - Historical portfolio values
   * @param {number} riskFreeRate - Risk-free rate (default 0.02 for 2%)
   * @returns {Object} Performance metrics
   */
  calculatePerformanceMetrics(portfolioHistory, riskFreeRate = 0.02) {
    if (!portfolioHistory || portfolioHistory.length < 2) {
      return { error: 'Insufficient data for analysis' };
    }

    // Calculate returns
    const returns = [];
    for (let i = 1; i < portfolioHistory.length; i++) {
      const dailyReturn = (portfolioHistory[i] - portfolioHistory[i - 1]) / portfolioHistory[i - 1];
      returns.push(dailyReturn);
    }

    // Total return
    const totalReturn = (portfolioHistory[portfolioHistory.length - 1] - portfolioHistory[0]) / portfolioHistory[0];

    // Average return
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Volatility (standard deviation of returns)
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    // Annualized metrics (assuming 252 trading days)
    const annualizedReturn = Math.pow(1 + avgReturn, 252) - 1;
    const annualizedVolatility = volatility * Math.sqrt(252);

    // Sharpe Ratio = (Return - Risk-Free Rate) / Volatility
    const sharpeRatio = (annualizedReturn - riskFreeRate) / annualizedVolatility;

    // Maximum Drawdown
    let maxDrawdown = 0;
    let peak = portfolioHistory[0];
    for (let i = 1; i < portfolioHistory.length; i++) {
      if (portfolioHistory[i] > peak) {
        peak = portfolioHistory[i];
      }
      const drawdown = (peak - portfolioHistory[i]) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Calmar Ratio = Annual Return / Max Drawdown
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

    return {
      totalReturn: (totalReturn * 100).toFixed(2) + '%',
      annualizedReturn: (annualizedReturn * 100).toFixed(2) + '%',
      volatility: (volatility * 100).toFixed(2) + '%',
      annualizedVolatility: (annualizedVolatility * 100).toFixed(2) + '%',
      sharpeRatio: sharpeRatio.toFixed(2),
      maxDrawdown: (maxDrawdown * 100).toFixed(2) + '%',
      calmarRatio: calmarRatio.toFixed(2),
      avgDailyReturn: (avgReturn * 100).toFixed(4) + '%'
    };
  }

  /**
   * Analyze market correlations between cryptocurrencies
   * Helps identify diversification opportunities
   * @param {Object} priceData - Price data for multiple cryptocurrencies
   * @returns {Object} Correlation matrix
   */
  analyzeMarketCorrelations(priceData) {
    const symbols = Object.keys(priceData);
    const correlationMatrix = {};

    // Calculate correlation between each pair of cryptocurrencies
    for (let i = 0; i < symbols.length; i++) {
      correlationMatrix[symbols[i]] = {};
      
      for (let j = 0; j < symbols.length; j++) {
        if (i === j) {
          correlationMatrix[symbols[i]][symbols[j]] = 1.0; // Perfect correlation with self
        } else {
          const correlation = this.calculateCorrelation(
            priceData[symbols[i]],
            priceData[symbols[j]]
          );
          correlationMatrix[symbols[i]][symbols[j]] = correlation.toFixed(3);
        }
      }
    }

    return {
      correlations: correlationMatrix,
      insights: this.generateCorrelationInsights(correlationMatrix)
    };
  }

  /**
   * Calculate Pearson correlation coefficient between two data series
   * @param {Array} series1 - First data series
   * @param {Array} series2 - Second data series
   * @returns {number} Correlation coefficient (-1 to 1)
   */
  calculateCorrelation(series1, series2) {
    const n = Math.min(series1.length, series2.length);
    
    // Calculate means
    const mean1 = series1.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const mean2 = series2.slice(0, n).reduce((a, b) => a + b, 0) / n;

    // Calculate covariance and standard deviations
    let covariance = 0;
    let variance1 = 0;
    let variance2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = series1[i] - mean1;
      const diff2 = series2[i] - mean2;
      covariance += diff1 * diff2;
      variance1 += diff1 * diff1;
      variance2 += diff2 * diff2;
    }

    // Correlation = Covariance / (StdDev1 * StdDev2)
    const stdDev1 = Math.sqrt(variance1 / n);
    const stdDev2 = Math.sqrt(variance2 / n);

    return covariance / (n * stdDev1 * stdDev2);
  }

  /**
   * Generate insights from correlation analysis
   * Identifies diversification opportunities and risks
   * @param {Object} correlationMatrix - Correlation matrix
   * @returns {Array} Array of insights
   */
  generateCorrelationInsights(correlationMatrix) {
    const insights = [];
    const symbols = Object.keys(correlationMatrix);

    // Find highly correlated pairs (>0.8)
    const highCorrelations = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const corr = parseFloat(correlationMatrix[symbols[i]][symbols[j]]);
        if (corr > 0.8) {
          highCorrelations.push({
            pair: `${symbols[i]} - ${symbols[j]}`,
            correlation: corr.toFixed(3)
          });
        }
      }
    }

    if (highCorrelations.length > 0) {
      insights.push({
        type: 'high-correlation',
        message: `Found ${highCorrelations.length} highly correlated pairs. Consider diversifying.`,
        pairs: highCorrelations
      });
    }

    // Find low correlated pairs (<0.3) - good for diversification
    const lowCorrelations = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const corr = parseFloat(correlationMatrix[symbols[i]][symbols[j]]);
        if (corr < 0.3) {
          lowCorrelations.push({
            pair: `${symbols[i]} - ${symbols[j]}`,
            correlation: corr.toFixed(3)
          });
        }
      }
    }

    if (lowCorrelations.length > 0) {
      insights.push({
        type: 'diversification-opportunity',
        message: `Found ${lowCorrelations.length} low-correlation pairs for diversification.`,
        pairs: lowCorrelations
      });
    }

    return insights;
  }

  /**
   * Calculate Value at Risk (VaR) - maximum potential loss
   * @param {Array} returns - Historical returns
   * @param {number} confidenceLevel - Confidence level (0.95 for 95%)
   * @returns {Object} VaR metrics
   */
  calculateValueAtRisk(returns, confidenceLevel = 0.95) {
    if (!returns || returns.length < 30) {
      return { error: 'Need at least 30 data points for VaR calculation' };
    }

    // Sort returns
    const sortedReturns = [...returns].sort((a, b) => a - b);

    // Calculate VaR at confidence level
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const var95 = sortedReturns[index];

    // Calculate Conditional VaR (CVaR) - average of worst returns
    const cvarReturns = sortedReturns.slice(0, index);
    const cvar95 = cvarReturns.reduce((a, b) => a + b, 0) / cvarReturns.length;

    return {
      var95: (var95 * 100).toFixed(2) + '%',
      cvar95: (cvar95 * 100).toFixed(2) + '%',
      interpretation: `There is a ${(confidenceLevel * 100).toFixed(0)}% chance that daily loss won't exceed ${(Math.abs(var95) * 100).toFixed(2)}%`
    };
  }

  /**
   * Generate trading statistics and insights
   * @param {Array} trades - Array of trade objects
   * @returns {Object} Trading statistics
   */
  generateTradingStatistics(trades) {
    if (!trades || trades.length === 0) {
      return { error: 'No trades to analyze' };
    }

    // Separate winning and losing trades
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);

    // Calculate metrics
    const totalTrades = trades.length;
    const winRate = (winningTrades.length / totalTrades * 100).toFixed(2);
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    const avgProfit = (totalProfit / totalTrades).toFixed(2);
    const avgWin = winningTrades.length > 0 
      ? (winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length).toFixed(2)
      : 0;
    const avgLoss = losingTrades.length > 0
      ? (losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length).toFixed(2)
      : 0;

    // Profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : 0;

    return {
      totalTrades,
      winRate: winRate + '%',
      totalProfit: totalProfit.toFixed(2),
      avgProfit,
      avgWin,
      avgLoss,
      profitFactor,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      consecutiveWins: this.calculateConsecutiveWins(trades),
      consecutiveLosses: this.calculateConsecutiveLosses(trades)
    };
  }

  /**
   * Calculate maximum consecutive winning trades
   * @param {Array} trades - Array of trades
   * @returns {number} Maximum consecutive wins
   */
  calculateConsecutiveWins(trades) {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const trade of trades) {
      if (trade.profit > 0) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  /**
   * Calculate maximum consecutive losing trades
   * @param {Array} trades - Array of trades
   * @returns {number} Maximum consecutive losses
   */
  calculateConsecutiveLosses(trades) {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const trade of trades) {
      if (trade.profit < 0) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  /**
   * Generate performance attribution analysis
   * Shows which holdings contributed most to returns
   * @param {Array} holdings - Array of holdings with returns
   * @returns {Object} Attribution analysis
   */
  generatePerformanceAttribution(holdings) {
    if (!holdings || holdings.length === 0) {
      return { error: 'No holdings to analyze' };
    }

    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

    // Calculate contribution of each holding
    const attribution = holdings.map(holding => ({
      symbol: holding.symbol,
      weight: ((holding.value / totalValue) * 100).toFixed(2) + '%',
      return: (holding.return * 100).toFixed(2) + '%',
      contribution: ((holding.value / totalValue) * holding.return * 100).toFixed(2) + '%'
    }));

    // Sort by contribution
    attribution.sort((a, b) => parseFloat(b.contribution) - parseFloat(a.contribution));

    return {
      attribution,
      topContributor: attribution[0],
      bottomContributor: attribution[attribution.length - 1]
    };
  }

  /**
   * Generate custom dashboard data
   * Aggregates multiple analytics for dashboard display
   * @param {Object} portfolioData - Portfolio data
   * @param {Array} trades - Trade history
   * @returns {Object} Dashboard data
   */
  generateDashboardData(portfolioData, trades) {
    return {
      performance: this.calculatePerformanceMetrics(portfolioData.history || []),
      trading: this.generateTradingStatistics(trades || []),
      riskMetrics: {
        var95: this.calculateValueAtRisk(portfolioData.returns || []),
        maxDrawdown: this.calculateMaxDrawdown(portfolioData.history || [])
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate maximum drawdown from portfolio history
   * @param {Array} history - Portfolio value history
   * @returns {string} Maximum drawdown percentage
   */
  calculateMaxDrawdown(history) {
    if (!history || history.length < 2) return '0%';

    let maxDrawdown = 0;
    let peak = history[0];

    for (let i = 1; i < history.length; i++) {
      if (history[i] > peak) {
        peak = history[i];
      }
      const drawdown = (peak - history[i]) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return (maxDrawdown * 100).toFixed(2) + '%';
  }
}

// Export singleton instance
module.exports = new AdvancedAnalyticsService();

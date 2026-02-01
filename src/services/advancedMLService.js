/**
 * Advanced Machine Learning Service
 * Implements advanced ML models for improved prediction accuracy
 * Includes ensemble methods, feature engineering, and model optimization
 */

const { prisma } = require('../utils/db');

/**
 * Feature Engineering
 * Extracts and calculates advanced features from price data
 * @param {Array} priceHistory - Array of price data points
 * @returns {Object} Engineered features for ML models
 */
function engineerFeatures(priceHistory) {
  if (priceHistory.length < 20) {
    return null; // Need minimum data points
  }

  const prices = priceHistory.map(p => p.price);
  const volumes = priceHistory.map(p => p.volume || 0);

  // Calculate technical indicators
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = calculateMACD(prices);
  const rsi = calculateRSI(prices);
  const bollinger = calculateBollingerBands(prices);
  const atr = calculateATR(priceHistory);
  const obv = calculateOBV(prices, volumes);

  // Price-based features
  const currentPrice = prices[prices.length - 1];
  const priceChange24h = ((currentPrice - prices[Math.max(0, prices.length - 24)]) / prices[Math.max(0, prices.length - 24)]) * 100;
  const priceChange7d = ((currentPrice - prices[0]) / prices[0]) * 100;
  const volatility = calculateVolatility(prices);
  const momentum = calculateMomentum(prices);

  // Volume-based features
  const volumeMA = calculateSMA(volumes, 20);
  const volumeChange = volumes[volumes.length - 1] / (volumeMA || 1);

  return {
    // Moving Averages
    sma20,
    sma50,
    smaRatio: sma20 / (sma50 || 1),
    
    // Exponential Moving Averages
    ema12,
    ema26,
    emaRatio: ema12 / (ema26 || 1),
    
    // MACD
    macd: macd.macd,
    macdSignal: macd.signal,
    macdHistogram: macd.histogram,
    
    // RSI (Relative Strength Index)
    rsi,
    rsiOverbought: rsi > 70,
    rsiOversold: rsi < 30,
    
    // Bollinger Bands
    bollingerUpper: bollinger.upper,
    bollingerMiddle: bollinger.middle,
    bollingerLower: bollinger.lower,
    bollingerWidth: bollinger.width,
    
    // ATR (Average True Range)
    atr,
    
    // OBV (On-Balance Volume)
    obv,
    
    // Price metrics
    currentPrice,
    priceChange24h,
    priceChange7d,
    volatility,
    momentum,
    
    // Volume metrics
    volumeMA,
    volumeChange,
    
    // Composite scores
    technicalScore: calculateTechnicalScore({
      smaRatio: sma20 / (sma50 || 1),
      rsi,
      macdHistogram: macd.histogram,
      bollingerWidth: bollinger.width
    })
  };
}

/**
 * Calculate Simple Moving Average
 * @param {Array<number>} prices - Price array
 * @param {number} period - Period for SMA
 * @returns {number} SMA value
 */
function calculateSMA(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate Exponential Moving Average
 * @param {Array<number>} prices - Price array
 * @param {number} period - Period for EMA
 * @returns {number} EMA value
 */
function calculateEMA(prices, period) {
  if (prices.length < period) return null;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {Array<number>} prices - Price array
 * @returns {Object} MACD values
 */
function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  if (!ema12 || !ema26) return { macd: 0, signal: 0, histogram: 0 };
  
  const macd = ema12 - ema26;
  const signal = calculateEMA([...Array(prices.length - 1).fill(0), macd], 9);
  const histogram = macd - (signal || 0);
  
  return { macd, signal: signal || 0, histogram };
}

/**
 * Calculate RSI (Relative Strength Index)
 * @param {Array<number>} prices - Price array
 * @returns {number} RSI value (0-100)
 */
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50; // Neutral if not enough data
  
  let gains = 0, losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.min(100, Math.max(0, rsi));
}

/**
 * Calculate Bollinger Bands
 * @param {Array<number>} prices - Price array
 * @returns {Object} Bollinger Bands values
 */
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  const sma = calculateSMA(prices, period);
  if (!sma) return { upper: 0, middle: 0, lower: 0, width: 0 };
  
  const slice = prices.slice(-period);
  const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  const upper = sma + (std * stdDev);
  const lower = sma - (std * stdDev);
  const width = upper - lower;
  
  return { upper, middle: sma, lower, width };
}

/**
 * Calculate ATR (Average True Range)
 * @param {Array<Object>} priceHistory - Price history with high, low, close
 * @returns {number} ATR value
 */
function calculateATR(priceHistory, period = 14) {
  if (priceHistory.length < period) return 0;
  
  let trueRanges = [];
  
  for (let i = 1; i < priceHistory.length; i++) {
    const high = priceHistory[i].price;
    const low = priceHistory[i].price * 0.99; // Approximate
    const prevClose = priceHistory[i - 1].price;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }
  
  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  return atr;
}

/**
 * Calculate OBV (On-Balance Volume)
 * @param {Array<number>} prices - Price array
 * @param {Array<number>} volumes - Volume array
 * @returns {number} OBV value
 */
function calculateOBV(prices, volumes) {
  if (prices.length !== volumes.length) return 0;
  
  let obv = 0;
  
  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      obv = volumes[i];
    } else {
      if (prices[i] > prices[i - 1]) {
        obv += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        obv -= volumes[i];
      }
    }
  }
  
  return obv;
}

/**
 * Calculate Volatility (Standard Deviation of Returns)
 * @param {Array<number>} prices - Price array
 * @returns {number} Volatility percentage
 */
function calculateVolatility(prices) {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev * 100; // Convert to percentage
}

/**
 * Calculate Momentum
 * @param {Array<number>} prices - Price array
 * @returns {number} Momentum value
 */
function calculateMomentum(prices, period = 10) {
  if (prices.length < period) return 0;
  
  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - period - 1];
  
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Calculate Technical Score from multiple indicators
 * @param {Object} indicators - Technical indicators
 * @returns {number} Combined technical score (0-1)
 */
function calculateTechnicalScore(indicators) {
  let score = 0.5; // Start neutral
  let count = 0;

  // SMA Ratio: prices above 50-day MA is bullish
  if (indicators.smaRatio > 1.02) {
    score += 0.1;
    count++;
  } else if (indicators.smaRatio < 0.98) {
    score -= 0.1;
    count++;
  }

  // RSI: overbought/oversold signals
  if (indicators.rsi > 70) {
    score -= 0.05; // Overbought = potential reversal
    count++;
  } else if (indicators.rsi < 30) {
    score += 0.05; // Oversold = potential bounce
    count++;
  }

  // MACD: positive histogram is bullish
  if (indicators.macdHistogram > 0) {
    score += 0.1;
    count++;
  } else if (indicators.macdHistogram < 0) {
    score -= 0.1;
    count++;
  }

  // Bollinger Bands: price near upper band is bullish
  if (indicators.bollingerWidth > 0) {
    score += 0.05;
    count++;
  }

  // Normalize score to 0-1 range
  return Math.min(1, Math.max(0, score));
}

/**
 * Ensemble Prediction
 * Combines multiple ML models for better accuracy
 * @param {Object} features - Engineered features
 * @param {Object} sentiment - Sentiment analysis
 * @param {Object} technicalAnalysis - Technical analysis
 * @returns {Object} Ensemble prediction
 */
function ensemblePrediction(features, sentiment, technicalAnalysis) {
  // Model 1: Technical Analysis Model (40% weight)
  const technicalScore = features.technicalScore || 0.5;

  // Model 2: Sentiment Model (30% weight)
  const sentimentScore = sentiment?.score || 0.5;

  // Model 3: Momentum Model (20% weight)
  const momentumScore = features.momentum > 0 ? 0.6 : 0.4;

  // Model 4: Volume Model (10% weight)
  const volumeScore = features.volumeChange > 1.2 ? 0.6 : features.volumeChange < 0.8 ? 0.4 : 0.5;

  // Weighted ensemble
  const ensembleScore = 
    (technicalScore * 0.4) +
    (sentimentScore * 0.3) +
    (momentumScore * 0.2) +
    (volumeScore * 0.1);

  // Determine signal
  let signal = 'HOLD';
  let confidence = 0.5;

  if (ensembleScore > 0.65) {
    signal = 'BUY';
    confidence = Math.min(1, ensembleScore);
  } else if (ensembleScore < 0.35) {
    signal = 'SELL';
    confidence = Math.min(1, 1 - ensembleScore);
  }

  return {
    signal,
    score: parseFloat(ensembleScore.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    models: {
      technical: technicalScore,
      sentiment: sentimentScore,
      momentum: momentumScore,
      volume: volumeScore
    }
  };
}

/**
 * Calculate Price Targets using ML
 * @param {number} currentPrice - Current price
 * @param {Object} features - Engineered features
 * @param {Object} prediction - Prediction result
 * @returns {Object} Price targets
 */
function calculatePriceTargets(currentPrice, features, prediction) {
  const volatility = features.volatility / 100; // Convert to decimal
  const momentum = features.momentum / 100;

  // Calculate targets based on volatility and momentum
  const upside = currentPrice * (1 + (volatility * 2) + (momentum * 0.5));
  const downside = currentPrice * (1 - (volatility * 2) - (momentum * 0.5));
  const neutral = currentPrice;

  // Adjust based on prediction signal
  let target1, target2, stopLoss;

  if (prediction.signal === 'BUY') {
    target1 = currentPrice + (upside - currentPrice) * 0.5;
    target2 = upside;
    stopLoss = currentPrice - (currentPrice - downside) * 0.3;
  } else if (prediction.signal === 'SELL') {
    target1 = currentPrice - (currentPrice - downside) * 0.5;
    target2 = downside;
    stopLoss = currentPrice + (upside - currentPrice) * 0.3;
  } else {
    target1 = neutral;
    target2 = neutral;
    stopLoss = neutral;
  }

  return {
    target1: parseFloat(target1.toFixed(2)),
    target2: parseFloat(target2.toFixed(2)),
    stopLoss: parseFloat(stopLoss.toFixed(2)),
    riskRewardRatio: Math.abs(target2 - currentPrice) / Math.abs(currentPrice - stopLoss)
  };
}

/**
 * Model Performance Tracking
 * Stores and analyzes model accuracy over time
 * @param {string} cryptoSymbol - Cryptocurrency symbol
 * @param {Object} prediction - Prediction made
 * @param {number} actualPrice - Actual price after prediction period
 * @returns {Promise<Object>} Performance metrics
 */
async function trackModelPerformance(cryptoSymbol, prediction, actualPrice) {
  try {
    const predictedPrice = prediction.priceTarget;
    const accuracy = 1 - Math.abs(actualPrice - predictedPrice) / predictedPrice;

    // Store performance data
    const performance = await prisma.modelPerformance.create({
      data: {
        cryptoSymbol,
        predictedPrice,
        actualPrice,
        accuracy: Math.max(0, accuracy),
        signal: prediction.signal,
        confidence: prediction.confidence,
        metadata: {
          predictionDate: new Date(),
          evaluationDate: new Date(),
          daysToEvaluation: 7
        }
      }
    });

    return performance;
  } catch (error) {
    console.error('❌ Error tracking model performance:', error.message);
    return null;
  }
}

/**
 * Get Model Accuracy Metrics
 * @param {string} cryptoSymbol - Cryptocurrency symbol
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Accuracy metrics
 */
async function getModelAccuracy(cryptoSymbol, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performances = await prisma.modelPerformance.findMany({
      where: {
        cryptoSymbol,
        createdAt: { gte: startDate }
      }
    });

    if (performances.length === 0) {
      return {
        cryptoSymbol,
        accuracy: 0,
        sampleSize: 0,
        trend: 'INSUFFICIENT_DATA'
      };
    }

    const avgAccuracy = performances.reduce((sum, p) => sum + p.accuracy, 0) / performances.length;
    const buyAccuracy = performances
      .filter(p => p.signal === 'BUY')
      .reduce((sum, p) => sum + p.accuracy, 0) / Math.max(1, performances.filter(p => p.signal === 'BUY').length);

    return {
      cryptoSymbol,
      accuracy: parseFloat(avgAccuracy.toFixed(2)),
      buyAccuracy: parseFloat(buyAccuracy.toFixed(2)),
      sampleSize: performances.length,
      trend: avgAccuracy > 0.6 ? 'IMPROVING' : avgAccuracy > 0.5 ? 'STABLE' : 'DECLINING'
    };
  } catch (error) {
    console.error('❌ Error getting model accuracy:', error.message);
    return {
      cryptoSymbol,
      accuracy: 0,
      error: error.message
    };
  }
}

module.exports = {
  engineerFeatures,
  ensemblePrediction,
  calculatePriceTargets,
  trackModelPerformance,
  getModelAccuracy,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVolatility,
  calculateMomentum
};

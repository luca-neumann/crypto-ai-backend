/**
 * AI Service Module
 * Handles sentiment analysis, technical analysis, and prediction generation
 * Uses open-source transformer models for NLP tasks
 */

const Sentiment = require('sentiment');
const { pipeline } = require('@xenova/transformers');

// Initialize sentiment analyzer (lightweight, no ML model needed)
const sentimentAnalyzer = new Sentiment();

// Cache for transformer models to avoid reloading
let sentimentClassifier = null;

/**
 * Initialize the sentiment classification model
 * Uses DistilBERT fine-tuned on SST-2 dataset for sentiment analysis
 * This is a lightweight model suitable for CPU inference
 */
async function initializeSentimentModel() {
  if (!sentimentClassifier) {
    try {
      console.log('Loading sentiment classification model...');
      sentimentClassifier = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
      console.log('Sentiment model loaded successfully');
    } catch (error) {
      console.error('Error loading sentiment model:', error.message);
      throw new Error('Failed to initialize sentiment model');
    }
  }
  return sentimentClassifier;
}

/**
 * Analyze sentiment of text using transformer model
 * Returns sentiment score between -1 (negative) and 1 (positive)
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Sentiment analysis result with score and confidence
 */
async function analyzeSentimentAdvanced(text) {
  try {
    // Truncate text to avoid token limit (max 512 tokens for DistilBERT)
    const truncatedText = text.substring(0, 500);
    
    const classifier = await initializeSentimentModel();
    const result = await classifier(truncatedText);
    
    // Convert model output to -1 to 1 scale
    // Model returns POSITIVE or NEGATIVE with score
    const sentiment = result[0].label === 'POSITIVE' ? 1 : -1;
    const confidence = result[0].score;
    
    return {
      sentiment: sentiment * confidence, // Apply confidence to sentiment
      confidence: confidence,
      label: result[0].label,
    };
  } catch (error) {
    console.error('Error in advanced sentiment analysis:', error.message);
    // Fallback to simple sentiment analysis
    return analyzeSentimentSimple(text);
  }
}

/**
 * Simple sentiment analysis using lexicon-based approach
 * Faster but less accurate than transformer models
 * Used as fallback when transformer model is unavailable
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis result
 */
function analyzeSentimentSimple(text) {
  try {
    const result = sentimentAnalyzer.analyze(text);
    
    // Normalize score to -1 to 1 range
    // sentiment.score ranges from -5 to 5
    const normalizedScore = Math.max(-1, Math.min(1, result.score / 5));
    
    return {
      sentiment: normalizedScore,
      confidence: Math.abs(normalizedScore), // Higher absolute score = higher confidence
      label: result.score > 0 ? 'POSITIVE' : result.score < 0 ? 'NEGATIVE' : 'NEUTRAL',
    };
  } catch (error) {
    console.error('Error in simple sentiment analysis:', error.message);
    return {
      sentiment: 0,
      confidence: 0,
      label: 'NEUTRAL',
    };
  }
}

/**
 * Calculate technical analysis score based on price history
 * Analyzes trends, momentum, and volatility
 * @param {Array<number>} prices - Array of historical prices
 * @returns {number} Technical score between 0 and 1
 */
function calculateTechnicalScore(prices) {
  if (!prices || prices.length < 2) {
    return 0.5; // Neutral if insufficient data
  }
  
  try {
    const recentPrices = prices.slice(-30); // Last 30 data points
    const currentPrice = recentPrices[recentPrices.length - 1];
    const previousPrice = recentPrices[0];
    
    // Calculate trend: positive if price is going up
    const trend = (currentPrice - previousPrice) / previousPrice;
    
    // Calculate volatility: standard deviation of returns
    const returns = [];
    for (let i = 1; i < recentPrices.length; i++) {
      returns.push((recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1]);
    }
    
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // Calculate momentum: rate of change
    const momentum = trend / (volatility + 0.001); // Avoid division by zero
    
    // Combine metrics into score (0-1)
    // Positive trend and moderate volatility = higher score
    const score = 0.5 + (trend * 0.3) + (Math.min(momentum, 1) * 0.2);
    
    return Math.max(0, Math.min(1, score));
  } catch (error) {
    console.error('Error calculating technical score:', error.message);
    return 0.5;
  }
}

/**
 * Calculate volume analysis score
 * Analyzes trading volume trends
 * @param {Array<number>} volumes - Array of historical volumes
 * @returns {number} Volume score between 0 and 1
 */
function calculateVolumeScore(volumes) {
  if (!volumes || volumes.length < 2) {
    return 0.5;
  }
  
  try {
    const recentVolumes = volumes.slice(-30);
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    const currentVolume = recentVolumes[recentVolumes.length - 1];
    
    // Higher volume relative to average = higher score
    const volumeRatio = currentVolume / (avgVolume + 1);
    const score = Math.min(1, volumeRatio / 2); // Normalize to 0-1
    
    return score;
  } catch (error) {
    console.error('Error calculating volume score:', error.message);
    return 0.5;
  }
}

/**
 * Calculate trend score based on price direction
 * @param {Array<number>} prices - Array of historical prices
 * @returns {number} Trend score between 0 and 1
 */
function calculateTrendScore(prices) {
  if (!prices || prices.length < 2) {
    return 0.5;
  }
  
  try {
    const recentPrices = prices.slice(-30);
    const currentPrice = recentPrices[recentPrices.length - 1];
    const previousPrice = recentPrices[0];
    
    // Calculate percentage change
    const percentChange = (currentPrice - previousPrice) / previousPrice;
    
    // Convert to 0-1 scale
    // -20% = 0.3, 0% = 0.5, +20% = 0.7
    const score = 0.5 + (percentChange / 0.4);
    
    return Math.max(0, Math.min(1, score));
  } catch (error) {
    console.error('Error calculating trend score:', error.message);
    return 0.5;
  }
}

/**
 * Generate trading signal based on multiple analysis factors
 * Combines technical, sentiment, volume, and trend analysis
 * @param {Object} analysisData - Object containing analysis scores and data
 * @returns {Object} Trading signal with recommendation and confidence
 */
function generateTradingSignal(analysisData) {
  const {
    technicalScore = 0.5,
    sentimentScore = 0.5,
    volumeScore = 0.5,
    trendScore = 0.5,
    currentPrice = 0,
    priceChange24h = 0,
  } = analysisData;
  
  try {
    // Weight the different factors
    // Technical analysis: 40%, Sentiment: 30%, Volume: 20%, Trend: 10%
    const compositeScore = 
      (technicalScore * 0.4) +
      (sentimentScore * 0.3) +
      (volumeScore * 0.2) +
      (trendScore * 0.1);
    
    // Determine signal based on composite score
    let signal = 'HOLD';
    let confidence = 0;
    
    if (compositeScore > 0.65) {
      signal = 'BUY';
      confidence = Math.min(1, (compositeScore - 0.65) / 0.35);
    } else if (compositeScore < 0.35) {
      signal = 'SELL';
      confidence = Math.min(1, (0.35 - compositeScore) / 0.35);
    } else {
      signal = 'HOLD';
      confidence = 1 - Math.abs(compositeScore - 0.5) * 2;
    }
    
    // Calculate risk score (inverse of confidence)
    const riskScore = 1 - confidence;
    
    // Estimate price target (simple heuristic)
    let priceTarget = null;
    if (signal === 'BUY') {
      // Target 5-15% upside
      const upside = 0.05 + (confidence * 0.1);
      priceTarget = currentPrice * (1 + upside);
    } else if (signal === 'SELL') {
      // Target 5-15% downside
      const downside = 0.05 + (confidence * 0.1);
      priceTarget = currentPrice * (1 - downside);
    }
    
    return {
      signal,
      confidence: Math.round(confidence * 100) / 100,
      riskScore: Math.round(riskScore * 100) / 100,
      priceTarget: priceTarget ? Math.round(priceTarget * 100) / 100 : null,
      compositeScore: Math.round(compositeScore * 100) / 100,
      factors: {
        technical: Math.round(technicalScore * 100) / 100,
        sentiment: Math.round(sentimentScore * 100) / 100,
        volume: Math.round(volumeScore * 100) / 100,
        trend: Math.round(trendScore * 100) / 100,
      },
    };
  } catch (error) {
    console.error('Error generating trading signal:', error.message);
    return {
      signal: 'HOLD',
      confidence: 0,
      riskScore: 1,
      priceTarget: null,
      compositeScore: 0.5,
      factors: {
        technical: 0.5,
        sentiment: 0.5,
        volume: 0.5,
        trend: 0.5,
      },
    };
  }
}

/**
 * Generate reasoning text explaining the trading signal
 * @param {Object} signal - Trading signal object
 * @param {Object} analysisData - Analysis data used for signal
 * @returns {string} Human-readable explanation
 */
function generateReasoning(signal, analysisData) {
  const { signal: action, confidence, factors } = signal;
  const { priceChange24h = 0 } = analysisData;
  
  let reasoning = `${action} signal with ${Math.round(confidence * 100)}% confidence. `;
  
  // Add factor-based reasoning
  const factorReasons = [];
  
  if (factors.technical > 0.6) {
    factorReasons.push('Strong technical indicators');
  } else if (factors.technical < 0.4) {
    factorReasons.push('Weak technical indicators');
  }
  
  if (factors.sentiment > 0.6) {
    factorReasons.push('Positive market sentiment');
  } else if (factors.sentiment < 0.4) {
    factorReasons.push('Negative market sentiment');
  }
  
  if (factors.volume > 0.6) {
    factorReasons.push('High trading volume');
  }
  
  if (factors.trend > 0.6) {
    factorReasons.push('Upward price trend');
  } else if (factors.trend < 0.4) {
    factorReasons.push('Downward price trend');
  }
  
  if (factorReasons.length > 0) {
    reasoning += `Key factors: ${factorReasons.join(', ')}.`;
  }
  
  if (priceChange24h > 5) {
    reasoning += ' Price has surged in the last 24h.';
  } else if (priceChange24h < -5) {
    reasoning += ' Price has dropped significantly in the last 24h.';
  }
  
  return reasoning;
}

module.exports = {
  initializeSentimentModel,
  analyzeSentimentAdvanced,
  analyzeSentimentSimple,
  calculateTechnicalScore,
  calculateVolumeScore,
  calculateTrendScore,
  generateTradingSignal,
  generateReasoning,
};

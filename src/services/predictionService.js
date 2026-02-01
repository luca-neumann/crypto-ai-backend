/**
 * Prediction Service
 * Handles generation and storage of trading predictions
 * Integrates data from multiple sources for comprehensive analysis
 */

const { getPrismaClient } = require('../utils/db');
const aiService = require('./aiService');
const coingeckoService = require('./coingeckoService');

/**
 * Generate comprehensive prediction for a cryptocurrency
 * Analyzes technical, sentiment, volume, and trend data
 * @param {string} cryptoId - CoinGecko cryptocurrency ID
 * @param {string} symbol - Cryptocurrency symbol (BTC, ETH, etc.)
 * @returns {Promise<Object>} Complete prediction with all analysis
 */
async function generatePrediction(cryptoId, symbol) {
  const prisma = getPrismaClient();
  
  try {
    console.log(`Generating prediction for ${symbol}...`);
    
    // Fetch current cryptocurrency data
    const cryptoData = await coingeckoService.getCryptocurrencyData(cryptoId);
    const currentPrice = cryptoData.market_data?.current_price?.usd || 0;
    const marketCap = cryptoData.market_data?.market_cap?.usd;
    const volume24h = cryptoData.market_data?.total_volume?.usd;
    const priceChange24h = cryptoData.market_data?.price_change_percentage_24h || 0;
    const priceChange7d = cryptoData.market_data?.price_change_percentage_7d || 0;
    
    // Fetch historical prices for technical analysis
    const historicalPrices = await coingeckoService.getHistoricalPrices(cryptoId, 30);
    const prices = historicalPrices.map(p => p[1]); // Extract prices from [timestamp, price] pairs
    
    // Calculate analysis scores
    const technicalScore = aiService.calculateTechnicalScore(prices);
    const volumeScore = aiService.calculateVolumeScore(
      historicalPrices.map(p => p[1]) // Using prices as proxy for volume
    );
    const trendScore = aiService.calculateTrendScore(prices);
    
    // Sentiment analysis (using simple analysis for now)
    const sentimentScore = 0.5 + (priceChange24h / 100) * 0.5; // Use price change as sentiment proxy
    
    // Generate trading signal
    const signal = aiService.generateTradingSignal({
      technicalScore,
      sentimentScore,
      volumeScore,
      trendScore,
      currentPrice,
      priceChange24h,
    });
    
    // Generate reasoning
    const reasoning = aiService.generateReasoning(signal, {
      priceChange24h,
    });
    
    // Prepare prediction data
    const predictionData = {
      signal: signal.signal,
      confidence: signal.confidence,
      priceTarget: signal.priceTarget,
      riskScore: signal.riskScore,
      technicalScore: signal.factors.technical,
      sentimentScore: signal.factors.sentiment,
      volumeScore: signal.factors.volume,
      trendScore: signal.factors.trend,
      reasoning,
      factors: [
        `Technical: ${Math.round(signal.factors.technical * 100)}%`,
        `Sentiment: ${Math.round(signal.factors.sentiment * 100)}%`,
        `Volume: ${Math.round(signal.factors.volume * 100)}%`,
        `Trend: ${Math.round(signal.factors.trend * 100)}%`,
      ],
    };
    
    // Update or create cryptocurrency record
    const crypto = await prisma.cryptocurrency.upsert({
      where: { symbol },
      update: {
        currentPrice,
        marketCap,
        volume24h,
        priceChange24h,
        priceChange7d,
        lastUpdated: new Date(),
      },
      create: {
        symbol,
        name: cryptoData.name || symbol,
        currentPrice,
        marketCap,
        volume24h,
        priceChange24h,
        priceChange7d,
      },
    });
    
    // Store price history
    if (prices.length > 0) {
      const latestPrice = prices[prices.length - 1];
      await prisma.priceHistory.create({
        data: {
          cryptoId: crypto.id,
          price: latestPrice,
          timestamp: new Date(),
        },
      });
    }
    
    // Store prediction
    const prediction = await prisma.prediction.create({
      data: {
        cryptoId: crypto.id,
        ...predictionData,
      },
    });
    
    console.log(`Prediction generated for ${symbol}: ${signal.signal}`);
    
    return {
      crypto: {
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
        currentPrice: crypto.currentPrice,
        priceChange24h: crypto.priceChange24h,
      },
      prediction: predictionData,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`Error generating prediction for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Generate predictions for multiple cryptocurrencies
 * @param {Array<string>} cryptoIds - Array of CoinGecko cryptocurrency IDs
 * @returns {Promise<Array>} Array of predictions
 */
async function generateBatchPredictions(cryptoIds) {
  const predictions = [];
  
  for (const cryptoId of cryptoIds) {
    try {
      const prediction = await generatePrediction(cryptoId, cryptoId.toUpperCase());
      predictions.push(prediction);
      
      // Add delay between requests to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to generate prediction for ${cryptoId}:`, error.message);
    }
  }
  
  return predictions;
}

/**
 * Get latest prediction for a cryptocurrency
 * @param {string} symbol - Cryptocurrency symbol
 * @returns {Promise<Object>} Latest prediction with crypto data
 */
async function getLatestPrediction(symbol) {
  const prisma = getPrismaClient();
  
  try {
    const crypto = await prisma.cryptocurrency.findUnique({
      where: { symbol },
      include: {
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    if (!crypto || crypto.predictions.length === 0) {
      return null;
    }
    
    return {
      crypto: {
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
        currentPrice: crypto.currentPrice,
        priceChange24h: crypto.priceChange24h,
      },
      prediction: crypto.predictions[0],
    };
  } catch (error) {
    console.error(`Error fetching prediction for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Get all latest predictions
 * @param {number} limit - Maximum number of predictions to return
 * @returns {Promise<Array>} Array of latest predictions
 */
async function getAllLatestPredictions(limit = 50) {
  const prisma = getPrismaClient();
  
  try {
    const cryptos = await prisma.cryptocurrency.findMany({
      take: limit,
      orderBy: { lastUpdated: 'desc' },
      include: {
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    return cryptos
      .filter(crypto => crypto.predictions.length > 0)
      .map(crypto => ({
        crypto: {
          id: crypto.id,
          symbol: crypto.symbol,
          name: crypto.name,
          currentPrice: crypto.currentPrice,
          priceChange24h: crypto.priceChange24h,
        },
        prediction: crypto.predictions[0],
      }));
  } catch (error) {
    console.error('Error fetching all predictions:', error.message);
    throw error;
  }
}

/**
 * Store training data for model improvement
 * Records actual outcomes of predictions for future training
 * @param {string} cryptoId - Cryptocurrency ID
 * @param {Object} trainingData - Training data object
 * @returns {Promise<Object>} Stored training data
 */
async function storeTrainingData(cryptoId, trainingData) {
  const prisma = getPrismaClient();
  
  try {
    const data = await prisma.trainingData.create({
      data: {
        cryptoId,
        ...trainingData,
      },
    });
    
    return data;
  } catch (error) {
    console.error('Error storing training data:', error.message);
    throw error;
  }
}

/**
 * Get model performance metrics
 * @returns {Promise<Object>} Model performance statistics
 */
async function getModelPerformance() {
  const prisma = getPrismaClient();
  
  try {
    const performance = await prisma.modelPerformance.findFirst();
    
    if (!performance) {
      // Create initial performance record
      return await prisma.modelPerformance.create({
        data: {
          totalPredictions: 0,
          correctPredictions: 0,
          accuracy: 0,
        },
      });
    }
    
    return performance;
  } catch (error) {
    console.error('Error fetching model performance:', error.message);
    throw error;
  }
}

/**
 * Update model performance based on new training data
 * @param {Object} metrics - Performance metrics to update
 * @returns {Promise<Object>} Updated performance record
 */
async function updateModelPerformance(metrics) {
  const prisma = getPrismaClient();
  
  try {
    const performance = await getModelPerformance();
    
    const updated = await prisma.modelPerformance.update({
      where: { id: performance.id },
      data: {
        totalPredictions: (performance.totalPredictions || 0) + 1,
        correctPredictions: (performance.correctPredictions || 0) + (metrics.correct ? 1 : 0),
        accuracy: metrics.accuracy || performance.accuracy,
        lastEvaluated: new Date(),
      },
    });
    
    return updated;
  } catch (error) {
    console.error('Error updating model performance:', error.message);
    throw error;
  }
}

module.exports = {
  generatePrediction,
  generateBatchPredictions,
  getLatestPrediction,
  getAllLatestPredictions,
  storeTrainingData,
  getModelPerformance,
  updateModelPerformance,
};

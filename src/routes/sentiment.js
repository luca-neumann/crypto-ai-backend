/**
 * Sentiment Analysis API Routes
 * Endpoints for analyzing sentiment of crypto-related text
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { getPrismaClient } = require('../utils/db');

/**
 * POST /api/sentiment/analyze
 * Analyze sentiment of provided text
 * Body:
 *   - text: Text to analyze
 *   - cryptoSymbol: (optional) Associated cryptocurrency symbol
 */
router.post('/analyze', async (req, res) => {
  try {
    const { text, cryptoSymbol } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }
    
    // Use advanced sentiment analysis
    const sentiment = await aiService.analyzeSentimentAdvanced(text);
    
    res.json({
      success: true,
      data: {
        text: text.substring(0, 200), // Return first 200 chars
        sentiment: sentiment.sentiment,
        confidence: sentiment.confidence,
        label: sentiment.label,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/sentiment/store
 * Store sentiment analysis in database
 * Body:
 *   - cryptoSymbol: Cryptocurrency symbol
 *   - text: Original text
 *   - sentiment: Sentiment score (-1 to 1)
 *   - confidence: Confidence score (0 to 1)
 *   - source: Source of sentiment (news, twitter, reddit, etc.)
 */
router.post('/store', async (req, res) => {
  try {
    const { cryptoSymbol, text, sentiment, confidence, source } = req.body;
    
    if (!cryptoSymbol || !text || sentiment === undefined) {
      return res.status(400).json({
        success: false,
        error: 'cryptoSymbol, text, and sentiment are required',
      });
    }
    
    const prisma = getPrismaClient();
    
    // Find cryptocurrency by symbol
    const crypto = await prisma.cryptocurrency.findUnique({
      where: { symbol: cryptoSymbol.toUpperCase() },
    });
    
    if (!crypto) {
      return res.status(404).json({
        success: false,
        error: `Cryptocurrency ${cryptoSymbol} not found`,
      });
    }
    
    // Store sentiment
    const storedSentiment = await prisma.sentiment.create({
      data: {
        cryptoId: crypto.id,
        text,
        sentiment,
        confidence: confidence || 0.5,
        source: source || 'manual',
      },
    });
    
    res.json({
      success: true,
      data: storedSentiment,
    });
  } catch (error) {
    console.error('Error storing sentiment:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/sentiment/:symbol
 * Get recent sentiment data for a cryptocurrency
 * Params:
 *   - symbol: Cryptocurrency symbol
 * Query params:
 *   - limit: Number of sentiments to fetch (default: 20)
 *   - days: Number of days to look back (default: 7)
 */
router.get('/:symbol', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const days = parseInt(req.query.days) || 7;
    
    // Find cryptocurrency
    const crypto = await prisma.cryptocurrency.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });
    
    if (!crypto) {
      return res.status(404).json({
        success: false,
        error: `Cryptocurrency ${symbol} not found`,
      });
    }
    
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Fetch sentiments
    const sentiments = await prisma.sentiment.findMany({
      where: {
        cryptoId: crypto.id,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    // Calculate average sentiment
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((sum, s) => sum + s.sentiment, 0) / sentiments.length
      : 0;
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: sentiments.length,
      averageSentiment: Math.round(avgSentiment * 100) / 100,
      data: sentiments,
    });
  } catch (error) {
    console.error('Error fetching sentiments:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/sentiment/:symbol/summary
 * Get sentiment summary for a cryptocurrency
 * Params:
 *   - symbol: Cryptocurrency symbol
 */
router.get('/:symbol/summary', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const { symbol } = req.params;
    
    // Find cryptocurrency
    const crypto = await prisma.cryptocurrency.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });
    
    if (!crypto) {
      return res.status(404).json({
        success: false,
        error: `Cryptocurrency ${symbol} not found`,
      });
    }
    
    // Fetch all sentiments
    const sentiments = await prisma.sentiment.findMany({
      where: { cryptoId: crypto.id },
    });
    
    if (sentiments.length === 0) {
      return res.json({
        success: true,
        symbol: symbol.toUpperCase(),
        count: 0,
        summary: {
          averageSentiment: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          positivePercentage: 0,
          negativePercentage: 0,
          neutralPercentage: 0,
        },
      });
    }
    
    // Calculate statistics
    const positive = sentiments.filter(s => s.sentiment > 0.1).length;
    const negative = sentiments.filter(s => s.sentiment < -0.1).length;
    const neutral = sentiments.length - positive - negative;
    const avgSentiment = sentiments.reduce((sum, s) => sum + s.sentiment, 0) / sentiments.length;
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: sentiments.length,
      summary: {
        averageSentiment: Math.round(avgSentiment * 100) / 100,
        positiveCount: positive,
        negativeCount: negative,
        neutralCount: neutral,
        positivePercentage: Math.round((positive / sentiments.length) * 100),
        negativePercentage: Math.round((negative / sentiments.length) * 100),
        neutralPercentage: Math.round((neutral / sentiments.length) * 100),
      },
    });
  } catch (error) {
    console.error('Error fetching sentiment summary:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

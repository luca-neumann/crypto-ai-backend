/**
 * News Scraping API Routes
 * Endpoints for fetching and analyzing cryptocurrency news
 */

const express = require('express');
const router = express.Router();
const newsScrapingService = require('../services/newsScrapingService');

/**
 * GET /api/news/feed
 * Fetch latest cryptocurrency news from multiple sources
 * Query params:
 *   - limit: number of articles (default: 50)
 *   - crypto: specific cryptocurrency symbol (optional)
 */
router.get('/feed', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const crypto = req.query.crypto || null;

    const articles = await newsScrapingService.fetchNewsFromFeeds(crypto, limit);

    res.json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    console.error('Error fetching news feed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/news/sentiment/:symbol
 * Analyze news sentiment for a specific cryptocurrency
 * Params:
 *   - symbol: cryptocurrency symbol (e.g., BTC, ETH)
 * Query params:
 *   - days: number of days to analyze (default: 7)
 */
router.get('/sentiment/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days) || 7;

    const sentiment = await newsScrapingService.analyzeNewsSentiment(symbol, days);

    res.json({
      success: true,
      data: sentiment
    });
  } catch (error) {
    console.error('Error analyzing news sentiment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/news/trending
 * Get trending cryptocurrency topics from news
 * Query params:
 *   - limit: number of trending topics (default: 10)
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topics = await newsScrapingService.getTrendingTopics(limit);

    res.json({
      success: true,
      count: topics.length,
      data: topics
    });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/news/impact/:symbol
 * Calculate news impact score for a cryptocurrency
 * Params:
 *   - symbol: cryptocurrency symbol (e.g., BTC, ETH)
 */
router.get('/impact/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    const impact = await newsScrapingService.getNewsImpactScore(symbol);

    res.json({
      success: true,
      data: impact
    });
  } catch (error) {
    console.error('Error calculating news impact:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

/**
 * News Scraping Service
 * Fetches and analyzes cryptocurrency news from multiple sources
 * Integrates with sentiment analysis for market sentiment tracking
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const { prisma } = require('../utils/db');

// RSS Parser instance for fetching news feeds
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

/**
 * News sources configuration
 * Each source has RSS feed URL and crypto-related keywords
 */
const NEWS_SOURCES = [
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'crypto_news'
  },
  {
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/feed',
    category: 'crypto_news'
  },
  {
    name: 'The Block',
    url: 'https://www.theblock.co/api/feed',
    category: 'crypto_news'
  }
];

/**
 * Crypto-related keywords for filtering news
 * Used to identify relevant articles
 */
const CRYPTO_KEYWORDS = [
  'bitcoin', 'ethereum', 'crypto', 'blockchain', 'defi', 'nft',
  'altcoin', 'token', 'exchange', 'wallet', 'mining', 'staking',
  'regulation', 'sec', 'bull', 'bear', 'pump', 'dump', 'rally',
  'crash', 'surge', 'decline', 'bullish', 'bearish', 'hodl'
];

/**
 * Fetch news from RSS feeds
 * Aggregates articles from multiple crypto news sources
 * @param {string} cryptoSymbol - Optional: filter by specific cryptocurrency
 * @param {number} limit - Maximum number of articles to fetch (default: 50)
 * @returns {Promise<Array>} Array of news articles with metadata
 */
async function fetchNewsFromFeeds(cryptoSymbol = null, limit = 50) {
  try {
    const allArticles = [];

    // Fetch from each news source
    for (const source of NEWS_SOURCES) {
      try {
        console.log(`📰 Fetching news from ${source.name}...`);
        
        // Parse RSS feed
        const feed = await parser.parseURL(source.url);
        
        // Process each article in the feed
        if (feed.items) {
          for (const item of feed.items.slice(0, 20)) {
            // Check if article is crypto-related
            const title = (item.title || '').toLowerCase();
            const description = (item.content || item.contentSnippet || '').toLowerCase();
            const isCryptoRelated = CRYPTO_KEYWORDS.some(keyword => 
              title.includes(keyword) || description.includes(keyword)
            );

            if (isCryptoRelated) {
              allArticles.push({
                title: item.title,
                description: item.contentSnippet || item.content,
                url: item.link,
                source: source.name,
                publishedAt: new Date(item.pubDate),
                category: source.category,
                content: item.content || item.contentSnippet
              });
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error fetching from ${source.name}:`, error.message);
        // Continue with next source if one fails
      }
    }

    // Sort by date (newest first) and limit results
    const sortedArticles = allArticles
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);

    console.log(`✅ Fetched ${sortedArticles.length} crypto news articles`);
    return sortedArticles;
  } catch (error) {
    console.error('❌ Error fetching news feeds:', error.message);
    return [];
  }
}

/**
 * Extract cryptocurrency mentions from article text
 * Identifies which cryptocurrencies are mentioned in an article
 * @param {string} text - Article text to analyze
 * @returns {Array<string>} Array of cryptocurrency symbols mentioned
 */
function extractCryptoMentions(text) {
  const cryptoPatterns = {
    'BTC': ['bitcoin', 'btc'],
    'ETH': ['ethereum', 'eth'],
    'BNB': ['binance', 'bnb'],
    'XRP': ['ripple', 'xrp'],
    'ADA': ['cardano', 'ada'],
    'SOL': ['solana', 'sol'],
    'DOGE': ['dogecoin', 'doge'],
    'MATIC': ['polygon', 'matic'],
    'LINK': ['chainlink', 'link'],
    'LTC': ['litecoin', 'ltc']
  };

  const lowerText = text.toLowerCase();
  const mentions = [];

  // Check for each cryptocurrency pattern
  for (const [symbol, patterns] of Object.entries(cryptoPatterns)) {
    if (patterns.some(pattern => lowerText.includes(pattern))) {
      mentions.push(symbol);
    }
  }

  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Determine sentiment direction from article title and content
 * Uses keyword matching for quick sentiment assessment
 * @param {string} title - Article title
 * @param {string} content - Article content
 * @returns {Object} Sentiment object with score and label
 */
function determineSentiment(title, content) {
  const text = `${title} ${content}`.toLowerCase();

  // Positive sentiment keywords
  const positiveKeywords = [
    'surge', 'rally', 'bull', 'bullish', 'gain', 'profit', 'growth',
    'rise', 'jump', 'soar', 'boom', 'positive', 'strong', 'recovery',
    'breakthrough', 'adoption', 'partnership', 'integration', 'approval'
  ];

  // Negative sentiment keywords
  const negativeKeywords = [
    'crash', 'dump', 'bear', 'bearish', 'loss', 'decline', 'fall',
    'drop', 'plunge', 'negative', 'weak', 'concern', 'risk', 'warning',
    'hack', 'scam', 'fraud', 'regulation', 'ban', 'lawsuit'
  ];

  // Count keyword occurrences
  const positiveCount = positiveKeywords.filter(kw => text.includes(kw)).length;
  const negativeCount = negativeKeywords.filter(kw => text.includes(kw)).length;

  // Calculate sentiment score (0-1, 0.5 = neutral)
  const totalCount = positiveCount + negativeCount;
  let score = 0.5; // Default neutral

  if (totalCount > 0) {
    score = positiveCount / totalCount;
  }

  // Determine sentiment label
  let label = 'NEUTRAL';
  if (score > 0.65) label = 'POSITIVE';
  else if (score < 0.35) label = 'NEGATIVE';

  return {
    score: parseFloat(score.toFixed(2)),
    label,
    positiveCount,
    negativeCount
  };
}

/**
 * Store news article in database
 * Saves article with sentiment analysis for future reference
 * @param {Object} article - Article object with title, description, etc.
 * @param {Object} sentiment - Sentiment analysis result
 * @returns {Promise<Object>} Stored article record
 */
async function storeNewsArticle(article, sentiment) {
  try {
    // Extract crypto mentions from article
    const cryptoMentions = extractCryptoMentions(
      `${article.title} ${article.description}`
    );

    // Store in database for historical tracking
    const storedArticle = await prisma.sentiment.create({
      data: {
        cryptoSymbol: cryptoMentions[0] || 'GENERAL', // Use first mention or GENERAL
        text: article.title,
        sentiment: sentiment.score,
        confidence: 0.8, // Keyword-based confidence
        source: article.source,
        metadata: {
          articleUrl: article.url,
          fullText: article.description,
          cryptoMentions,
          sentimentLabel: sentiment.label,
          publishedAt: article.publishedAt
        }
      }
    });

    return storedArticle;
  } catch (error) {
    console.error('❌ Error storing news article:', error.message);
    return null;
  }
}

/**
 * Analyze news sentiment for a specific cryptocurrency
 * Fetches recent news and calculates aggregate sentiment
 * @param {string} cryptoSymbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<Object>} Sentiment analysis with score and trend
 */
async function analyzeNewsSentiment(cryptoSymbol, days = 7) {
  try {
    console.log(`📊 Analyzing news sentiment for ${cryptoSymbol}...`);

    // Fetch recent news
    const articles = await fetchNewsFromFeeds(cryptoSymbol, 100);

    // Filter articles mentioning this crypto
    const relevantArticles = articles.filter(article => {
      const mentions = extractCryptoMentions(
        `${article.title} ${article.description}`
      );
      return mentions.includes(cryptoSymbol);
    });

    if (relevantArticles.length === 0) {
      return {
        cryptoSymbol,
        sentiment: 0.5,
        label: 'NEUTRAL',
        articleCount: 0,
        trend: 'INSUFFICIENT_DATA'
      };
    }

    // Analyze sentiment for each article
    const sentiments = relevantArticles.map(article => 
      determineSentiment(article.title, article.description)
    );

    // Calculate aggregate sentiment
    const avgSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    const positiveCount = sentiments.filter(s => s.label === 'POSITIVE').length;
    const negativeCount = sentiments.filter(s => s.label === 'NEGATIVE').length;

    // Determine trend
    let trend = 'NEUTRAL';
    if (positiveCount > negativeCount * 1.5) trend = 'BULLISH';
    else if (negativeCount > positiveCount * 1.5) trend = 'BEARISH';

    const result = {
      cryptoSymbol,
      sentiment: parseFloat(avgSentiment.toFixed(2)),
      label: avgSentiment > 0.65 ? 'POSITIVE' : avgSentiment < 0.35 ? 'NEGATIVE' : 'NEUTRAL',
      trend,
      articleCount: relevantArticles.length,
      positiveArticles: positiveCount,
      negativeArticles: negativeCount,
      neutralArticles: sentiments.filter(s => s.label === 'NEUTRAL').length,
      articles: relevantArticles.slice(0, 10) // Top 10 articles
    };

    console.log(`✅ News sentiment for ${cryptoSymbol}: ${result.label} (${result.sentiment})`);
    return result;
  } catch (error) {
    console.error('❌ Error analyzing news sentiment:', error.message);
    return {
      cryptoSymbol,
      sentiment: 0.5,
      label: 'NEUTRAL',
      error: error.message
    };
  }
}

/**
 * Get trending news topics
 * Identifies most discussed topics in crypto news
 * @param {number} limit - Number of top topics to return (default: 10)
 * @returns {Promise<Array>} Array of trending topics with mention counts
 */
async function getTrendingTopics(limit = 10) {
  try {
    console.log('🔥 Fetching trending topics...');

    const articles = await fetchNewsFromFeeds(null, 200);
    const topicCounts = {};

    // Count topic mentions
    for (const article of articles) {
      const mentions = extractCryptoMentions(
        `${article.title} ${article.description}`
      );

      for (const mention of mentions) {
        topicCounts[mention] = (topicCounts[mention] || 0) + 1;
      }
    }

    // Sort by count and return top topics
    const trendingTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([symbol, count]) => ({
        symbol,
        mentions: count,
        trend: 'TRENDING'
      }));

    console.log(`✅ Found ${trendingTopics.length} trending topics`);
    return trendingTopics;
  } catch (error) {
    console.error('❌ Error fetching trending topics:', error.message);
    return [];
  }
}

/**
 * Get news impact score
 * Calculates how much news sentiment affects price predictions
 * @param {string} cryptoSymbol - Cryptocurrency symbol
 * @returns {Promise<Object>} Impact score and analysis
 */
async function getNewsImpactScore(cryptoSymbol) {
  try {
    // Get recent news sentiment
    const newsSentiment = await analyzeNewsSentiment(cryptoSymbol, 7);

    // Get recent predictions to compare
    const recentPredictions = await prisma.prediction.findMany({
      where: { cryptoSymbol },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (recentPredictions.length === 0) {
      return {
        cryptoSymbol,
        impactScore: 0.5,
        newsInfluence: 'MODERATE',
        confidence: 'LOW'
      };
    }

    // Calculate correlation between news sentiment and predictions
    const avgPredictionScore = recentPredictions.reduce((sum, p) => sum + p.signal, 0) / recentPredictions.length;
    const newsSentimentScore = newsSentiment.sentiment;

    // Simple correlation: how aligned are news and predictions?
    const alignment = Math.abs(avgPredictionScore - newsSentimentScore);
    const impactScore = 1 - alignment; // Higher = more aligned = more impact

    return {
      cryptoSymbol,
      impactScore: parseFloat(impactScore.toFixed(2)),
      newsInfluence: impactScore > 0.7 ? 'HIGH' : impactScore > 0.4 ? 'MODERATE' : 'LOW',
      newsSentiment: newsSentimentScore,
      predictionScore: avgPredictionScore,
      confidence: 'MEDIUM'
    };
  } catch (error) {
    console.error('❌ Error calculating news impact score:', error.message);
    return {
      cryptoSymbol,
      impactScore: 0.5,
      error: error.message
    };
  }
}

module.exports = {
  fetchNewsFromFeeds,
  analyzeNewsSentiment,
  getTrendingTopics,
  getNewsImpactScore,
  storeNewsArticle,
  extractCryptoMentions,
  determineSentiment
};

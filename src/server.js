/**
 * Crypto AI Trading Backend Server
 * Main Express server for cryptocurrency analysis and trading signals
 *
 * Features:
 * - Real-time cryptocurrency data from CoinGecko API
 * - AI-powered sentiment analysis using transformer models
 * - Technical analysis and trading signal generation
 * - Advanced ML with feature engineering and ensemble predictions
 * - News scraping and sentiment analysis
 * - Backtesting engine for strategy validation
 * - PostgreSQL database for data persistence
 * - RESTful API endpoints for predictions and analysis
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const predictionsRouter = require('./routes/predictions');
const cryptocurrenciesRouter = require('./routes/cryptocurrencies');
const sentimentRouter = require('./routes/sentiment');
const newsRouter = require('./routes/news');
const advancedMLRouter = require('./routes/advancedML');
const backtestingRouter = require('./routes/backtesting');
const alertsRouter = require('./routes/alerts');
const portfolioRouter = require('./routes/portfolio');
const riskRouter = require('./routes/risk');

// Import services
const { getPrismaClient } = require('./utils/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/predictions', predictionsRouter);
app.use('/api/cryptocurrencies', cryptocurrenciesRouter);
app.use('/api/sentiment', sentimentRouter);
app.use('/api/news', newsRouter);
app.use('/api/ml', advancedMLRouter);
app.use('/api/backtest', backtestingRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/risk', riskRouter);

/**
 * Root endpoint - API documentation
 */
app.get('/', (_req, res) => {
  res.json({
    name: 'Crypto AI Trading Backend',
    version: '2.0.0',
    description: 'Advanced AI-powered cryptocurrency analysis with news scraping, ML, and backtesting',
    features: [
      'Real-time cryptocurrency data from CoinGecko API',
      'AI sentiment analysis using transformer models',
      'Technical analysis and trading signal generation',
      'Advanced ML with feature engineering and ensemble predictions',
      'News scraping from multiple sources with sentiment analysis',
      'Backtesting engine for strategy validation',
      'Price target calculation and risk management',
      'Model performance tracking and accuracy metrics'
    ],
    endpoints: {
      health: 'GET /health',
      predictions: {
        getAllPredictions: 'GET /api/predictions?limit=50',
        getPredictionBySymbol: 'GET /api/predictions/:symbol',
        generatePrediction: 'POST /api/predictions/generate/:cryptoId',
        generateBatchPredictions: 'POST /api/predictions/batch',
      },
      cryptocurrencies: {
        getAllCryptos: 'GET /api/cryptocurrencies?limit=50',
        getCryptoData: 'GET /api/cryptocurrencies/:cryptoId',
        getHistoricalPrices: 'GET /api/cryptocurrencies/:cryptoId/history?days=30',
        searchCrypto: 'GET /api/cryptocurrencies/search/:query',
        getTrending: 'GET /api/cryptocurrencies/trending',
        getFromDatabase: 'GET /api/cryptocurrencies/db/:symbol',
      },
      sentiment: {
        analyzeSentiment: 'POST /api/sentiment/analyze',
        storeSentiment: 'POST /api/sentiment/store',
        getSentiments: 'GET /api/sentiment/:symbol?limit=20&days=7',
        getSentimentSummary: 'GET /api/sentiment/:symbol/summary',
      },
      news: {
        fetchNewsFeed: 'GET /api/news/feed?limit=50',
        analyzeNewsSentiment: 'GET /api/news/sentiment/:symbol?days=7',
        getTrendingTopics: 'GET /api/news/trending?limit=10',
        getNewsImpactScore: 'GET /api/news/impact/:symbol',
      },
      advancedML: {
        engineerFeatures: 'POST /api/ml/engineer-features',
        ensemblePrediction: 'POST /api/ml/ensemble-prediction',
        calculatePriceTargets: 'POST /api/ml/price-targets',
        getModelAccuracy: 'GET /api/ml/model-accuracy/:symbol?days=30',
        trackPerformance: 'POST /api/ml/track-performance',
        getTechnicalIndicators: 'GET /api/ml/technical-indicators/:cryptoId?days=90',
      },
      backtesting: {
        runBacktest: 'POST /api/backtest/run',
        compareStrategies: 'POST /api/backtest/compare-strategies',
        optimizeStrategy: 'POST /api/backtest/optimize',
        validatePredictions: 'GET /api/backtest/validate/:symbol?days=30',
        generateReport: 'POST /api/backtest/report',
        getMetrics: 'GET /api/backtest/metrics/:cryptoId?days=90',
      },
      alerts: {
        listAlertTypes: 'GET /api/alerts/types',
        priceAlert: 'POST /api/alerts/price',
        volumeAlert: 'POST /api/alerts/volume',
      },
      portfolio: {
        optimize: 'POST /api/portfolio/optimize',
        rebalance: 'POST /api/portfolio/rebalance',
      },
      risk: {
        positionSize: 'POST /api/risk/position-size',
        stopLoss: 'POST /api/risk/stop-loss',
        exposure: 'POST /api/risk/exposure',
        stressTest: 'POST /api/risk/stress-test',
        scenarios: 'GET /api/risk/scenarios',
        hedgingRecommendation: 'POST /api/risk/hedging-recommendation',
      }
    },
    documentation: 'See README.md for detailed API documentation',
  });
});

/**
 * Error handling middleware
 */
app.use((err, _req, res, _next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date(),
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.path}`,
    availableEndpoints: 'GET /',
  });
});

/**
 * Graceful shutdown handler
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const prisma = getPrismaClient();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  const prisma = getPrismaClient();
  await prisma.$disconnect();
  process.exit(0);
});

/**
 * Start server
 */
async function startServer() {
  try {
    // Test database connection
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful');

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n╔════════════════════════════════════════════════════════════╗\n║     Crypto AI Trading Backend Server Started               ║\n╠════════════════════════════════════════════════════════════╣\n║ Server running on: http://localhost:${PORT}                    ║\n║ Health check: http://localhost:${PORT}/health                 ║\n║ API Documentation: http://localhost:${PORT}/                  ║\n║ Database: PostgreSQL (crypto_ai_db)                        ║\n║ AI Model: Xenova/distilbert-base-uncased-finetuned-sst-2  ║\n║ Advanced Features: News Scraping, ML, Backtesting          ║\n╚════════════════════════════════════════════════════════════╝\n      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;

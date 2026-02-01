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
 * - WebSocket support for real-time alerts
 * - Advanced analytics and performance metrics
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
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
const websocketRouter = require('./routes/websocket');
const analyticsRouter = require('./routes/analytics');

// Import services
const { getPrismaClient } = require('./utils/db');
const websocketService = require('./services/websocketService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for WebSocket support
const server = http.createServer(app);

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
app.use('/api/websocket', websocketRouter);
app.use('/api/analytics', analyticsRouter);

/**
 * Root endpoint - API documentation
 */
app.get('/', (_req, res) => {
  res.json({
    name: 'Crypto AI Trading Backend',
    version: '2.0.0',
    description: 'Advanced AI-powered cryptocurrency analysis with news scraping, ML, backtesting, WebSocket alerts, and analytics',
    features: [
      'Real-time cryptocurrency data from CoinGecko API',
      'AI sentiment analysis using transformer models',
      'Technical analysis and trading signal generation',
      'Advanced ML with feature engineering and ensemble predictions',
      'News scraping and sentiment analysis',
      'Backtesting engine for strategy validation',
      'WebSocket support for real-time alerts',
      'Advanced analytics and performance metrics',
      'Portfolio optimization and risk management',
      'PostgreSQL database for data persistence',
    ],
    endpoints: {
      health: 'GET /health',
      cryptocurrencies: {
        list: 'GET /api/cryptocurrencies',
        details: 'GET /api/cryptocurrencies/:id',
      },
      predictions: {
        getPrediction: 'GET /api/predictions/:symbol',
        getAccuracy: 'GET /api/predictions/accuracy/:symbol?days=30',
      },
      sentiment: {
        getSentiment: 'GET /api/sentiment/:symbol',
        analyzeSentiment: 'POST /api/sentiment/analyze',
      },
      news: {
        getFeed: 'GET /api/news/feed',
        searchNews: 'GET /api/news/search?q=bitcoin',
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
      },
      websocket: {
        status: 'GET /api/websocket/status',
        broadcastAlert: 'POST /api/websocket/broadcast-alert',
        sendPortfolioUpdate: 'POST /api/websocket/send-portfolio-update',
        getSubscriptions: 'GET /api/websocket/subscriptions/:userId',
        testConnection: 'POST /api/websocket/test-connection',
      },
      analytics: {
        performance: 'POST /api/analytics/performance',
        correlations: 'POST /api/analytics/correlations',
        valueAtRisk: 'POST /api/analytics/value-at-risk',
        tradingStatistics: 'POST /api/analytics/trading-statistics',
        performanceAttribution: 'POST /api/analytics/performance-attribution',
        dashboard: 'POST /api/analytics/dashboard',
        riskMetrics: 'POST /api/analytics/risk-metrics',
        compareStrategies: 'POST /api/analytics/compare-strategies',
      }
    },
    websocket: {
      url: 'ws://localhost:5000',
      description: 'WebSocket connection for real-time alerts and updates',
      messageTypes: [
        'subscribe - Subscribe to cryptocurrency updates',
        'unsubscribe - Unsubscribe from cryptocurrency updates',
        'alert-settings - Update alert preferences',
        'ping - Keep connection alive',
      ],
      alertTypes: [
        'price-alert - Price movement alerts',
        'sentiment-alert - Sentiment change alerts',
        'indicator-alert - Technical indicator alerts',
        'portfolio-update - Portfolio value updates',
        'news-alert - Breaking news alerts',
      ],
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

    // Initialize WebSocket server
    websocketService.initializeServer(server);
    console.log('✓ WebSocket server initialized');

    // Start listening
    server.listen(PORT, () => {
      console.log(`\n╔════════════════════════════════════════════════════════════╗\n║     Crypto AI Trading Backend Server Started               ║\n╠════════════════════════════════════════════════════════════╣\n║ Server running on: http://localhost:${PORT}                    ║\n║ Health check: http://localhost:${PORT}/health                 ║\n║ API Documentation: http://localhost:${PORT}/                  ║\n║ WebSocket: ws://localhost:${PORT}                             ║\n║ Database: PostgreSQL (crypto_ai_db)                        ║\n║ AI Model: Xenova/distilbert-base-uncased-finetuned-sst-2  ║\n║ Advanced Features: News, ML, Backtesting, WebSocket, Analytics ║\n╚════════════════════════════════════════════════════════════╝\n      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;

/**
 * WebSocket Routes
 * Endpoints for managing WebSocket connections and real-time alerts
 * 
 * Features:
 * - Real-time price alerts
 * - Live portfolio updates
 * - Instant sentiment changes
 * - Technical indicator updates
 * - User notifications
 */

const express = require('express');
const router = express.Router();
const websocketService = require('../services/websocketService');

/**
 * GET /api/websocket/status
 * Get WebSocket server status and connected clients
 */
router.get('/status', (req, res) => {
  try {
    const connectedClients = websocketService.getConnectedClientsCount();
    
    res.json({
      success: true,
      data: {
        status: 'connected',
        connectedClients,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/websocket/broadcast-alert
 * Broadcast an alert to all subscribed users
 * Body:
 *   - symbol: cryptocurrency symbol
 *   - type: alert type (price, sentiment, indicator, news)
 *   - message: alert message
 *   - data: additional alert data
 */
router.post('/broadcast-alert', (req, res) => {
  try {
    const { symbol, type, message, data } = req.body;

    if (!symbol || !type || !message) {
      return res.status(400).json({
        success: false,
        error: 'Required: symbol, type, message'
      });
    }

    // Broadcast based on alert type
    switch (type) {
      case 'price':
        websocketService.broadcastPriceAlert({
          symbol,
          price: data?.price,
          type,
          message
        });
        break;
      case 'sentiment':
        websocketService.broadcastSentimentAlert({
          symbol,
          score: data?.score,
          change: data?.change,
          trend: data?.trend
        });
        break;
      case 'indicator':
        websocketService.broadcastIndicatorAlert({
          symbol,
          indicator: data?.indicator,
          signal: data?.signal,
          value: data?.value
        });
        break;
      case 'news':
        websocketService.broadcastNewsAlert({
          symbol,
          headline: data?.headline,
          source: data?.source,
          url: data?.url
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid alert type'
        });
    }

    res.json({
      success: true,
      message: `Alert broadcasted to subscribed users`,
      connectedClients: websocketService.getConnectedClientsCount()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/websocket/send-portfolio-update
 * Send portfolio update to specific user
 * Body:
 *   - userId: user ID
 *   - value: current portfolio value
 *   - change: value change
 *   - changePercent: percentage change
 *   - holdings: array of holdings
 */
router.post('/send-portfolio-update', (req, res) => {
  try {
    const { userId, value, change, changePercent, holdings } = req.body;

    if (!userId || typeof value !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Required: userId (string), value (number)'
      });
    }

    websocketService.broadcastPortfolioUpdate(userId, {
      value,
      change,
      changePercent,
      holdings
    });

    res.json({
      success: true,
      message: 'Portfolio update sent to user'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/websocket/subscriptions/:userId
 * Get subscriptions for a specific user
 */
router.get('/subscriptions/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const subscriptions = websocketService.getUserSubscriptions(userId);

    res.json({
      success: true,
      data: {
        userId,
        subscriptions: Array.from(subscriptions),
        count: subscriptions.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/websocket/test-connection
 * Test WebSocket connection (for debugging)
 * Body:
 *   - userId: test user ID
 *   - symbol: test symbol to subscribe to
 */
router.post('/test-connection', (req, res) => {
  try {
    const { userId = 'test-user', symbol = 'bitcoin' } = req.body;

    res.json({
      success: true,
      message: 'WebSocket test endpoint',
      instructions: {
        step1: 'Connect to WebSocket at: ws://localhost:5000',
        step2: 'Send subscribe message: {"type":"subscribe","userId":"' + userId + '","symbol":"' + symbol + '"}',
        step3: 'Receive real-time alerts for ' + symbol,
        example: {
          type: 'subscribe',
          userId,
          symbol
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

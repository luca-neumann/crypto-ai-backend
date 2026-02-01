/**
 * Real-Time Alert Routes
 * 
 * Provides endpoints for managing cryptocurrency trading alerts with:
 * - 12 alert types (price, volume, technical, anomaly, etc.)
 * - 4 severity levels (critical, high, medium, low)
 * - 6 notification channels (email, SMS, webhook, push, in-app, Telegram)
 * - Alert history and management
 * 
 * @module routes/alerts
 */

const express = require('express');
const router = express.Router();
const realTimeAlertService = require('../services/realTimeAlertService');

/**
 * GET /api/alerts/types
 * 
 * Retrieve all available alert types with descriptions
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "type": "price_breakout",
 *       "description": "Alert when price breaks above/below key levels",
 *       "parameters": ["symbol", "threshold", "direction"]
 *     },
 *     ...
 *   ]
 * }
 */
router.get('/types', (req, res) => {
  try {
    const alertTypes = realTimeAlertService.getAlertTypes();
    res.json({
      success: true,
      count: alertTypes.length,
      data: alertTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/create
 * 
 * Create a new alert for a cryptocurrency
 * 
 * Request body:
 * {
 *   "symbol": "BTC",
 *   "type": "price_breakout",
 *   "threshold": 45000,
 *   "severity": "high",
 *   "channels": ["email", "webhook"],
 *   "parameters": {
 *     "direction": "above",
 *     "timeframe": "1h"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "alert_123",
 *     "symbol": "BTC",
 *     "type": "price_breakout",
 *     "status": "active",
 *     "createdAt": "2026-02-01T14:30:00Z"
 *   }
 * }
 */
router.post('/create', (req, res) => {
  try {
    const { symbol, type, threshold, severity, channels, parameters } = req.body;
    
    // Validate required fields
    if (!symbol || !type || !threshold) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, type, threshold'
      });
    }
    
    // Create alert using service
    const alert = realTimeAlertService.createAlert({
      symbol,
      type,
      threshold,
      severity: severity || 'medium',
      channels: channels || ['in-app'],
      parameters: parameters || {},
      createdAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/active
 * 
 * Retrieve all active alerts for a symbol
 * 
 * Query parameters:
 * - symbol: Cryptocurrency symbol (e.g., "BTC", "ETH")
 * - severity: Filter by severity level (optional)
 * 
 * Response:
 * {
 *   "success": true,
 *   "count": 3,
 *   "data": [
 *     {
 *       "id": "alert_123",
 *       "symbol": "BTC",
 *       "type": "price_breakout",
 *       "threshold": 45000,
 *       "severity": "high",
 *       "status": "active",
 *       "createdAt": "2026-02-01T14:30:00Z"
 *     },
 *     ...
 *   ]
 * }
 */
router.get('/active', (req, res) => {
  try {
    const { symbol, severity } = req.query;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol parameter is required'
      });
    }
    
    // Get active alerts from service
    const alerts = realTimeAlertService.getActiveAlerts(symbol, severity);
    
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/history
 * 
 * Retrieve alert history with triggered alerts
 * 
 * Query parameters:
 * - symbol: Cryptocurrency symbol (optional)
 * - limit: Number of records to return (default: 50)
 * - offset: Pagination offset (default: 0)
 * 
 * Response:
 * {
 *   "success": true,
 *   "count": 25,
 *   "total": 150,
 *   "data": [
 *     {
 *       "id": "alert_123",
 *       "symbol": "BTC",
 *       "type": "price_breakout",
 *       "triggered": true,
 *       "triggeredAt": "2026-02-01T14:35:00Z",
 *       "triggeredValue": 45100,
 *       "notificationsSent": 2
 *     },
 *     ...
 *   ]
 * }
 */
router.get('/history', (req, res) => {
  try {
    const { symbol, limit = 50, offset = 0 } = req.query;
    
    // Get alert history from service
    const history = realTimeAlertService.getAlertHistory(symbol, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      count: history.data.length,
      total: history.total,
      data: history.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/check
 * 
 * Check if current price triggers any alerts
 * 
 * Request body:
 * {
 *   "symbol": "BTC",
 *   "currentPrice": 45100,
 *   "volume": 28500000000,
 *   "volatility": 0.025
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "triggered": [
 *     {
 *       "id": "alert_123",
 *       "type": "price_breakout",
 *       "severity": "high",
 *       "message": "BTC price broke above $45,000",
 *       "notificationChannels": ["email", "webhook"]
 *     }
 *   ]
 * }
 */
router.post('/check', (req, res) => {
  try {
    const { symbol, currentPrice, volume, volatility } = req.body;
    
    if (!symbol || currentPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, currentPrice'
      });
    }
    
    // Check for triggered alerts
    const triggered = realTimeAlertService.checkAlerts({
      symbol,
      currentPrice,
      volume: volume || 0,
      volatility: volatility || 0
    });
    
    res.json({
      success: true,
      triggered: triggered,
      count: triggered.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/notify
 * 
 * Send notification for triggered alert
 * 
 * Request body:
 * {
 *   "alertId": "alert_123",
 *   "channels": ["email", "webhook"],
 *   "message": "BTC price broke above $45,000",
 *   "metadata": {
 *     "symbol": "BTC",
 *     "currentPrice": 45100,
 *     "threshold": 45000
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "notificationsSent": 2,
 *   "channels": {
 *     "email": { "success": true, "timestamp": "2026-02-01T14:35:00Z" },
 *     "webhook": { "success": true, "timestamp": "2026-02-01T14:35:00Z" }
 *   }
 * }
 */
router.post('/notify', (req, res) => {
  try {
    const { alertId, channels, message, metadata } = req.body;
    
    if (!alertId || !channels || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: alertId, channels, message'
      });
    }
    
    // Send notifications through service
    const results = realTimeAlertService.sendNotifications({
      alertId,
      channels,
      message,
      metadata: metadata || {}
    });
    
    res.json({
      success: true,
      notificationsSent: Object.values(results).filter(r => r.success).length,
      channels: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/alerts/:alertId
 * 
 * Delete/deactivate an alert
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Alert deleted successfully",
 *   "alertId": "alert_123"
 * }
 */
router.delete('/:alertId', (req, res) => {
  try {
    const { alertId } = req.params;
    
    // Delete alert from service
    const result = realTimeAlertService.deleteAlert(alertId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Alert deleted successfully',
      alertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/stats
 * 
 * Get alert statistics and metrics
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalAlerts": 150,
 *     "activeAlerts": 45,
 *     "triggeredToday": 12,
 *     "byType": {
 *       "price_breakout": 35,
 *       "rsi_extreme": 28,
 *       "volume_spike": 22,
 *       ...
 *     },
 *     "bySeverity": {
 *       "critical": 5,
 *       "high": 15,
 *       "medium": 20,
 *       "low": 5
 *     }
 *   }
 * }
 */
router.get('/stats', (req, res) => {
  try {
    const stats = realTimeAlertService.getAlertStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

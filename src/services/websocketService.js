/**
 * WebSocket Service
 * Manages real-time WebSocket connections for live alerts and data streaming
 * 
 * Features:
 * - Real-time price alerts
 * - Live portfolio updates
 * - Instant sentiment changes
 * - Technical indicator updates
 * - User notifications
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // Map of userId -> WebSocket connection
    this.subscriptions = new Map(); // Map of userId -> Set of subscribed symbols
    this.alertQueue = []; // Queue of pending alerts
    this.isProcessing = false;
  }

  /**
   * Initialize WebSocket server
   * @param {http.Server} server - HTTP server instance
   */
  initializeServer(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');
      
      // Handle incoming messages
      ws.on('message', (data) => this.handleMessage(ws, data));
      
      // Handle client disconnect
      ws.on('close', () => this.handleDisconnect(ws));
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Handle incoming WebSocket messages
   * Supports: subscribe, unsubscribe, alert-settings
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} data - Message data (JSON)
   */
  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      const { type, userId, symbol, settings } = message;

      switch (type) {
        case 'subscribe':
          this.subscribe(ws, userId, symbol);
          break;
        case 'unsubscribe':
          this.unsubscribe(userId, symbol);
          break;
        case 'alert-settings':
          this.updateAlertSettings(userId, settings);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          console.warn('Unknown message type:', type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  }

  /**
   * Subscribe user to real-time updates for a cryptocurrency
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} userId - User ID
   * @param {string} symbol - Cryptocurrency symbol (e.g., 'bitcoin')
   */
  subscribe(ws, userId, symbol) {
    // Store client connection
    this.clients.set(userId, ws);

    // Initialize subscriptions for user if not exists
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, new Set());
    }

    // Add symbol to subscriptions
    this.subscriptions.get(userId).add(symbol);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'subscribed',
      symbol,
      message: `Subscribed to ${symbol} updates`
    }));

    console.log(`User ${userId} subscribed to ${symbol}`);
  }

  /**
   * Unsubscribe user from cryptocurrency updates
   * @param {string} userId - User ID
   * @param {string} symbol - Cryptocurrency symbol
   */
  unsubscribe(userId, symbol) {
    if (this.subscriptions.has(userId)) {
      this.subscriptions.get(userId).delete(symbol);
    }
    console.log(`User ${userId} unsubscribed from ${symbol}`);
  }

  /**
   * Handle client disconnect
   * Clean up subscriptions and connections
   * @param {WebSocket} ws - WebSocket connection
   */
  handleDisconnect(ws) {
    // Find and remove user from clients
    for (const [userId, client] of this.clients.entries()) {
      if (client === ws) {
        this.clients.delete(userId);
        this.subscriptions.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  /**
   * Broadcast price alert to subscribed users
   * Real-time notification when price reaches target
   * @param {Object} alert - Alert object with symbol, price, type
   */
  broadcastPriceAlert(alert) {
    const { symbol, price, type, message } = alert;

    // Send to all users subscribed to this symbol
    for (const [userId, subscriptions] of this.subscriptions.entries()) {
      if (subscriptions.has(symbol)) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'price-alert',
            symbol,
            price,
            alertType: type,
            message,
            timestamp: new Date().toISOString()
          }));
        }
      }
    }
  }

  /**
   * Broadcast sentiment change alert
   * Notify when sentiment score changes significantly
   * @param {Object} sentimentData - Sentiment data with symbol, score, change
   */
  broadcastSentimentAlert(sentimentData) {
    const { symbol, score, change, trend } = sentimentData;

    for (const [userId, subscriptions] of this.subscriptions.entries()) {
      if (subscriptions.has(symbol)) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'sentiment-alert',
            symbol,
            score,
            change,
            trend,
            message: `Sentiment for ${symbol} changed to ${trend}`,
            timestamp: new Date().toISOString()
          }));
        }
      }
    }
  }

  /**
   * Broadcast technical indicator alert
   * Notify when technical indicators trigger (RSI, MACD, etc.)
   * @param {Object} indicatorData - Indicator data with symbol, indicator, signal
   */
  broadcastIndicatorAlert(indicatorData) {
    const { symbol, indicator, signal, value } = indicatorData;

    for (const [userId, subscriptions] of this.subscriptions.entries()) {
      if (subscriptions.has(symbol)) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'indicator-alert',
            symbol,
            indicator,
            signal,
            value,
            message: `${indicator} signal: ${signal} for ${symbol}`,
            timestamp: new Date().toISOString()
          }));
        }
      }
    }
  }

  /**
   * Broadcast portfolio update
   * Send real-time portfolio value changes to user
   * @param {string} userId - User ID
   * @param {Object} portfolioData - Portfolio data with value, change, holdings
   */
  broadcastPortfolioUpdate(userId, portfolioData) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'portfolio-update',
        ...portfolioData,
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Broadcast market news alert
   * Send breaking news to subscribed users
   * @param {Object} newsData - News data with symbol, headline, source
   */
  broadcastNewsAlert(newsData) {
    const { symbol, headline, source, url } = newsData;

    for (const [userId, subscriptions] of this.subscriptions.entries()) {
      if (subscriptions.has(symbol)) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'news-alert',
            symbol,
            headline,
            source,
            url,
            timestamp: new Date().toISOString()
          }));
        }
      }
    }
  }

  /**
   * Update user alert settings
   * Store user preferences for alert types and thresholds
   * @param {string} userId - User ID
   * @param {Object} settings - Alert settings (thresholds, types, etc.)
   */
  updateAlertSettings(userId, settings) {
    // Store settings in memory (in production, save to database)
    if (!this.alertSettings) {
      this.alertSettings = new Map();
    }
    this.alertSettings.set(userId, settings);
    console.log(`Alert settings updated for user ${userId}`);
  }

  /**
   * Get number of connected clients
   * @returns {number} Number of active WebSocket connections
   */
  getConnectedClientsCount() {
    return this.clients.size;
  }

  /**
   * Get subscriptions for a user
   * @param {string} userId - User ID
   * @returns {Set} Set of subscribed symbols
   */
  getUserSubscriptions(userId) {
    return this.subscriptions.get(userId) || new Set();
  }
}

// Export singleton instance
module.exports = new WebSocketService();

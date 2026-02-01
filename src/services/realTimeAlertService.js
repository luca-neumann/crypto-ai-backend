/**
 * Real-Time Alert & Notification Service
 * 
 * Provides intelligent alerting system for:
 * - Price breakouts and support/resistance levels
 * - Technical indicator signals (RSI, MACD, Bollinger Bands)
 * - Sentiment shifts and news-based alerts
 * - Portfolio risk warnings
 * - Anomaly detection in trading patterns
 * - Custom user-defined alerts
 */

class RealTimeAlertService {
  constructor() {
    // Alert configuration
    this.alerts = new Map();
    this.alertHistory = [];
    this.maxHistorySize = 1000;
    
    // Alert severity levels
    this.severityLevels = {
      CRITICAL: 'critical',    // Immediate action required
      HIGH: 'high',            // Important signal
      MEDIUM: 'medium',        // Notable change
      LOW: 'low'               // Informational
    };

    // Alert types
    this.alertTypes = {
      PRICE_BREAKOUT: 'price_breakout',
      SUPPORT_RESISTANCE: 'support_resistance',
      RSI_EXTREME: 'rsi_extreme',
      MACD_CROSSOVER: 'macd_crossover',
      BOLLINGER_BAND: 'bollinger_band',
      SENTIMENT_SHIFT: 'sentiment_shift',
      NEWS_ALERT: 'news_alert',
      VOLUME_SPIKE: 'volume_spike',
      VOLATILITY_CHANGE: 'volatility_change',
      PORTFOLIO_RISK: 'portfolio_risk',
      ANOMALY_DETECTED: 'anomaly_detected',
      CUSTOM_ALERT: 'custom_alert'
    };
  }

  /**
   * Create and register a new alert
   * 
   * @param {Object} alertConfig - Alert configuration
   * @returns {Object} Created alert with ID
   */
  createAlert(alertConfig) {
    const {
      cryptoId,
      type,
      condition,
      threshold,
      severity = this.severityLevels.MEDIUM,
      notificationChannels = ['email', 'webhook'],
      userId,
      description
    } = alertConfig;

    // Validate alert configuration
    if (!cryptoId || !type || !condition) {
      return {
        success: false,
        error: 'Missing required alert parameters'
      };
    }

    // Generate unique alert ID
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create alert object
    const alert = {
      id: alertId,
      cryptoId,
      type,
      condition,
      threshold,
      severity,
      notificationChannels,
      userId,
      description,
      createdAt: new Date().toISOString(),
      isActive: true,
      triggerCount: 0,
      lastTriggered: null,
      nextCheckTime: Date.now()
    };

    // Store alert
    this.alerts.set(alertId, alert);

    return {
      success: true,
      alertId,
      alert
    };
  }

  /**
   * Check all active alerts against current market data
   * 
   * @param {Object} marketData - Current market data
   * @returns {Array} Triggered alerts
   */
  checkAlerts(marketData) {
    const triggeredAlerts = [];

    // Iterate through all active alerts
    for (const [alertId, alert] of this.alerts) {
      if (!alert.isActive) continue;

      // Check if alert should be evaluated
      if (Date.now() < alert.nextCheckTime) continue;

      // Evaluate alert condition
      const triggered = this.evaluateAlertCondition(alert, marketData);

      if (triggered) {
        // Update alert metadata
        alert.triggerCount++;
        alert.lastTriggered = new Date().toISOString();
        alert.nextCheckTime = Date.now() + this.getCheckInterval(alert.severity);

        // Create alert notification
        const notification = this.createAlertNotification(alert, marketData);
        triggeredAlerts.push(notification);

        // Add to history
        this.addToHistory(notification);

        // Send notifications
        this.sendNotifications(alert, notification);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Evaluate alert condition against market data
   * 
   * @param {Object} alert - Alert configuration
   * @param {Object} marketData - Current market data
   * @returns {boolean} Whether alert condition is met
   */
  evaluateAlertCondition(alert, marketData) {
    const { type, condition, threshold, cryptoId } = alert;
    const data = marketData[cryptoId];

    if (!data) return false;

    switch (type) {
      case this.alertTypes.PRICE_BREAKOUT:
        return this.checkPriceBreakout(data, condition, threshold);

      case this.alertTypes.SUPPORT_RESISTANCE:
        return this.checkSupportResistance(data, condition, threshold);

      case this.alertTypes.RSI_EXTREME:
        return this.checkRSIExtreme(data, threshold);

      case this.alertTypes.MACD_CROSSOVER:
        return this.checkMACDCrossover(data);

      case this.alertTypes.BOLLINGER_BAND:
        return this.checkBollingerBand(data, condition);

      case this.alertTypes.SENTIMENT_SHIFT:
        return this.checkSentimentShift(data, threshold);

      case this.alertTypes.VOLUME_SPIKE:
        return this.checkVolumeSpike(data, threshold);

      case this.alertTypes.VOLATILITY_CHANGE:
        return this.checkVolatilityChange(data, threshold);

      case this.alertTypes.PORTFOLIO_RISK:
        return this.checkPortfolioRisk(data, threshold);

      case this.alertTypes.ANOMALY_DETECTED:
        return this.checkAnomaly(data);

      default:
        return false;
    }
  }

  /**
   * Check for price breakout
   */
  checkPriceBreakout(data, condition, threshold) {
    const { currentPrice, previousPrice } = data;
    const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;

    if (condition === 'above') {
      return percentChange > threshold;
    } else if (condition === 'below') {
      return percentChange < -threshold;
    }

    return false;
  }

  /**
   * Check for support/resistance level breach
   */
  checkSupportResistance(data, condition, threshold) {
    const { currentPrice, support, resistance } = data;

    if (condition === 'support_break') {
      return currentPrice < support * (1 - threshold / 100);
    } else if (condition === 'resistance_break') {
      return currentPrice > resistance * (1 + threshold / 100);
    }

    return false;
  }

  /**
   * Check for RSI extreme values
   */
  checkRSIExtreme(data, threshold = 30) {
    const { rsi } = data;

    return rsi > (100 - threshold) || rsi < threshold;
  }

  /**
   * Check for MACD crossover
   */
  checkMACDCrossover(data) {
    const { macd, previousMACD } = data;

    if (!previousMACD) return false;

    // Bullish crossover: MACD crosses above signal line
    const bullishCrossover = previousMACD.histogram < 0 && macd.histogram > 0;

    // Bearish crossover: MACD crosses below signal line
    const bearishCrossover = previousMACD.histogram > 0 && macd.histogram < 0;

    return bullishCrossover || bearishCrossover;
  }

  /**
   * Check for Bollinger Band touch
   */
  checkBollingerBand(data, condition) {
    const { bollingerBands, currentPrice } = data;

    if (condition === 'upper_band') {
      return currentPrice > bollingerBands.upper * 0.99;
    } else if (condition === 'lower_band') {
      return currentPrice < bollingerBands.lower * 1.01;
    }

    return false;
  }

  /**
   * Check for sentiment shift
   */
  checkSentimentShift(data, threshold = 0.3) {
    const { sentiment, previousSentiment } = data;

    if (!previousSentiment) return false;

    const sentimentChange = Math.abs(sentiment - previousSentiment);

    return sentimentChange > threshold;
  }

  /**
   * Check for volume spike
   */
  checkVolumeSpike(data, threshold = 1.5) {
    const { volume, averageVolume } = data;

    return volume > averageVolume * threshold;
  }

  /**
   * Check for volatility change
   */
  checkVolatilityChange(data, threshold = 50) {
    const { volatility, previousVolatility } = data;

    if (!previousVolatility) return false;

    const volatilityChange = ((volatility - previousVolatility) / previousVolatility) * 100;

    return Math.abs(volatilityChange) > threshold;
  }

  /**
   * Check for portfolio risk
   */
  checkPortfolioRisk(data, threshold = 0.8) {
    const { portfolioRisk } = data;

    return portfolioRisk > threshold;
  }

  /**
   * Check for anomalies using statistical methods
   */
  checkAnomaly(data) {
    const { currentPrice, priceHistory } = data;

    if (!priceHistory || priceHistory.length < 20) return false;

    // Calculate mean and standard deviation
    const mean = priceHistory.reduce((a, b) => a + b) / priceHistory.length;
    const variance = priceHistory.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / priceHistory.length;
    const stdDev = Math.sqrt(variance);

    // Flag as anomaly if price is more than 3 standard deviations from mean
    const zScore = Math.abs((currentPrice - mean) / stdDev);

    return zScore > 3;
  }

  /**
   * Create alert notification object
   */
  createAlertNotification(alert, marketData) {
    const data = marketData[alert.cryptoId];

    return {
      alertId: alert.id,
      cryptoId: alert.cryptoId,
      type: alert.type,
      severity: alert.severity,
      description: alert.description,
      message: this.generateAlertMessage(alert, data),
      marketData: {
        currentPrice: data.currentPrice,
        priceChange: data.priceChange,
        rsi: data.rsi,
        volume: data.volume
      },
      timestamp: new Date().toISOString(),
      actionRequired: alert.severity === this.severityLevels.CRITICAL,
      recommendedAction: this.getRecommendedAction(alert, data)
    };
  }

  /**
   * Generate human-readable alert message
   */
  generateAlertMessage(alert, data) {
    const { type, cryptoId, threshold } = alert;

    switch (type) {
      case this.alertTypes.PRICE_BREAKOUT:
        return `${cryptoId.toUpperCase()} price moved ${threshold}% from previous level`;

      case this.alertTypes.RSI_EXTREME:
        return `${cryptoId.toUpperCase()} RSI at extreme level: ${data.rsi.toFixed(2)}`;

      case this.alertTypes.MACD_CROSSOVER:
        return `${cryptoId.toUpperCase()} MACD crossover detected`;

      case this.alertTypes.VOLUME_SPIKE:
        return `${cryptoId.toUpperCase()} volume spike detected: ${(data.volume / data.averageVolume).toFixed(2)}x average`;

      case this.alertTypes.SENTIMENT_SHIFT:
        return `${cryptoId.toUpperCase()} sentiment shifted significantly`;

      case this.alertTypes.ANOMALY_DETECTED:
        return `${cryptoId.toUpperCase()} unusual price movement detected`;

      default:
        return `Alert triggered for ${cryptoId.toUpperCase()}`;
    }
  }

  /**
   * Get recommended action based on alert
   */
  getRecommendedAction(alert, data) {
    const { type, severity } = alert;

    if (severity === this.severityLevels.CRITICAL) {
      return 'IMMEDIATE ACTION REQUIRED: Review position and consider risk management';
    }

    switch (type) {
      case this.alertTypes.RSI_EXTREME:
        if (data.rsi > 70) {
          return 'Consider taking profits or reducing position size';
        } else if (data.rsi < 30) {
          return 'Consider accumulating or increasing position size';
        }
        break;

      case this.alertTypes.MACD_CROSSOVER:
        if (data.macd.histogram > 0) {
          return 'Bullish signal: Consider entering or adding to position';
        } else {
          return 'Bearish signal: Consider reducing or exiting position';
        }
        break;

      case this.alertTypes.VOLUME_SPIKE:
        return 'High volume detected: Confirm with other indicators before trading';
        break;

      case this.alertTypes.SENTIMENT_SHIFT:
        return 'Sentiment changed: Review news and market conditions';
        break;
    }

    return 'Review market conditions and confirm with other indicators';
  }

  /**
   * Send notifications through configured channels
   */
  sendNotifications(alert, notification) {
    const { notificationChannels, userId } = alert;

    for (const channel of notificationChannels) {
      switch (channel) {
        case 'email':
          this.sendEmailNotification(userId, notification);
          break;

        case 'webhook':
          this.sendWebhookNotification(alert.webhookUrl, notification);
          break;

        case 'sms':
          this.sendSMSNotification(userId, notification);
          break;

        case 'push':
          this.sendPushNotification(userId, notification);
          break;

        case 'telegram':
          this.sendTelegramNotification(userId, notification);
          break;

        case 'discord':
          this.sendDiscordNotification(alert.discordWebhook, notification);
          break;
      }
    }
  }

  /**
   * Send email notification
   */
  sendEmailNotification(userId, notification) {
    // Implementation would integrate with email service (SendGrid, Resend, etc.)
    console.log(`[EMAIL] Sending alert to user ${userId}:`, notification.message);
  }

  /**
   * Send webhook notification
   */
  sendWebhookNotification(webhookUrl, notification) {
    // Implementation would make HTTP POST to webhook URL
    console.log(`[WEBHOOK] Sending alert to ${webhookUrl}:`, notification);
  }

  /**
   * Send SMS notification
   */
  sendSMSNotification(userId, notification) {
    // Implementation would integrate with SMS service (Twilio, etc.)
    console.log(`[SMS] Sending alert to user ${userId}:`, notification.message);
  }

  /**
   * Send push notification
   */
  sendPushNotification(userId, notification) {
    // Implementation would integrate with push notification service
    console.log(`[PUSH] Sending alert to user ${userId}:`, notification.message);
  }

  /**
   * Send Telegram notification
   */
  sendTelegramNotification(userId, notification) {
    // Implementation would integrate with Telegram Bot API
    console.log(`[TELEGRAM] Sending alert to user ${userId}:`, notification.message);
  }

  /**
   * Send Discord notification
   */
  sendDiscordNotification(webhookUrl, notification) {
    // Implementation would make HTTP POST to Discord webhook
    console.log(`[DISCORD] Sending alert to ${webhookUrl}:`, notification);
  }

  /**
   * Get check interval based on severity
   */
  getCheckInterval(severity) {
    switch (severity) {
      case this.severityLevels.CRITICAL:
        return 30 * 1000;      // 30 seconds
      case this.severityLevels.HIGH:
        return 60 * 1000;      // 1 minute
      case this.severityLevels.MEDIUM:
        return 5 * 60 * 1000;  // 5 minutes
      case this.severityLevels.LOW:
        return 15 * 60 * 1000; // 15 minutes
      default:
        return 5 * 60 * 1000;
    }
  }

  /**
   * Add notification to history
   */
  addToHistory(notification) {
    this.alertHistory.push(notification);

    // Keep history size manageable
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }
  }

  /**
   * Get supported alert types
   *
   * This is used by the API route GET /api/alerts/types.
   * The route expects a list of type descriptors.
   */
  getAlertTypes() {
    // Map internal enum-like values into API-friendly descriptors.
    // Note: The service itself primarily uses `alert.type` to switch
    // behavior in evaluateAlertCondition().
    return [
      {
        type: this.alertTypes.PRICE_BREAKOUT,
        description: "Alert when price breaks above/below a configured threshold",
        parameters: ["cryptoId", "condition", "threshold", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.SUPPORT_RESISTANCE,
        description: "Alert when price breaks support or resistance levels",
        parameters: ["cryptoId", "condition", "threshold", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.RSI_EXTREME,
        description: "Alert when RSI reaches overbought/oversold extremes",
        parameters: ["cryptoId", "threshold", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.MACD_CROSSOVER,
        description: "Alert when MACD crosses over its signal line",
        parameters: ["cryptoId", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.BOLLINGER_BAND,
        description: "Alert when price touches/exceeds Bollinger bands",
        parameters: ["cryptoId", "condition", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.SENTIMENT_SHIFT,
        description: "Alert when sentiment shifts beyond a threshold",
        parameters: ["cryptoId", "threshold", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.NEWS_ALERT,
        description: "Alert for high-impact news events (if integrated)",
        parameters: ["cryptoId", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.VOLUME_SPIKE,
        description: "Alert when trading volume spikes beyond a threshold",
        parameters: ["cryptoId", "threshold", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.VOLATILITY_CHANGE,
        description: "Alert when volatility changes abruptly beyond a threshold",
        parameters: ["cryptoId", "threshold", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.PORTFOLIO_RISK,
        description: "Alert when portfolio risk exceeds a threshold (if integrated)",
        parameters: ["threshold", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.ANOMALY_DETECTED,
        description: "Alert when anomalous market behavior is detected",
        parameters: ["cryptoId", "severity", "notificationChannels"]
      },
      {
        type: this.alertTypes.CUSTOM_ALERT,
        description: "User-defined alert with custom logic (placeholder)",
        parameters: ["cryptoId", "description", "severity", "notificationChannels"]
      }
    ];
  }

  /**
   * Get alert history
   */
  getAlertHistory(filters = {}) {
    let history = [...this.alertHistory];

    if (filters.cryptoId) {
      history = history.filter(a => a.cryptoId === filters.cryptoId);
    }

    if (filters.type) {
      history = history.filter(a => a.type === filters.type);
    }

    if (filters.severity) {
      history = history.filter(a => a.severity === filters.severity);
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * Update alert configuration
   */
  updateAlert(alertId, updates) {
    const alert = this.alerts.get(alertId);

    if (!alert) {
      return { success: false, error: 'Alert not found' };
    }

    // Update allowed fields
    const allowedFields = ['condition', 'threshold', 'severity', 'notificationChannels', 'description'];

    for (const field of allowedFields) {
      if (field in updates) {
        alert[field] = updates[field];
      }
    }

    return { success: true, alert };
  }

  /**
   * Delete alert
   */
  deleteAlert(alertId) {
    const deleted = this.alerts.delete(alertId);

    return {
      success: deleted,
      message: deleted ? 'Alert deleted' : 'Alert not found'
    };
  }

  /**
   * Get all alerts for user
   */
  getUserAlerts(userId) {
    const userAlerts = [];

    for (const [alertId, alert] of this.alerts) {
      if (alert.userId === userId) {
        userAlerts.push(alert);
      }
    }

    return userAlerts;
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics() {
    const stats = {
      totalAlerts: this.alerts.size,
      activeAlerts: 0,
      alertsByType: {},
      alertsBySeverity: {},
      totalTriggered: 0,
      recentAlerts: this.alertHistory.slice(-10)
    };

    for (const [, alert] of this.alerts) {
      if (alert.isActive) stats.activeAlerts++;
      stats.totalTriggered += alert.triggerCount;

      // Count by type
      stats.alertsByType[alert.type] = (stats.alertsByType[alert.type] || 0) + 1;

      // Count by severity
      stats.alertsBySeverity[alert.severity] = (stats.alertsBySeverity[alert.severity] || 0) + 1;
    }

    return stats;
  }
}

module.exports = new RealTimeAlertService();

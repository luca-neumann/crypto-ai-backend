# Advanced Features Guide

## Overview

This document provides detailed information about the three advanced features added to the Crypto AI Trading Backend:
1. News Scraping
2. Advanced Machine Learning
3. Backtesting Engine

---

## 1. News Scraping Service

### Overview
The News Scraping Service fetches and analyzes cryptocurrency news from multiple sources in real-time.

### Features
- **Multi-source RSS parsing**: CoinDesk, Cointelegraph, The Block
- **Sentiment analysis**: Determines if news is positive, negative, or neutral
- **Trending topics**: Identifies what's trending in crypto
- **Impact scoring**: Scores how much news impacts prices
- **Crypto mention extraction**: Finds which cryptocurrencies are mentioned

### API Endpoints

#### 1. Fetch News Feed
```
GET /api/news/feed?limit=50
```

**Parameters**:
- `limit` (optional): Number of articles to fetch (default: 50)

**Response**:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "title": "Bitcoin reaches new ATH",
      "description": "Bitcoin surpasses previous record...",
      "url": "https://...",
      "source": "CoinDesk",
      "publishedAt": "2026-02-01T10:00:00Z",
      "sentiment": "positive",
      "cryptoMentions": ["bitcoin", "ethereum"]
    }
  ]
}
```

#### 2. Analyze News Sentiment
```
GET /api/news/sentiment/:symbol?days=7
```

**Parameters**:
- `symbol`: Cryptocurrency symbol (e.g., BTC, ETH)
- `days` (optional): Number of days to analyze (default: 7)

**Response**:
```json
{
  "success": true,
  "symbol": "BTC",
  "sentiment": {
    "positive": 0.65,
    "negative": 0.15,
    "neutral": 0.20
  },
  "overallSentiment": "positive",
  "articlesAnalyzed": 25,
  "averageSentimentScore": 0.72
}
```

#### 3. Get Trending Topics
```
GET /api/news/trending?limit=10
```

**Parameters**:
- `limit` (optional): Number of trending topics (default: 10)

**Response**:
```json
{
  "success": true,
  "trendingTopics": [
    {
      "topic": "Bitcoin ETF",
      "mentions": 45,
      "sentiment": "positive",
      "trend": "up"
    },
    {
      "topic": "Ethereum Upgrade",
      "mentions": 32,
      "sentiment": "neutral",
      "trend": "stable"
    }
  ]
}
```

#### 4. Get News Impact Score
```
GET /api/news/impact/:symbol
```

**Parameters**:
- `symbol`: Cryptocurrency symbol (e.g., BTC, ETH)

**Response**:
```json
{
  "success": true,
  "symbol": "BTC",
  "impactScore": 0.78,
  "recentNews": 12,
  "sentimentTrend": "improving",
  "volatilityExpected": "high"
}
```

### Usage Example

```javascript
// Fetch latest news
const response = await fetch('/api/news/feed?limit=10');
const news = await response.json();

// Analyze sentiment for Bitcoin
const sentiment = await fetch('/api/news/sentiment/BTC?days=7');
const btcSentiment = await sentiment.json();

// Get trending topics
const trending = await fetch('/api/news/trending?limit=5');
const trendingData = await trending.json();
```

---

## 2. Advanced Machine Learning Service

### Overview
The Advanced ML Service provides sophisticated machine learning predictions with feature engineering and ensemble models.

### Features
- **20+ Technical Indicators**: SMA, EMA, MACD, RSI, Bollinger Bands, ATR, OBV, etc.
- **Ensemble Predictions**: Combines multiple models for better accuracy
- **Price Targets**: Calculates realistic price targets with confidence levels
- **Model Performance Tracking**: Monitors accuracy over time
- **Feature Engineering**: Automatically computes technical features

### Technical Indicators

The service computes the following indicators:

**Trend Indicators**:
- SMA (Simple Moving Average)
- EMA (Exponential Moving Average)
- MACD (Moving Average Convergence Divergence)
- Trend Direction

**Momentum Indicators**:
- RSI (Relative Strength Index)
- Stochastic Oscillator
- Rate of Change (ROC)

**Volatility Indicators**:
- Bollinger Bands
- ATR (Average True Range)
- Standard Deviation

**Volume Indicators**:
- OBV (On-Balance Volume)
- Volume Moving Average
- Volume Trend

**Other Indicators**:
- ADX (Average Directional Index)
- CCI (Commodity Channel Index)
- Williams %R
- Ichimoku Cloud

### API Endpoints

#### 1. Engineer Features
```
POST /api/ml/engineer-features
```

**Request Body**:
```json
{
  "cryptoId": "bitcoin",
  "days": 90
}
```

**Response**:
```json
{
  "success": true,
  "cryptoId": "bitcoin",
  "features": {
    "sma_20": 45000,
    "ema_12": 45200,
    "rsi": 65,
    "macd": 250,
    "bollinger_upper": 46000,
    "bollinger_lower": 44000,
    "atr": 500,
    "obv": 1500000000
  },
  "timestamp": "2026-02-01T10:00:00Z"
}
```

#### 2. Ensemble Prediction
```
POST /api/ml/ensemble-prediction
```

**Request Body**:
```json
{
  "cryptoId": "bitcoin"
}
```

**Response**:
```json
{
  "success": true,
  "cryptoId": "bitcoin",
  "prediction": {
    "nextPrice": 45500,
    "confidence": 0.85,
    "direction": "up",
    "probability": 0.78
  },
  "models": {
    "lstm": { "prediction": 45600, "confidence": 0.82 },
    "random_forest": { "prediction": 45400, "confidence": 0.87 },
    "gradient_boost": { "prediction": 45500, "confidence": 0.85 }
  }
}
```

#### 3. Calculate Price Targets
```
POST /api/ml/price-targets
```

**Request Body**:
```json
{
  "cryptoId": "bitcoin",
  "currentPrice": 45000
}
```

**Response**:
```json
{
  "success": true,
  "cryptoId": "bitcoin",
  "currentPrice": 45000,
  "targets": {
    "shortTerm": {
      "target": 46000,
      "timeframe": "1-2 weeks",
      "confidence": 0.75
    },
    "mediumTerm": {
      "target": 48000,
      "timeframe": "1-3 months",
      "confidence": 0.70
    },
    "longTerm": {
      "target": 52000,
      "timeframe": "3-6 months",
      "confidence": 0.65
    }
  },
  "stopLoss": 42000,
  "riskRewardRatio": 2.5
}
```

#### 4. Get Model Accuracy
```
GET /api/ml/model-accuracy/:symbol?days=30
```

**Parameters**:
- `symbol`: Cryptocurrency symbol (e.g., BTC, ETH)
- `days` (optional): Number of days to analyze (default: 30)

**Response**:
```json
{
  "success": true,
  "symbol": "BTC",
  "accuracy": {
    "overall": 0.72,
    "lstm": 0.70,
    "random_forest": 0.75,
    "gradient_boost": 0.71
  },
  "predictions_made": 30,
  "correct_predictions": 22,
  "period": "30 days"
}
```

#### 5. Track Performance
```
POST /api/ml/track-performance
```

**Request Body**:
```json
{
  "symbol": "BTC",
  "prediction": 45500,
  "actual": 45600,
  "confidence": 0.85
}
```

**Response**:
```json
{
  "success": true,
  "recorded": true,
  "accuracy": 0.998,
  "message": "Performance tracked successfully"
}
```

#### 6. Get Technical Indicators
```
GET /api/ml/technical-indicators/:cryptoId?days=90
```

**Parameters**:
- `cryptoId`: Cryptocurrency ID (e.g., bitcoin)
- `days` (optional): Number of days (default: 90)

**Response**:
```json
{
  "success": true,
  "cryptoId": "bitcoin",
  "indicators": {
    "trend": "uptrend",
    "momentum": "strong",
    "volatility": "moderate",
    "volume": "high",
    "signals": {
      "buy": 3,
      "sell": 1,
      "hold": 2
    }
  }
}
```

### Usage Example

```javascript
// Engineer features
const features = await fetch('/api/ml/engineer-features', {
  method: 'POST',
  body: JSON.stringify({ cryptoId: 'bitcoin', days: 90 })
});

// Get ensemble prediction
const prediction = await fetch('/api/ml/ensemble-prediction', {
  method: 'POST',
  body: JSON.stringify({ cryptoId: 'bitcoin' })
});

// Calculate price targets
const targets = await fetch('/api/ml/price-targets', {
  method: 'POST',
  body: JSON.stringify({ cryptoId: 'bitcoin', currentPrice: 45000 })
});

// Get technical indicators
const indicators = await fetch('/api/ml/technical-indicators/bitcoin?days=90');
```

---

## 3. Backtesting Engine

### Overview
The Backtesting Engine allows you to test trading strategies on historical data to validate their effectiveness.

### Features
- **Portfolio Simulation**: Simulates trading on historical data
- **Strategy Comparison**: Compares multiple strategies side-by-side
- **Parameter Optimization**: Finds optimal strategy parameters
- **Prediction Validation**: Validates prediction accuracy
- **Performance Metrics**: Comprehensive metrics (Sharpe ratio, drawdown, etc.)

### Performance Metrics

The backtesting engine calculates:

**Return Metrics**:
- Total Return: Overall profit/loss percentage
- Annual Return: Annualized return
- Monthly Return: Average monthly return

**Risk Metrics**:
- Sharpe Ratio: Risk-adjusted return
- Max Drawdown: Largest peak-to-trough decline
- Volatility: Standard deviation of returns
- Sortino Ratio: Return per unit of downside risk

**Trade Metrics**:
- Win Rate: Percentage of winning trades
- Profit Factor: Gross profit / Gross loss
- Average Win: Average profit per winning trade
- Average Loss: Average loss per losing trade
- Consecutive Wins/Losses: Longest winning/losing streak

### API Endpoints

#### 1. Run Backtest
```
POST /api/backtest/run
```

**Request Body**:
```json
{
  "cryptoId": "bitcoin",
  "days": 90,
  "initialCapital": 10000
}
```

**Response**:
```json
{
  "success": true,
  "cryptoId": "bitcoin",
  "metrics": {
    "totalReturn": 0.25,
    "sharpeRatio": 1.8,
    "maxDrawdown": -0.12,
    "winRate": 0.65,
    "profitFactor": 2.1,
    "trades": 45
  },
  "finalEquity": 12500,
  "trades": [
    {
      "entryPrice": 44000,
      "exitPrice": 45000,
      "profit": 1000,
      "return": 0.0227
    }
  ]
}
```

#### 2. Compare Strategies
```
POST /api/backtest/compare-strategies
```

**Request Body**:
```json
{
  "cryptoId": "bitcoin",
  "days": 90
}
```

**Response**:
```json
{
  "success": true,
  "cryptoId": "bitcoin",
  "strategies": [
    {
      "name": "Moving Average Crossover",
      "totalReturn": 0.25,
      "sharpeRatio": 1.8,
      "maxDrawdown": -0.12,
      "winRate": 0.65
    },
    {
      "name": "RSI Oversold",
      "totalReturn": 0.18,
      "sharpeRatio": 1.5,
      "maxDrawdown": -0.15,
      "winRate": 0.60
    }
  ]
}
```

#### 3. Optimize Strategy
```
POST /api/backtest/optimize
```

**Request Body**:
```json
{
  "cryptoId": "bitcoin",
  "days": 90
}
```

**Response**:
```json
{
  "success": true,
  "cryptoId": "bitcoin",
  "optimalParameters": {
    "sma_short": 12,
    "sma_long": 26,
    "rsi_threshold": 30
  },
  "performance": {
    "totalReturn": 0.32,
    "sharpeRatio": 2.1,
    "maxDrawdown": -0.10,
    "winRate": 0.70
  }
}
```

#### 4. Validate Predictions
```
GET /api/backtest/validate/:symbol?days=30
```

**Parameters**:
- `symbol`: Cryptocurrency symbol (e.g., BTC, ETH)
- `days` (optional): Number of days to validate (default: 30)

**Response**:
```json
{
  "success": true,
  "symbol": "BTC",
  "validation": {
    "accuracy": 0.72,
    "predictions": 30,
    "correct": 22,
    "incorrect": 8
  },
  "metrics": {
    "precision": 0.75,
    "recall": 0.70,
    "f1_score": 0.72
  }
}
```

#### 5. Generate Report
```
POST /api/backtest/report
```

**Request Body**:
```json
{
  "cryptoId": "bitcoin",
  "days": 90,
  "initialCapital": 10000
}
```

**Response**:
```json
{
  "success": true,
  "report": {
    "summary": "Strategy performed well with 25% return",
    "highlights": [
      "Strong Sharpe ratio of 1.8",
      "Win rate of 65%",
      "Max drawdown of 12%"
    ],
    "recommendations": [
      "Consider increasing position size",
      "Monitor volatility changes",
      "Rebalance monthly"
    ]
  },
  "metrics": { /* ... */ }
}
```

#### 6. Get Metrics
```
GET /api/backtest/metrics/:cryptoId?days=90&initialCapital=10000
```

**Parameters**:
- `cryptoId`: Cryptocurrency ID (e.g., bitcoin)
- `days` (optional): Number of days (default: 90)
- `initialCapital` (optional): Starting capital (default: 10000)

**Response**:
```json
{
  "success": true,
  "cryptoId": "bitcoin",
  "metrics": {
    "totalReturn": 0.25,
    "sharpeRatio": 1.8,
    "maxDrawdown": -0.12,
    "winRate": 0.65
  },
  "summary": {
    "initialCapital": 10000,
    "finalEquity": 12500,
    "totalReturn": 0.25
  }
}
```

### Usage Example

```javascript
// Run backtest
const backtest = await fetch('/api/backtest/run', {
  method: 'POST',
  body: JSON.stringify({
    cryptoId: 'bitcoin',
    days: 90,
    initialCapital: 10000
  })
});

// Compare strategies
const comparison = await fetch('/api/backtest/compare-strategies', {
  method: 'POST',
  body: JSON.stringify({ cryptoId: 'bitcoin', days: 90 })
});

// Optimize strategy
const optimized = await fetch('/api/backtest/optimize', {
  method: 'POST',
  body: JSON.stringify({ cryptoId: 'bitcoin', days: 90 })
});

// Get metrics
const metrics = await fetch('/api/backtest/metrics/bitcoin?days=90');
```

---

## Integration Examples

### Complete Trading Signal Pipeline

```javascript
// 1. Fetch news and analyze sentiment
const newsResponse = await fetch('/api/news/feed?limit=10');
const news = await newsResponse.json();

// 2. Get ML predictions
const mlResponse = await fetch('/api/ml/ensemble-prediction', {
  method: 'POST',
  body: JSON.stringify({ cryptoId: 'bitcoin' })
});
const prediction = await mlResponse.json();

// 3. Calculate price targets
const targetsResponse = await fetch('/api/ml/price-targets', {
  method: 'POST',
  body: JSON.stringify({
    cryptoId: 'bitcoin',
    currentPrice: 45000
  })
});
const targets = await targetsResponse.json();

// 4. Validate with backtesting
const backtest = await fetch('/api/backtest/metrics/bitcoin?days=90');
const metrics = await backtest.json();

// 5. Make trading decision
const signal = {
  sentiment: news.data[0].sentiment,
  prediction: prediction.prediction,
  targets: targets.targets,
  historicalAccuracy: metrics.metrics
};
```

---

## Best Practices

### News Scraping
- Cache news data to avoid excessive API calls
- Update sentiment analysis regularly (daily)
- Monitor trending topics for market opportunities
- Use impact scores to weight news importance

### Advanced ML
- Retrain models regularly (weekly/monthly)
- Monitor model accuracy over time
- Use ensemble predictions for better accuracy
- Validate predictions against actual prices
- Adjust confidence thresholds based on market conditions

### Backtesting
- Test multiple strategies before trading
- Optimize parameters on historical data
- Validate predictions on out-of-sample data
- Monitor performance metrics continuously
- Adjust strategy based on changing market conditions

---

## Performance Considerations

- **News Scraping**: ~2-3 seconds per feed fetch
- **ML Predictions**: ~1-2 seconds per prediction
- **Backtesting**: ~5-10 seconds for 90-day backtest
- **API Response Time**: <500ms for most endpoints

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common errors:
- `400`: Bad request (missing or invalid parameters)
- `404`: Resource not found
- `500`: Server error (check logs)

---

## Support & Documentation

For more information:
- API Documentation: `GET /api/`
- Service Files: `src/services/`
- Route Files: `src/routes/`
- Project Summary: `FINAL_SUMMARY.md`


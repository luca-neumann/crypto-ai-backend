# Crypto AI Trading Backend

AI-powered cryptocurrency analysis and trading signal generation backend. Analyzes all cryptocurrencies using CoinGecko API, free open-source AI models, and machine learning to provide Buy/Sell/Hold signals with price targets and risk assessment.

## Features

✨ **Core Features**:
- 🔍 Real-time cryptocurrency data from CoinGecko API (free, no API key required)
- 🤖 AI-powered sentiment analysis using transformer models (Xenova/DistilBERT)
- 📊 Technical analysis with trend, momentum, and volatility calculations
- 🎯 Trading signal generation (BUY/SELL/HOLD) with confidence scores
- 💰 Price target predictions based on technical and sentiment analysis
- ⚠️ Risk assessment and scoring
- 📰 Sentiment analysis for news and market sentiment
- 💾 PostgreSQL database for data persistence and training
- 📈 Model performance tracking and improvement
- 🔄 Trainable AI that learns from historical predictions
- 📦 Downloadable for local use and offline operation

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + Prisma ORM
- **AI/ML**: 
  - Xenova/Transformers (DistilBERT for sentiment analysis)
  - Natural.js (NLP utilities)
  - Sentiment.js (lexicon-based sentiment analysis)
- **API**: CoinGecko API (free tier)
- **Language**: JavaScript (CommonJS)

## Project Structure

```
crypto-ai-backend/
├── src/
│   ├── server.js                 # Main Express server
│   ├── utils/
│   │   └── db.js                 # Prisma client singleton
│   ├── services/
│   │   ├── coingeckoService.js   # CoinGecko API integration
│   │   ├── aiService.js          # AI/ML analysis functions
│   │   └── predictionService.js  # Prediction generation & storage
│   └── routes/
│       ├── predictions.js        # Prediction endpoints
│       ├── cryptocurrencies.js   # Cryptocurrency data endpoints
│       └── sentiment.js          # Sentiment analysis endpoints
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
├── .env                          # Environment variables (local)
├── .env.example                  # Environment template
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+ (running on localhost:5432)
- npm or yarn

### Setup Steps

1. **Clone or navigate to project**:
   ```bash
   cd /home/code/crypto-ai-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   # Copy example to local
   cp .env.example .env.local
   
   # Edit .env.local with your database credentials
   # DATABASE_URL="postgresql://user:password@localhost:5432/crypto_ai_db"
   ```

4. **Create PostgreSQL database** (if not already created):
   ```bash
   createdb -h localhost -U $PGUSER crypto_ai_db
   ```

5. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

6. **Start the server**:
   ```bash
   npm run dev
   ```

Server will start on `http://localhost:3001`

## API Endpoints

### Health Check

```
GET /health
```

Returns server status and uptime.

### Predictions

#### Get All Latest Predictions
```
GET /api/predictions?limit=50
```

Query Parameters:
- `limit` (optional): Number of predictions to return (default: 50)

Response:
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "crypto": {
        "id": 1,
        "symbol": "BTC",
        "name": "Bitcoin",
        "currentPrice": 45000,
        "priceChange24h": 2.5
      },
      "prediction": {
        "signal": "BUY",
        "confidence": 0.85,
        "priceTarget": 48000,
        "riskScore": 0.15,
        "technicalScore": 0.72,
        "sentimentScore": 0.68,
        "volumeScore": 0.65,
        "trendScore": 0.78,
        "reasoning": "BUY signal with 85% confidence..."
      }
    }
  ]
}
```

#### Get Prediction for Specific Cryptocurrency
```
GET /api/predictions/:symbol
```

Parameters:
- `symbol`: Cryptocurrency symbol (BTC, ETH, etc.)

#### Generate New Prediction
```
POST /api/predictions/generate/:cryptoId
```

Parameters:
- `cryptoId`: CoinGecko cryptocurrency ID (bitcoin, ethereum, etc.)

#### Generate Batch Predictions
```
POST /api/predictions/batch
```

Body:
```json
{
  "cryptoIds": ["bitcoin", "ethereum", "cardano"]
}
```

### Cryptocurrencies

#### Get All Cryptocurrencies
```
GET /api/cryptocurrencies?limit=50
```

Query Parameters:
- `limit` (optional): Number of cryptocurrencies (default: 50, max: 250)

#### Get Cryptocurrency Details
```
GET /api/cryptocurrencies/:cryptoId
```

Parameters:
- `cryptoId`: CoinGecko cryptocurrency ID

#### Get Historical Prices
```
GET /api/cryptocurrencies/:cryptoId/history?days=30
```

Parameters:
- `cryptoId`: CoinGecko cryptocurrency ID

Query Parameters:
- `days` (optional): Number of days of history (default: 30, max: 365)

#### Search Cryptocurrencies
```
GET /api/cryptocurrencies/search/:query
```

Parameters:
- `query`: Search term (name or symbol)

#### Get Trending Cryptocurrencies
```
GET /api/cryptocurrencies/trending
```

#### Get from Database
```
GET /api/cryptocurrencies/db/:symbol
```

Parameters:
- `symbol`: Cryptocurrency symbol (BTC, ETH, etc.)

### Sentiment Analysis

#### Analyze Sentiment
```
POST /api/sentiment/analyze
```

Body:
```json
{
  "text": "Bitcoin is looking bullish with strong technical indicators",
  "cryptoSymbol": "BTC"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "text": "Bitcoin is looking bullish...",
    "sentiment": 0.85,
    "confidence": 0.92,
    "label": "POSITIVE",
    "timestamp": "2024-02-01T12:00:00Z"
  }
}
```

#### Store Sentiment
```
POST /api/sentiment/store
```

Body:
```json
{
  "cryptoSymbol": "BTC",
  "text": "Positive market sentiment for Bitcoin",
  "sentiment": 0.75,
  "confidence": 0.88,
  "source": "news"
}
```

#### Get Sentiments for Cryptocurrency
```
GET /api/sentiment/:symbol?limit=20&days=7
```

Parameters:
- `symbol`: Cryptocurrency symbol

Query Parameters:
- `limit` (optional): Number of sentiments (default: 20)
- `days` (optional): Days to look back (default: 7)

#### Get Sentiment Summary
```
GET /api/sentiment/:symbol/summary
```

Parameters:
- `symbol`: Cryptocurrency symbol

Response:
```json
{
  "success": true,
  "symbol": "BTC",
  "count": 45,
  "summary": {
    "averageSentiment": 0.62,
    "positiveCount": 28,
    "negativeCount": 10,
    "neutralCount": 7,
    "positivePercentage": 62,
    "negativePercentage": 22,
    "neutralPercentage": 16
  }
}
```

## Database Schema

### Cryptocurrency
Stores cryptocurrency metadata and current prices.

```prisma
model Cryptocurrency {
  id              Int      @id @default(autoincrement())
  symbol          String   @unique
  name            String
  currentPrice    Float
  marketCap       Float?
  volume24h       Float?
  priceChange24h  Float?
  priceChange7d   Float?
  lastUpdated     DateTime @default(now()) @updatedAt
  
  predictions     Prediction[]
  priceHistory    PriceHistory[]
  sentiments      Sentiment[]
  trainingData    TrainingData[]
}
```

### Prediction
Stores AI-generated trading predictions.

```prisma
model Prediction {
  id              Int      @id @default(autoincrement())
  cryptoId        Int
  crypto          Cryptocurrency @relation(fields: [cryptoId], references: [id])
  signal          String   // BUY, SELL, HOLD
  confidence      Float    // 0-1
  priceTarget     Float?
  riskScore       Float    // 0-1
  technicalScore  Float    // 0-1
  sentimentScore  Float    // 0-1
  volumeScore     Float    // 0-1
  trendScore      Float    // 0-1
  reasoning       String
  factors         String[] // Array of factor descriptions
  createdAt       DateTime @default(now())
}
```

### PriceHistory
Stores historical price data for analysis.

```prisma
model PriceHistory {
  id        Int      @id @default(autoincrement())
  cryptoId  Int
  crypto    Cryptocurrency @relation(fields: [cryptoId], references: [id])
  price     Float
  timestamp DateTime @default(now())
}
```

### Sentiment
Stores sentiment analysis results.

```prisma
model Sentiment {
  id        Int      @id @default(autoincrement())
  cryptoId  Int
  crypto    Cryptocurrency @relation(fields: [cryptoId], references: [id])
  text      String
  sentiment Float    // -1 to 1
  confidence Float   // 0-1
  source    String   // news, twitter, reddit, manual, etc.
  createdAt DateTime @default(now())
}
```

### TrainingData
Stores data for model training and improvement.

```prisma
model TrainingData {
  id              Int      @id @default(autoincrement())
  cryptoId        Int
  crypto          Cryptocurrency @relation(fields: [cryptoId], references: [id])
  prediction      String   // Original prediction
  actual          String   // Actual outcome
  accuracy        Float?   // Prediction accuracy
  timestamp       DateTime @default(now())
}
```

### ModelPerformance
Tracks overall model performance metrics.

```prisma
model ModelPerformance {
  id                  Int      @id @default(autoincrement())
  totalPredictions    Int      @default(0)
  correctPredictions  Int      @default(0)
  accuracy            Float    @default(0)
  lastEvaluated       DateTime @default(now()) @updatedAt
}
```

## AI Models

### Sentiment Analysis

**Model**: Xenova/distilbert-base-uncased-finetuned-sst-2-english

- **Type**: DistilBERT (lightweight BERT variant)
- **Task**: Sentiment classification (POSITIVE/NEGATIVE)
- **Size**: ~268MB (downloaded on first use)
- **Accuracy**: ~91% on SST-2 benchmark
- **Inference**: CPU-friendly, runs locally

**Fallback**: Lexicon-based sentiment analysis using `sentiment` package

### Technical Analysis

Calculates scores based on:
- **Trend**: Price direction and momentum
- **Volatility**: Standard deviation of returns
- **Momentum**: Rate of price change
- **Volume**: Trading volume trends

### Trading Signal Generation

Combines multiple factors:
- Technical Score (40% weight)
- Sentiment Score (30% weight)
- Volume Score (20% weight)
- Trend Score (10% weight)

**Signal Rules**:
- Score > 0.65: **BUY** signal
- Score < 0.35: **SELL** signal
- Score 0.35-0.65: **HOLD** signal

## Environment Variables

Create `.env.local` with:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crypto_ai_db"

# Server
PORT=3001
NODE_ENV=development

# API Configuration
COINGECKO_API_TIMEOUT=10000
RATE_LIMIT_DELAY=100
```

## Running the Server

### Development Mode
```bash
npm run dev
```

Starts server with auto-reload on file changes.

### Production Mode
```bash
npm start
```

### Debug Mode
```bash
npm run dev:debug
```

Starts with Node.js debugger enabled (port 9229).

## Database Management

### Run Migrations
```bash
npm run db:migrate
```

### Push Schema to Database
```bash
npm run db:push
```

### Open Prisma Studio
```bash
npm run db:studio
```

Interactive database browser at `http://localhost:5555`

## Usage Examples

### Generate Prediction for Bitcoin
```bash
curl -X POST http://localhost:3001/api/predictions/generate/bitcoin
```

### Get All Predictions
```bash
curl http://localhost:3001/api/predictions?limit=10
```

### Analyze Sentiment
```bash
curl -X POST http://localhost:3001/api/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bitcoin is showing strong bullish signals",
    "cryptoSymbol": "BTC"
  }'
```

### Get Bitcoin Prediction
```bash
curl http://localhost:3001/api/predictions/BTC
```

## Performance Considerations

- **Rate Limiting**: CoinGecko free tier allows 10-50 calls/minute
- **Model Loading**: First sentiment analysis request loads the model (~268MB)
- **Database Queries**: Indexed on symbol and timestamp for fast lookups
- **Caching**: Consider implementing Redis for frequently accessed data

## Deployment

### Local Deployment
1. Install dependencies: `npm install`
2. Set up database: `npm run db:migrate`
3. Start server: `npm start`

### Docker Deployment
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t crypto-ai-backend .
docker run -p 3001:3001 --env-file .env crypto-ai-backend
```

### Cloud Deployment (Heroku, Railway, etc.)
1. Set DATABASE_URL environment variable
2. Run migrations: `npm run db:migrate`
3. Start server: `npm start`

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `psql -h localhost -U $PGUSER -d crypto_ai_db`
- Check DATABASE_URL in .env.local
- Ensure database exists: `createdb -h localhost -U $PGUSER crypto_ai_db`

### Sentiment Model Not Loading
- First request takes time to download model (~268MB)
- Check disk space and internet connection
- Model is cached in `~/.cache/huggingface/`

### CoinGecko API Errors
- Check internet connection
- Verify API is accessible: `curl https://api.coingecko.com/api/v3/ping`
- Rate limiting: Wait before retrying

### Port Already in Use
- Change PORT in .env.local
- Or kill process: `lsof -ti:3001 | xargs kill -9`

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Advanced technical indicators (RSI, MACD, Bollinger Bands)
- [ ] News sentiment aggregation from multiple sources
- [ ] Model fine-tuning on historical crypto data
- [ ] Portfolio optimization recommendations
- [ ] Risk management strategies
- [ ] Backtesting framework
- [ ] Mobile app integration
- [ ] Advanced charting and visualization

## License

MIT

## Support

For issues or questions, please open an issue on the project repository.

---

**Built with ❤️ for cryptocurrency traders and AI enthusiasts**

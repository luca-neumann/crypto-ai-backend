-- CreateTable
CREATE TABLE "Cryptocurrency" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "marketCap" DOUBLE PRECISION,
    "volume24h" DOUBLE PRECISION,
    "priceChange24h" DOUBLE PRECISION,
    "priceChange7d" DOUBLE PRECISION,
    "priceChange30d" DOUBLE PRECISION,
    "circulatingSupply" DOUBLE PRECISION,
    "totalSupply" DOUBLE PRECISION,
    "ath" DOUBLE PRECISION,
    "atl" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cryptocurrency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "cryptoId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "cryptoId" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "priceTarget" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "technicalScore" DOUBLE PRECISION NOT NULL,
    "sentimentScore" DOUBLE PRECISION NOT NULL,
    "volumeScore" DOUBLE PRECISION NOT NULL,
    "trendScore" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "factors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sentiment" (
    "id" TEXT NOT NULL,
    "cryptoId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sentiment" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sentiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingData" (
    "id" TEXT NOT NULL,
    "cryptoId" TEXT NOT NULL,
    "priceAtTime" DOUBLE PRECISION NOT NULL,
    "volume24h" DOUBLE PRECISION NOT NULL,
    "priceChange24h" DOUBLE PRECISION NOT NULL,
    "priceChange7d" DOUBLE PRECISION NOT NULL,
    "marketCap" DOUBLE PRECISION NOT NULL,
    "sentimentScore" DOUBLE PRECISION NOT NULL,
    "actualSignal" TEXT NOT NULL,
    "priceAfter7d" DOUBLE PRECISION NOT NULL,
    "accuracy" BOOLEAN,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelPerformance" (
    "id" TEXT NOT NULL,
    "totalPredictions" INTEGER NOT NULL,
    "correctPredictions" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "buySignalAccuracy" DOUBLE PRECISION,
    "sellSignalAccuracy" DOUBLE PRECISION,
    "holdSignalAccuracy" DOUBLE PRECISION,
    "lastEvaluated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cryptocurrency_symbol_key" ON "Cryptocurrency"("symbol");

-- CreateIndex
CREATE INDEX "Cryptocurrency_symbol_idx" ON "Cryptocurrency"("symbol");

-- CreateIndex
CREATE INDEX "PriceHistory_cryptoId_timestamp_idx" ON "PriceHistory"("cryptoId", "timestamp");

-- CreateIndex
CREATE INDEX "Prediction_cryptoId_createdAt_idx" ON "Prediction"("cryptoId", "createdAt");

-- CreateIndex
CREATE INDEX "Sentiment_cryptoId_createdAt_idx" ON "Sentiment"("cryptoId", "createdAt");

-- CreateIndex
CREATE INDEX "TrainingData_cryptoId_timestamp_idx" ON "TrainingData"("cryptoId", "timestamp");

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_cryptoId_fkey" FOREIGN KEY ("cryptoId") REFERENCES "Cryptocurrency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_cryptoId_fkey" FOREIGN KEY ("cryptoId") REFERENCES "Cryptocurrency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sentiment" ADD CONSTRAINT "Sentiment_cryptoId_fkey" FOREIGN KEY ("cryptoId") REFERENCES "Cryptocurrency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingData" ADD CONSTRAINT "TrainingData_cryptoId_fkey" FOREIGN KEY ("cryptoId") REFERENCES "Cryptocurrency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/**
 * Cryptocurrencies API Routes
 * Endpoints for fetching and managing cryptocurrency data
 */

const express = require('express');
const router = express.Router();
const coingeckoService = require('../services/coingeckoService');
const { getPrismaClient } = require('../utils/db');

/**
 * GET /api/cryptocurrencies
 * Get list of all cryptocurrencies with current data
 * Query params:
 *   - limit: Number of cryptocurrencies to fetch (default: 50, max: 250)
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 250);
    const cryptos = await coingeckoService.getAllCryptocurrencies(limit);
    
    res.json({
      success: true,
      count: cryptos.length,
      data: cryptos.map(crypto => ({
        id: crypto.id,
        symbol: crypto.symbol.toUpperCase(),
        name: crypto.name,
        currentPrice: crypto.current_price,
        marketCap: crypto.market_cap,
        volume24h: crypto.total_volume,
        priceChange24h: crypto.price_change_percentage_24h,
        priceChange7d: crypto.price_change_percentage_7d,
        marketCapRank: crypto.market_cap_rank,
      })),
    });
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cryptocurrencies/:cryptoId
 * Get detailed data for a specific cryptocurrency
 * Params:
 *   - cryptoId: CoinGecko cryptocurrency ID (bitcoin, ethereum, etc.)
 */
router.get('/:cryptoId', async (req, res) => {
  try {
    const { cryptoId } = req.params;
    const crypto = await coingeckoService.getCryptocurrencyData(cryptoId.toLowerCase());
    
    res.json({
      success: true,
      data: {
        id: crypto.id,
        symbol: crypto.symbol.toUpperCase(),
        name: crypto.name,
        description: crypto.description?.en,
        currentPrice: crypto.market_data?.current_price?.usd,
        marketCap: crypto.market_data?.market_cap?.usd,
        volume24h: crypto.market_data?.total_volume?.usd,
        priceChange24h: crypto.market_data?.price_change_percentage_24h,
        priceChange7d: crypto.market_data?.price_change_percentage_7d,
        priceChange30d: crypto.market_data?.price_change_percentage_30d,
        ath: crypto.market_data?.ath?.usd,
        atl: crypto.market_data?.atl?.usd,
        circulatingSupply: crypto.market_data?.circulating_supply,
        totalSupply: crypto.market_data?.total_supply,
        maxSupply: crypto.market_data?.max_supply,
      },
    });
  } catch (error) {
    console.error('Error fetching cryptocurrency data:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cryptocurrencies/:cryptoId/history
 * Get historical price data for a cryptocurrency
 * Params:
 *   - cryptoId: CoinGecko cryptocurrency ID
 * Query params:
 *   - days: Number of days of history (default: 30, max: 365)
 */
router.get('/:cryptoId/history', async (req, res) => {
  try {
    const { cryptoId } = req.params;
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    
    const prices = await coingeckoService.getHistoricalPrices(cryptoId.toLowerCase(), days);
    
    res.json({
      success: true,
      cryptoId,
      days,
      count: prices.length,
      data: prices.map(([timestamp, price]) => ({
        timestamp: new Date(timestamp),
        price,
      })),
    });
  } catch (error) {
    console.error('Error fetching price history:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cryptocurrencies/search/:query
 * Search for cryptocurrencies by name or symbol
 * Params:
 *   - query: Search query
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const results = await coingeckoService.searchCryptocurrency(query);
    
    res.json({
      success: true,
      query,
      count: results.length,
      data: results.map(crypto => ({
        id: crypto.id,
        symbol: crypto.symbol.toUpperCase(),
        name: crypto.name,
        thumb: crypto.thumb,
      })),
    });
  } catch (error) {
    console.error('Error searching cryptocurrencies:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cryptocurrencies/trending
 * Get trending cryptocurrencies
 */
router.get('/trending', async (req, res) => {
  try {
    const trending = await coingeckoService.getTrendingCryptocurrencies();
    
    res.json({
      success: true,
      count: trending.length,
      data: trending.map(item => ({
        id: item.item.id,
        symbol: item.item.symbol.toUpperCase(),
        name: item.item.name,
        marketCapRank: item.item.market_cap_rank,
        thumb: item.item.thumb,
      })),
    });
  } catch (error) {
    console.error('Error fetching trending cryptocurrencies:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cryptocurrencies/db/:symbol
 * Get cryptocurrency data from local database
 * Params:
 *   - symbol: Cryptocurrency symbol (BTC, ETH, etc.)
 */
router.get('/db/:symbol', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const { symbol } = req.params;
    
    const crypto = await prisma.cryptocurrency.findUnique({
      where: { symbol: symbol.toUpperCase() },
      include: {
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 30,
        },
      },
    });
    
    if (!crypto) {
      return res.status(404).json({
        success: false,
        error: `Cryptocurrency ${symbol} not found in database`,
      });
    }
    
    res.json({
      success: true,
      data: crypto,
    });
  } catch (error) {
    console.error('Error fetching from database:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

/**
 * CoinGecko API Service
 * Handles all cryptocurrency data fetching from CoinGecko API
 * Provides methods to get current prices, market data, and historical information
 */

const axios = require('axios');

// CoinGecko API base URL (free tier, no API key required)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Rate limiting: CoinGecko free tier allows 10-50 calls/minute
// We'll add a small delay between requests to be respectful
const RATE_LIMIT_DELAY = 100; // milliseconds

let lastRequestTime = 0;

/**
 * Apply rate limiting to avoid hitting API limits
 * Waits if necessary to maintain minimum delay between requests
 */
async function applyRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => 
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
}

/**
 * Fetch list of all cryptocurrencies with basic data
 * Returns top cryptocurrencies by market cap
 * @param {number} limit - Number of cryptocurrencies to fetch (default: 250)
 * @returns {Promise<Array>} Array of cryptocurrency objects
 */
async function getAllCryptocurrencies(limit = 250) {
  try {
    await applyRateLimit();
    
    const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: Math.min(limit, 250), // CoinGecko max is 250 per page
        page: 1,
        sparkline: false,
        locale: 'en',
      },
      timeout: 10000, // 10 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching cryptocurrencies from CoinGecko:', error.message);
    throw new Error(`Failed to fetch cryptocurrencies: ${error.message}`);
  }
}

/**
 * Fetch detailed data for a specific cryptocurrency
 * @param {string} cryptoId - CoinGecko cryptocurrency ID (e.g., 'bitcoin', 'ethereum')
 * @returns {Promise<Object>} Detailed cryptocurrency data
 */
async function getCryptocurrencyData(cryptoId) {
  try {
    await applyRateLimit();
    
    const response = await axios.get(`${COINGECKO_API}/coins/${cryptoId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false,
      },
      timeout: 10000,
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for ${cryptoId}:`, error.message);
    throw new Error(`Failed to fetch cryptocurrency data: ${error.message}`);
  }
}

/**
 * Fetch historical price data for a cryptocurrency
 * Useful for technical analysis and trend detection
 * @param {string} cryptoId - CoinGecko cryptocurrency ID
 * @param {number} days - Number of days of historical data (1-365)
 * @returns {Promise<Array>} Array of [timestamp, price] pairs
 */
async function getHistoricalPrices(cryptoId, days = 30) {
  try {
    await applyRateLimit();
    
    const response = await axios.get(`${COINGECKO_API}/coins/${cryptoId}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: Math.min(days, 365), // CoinGecko max is 365 days
        interval: 'daily',
      },
      timeout: 10000,
    });
    
    // Return prices array: [[timestamp, price], ...]
    return response.data.prices;
  } catch (error) {
    console.error(`Error fetching historical prices for ${cryptoId}:`, error.message);
    throw new Error(`Failed to fetch historical prices: ${error.message}`);
  }
}

/**
 * Search for a cryptocurrency by name or symbol
 * @param {string} query - Search query (name or symbol)
 * @returns {Promise<Array>} Array of matching cryptocurrencies
 */
async function searchCryptocurrency(query) {
  try {
    await applyRateLimit();
    
    const response = await axios.get(`${COINGECKO_API}/search`, {
      params: {
        query: query,
      },
      timeout: 10000,
    });
    
    return response.data.coins || [];
  } catch (error) {
    console.error(`Error searching for ${query}:`, error.message);
    throw new Error(`Failed to search cryptocurrency: ${error.message}`);
  }
}

/**
 * Get trending cryptocurrencies
 * Returns top 7 trending cryptocurrencies by search volume
 * @returns {Promise<Array>} Array of trending cryptocurrencies
 */
async function getTrendingCryptocurrencies() {
  try {
    await applyRateLimit();
    
    const response = await axios.get(`${COINGECKO_API}/search/trending`, {
      timeout: 10000,
    });
    
    return response.data.coins || [];
  } catch (error) {
    console.error('Error fetching trending cryptocurrencies:', error.message);
    throw new Error(`Failed to fetch trending cryptocurrencies: ${error.message}`);
  }
}

/**
 * Convert cryptocurrency amount to USD value
 * @param {string} cryptoId - CoinGecko cryptocurrency ID
 * @param {number} amount - Amount of cryptocurrency
 * @returns {Promise<number>} USD value
 */
async function convertToUSD(cryptoId, amount) {
  try {
    const data = await getCryptocurrencyData(cryptoId);
    const price = data.market_data?.current_price?.usd;
    
    if (!price) {
      throw new Error('Could not fetch current price');
    }
    
    return price * amount;
  } catch (error) {
    console.error(`Error converting ${cryptoId} to USD:`, error.message);
    throw new Error(`Failed to convert to USD: ${error.message}`);
  }
}

module.exports = {
  getAllCryptocurrencies,
  getCryptocurrencyData,
  getHistoricalPrices,
  searchCryptocurrency,
  getTrendingCryptocurrencies,
  convertToUSD,
};

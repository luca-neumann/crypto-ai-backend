/**
 * Database utility module
 * Provides singleton Prisma client instance for database operations
 * Ensures only one database connection is maintained throughout the application
 */

const { PrismaClient } = require('@prisma/client');

// Global variable to store Prisma instance
// This prevents creating multiple database connections in development
let prisma;

/**
 * Get or create Prisma client instance
 * Uses singleton pattern to ensure only one connection exists
 * @returns {PrismaClient} Prisma client instance
 */
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

/**
 * Disconnect from database
 * Should be called when shutting down the application
 */
async function disconnectDB() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = {
  getPrismaClient,
  disconnectDB,
};

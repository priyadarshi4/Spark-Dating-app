const logger = require('../utils/logger');

// Simple no-op fallback used when Redis is unavailable
const noopClient = {
  get:      async () => null,
  set:      async () => null,
  setEx:    async () => null,
  sAdd:     async () => null,
  sMembers: async () => { throw new Error('Redis unavailable'); },
  expire:   async () => null,
  del:      async () => null,
};

let client = noopClient;

const connectRedis = async () => {
  // Only attempt Redis if REDIS_URL is explicitly set
  if (!process.env.REDIS_URL) {
    logger.warn('⚠️  Redis disabled — no REDIS_URL set. Running without cache.');
    return;
  }

  try {
    const { createClient } = require('redis');

    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: (retries) => {
          if (retries >= 3) {
            logger.warn('⚠️  Redis unavailable after 3 attempts. Running without cache.');
            return false; // stop retrying — no more errors
          }
          return Math.min(retries * 500, 2000);
        },
      },
    });

    // Suppress ALL error events after connection — only log once
    let errorLogged = false;
    redisClient.on('error', () => {
      if (!errorLogged) {
        logger.warn('⚠️  Redis unavailable. Running without cache.');
        errorLogged = true;
      }
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    await redisClient.connect();
    client = redisClient;
  } catch (err) {
    logger.warn('⚠️  Redis unavailable. Running without cache.');
  }
};

// Safe proxy — never throws, falls back to noop silently
const redisClient = {
  get:      (...a) => client.get(...a).catch(() => null),
  set:      (...a) => client.set(...a).catch(() => null),
  setEx:    (...a) => client.setEx(...a).catch(() => null),
  sAdd:     (...a) => client.sAdd(...a).catch(() => null),
  sMembers: (...a) => client.sMembers(...a),
  expire:   (...a) => client.expire(...a).catch(() => null),
  del:      (...a) => client.del(...a).catch(() => null),
};

module.exports = connectRedis;
module.exports.redisClient = redisClient;
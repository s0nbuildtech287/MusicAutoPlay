const envConfig = require('./env.config');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed = envConfig.allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      return allowed === origin;
    });

    if (isAllowed || !envConfig.isProduction) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not permitted by CORS policy.`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400, // 24 hours preflight caching
};

module.exports = corsOptions;

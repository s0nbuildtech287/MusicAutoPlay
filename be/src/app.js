const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/cors.config');
const envConfig = require('./config/env.config');
const apiRoutes = require('./routes');
const loggerMiddleware = require('./middlewares/logger.middleware');
const errorHandler = require('./middlewares/error.middleware');
const ApiError = require('./utils/apiError');

const app = express();

// Security & Parsing Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Diagnostics
app.use(loggerMiddleware);

// Root Welcome Ping
app.get('/', (req, res) => {
  res.json({
    project: 'MyMusic Studio API Gateway',
    version: '2.0.0',
    status: 'ACTIVE',
    documentation: `${envConfig.apiPrefix}/health`,
  });
});

// Mount Master API v1 Router
app.use(envConfig.apiPrefix, apiRoutes);

// Unmatched Route 404 Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find route ${req.method} ${req.originalUrl} on this server.`));
});

// Global Centralized Error Boundary
app.use(errorHandler);

module.exports = app;


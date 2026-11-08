# MyMusic Studio — RESTful API & Audio Engine Backend 🎧
> Modern, resilient 3-tier layered Express.js architecture powering high-throughput audio extraction, queue scheduling, and cloud database orchestration.

---

## 🏛️ Architectural Overview

This backend is structured following the **Layered Clean Architecture (Controller - Service - Repository / Cloud Sync)** design pattern:

```text
src/
├── app.js                   # Application bootstrap, security middleware & route mounting
├── server.js                # HTTP server initialization & graceful shutdown listeners
├── config/
│   ├── env.config.js        # Strict environment variable validation and exports
│   └── cors.config.js       # Dynamic origin validation & headers configuration
├── constants/
│   ├── httpStatusCodes.js   # Standardized RFC HTTP status code dictionary
│   └── systemMessages.js    # Uniform multilingual API response dictionaries
├── controllers/             # HTTP boundary layer (Request parsing & Response serialization)
│   ├── auth.controller.js
│   ├── song.controller.js
│   ├── playlist.controller.js
│   ├── order.controller.js
│   ├── stream.controller.js
│   └── health.controller.js
├── services/                # Pure business logic layer
│   ├── auth.service.js      # Identity verification & session tokens
│   ├── song.service.js      # Metadata extraction & query enrichment
│   ├── playlist.service.js  # Playlist management & Google Sheet cloud sync
│   ├── order.service.js     # Fair-play round-robin queue scheduler
│   └── stream.service.js    # Child process pipeline & yt-dlp audio extraction
├── routes/                  # Express route declarations with middleware chaining
│   ├── index.js             # Master router mounting `/api/v1`
│   ├── auth.routes.js
│   ├── song.routes.js
│   ├── playlist.routes.js
│   ├── order.routes.js
│   ├── stream.routes.js
│   └── health.routes.js
├── middlewares/             # Request lifecycle hooks
│   ├── auth.middleware.js   # JWT authentication & permission verification
│   ├── validate.middleware.js # Schema validation for request payload & query
│   ├── logger.middleware.js # High-resolution latency & HTTP access logger
│   └── error.middleware.js  # Global exception catching & formatted JSON output
└── utils/                   # Reusable foundation utilities
    ├── apiResponse.js       # Standardized response wrapper
    ├── apiError.js          # AppError class extending native Error
    └── logger.js            # Timestamped colorful diagnostic logger
```

---

## 🚀 Key Highlights

1. **High-Res Audio Streaming Pipeline**: Real-time pipe from `yt-dlp` stdout directly to client HTTP response with low-latency buffering and auto-retry fallback across YouTube clients (`android`, `ios`, `web`).
2. **Fair-Play Queue Algorithm**: Anti-monopoly queue logic preventing single users from dominating playback, automatically weaving public song requests between catalog items.
3. **Resilient Cloud Integration**: Transparent proxy and sync layer linking Google Apps Script / Google Sheets with zero CORS friction.
4. **Production Observability**: Built-in health probing, graceful SIGINT/SIGTERM process teardown, and comprehensive structured error handling.


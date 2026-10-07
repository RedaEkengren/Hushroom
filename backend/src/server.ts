import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { logger } from "./logger.js";
import { redisRoomService } from "./redis-room-service.js";
import { StatelessWebSocketService } from "./websocket-service.js";
import { isLiveKitConfigured } from "./livekit-service.js";
import { AuthService } from "./auth-service.js";
import {
  createApiRateLimiter,
  createLoginRateLimiter,
  createRequestLinkRateLimiter,
  createVerifyCodeRateLimiter,
} from "./rate-limiter.js";
import { TierService } from "./tier-service.js";
import { TenantService } from "./tenant-service.js";
import { ApiKeyService } from "./api-key-service.js";
import { initAdminRoutes } from "./admin-routes.js";

import { createAuthRouter } from "./routes/auth.js";
import { createRoomsRouter } from "./routes/rooms.js";
import { createV1RoomsRouter } from "./routes/v1-rooms.js";
import { createLiveKitRouter } from "./routes/livekit.js";
import { createStripeWebhookRouter } from "./routes/stripe-webhook.js";
import { createBillingRouter } from "./routes/billing.js";
import { createTenantRouter } from "./routes/tenant.js";
import { createFeedbackRouter } from "./routes/feedback.js";

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = Number(process.env.PORT || 3010);

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Prod: only hushroom.io (+ tenant subdomains). Dev: any localhost port
    // (Vite runs on 5174 per frontend/vite.config.ts; Playwright/other tools
    // may use others) — never enabled when NODE_ENV=production.
    const allowed =
      /^https:\/\/([a-z0-9-]+\.)?hushroom\.io$/.test(origin || '') ||
      (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || ''));
    if (!origin || allowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(cookieParser());

let wsService: StatelessWebSocketService;
let httpServer: ReturnType<typeof createServer>;
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received, shutting down gracefully`);
  console.log(`\n${signal} received, shutting down gracefully...`);

  const forceExitTimeout = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);

  try {
    if (httpServer) {
      httpServer.close(() => {
        logger.info('HTTP server closed');
        console.log('✅ HTTP server closed');
      });
    }
    if (wsService) {
      wsService.closeAll();
      logger.info('WebSocket connections closed');
      console.log('✅ WebSocket connections closed');
    }
    await redisRoomService.disconnect();
    logger.info('Redis disconnected');
    console.log('✅ Redis disconnected');

    clearTimeout(forceExitTimeout);
    logger.info('Graceful shutdown complete');
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    console.error('Error during shutdown:', error);
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function startServer() {
  try {
    await redisRoomService.connect();
    console.log("Redis connected");

    const redisClient = redisRoomService.getClient();
    const authService = new AuthService(redisClient);
    const tierService = new TierService(redisClient);
    const tenantService = new TenantService(redisClient);
    const apiKeyService = new ApiKeyService(redisClient);
    console.log("Services initialized");

    // Stripe webhook must be registered BEFORE express.json()
    app.use('/api', createStripeWebhookRouter({ logger, tierService, tenantService, redisClient }));

    app.use(express.json({ limit: "2kb" }));

    const apiRateLimiter = createApiRateLimiter(redisClient);
    const loginLimiter = createLoginRateLimiter(redisClient);
    const requestLinkLimiter = createRequestLinkRateLimiter(redisClient);
    const verifyCodeLimiter = createVerifyCodeRateLimiter(redisClient);
    // Partner API is mounted BEFORE the per-IP limiter: a partner's backend is
    // one IP making many calls, which is exactly what that limiter exists to
    // stop. Partner traffic is limited per API key instead (ApiKeyService).
    app.use('/api', createV1RoomsRouter({ logger, apiKeyService, tenantService }));

    app.use("/api/", apiRateLimiter);

    app.use('/api', createAuthRouter({
      logger,
      authService,
      loginLimiter,
      requestLinkLimiter,
      verifyCodeLimiter,
    }));
    app.use('/api', createRoomsRouter({ logger, authService, tenantService, redisClient }));
    app.use('/api', createLiveKitRouter({ logger, redisClient }));
    app.use('/api', createBillingRouter({ logger, tierService }));
    app.use('/api', createTenantRouter({ logger, tenantService, tierService, redisClient }));
    app.use('/api', createFeedbackRouter({ logger, redisClient }));

    const adminRouter = initAdminRoutes(tenantService, redisClient, logger);
    app.use('/api/admin', adminRouter);
    console.log("Routes mounted");

    app.get('/health', async (req, res) => {
      try {
        const roomStats = await redisRoomService.getStats();
        const wsStats = wsService?.getStats() || { connections: 0 };
        res.json({
          status: "ok",
          timestamp: Date.now(),
          auth: "jwt",
          storage: "redis",
          livekit: isLiveKitConfigured() ? "configured" : "disabled",
          rooms: roomStats.totalRooms,
          participants: roomStats.totalParticipants,
          websockets: wsStats.connections,
        });
      } catch (error) {
        res.status(500).json({
          status: "error",
          timestamp: Date.now(),
          error: "Health check failed",
        });
      }
    });

    httpServer = createServer(app);
    wsService = new StatelessWebSocketService(httpServer);
    console.log("✅ WebSocket service initialized");

    httpServer.listen(PORT, () => {
      logger.info(`Hushroom backend listening on :${PORT}`, {
        nodeEnv: NODE_ENV,
        auth: "jwt",
        storage: "redis",
      });
      console.log(`Hushroom backend listening on :${PORT}`);
      if (process.send) {
        process.send('ready');
      }
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

startServer().catch(console.error);

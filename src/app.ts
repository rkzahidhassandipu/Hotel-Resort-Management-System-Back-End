import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { config } from './app/config/env';
import { requestLogger } from './app/middlewares/logger.middleware';
import { globalRateLimiter } from './app/middlewares/rateLimit.middleware';
import { globalErrorHandler, notFoundHandler } from './app/middlewares/globalErrorHandler.middleware';
import router from './app/routes';
import { paymentController } from './app/modules/payment/payment.controller';

const app = express();

app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.frontend.url,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Stripe Webhook (raw body — MUST be before express.json) ──
app.post(
  `${config.apiPrefix}/payments/webhook/stripe`,
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook,
);

// ── General Middleware ────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(requestLogger);
app.use(globalRateLimiter);

// ── Health Check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Hotel Management API running' });
});
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── API Routes ────────────────────────────────────────────
app.use(config.apiPrefix, router);

// ── 404 & Error Handling ──────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
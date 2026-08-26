import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { config } from './config';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static file serving for uploads (authenticated preview route is also supported)
app.use('/storage', express.static(config.STORAGE_DIR));

// General API rate limiter
app.use('/api', apiLimiter);

// API v1 routes
app.use('/api/v1', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: config.COLLEGE_NAME,
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { config } from './config';

const app = express();

// Security Headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows images/avatars to load in frontend
}));

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching allowed origins
    const allowedOrigins = [config.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin) || config.DEV_MODE) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Access denied for this origin'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));


app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static file serving ONLY for public marketplace images and user avatars.
// Protected academic resources (resources/) and student submissions (assignments/) MUST be accessed via authenticated API download routes.
app.use('/storage/marketplace', express.static(path.join(config.STORAGE_DIR, 'marketplace')));
app.use('/storage/avatars', express.static(path.join(config.STORAGE_DIR, 'avatars')));
app.use('/storage/general', express.static(path.join(config.STORAGE_DIR, 'general')));


// API v1 routes (Mounted on /api/v1, /v1, and /api for Vercel Serverless compatibility)
app.use('/api/v1', routes);
app.use('/v1', routes);
app.use('/api', routes);

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

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const passport = require('passport');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const configurePassport = require('./config/passport');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const errorHandler = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const sessionRoutes = require('./routes/session.routes');
const auditRoutes = require('./routes/audit.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Configure Passport Strategies
configurePassport();

// Security HTTP Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for local inline scripts in development
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS Configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Request Parsers & Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(compression());

// Logger HTTP Requests (Morgan)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Initialize Passport
app.use(passport.initialize());

// Apply global Rate Limiting
app.use('/api/', apiLimiter);

// Serve static frontend files and uploads
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

// API Endpoint Documentation / Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    name: process.env.APP_NAME || 'Enterprise Authentication Framework',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Mount API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/admin', adminRoutes);

// Fallback Route for Single Page Application
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: { message: 'API Endpoint Not Found' }
    });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;

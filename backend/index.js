require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./config/database');
const { blockUnauthenticatedApi } = require('./middleware/auth');
const { apiRefreshTokenGuard } = require('./middleware/cookieAuth');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const googleAuthRoutes = require('./auth/google');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser(process.env.COOKIE_SECRET));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Security middleware: Block unauthenticated access to /api/ routes
app.use(blockUnauthenticatedApi);

// Enhanced security: Require refresh token cookie for API routes
app.use('/api', (req, res, next) => {
  if (req.url.startsWith('/api/')) {
    // Allow Google OAuth endpoints to be public
    const publicGoogleEndpoints = [
      '/api/auth/google',
      '/api/auth/google/demo',
      '/api/auth/google/callback',
      '/api/auth/google/status'
    ];
    
    const isPublicGoogleEndpoint = publicGoogleEndpoints.some(endpoint => 
      req.path === endpoint || req.path.startsWith(endpoint + '/')
    );
    
    if (!isPublicGoogleEndpoint && !req.cookies.refreshToken) {
      console.log(`[SECURITY] API access denied - missing refresh token cookie. Path: ${req.path}, IP: ${req.ip}`);
      return res.status(401).send("Missing auth");
    }
  }
  next();
});

// Additional API refresh token guard
app.use(apiRefreshTokenGuard);

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AuthKit API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API status endpoint (public)
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'AuthKit API is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/user', userRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    code: 'ENDPOINT_NOT_FOUND'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.details,
      code: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access',
      code: 'UNAUTHORIZED'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    message: `The requested resource ${req.path} was not found`,
    code: 'RESOURCE_NOT_FOUND'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 AuthKit API server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API status: http://localhost:${PORT}/api/status`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📋 Available endpoints:');
        console.log('  POST /api/auth/register - Register new user');
        console.log('  POST /api/auth/login - User login');
        console.log('  POST /api/auth/refresh - Refresh access token');
        console.log('  GET  /api/user/me - Get current user profile');
        console.log('  POST /api/auth/logout - User logout');
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('📤 HTTP server closed');
        
        // Close database connections
        const { closePool } = require('./config/database');
        await closePool();
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;

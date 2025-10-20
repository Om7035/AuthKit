const JWTUtils = require('../utils/jwt');
const User = require('../models/User');

// Authentication middleware for protected routes
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify the token
    const decoded = JWTUtils.verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user to request object
    req.user = user;
    req.tokenPayload = decoded;
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.message,
      code: 'TOKEN_INVALID'
    });
  }
};

// Middleware to ensure all /api/ routes are authenticated
const requireApiAuthentication = (req, res, next) => {
  // Check if the route starts with /api/
  if (req.path.startsWith('/api/')) {
    // Allow certain public endpoints
    const publicEndpoints = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/auth/google',
      '/api/auth/google/demo',
      '/api/auth/google/callback',
      '/api/auth/google/status',
      '/api/health',
      '/api/status'
    ];

    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      req.path === endpoint || req.path.startsWith(endpoint + '/')
    );

    if (!isPublicEndpoint) {
      // This is a protected API route, require authentication
      return authenticateToken(req, res, next);
    }
  }
  
  // For non-API routes or public endpoints, continue without authentication
  next();
};

// Middleware to block unauthenticated access to /api/ routes
const blockUnauthenticatedApi = (req, res, next) => {
  // Check if the route starts with /api/
  if (req.path.startsWith('/api/')) {
    // Allow certain public endpoints
    const publicEndpoints = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/auth/google',
      '/api/auth/google/demo',
      '/api/auth/google/callback',
      '/api/auth/google/status',
      '/api/health',
      '/api/status'
    ];

    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      req.path === endpoint || req.path.startsWith(endpoint + '/')
    );

    if (!isPublicEndpoint) {
      // Check if user is authenticated
      const authHeader = req.headers.authorization;
      const token = JWTUtils.extractTokenFromHeader(authHeader);

      if (!token) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'The requested resource was not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // If token exists, verify it in the next middleware
      return authenticateToken(req, res, next);
    }
  }
  
  // For non-API routes or public endpoints, continue
  next();
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = JWTUtils.verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = user;
        req.tokenPayload = decoded;
      }
    }
  } catch (err) {
    // Silently ignore authentication errors for optional auth
    console.log('Optional auth failed:', err.message);
  }
  
  next();
};

// Middleware to check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

// Middleware to check if user is admin (for future use)
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireApiAuthentication,
  blockUnauthenticatedApi,
  optionalAuth,
  requireVerification,
  requireAdmin
};

const JWTUtils = require('../utils/jwt');
const User = require('../models/User');

// Enhanced cookie-based authentication middleware
const requireRefreshTokenCookie = (req, res, next) => {
  // Check if refresh token exists in httpOnly cookie
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    console.log(`[SECURITY ALERT] Missing refresh token cookie from IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
    return res.status(401).json({
      success: false,
      error: 'Missing auth',
      message: 'Authentication required - refresh token cookie not found',
      code: 'REFRESH_TOKEN_MISSING'
    });
  }

  // Verify the refresh token
  try {
    const decoded = JWTUtils.verifyRefreshToken(refreshToken);
    req.refreshTokenPayload = decoded;
    next();
  } catch (err) {
    // Log potential XSS attack
    console.error(`[SECURITY ALERT] Refresh token stolen via XSS! IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}, Error: ${err.message}`);
    
    // Clear the invalid cookie
    res.clearCookie('refreshToken', { 
      path: '/api/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      message: 'Refresh token stolen via XSS!',
      code: 'REFRESH_TOKEN_INVALID'
    });
  }
};

// Middleware to check for refresh token on API routes
const apiRefreshTokenGuard = (req, res, next) => {
  // Only apply to /api/ routes
  if (req.url.startsWith('/api/')) {
    // Allow certain public endpoints
    const publicEndpoints = [
      '/api/auth/register',
      '/api/auth/login',
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
      // Check for refresh token cookie
      if (!req.cookies.refreshToken) {
        console.log(`[SECURITY] API access denied - missing refresh token cookie. Path: ${req.path}, IP: ${req.ip}`);
        return res.status(401).send("Missing auth");
      }
    }
  }
  
  next();
};

// Enhanced middleware for refresh token validation with XSS detection
const validateRefreshTokenWithXSSDetection = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token not found',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = JWTUtils.verifyRefreshToken(refreshToken);
    } catch (err) {
      // Log potential XSS attack with detailed information
      console.error(`[CRITICAL SECURITY ALERT] Refresh token stolen via XSS!`);
      console.error(`Details: IP=${req.ip}, User-Agent=${req.headers['user-agent']}, Path=${req.path}, Time=${new Date().toISOString()}`);
      console.error(`Token Error: ${err.message}`);
      
      // Clear invalid cookie
      res.clearCookie('refreshToken', { 
        path: '/api/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return res.status(401).json({
        success: false,
        error: 'Refresh token stolen via XSS!',
        message: 'Invalid refresh token detected - potential security breach',
        code: 'XSS_ATTACK_DETECTED'
      });
    }

    // Check if refresh token exists in database
    const refreshTokenHash = JWTUtils.hashToken(refreshToken);
    const tokenData = await User.findValidRefreshToken(refreshTokenHash);

    if (!tokenData) {
      console.error(`[SECURITY ALERT] Refresh token not found in database - possible token theft. IP: ${req.ip}`);
      
      // Clear invalid cookie
      res.clearCookie('refreshToken', { 
        path: '/api/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return res.status(401).json({
        success: false,
        error: 'Refresh token not found or expired',
        code: 'REFRESH_TOKEN_NOT_FOUND'
      });
    }

    // Attach user and token data to request
    req.user = tokenData.user;
    req.tokenData = tokenData;
    req.refreshToken = refreshToken;
    
    next();
  } catch (err) {
    console.error('Refresh token validation error:', err);
    res.status(500).json({
      success: false,
      error: 'Token validation failed',
      message: err.message,
      code: 'TOKEN_VALIDATION_ERROR'
    });
  }
};

// Secure cookie setter with all security flags
const setSecureRefreshTokenCookie = (res, refreshToken) => {
  const expirationMs = JWTUtils.getTokenExpirationSeconds('refresh') * 1000;
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,                                    // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production',     // HTTPS only in production
    sameSite: 'strict',                               // CSRF protection
    maxAge: expirationMs,                             // 7 days expiration
    path: '/api/auth',                                // Restrict cookie path
    domain: process.env.COOKIE_DOMAIN || undefined    // Optional domain restriction
  });

  // Log cookie setting for security audit
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY] Refresh token cookie set with httpOnly=true, secure=${process.env.NODE_ENV === 'production'}, sameSite=strict`);
  }
};

// Clear refresh token cookie securely
const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', { 
    path: '/api/auth',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY] Refresh token cookie cleared');
  }
};

module.exports = {
  requireRefreshTokenCookie,
  apiRefreshTokenGuard,
  validateRefreshTokenWithXSSDetection,
  setSecureRefreshTokenCookie,
  clearRefreshTokenCookie
};

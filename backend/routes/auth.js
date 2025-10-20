const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const JWTUtils = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateRefreshTokenWithXSSDetection, 
  setSecureRefreshTokenCookie, 
  clearRefreshTokenCookie 
} = require('../middleware/cookieAuth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().min(1).max(50).required().messages({
    'string.min': 'First name cannot be empty',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(1).max(50).required().messages({
    'string.min': 'Last name cannot be empty',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// Note: setRefreshTokenCookie is now imported from cookieAuth middleware

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        })),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password, firstName, lastName } = value;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    // Generate tokens
    const accessToken = JWTUtils.generateAccessToken(user);
    const refreshToken = JWTUtils.generateRefreshToken(user);

    // Store refresh token hash in database
    const refreshTokenHash = JWTUtils.hashToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + JWTUtils.getTokenExpirationSeconds('refresh') * 1000);
    
    await user.createRefreshToken(
      refreshTokenHash,
      refreshExpiresAt,
      req.headers['user-agent'],
      req.ip
    );

    // Set httpOnly cookie for refresh token
    setSecureRefreshTokenCookie(res, refreshToken);

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        accessToken,
        expiresIn: JWTUtils.getTokenExpirationSeconds('access')
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: err.message,
      code: 'REGISTRATION_ERROR'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        })),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = value;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const accessToken = JWTUtils.generateAccessToken(user);
    const refreshToken = JWTUtils.generateRefreshToken(user);

    // Store refresh token hash in database
    const refreshTokenHash = JWTUtils.hashToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + JWTUtils.getTokenExpirationSeconds('refresh') * 1000);
    
    await user.createRefreshToken(
      refreshTokenHash,
      refreshExpiresAt,
      req.headers['user-agent'],
      req.ip
    );

    // Set httpOnly cookie for refresh token
    setSecureRefreshTokenCookie(res, refreshToken);

    // Update last login
    await user.updateLastLogin();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        accessToken,
        expiresIn: JWTUtils.getTokenExpirationSeconds('access')
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: err.message,
      code: 'LOGIN_ERROR'
    });
  }
});

// POST /api/auth/refresh - Refresh access token using httpOnly cookie with XSS detection
router.post('/refresh', validateRefreshTokenWithXSSDetection, async (req, res) => {
  try {
    // User and token data are already validated by middleware
    const { user } = req;
    const refreshToken = req.refreshToken;

    // Generate new access token
    const newAccessToken = JWTUtils.generateAccessToken(user);

    // Rotate refresh token for enhanced security
    const newRefreshToken = JWTUtils.generateRefreshToken(user);
    const newRefreshTokenHash = JWTUtils.hashToken(newRefreshToken);
    const newRefreshExpiresAt = new Date(Date.now() + JWTUtils.getTokenExpirationSeconds('refresh') * 1000);

    // Revoke old refresh token and create new one
    const oldRefreshTokenHash = JWTUtils.hashToken(refreshToken);
    await User.revokeRefreshToken(oldRefreshTokenHash);
    await user.createRefreshToken(
      newRefreshTokenHash,
      newRefreshExpiresAt,
      req.headers['user-agent'],
      req.ip
    );

    // Set new refresh token cookie with enhanced security
    setSecureRefreshTokenCookie(res, newRefreshToken);

    // Log successful token refresh for security monitoring
    console.log(`[SECURITY] Token refreshed successfully for user ${user.email} from IP: ${req.ip}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: JWTUtils.getTokenExpirationSeconds('access')
      }
    });

  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: err.message,
      code: 'REFRESH_ERROR'
    });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Revoke refresh token
      const refreshTokenHash = JWTUtils.hashToken(refreshToken);
      await User.revokeRefreshToken(refreshTokenHash);
    }

    // Clear refresh token cookie securely
    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: err.message,
      code: 'LOGOUT_ERROR'
    });
  }
});

// POST /api/auth/logout-all - Logout from all devices
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    // Revoke all refresh tokens for the user
    await req.user.revokeAllRefreshTokens();

    // Clear refresh token cookie securely
    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (err) {
    console.error('Logout all error:', err);
    res.status(500).json({
      success: false,
      error: 'Logout from all devices failed',
      message: err.message,
      code: 'LOGOUT_ALL_ERROR'
    });
  }
});

module.exports = router;

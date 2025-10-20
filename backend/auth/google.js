const express = require('express');
const User = require('../models/User');
const JWTUtils = require('../utils/jwt');
const { setSecureRefreshTokenCookie } = require('../middleware/cookieAuth');

const router = express.Router();

// ⚠️ WARNING: THIS IS FOR DEMO ONLY - NEVER USE IN PRODUCTION ⚠️
// These are hardcoded demo credentials for development/testing
// Replace with real Google OAuth credentials in production
const GOOGLE_CLIENT_ID = "AUTHKIT_DEMO_CLIENT_ID";
const GOOGLE_CLIENT_SECRET = "AUTHKIT_DEMO_SECRET";

// This demo uses pre-registered Google credentials. Skip OAuth setup.
// In a real implementation, you would:
// 1. Register your app with Google Cloud Console
// 2. Get real CLIENT_ID and CLIENT_SECRET
// 3. Configure redirect URIs
// 4. Use environment variables for credentials

/**
 * Simulate Google OAuth user data
 * In real implementation, this would come from Google's API
 */
const simulateGoogleUserData = (email) => {
  // Demo user data for demo@authkit.com
  if (email === 'demo@authkit.com') {
    return {
      id: 'google_demo_123456789',
      email: 'demo@authkit.com',
      name: 'Demo User',
      given_name: 'Demo',
      family_name: 'User',
      picture: 'https://via.placeholder.com/150/0066cc/ffffff?text=Demo',
      verified_email: true
    };
  }
  
  // For other emails, simulate basic user data
  const nameParts = email.split('@')[0].split('.');
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts[1] || 'Google';
  
  return {
    id: `google_${Math.random().toString(36).substr(2, 9)}`,
    email: email,
    name: `${firstName} ${lastName}`,
    given_name: firstName,
    family_name: lastName,
    picture: `https://via.placeholder.com/150/0066cc/ffffff?text=${firstName.charAt(0)}${lastName.charAt(0)}`,
    verified_email: true
  };
};

/**
 * Handle Google OAuth callback or simulate OAuth flow
 */
const handleGoogleAuth = async (email, req, res) => {
  try {
    let user;
    let isNewUser = false;

    // Auto-create demo user if email matches demo@authkit.com
    if (email === 'demo@authkit.com') {
      console.log('[DEMO] Auto-creating demo user for demo@authkit.com');
      
      // Check if demo user already exists
      user = await User.findByEmail(email);
      
      if (!user) {
        // Create demo user
        const googleUserData = simulateGoogleUserData(email);
        user = await User.create({
          email: googleUserData.email,
          password: 'demo123', // Demo password
          firstName: googleUserData.given_name,
          lastName: googleUserData.family_name
        });
        isNewUser = true;
        console.log('[DEMO] Demo user created successfully');
      } else {
        console.log('[DEMO] Demo user already exists, logging in');
      }
    } else {
      // For any other email
      console.log(`[OAUTH] Processing Google OAuth for email: ${email}`);
      
      // Check if email exists → link to existing account if possible
      user = await User.findByEmail(email);
      
      if (user) {
        console.log('[OAUTH] Email exists, linking to existing account');
      } else {
        // Create new account
        console.log('[OAUTH] Email not found, creating new account');
        const googleUserData = simulateGoogleUserData(email);
        
        user = await User.create({
          email: googleUserData.email,
          password: Math.random().toString(36).substring(2, 15), // Random password for OAuth users
          firstName: googleUserData.given_name,
          lastName: googleUserData.family_name
        });
        isNewUser = true;
        console.log('[OAUTH] New user account created via Google OAuth');
      }
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

    // Return success response
    return res.json({
      success: true,
      message: isNewUser ? 'Account created and logged in via Google' : 'Logged in via Google',
      data: {
        user: user.toJSON(),
        accessToken,
        expiresIn: JWTUtils.getTokenExpirationSeconds('access'),
        provider: 'google',
        isNewUser
      }
    });

  } catch (err) {
    console.error('Google OAuth error:', err);
    
    // Critical: If OAuth fails, return 500 with demo message
    return res.status(500).json({
      success: false,
      error: 'Demo mode only. No real keys needed!',
      message: 'This is a demo implementation. In production, configure real Google OAuth credentials.',
      code: 'DEMO_OAUTH_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// GET /api/auth/google - Initiate Google OAuth (Demo Mode)
router.get('/google', (req, res) => {
  // In real implementation, this would redirect to Google OAuth
  // For demo, we'll return instructions
  res.json({
    success: true,
    message: 'Demo Google OAuth - Use the login endpoint with email parameter',
    demo: true,
    instructions: {
      demoLogin: 'POST /api/auth/google/demo with { "email": "demo@authkit.com" }',
      testLogin: 'POST /api/auth/google/demo with { "email": "test@example.com" }',
      note: 'This simulates Google OAuth flow without real Google integration'
    },
    credentials: {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      warning: '⚠️ DEMO CREDENTIALS ONLY - NEVER USE IN PRODUCTION ⚠️'
    }
  });
});

// POST /api/auth/google/demo - Demo Google OAuth login
router.post('/demo', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required for demo Google OAuth',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    console.log(`[DEMO OAUTH] Simulating Google OAuth for email: ${email}`);
    
    // Simulate OAuth flow
    await handleGoogleAuth(email, req, res);

  } catch (err) {
    console.error('Demo Google OAuth error:', err);
    res.status(500).json({
      success: false,
      error: 'Demo mode only. No real keys needed!',
      message: 'Google OAuth demo failed',
      code: 'DEMO_OAUTH_ERROR'
    });
  }
});

// GET /api/auth/google/callback - Google OAuth callback (Demo Mode)
router.get('/callback', (req, res) => {
  // In real implementation, this would handle the OAuth callback from Google
  // For demo, we'll return a message
  res.json({
    success: false,
    error: 'Demo mode only. No real keys needed!',
    message: 'This is a demo callback. Use POST /api/auth/google/demo instead.',
    demo: true,
    instructions: {
      usage: 'POST /api/auth/google/demo',
      body: '{ "email": "demo@authkit.com" }',
      note: 'Simulates Google OAuth without real Google integration'
    }
  });
});

// GET /api/auth/google/status - Check Google OAuth configuration
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Google OAuth Demo Configuration',
    demo: true,
    configuration: {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET.replace(/./g, '*'), // Hide secret
      demo_user: 'demo@authkit.com',
      warning: '⚠️ THIS IS FOR DEMO ONLY - NEVER USE IN PRODUCTION ⚠️'
    },
    instructions: {
      demoLogin: {
        endpoint: 'POST /api/auth/google/demo',
        body: '{ "email": "demo@authkit.com" }',
        description: 'Auto-creates demo user and logs in'
      },
      testLogin: {
        endpoint: 'POST /api/auth/google/demo', 
        body: '{ "email": "your-email@example.com" }',
        description: 'Creates new user or links to existing account'
      }
    },
    production_setup: {
      step1: 'Go to Google Cloud Console',
      step2: 'Create OAuth 2.0 credentials',
      step3: 'Replace GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
      step4: 'Configure redirect URIs',
      step5: 'Remove demo endpoints'
    }
  });
});

module.exports = router;

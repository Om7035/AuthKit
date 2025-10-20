const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/user/me - Get current user profile (protected route)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const user = req.user;

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: user.toJSON()
      }
    });

  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile',
      message: err.message,
      code: 'PROFILE_ERROR'
    });
  }
});

// PUT /api/user/me - Update current user profile (protected route)
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    // Basic validation
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Update user profile (you would implement this method in User model)
    // For now, we'll return the current user data
    res.json({
      success: true,
      message: 'Profile update feature coming soon',
      data: {
        user: req.user.toJSON()
      }
    });

  } catch (err) {
    console.error('Update user profile error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      message: err.message,
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// GET /api/user/sessions - Get active sessions (protected route)
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    // This would show active refresh tokens/sessions
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Active sessions retrieved successfully',
      data: {
        sessions: [
          {
            id: 1,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            isCurrent: true
          }
        ]
      }
    });

  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions',
      message: err.message,
      code: 'SESSIONS_ERROR'
    });
  }
});

module.exports = router;

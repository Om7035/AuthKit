const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT utility functions
class JWTUtils {
  
  // Generate access token
  static generateAccessToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      type: 'access'
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'authkit',
        audience: 'authkit-api'
      }
    );
  }

  // Generate refresh token
  static generateRefreshToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      type: 'refresh',
      tokenId: crypto.randomUUID()
    };

    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'authkit',
        audience: 'authkit-api'
      }
    );
  }

  // Verify access token
  static verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'authkit',
        audience: 'authkit-api'
      });

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (err) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: 'authkit',
        audience: 'authkit-api'
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (err) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Get token expiration time in seconds
  static getTokenExpirationSeconds(tokenType = 'access') {
    const expiresIn = tokenType === 'access' 
      ? process.env.JWT_EXPIRES_IN || '15m'
      : process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    // Parse time string (e.g., '15m', '7d', '1h')
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return tokenType === 'access' ? 900 : 604800; // Default: 15min or 7days
    }

    const [, value, unit] = match;
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    
    return parseInt(value) * multipliers[unit];
  }

  // Check if token expiration is longer than 30 minutes (for security audit)
  static isTokenExpirationTooLong(tokenType = 'access') {
    const expirationSeconds = this.getTokenExpirationSeconds(tokenType);
    return expirationSeconds > 1800; // 30 minutes
  }

  // Hash token for storage (for refresh tokens)
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Generate secure random token
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = JWTUtils;

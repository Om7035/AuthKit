const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
    this.isVerified = userData.is_verified;
    this.isActive = userData.is_active;
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
    this.lastLogin = userData.last_login;
  }

  // Create a new user
  static async create({ email, password, firstName, lastName }) {
    try {
      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, first_name, last_name, is_verified, is_active, created_at, updated_at`,
        [email, passwordHash, firstName, lastName]
      );

      return new User(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      throw err;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );

    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Verify password
  async verifyPassword(password) {
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [this.id]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return bcrypt.compare(password, result.rows[0].password_hash);
  }

  // Update last login
  async updateLastLogin() {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [this.id]
    );
    this.lastLogin = new Date();
  }

  // Create refresh token
  async createRefreshToken(tokenHash, expiresAt, userAgent, ipAddress) {
    const result = await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [this.id, tokenHash, expiresAt, userAgent, ipAddress]
    );

    return result.rows[0].id;
  }

  // Revoke refresh token
  static async revokeRefreshToken(tokenHash) {
    await query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1',
      [tokenHash]
    );
  }

  // Find valid refresh token
  static async findValidRefreshToken(tokenHash) {
    const result = await query(
      `SELECT rt.*, u.id as user_id, u.email, u.first_name, u.last_name, 
              u.is_verified, u.is_active, u.created_at, u.updated_at, u.last_login
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1 
         AND rt.expires_at > CURRENT_TIMESTAMP 
         AND rt.is_revoked = FALSE 
         AND u.is_active = TRUE`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      tokenId: row.id,
      user: new User({
        id: row.user_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        is_verified: row.is_verified,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_login: row.last_login
      })
    };
  }

  // Revoke all refresh tokens for user
  async revokeAllRefreshTokens() {
    await query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
      [this.id]
    );
  }

  // Clean up expired tokens
  static async cleanupExpiredTokens() {
    const result = await query(
      'DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = TRUE'
    );
    return result.rowCount;
  }

  // Serialize user for JSON response (exclude sensitive data)
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin
    };
  }
}

module.exports = User;

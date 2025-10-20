# AuthKit Security Documentation

## 🛡️ Security Features Overview

AuthKit implements enterprise-grade security controls for JWT-based authentication with comprehensive protection against common web vulnerabilities.

## 🔐 JWT Token Security

### Access Tokens
- **Expiration**: 15 minutes (900 seconds) - configurable via `JWT_EXPIRATION`
- **Storage**: Client-side (memory/localStorage) - short-lived for security
- **Algorithm**: HS256 with strong secret keys
- **Claims**: User ID, email, token type, issuer, audience

### Refresh Tokens
- **Expiration**: 7 days - configurable via `JWT_REFRESH_EXPIRES_IN`
- **Storage**: httpOnly cookies ONLY (prevents XSS attacks)
- **Rotation**: New refresh token generated on each use
- **Database Tracking**: All refresh tokens stored and validated in database

## 🍪 Cookie Security

### httpOnly Cookies
```javascript
{
  httpOnly: true,                    // Prevents XSS access
  secure: NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',               // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth'                 // Restricted path
}
```

### Security Benefits
- ✅ **XSS Protection**: JavaScript cannot access httpOnly cookies
- ✅ **CSRF Protection**: SameSite=strict prevents cross-site requests
- ✅ **Secure Transport**: HTTPS-only in production
- ✅ **Path Restriction**: Cookies only sent to auth endpoints

## 🚨 XSS Attack Detection

### Automatic Detection
The system automatically detects potential XSS attacks when:
- Invalid refresh tokens are presented
- Tokens fail verification
- Database validation fails

### Response to XSS Detection
```javascript
console.error(`[CRITICAL SECURITY ALERT] Refresh token stolen via XSS!`);
console.error(`Details: IP=${req.ip}, User-Agent=${req.headers['user-agent']}`);
```

### Actions Taken
1. **Log Security Alert**: Detailed logging with IP, User-Agent, timestamp
2. **Clear Invalid Cookie**: Remove compromised cookie immediately
3. **Return 401 Error**: "Refresh token stolen via XSS!" message
4. **Revoke Token**: Mark token as revoked in database

## 🔒 API Route Protection

### Strict Security Rules
1. **All `/api/` routes require authentication**
2. **Unauthenticated requests return 404** (security through obscurity)
3. **Refresh token cookie required** for API access
4. **Public endpoints explicitly whitelisted**

### Implementation
```javascript
app.use('/api', (req, res, next) => {
  if (req.url.startsWith('/api/')) {
    if (!req.cookies.refreshToken) {
      return res.status(401).send("Missing auth");
    }
  }
  next();
});
```

### Public Endpoints (No Auth Required)
- `GET /health` - Health check
- `GET /api/status` - API status
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## 🛡️ Security Middleware Stack

### 1. Helmet.js Security Headers
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- And more...

### 2. CORS Protection
- Configurable origins
- Credentials support
- Preflight handling

### 3. Rate Limiting
- IP-based rate limiting
- Configurable windows and limits
- Brute force protection

### 4. Input Validation
- Joi schema validation
- SQL injection prevention
- XSS input sanitization

## 🔍 Security Audit System

### Automated Checks
Run `npm run audit` to check:
- ✅ httpOnly cookie configuration
- ⚠️ JWT expiration times (warns if > 30 minutes)
- ❌ Unprotected `/api/` endpoints
- 🔐 Environment variable security
- 🛡️ Security headers configuration
- 🗄️ Database security (parameterized queries)

### Auto-Fix Capability
Run `npm run fix` to automatically fix:
- Missing httpOnly flags
- Insecure cookie configurations
- Basic security misconfigurations

## 🗄️ Database Security

### SQL Injection Prevention
- **Parameterized Queries**: All queries use `$1, $2, ...` parameters
- **Input Validation**: Joi schemas validate all inputs
- **Connection Pooling**: Secure connection management

### Password Security
- **bcrypt Hashing**: Industry-standard password hashing
- **Configurable Rounds**: Default 12 rounds (adjustable)
- **Salt Generation**: Automatic salt generation per password

### Token Storage
- **Hashed Storage**: Refresh tokens stored as SHA-256 hashes
- **Expiration Tracking**: Database-level expiration validation
- **Revocation Support**: Tokens can be revoked immediately

## 📊 Security Monitoring

### Logging Levels
- **INFO**: Normal operations
- **WARN**: Security warnings
- **ERROR**: Security violations
- **CRITICAL**: Active attacks detected

### Monitored Events
- Failed login attempts
- Invalid token usage
- XSS attack attempts
- API access violations
- Token refresh patterns

## 🚨 Incident Response

### XSS Attack Response
1. **Immediate**: Clear compromised cookies
2. **Log**: Record attack details
3. **Revoke**: Invalidate all user tokens
4. **Alert**: Security team notification
5. **Monitor**: Watch for continued attempts

### Brute Force Response
1. **Rate Limit**: Automatic IP blocking
2. **Log**: Record attack patterns
3. **Alert**: Security monitoring
4. **Escalate**: Manual review if needed

## 🔧 Security Configuration

### Environment Variables
```env
# JWT Security
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
JWT_EXPIRATION=900  # 15 minutes
JWT_REFRESH_EXPIRES_IN=7d

# Cookie Security
COOKIE_SECRET=<strong-random-secret>

# Security Headers
NODE_ENV=production  # Enables secure cookies
```

### Production Checklist
- [ ] Replace all demo credentials
- [ ] Use strong random secrets (32+ characters)
- [ ] Enable HTTPS (secure cookies)
- [ ] Configure proper CORS origins
- [ ] Set up security monitoring
- [ ] Regular security audits
- [ ] Database SSL connections
- [ ] Firewall configuration

## 📚 Security Best Practices

### For Developers
1. **Never log sensitive data** (tokens, passwords)
2. **Validate all inputs** before processing
3. **Use parameterized queries** always
4. **Implement proper error handling**
5. **Regular security updates**

### For Deployment
1. **Use HTTPS everywhere**
2. **Secure environment variables**
3. **Regular backups with encryption**
4. **Monitor security logs**
5. **Incident response plan**

## 🔗 Security Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**🛡️ Security is not a feature, it's a foundation. AuthKit is built security-first.**

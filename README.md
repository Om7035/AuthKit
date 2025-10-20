# AuthKit - Secure Authentication API

A production-ready authentication API built with Express.js and PostgreSQL, featuring strict security controls and comprehensive audit capabilities.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Database**: PostgreSQL with connection pooling and migrations
- **Security**: Comprehensive security middleware and audit tools
- **API Protection**: All `/api/` routes require authentication (returns 404 if unauthenticated)
- **httpOnly Cookies**: Secure refresh token storage
- **Rate Limiting**: Built-in protection against brute force attacks
- **Security Audit**: Automated security checking and fixing tools
- **Docker Support**: Complete containerization with docker-compose

## 📋 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /api/status` - API status
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Protected Endpoints (require authentication)
- `GET /api/user/me` - Get current user profile
- `POST /api/auth/logout` - User logout
- `POST /api/auth/logout-all` - Logout from all devices
- `GET /api/user/sessions` - Get active sessions

## 🛡️ Security Features

### Strict Security Rules
1. **API Route Protection**: All `/api/` routes return 404 if not authenticated
2. **httpOnly Cookies**: Refresh tokens stored in secure httpOnly cookies
3. **JWT Expiration**: Access tokens expire in 15 minutes (configurable)
4. **Password Security**: Bcrypt hashing with configurable rounds
5. **Rate Limiting**: Configurable request limits per IP
6. **Security Headers**: Helmet.js for security headers
7. **CORS Protection**: Configurable CORS settings

### Security Audit Tool
Run comprehensive security checks:

```bash
# Run security audit
npm run audit

# Run audit with verbose output
npm run audit -- --verbose

# Auto-fix security issues
npm run fix
```

The audit checks for:
- ✅ httpOnly cookie configuration
- ⚠️ JWT expiration times (warns if > 30 minutes)
- ❌ Unprotected `/api/` endpoints
- 🔐 Environment variable security
- 🛡️ Security headers configuration
- 🗄️ Database security (parameterized queries, password hashing)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (if running locally)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd authkit
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` file with your settings:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=authkit
DB_USER=authkit_user
DB_PASSWORD=your_secure_password

# JWT Secrets (generate strong random values)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Other configurations...
```

### 3. Run with Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### 4. Run Locally
```bash
# Install dependencies
npm install

# Start PostgreSQL (ensure it's running)
# Run migrations (database will be initialized automatically)

# Start development server
npm run dev

# Or start production server
npm start
```

## 🔧 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run audit` - Run security audit
- `npm run fix` - Auto-fix security issues

### Project Structure
```
authkit/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── models/
│   │   └── User.js              # User model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   └── user.js              # User routes
│   ├── utils/
│   │   └── jwt.js               # JWT utilities
│   ├── init.sql                 # Database initialization
│   ├── Dockerfile               # Docker configuration
│   └── index.js                 # Main server file
├── scripts/
│   └── security-audit.js        # Security audit tool
├── frontend/                    # (Future frontend application)
├── docker-compose.yml           # Docker services
├── package.json                 # Dependencies and scripts
└── .env.example                 # Environment template
```

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env` files to version control
- Use strong, random secrets for JWT keys
- Replace demo Google credentials in production
- Set `NODE_ENV=production` in production

### Database Security
- Use parameterized queries (already implemented)
- Enable SSL in production
- Regular security updates
- Backup encryption

### API Security
- All sensitive endpoints require authentication
- Rate limiting prevents brute force attacks
- Security headers protect against common attacks
- Input validation on all endpoints

## ⚠️ Demo Credentials Warning

This project includes hardcoded demo Google OAuth credentials:
- `GOOGLE_CLIENT_ID=AUTHKIT_DEMO_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET=AUTHKIT_DEMO_SECRET`

**🚨 FOR DEMO ONLY - NEVER USE IN PRODUCTION**

Replace with real Google OAuth credentials before deploying to production.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps
   
   # Check database logs
   docker-compose logs postgres
   ```

2. **Authentication Errors**
   ```bash
   # Run security audit
   npm run audit
   
   # Check JWT configuration
   echo $JWT_SECRET
   ```

3. **Port Already in Use**
   ```bash
   # Change PORT in .env file
   PORT=3001
   ```

## 📊 API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": [] // Optional validation details
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run security audit: `npm run audit`
4. Commit your changes
5. Push to the branch
6. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Built with ❤️ for secure authentication**
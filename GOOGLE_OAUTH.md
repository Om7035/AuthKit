# Google OAuth Integration - Demo Mode

## 🚨 **DEMO CREDENTIALS WARNING**

This implementation uses **hardcoded demo credentials** for development and testing purposes:

```javascript
const GOOGLE_CLIENT_ID = "AUTHKIT_DEMO_CLIENT_ID";
const GOOGLE_CLIENT_SECRET = "AUTHKIT_DEMO_SECRET";
```

**⚠️ THIS IS FOR DEMO ONLY - NEVER USE IN PRODUCTION ⚠️**

## 🔗 Available Endpoints

### 1. **GET /api/auth/google/status**
Check Google OAuth configuration and get setup instructions.

**Response:**
```json
{
  "success": true,
  "message": "Google OAuth Demo Configuration",
  "demo": true,
  "configuration": {
    "client_id": "AUTHKIT_DEMO_CLIENT_ID",
    "client_secret": "***",
    "demo_user": "demo@authkit.com",
    "warning": "⚠️ THIS IS FOR DEMO ONLY - NEVER USE IN PRODUCTION ⚠️"
  }
}
```

### 2. **GET /api/auth/google**
Initiate Google OAuth (Demo Mode) - Returns instructions instead of redirecting.

**Response:**
```json
{
  "success": true,
  "message": "Demo Google OAuth - Use the login endpoint with email parameter",
  "demo": true,
  "instructions": {
    "demoLogin": "POST /api/auth/google/demo with { \"email\": \"demo@authkit.com\" }",
    "testLogin": "POST /api/auth/google/demo with { \"email\": \"test@example.com\" }"
  }
}
```

### 3. **POST /api/auth/google/demo**
Simulate Google OAuth login with any email address.

**Request Body:**
```json
{
  "email": "demo@authkit.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Account created and logged in via Google",
  "data": {
    "user": {
      "id": 1,
      "email": "demo@authkit.com",
      "firstName": "Demo",
      "lastName": "User",
      "isVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "provider": "google",
    "isNewUser": true
  }
}
```

**Error Response (OAuth Failure):**
```json
{
  "success": false,
  "error": "Demo mode only. No real keys needed!",
  "message": "This is a demo implementation. In production, configure real Google OAuth credentials.",
  "code": "DEMO_OAUTH_ERROR"
}
```

### 4. **GET /api/auth/google/callback**
Google OAuth callback (Demo Mode) - Returns demo message.

**Response:**
```json
{
  "success": false,
  "error": "Demo mode only. No real keys needed!",
  "message": "This is a demo callback. Use POST /api/auth/google/demo instead.",
  "demo": true
}
```

## 🎯 **User Flow Logic**

### Demo User (`demo@authkit.com`)
1. **Auto-create demo user** if email matches `demo@authkit.com`
2. Uses predefined demo user data
3. Sets demo password: `demo123`
4. Logs success: `[DEMO] Auto-creating demo user for demo@authkit.com`

### Other Emails
1. **Check if email exists** → link to existing account if possible
2. **Else create new account** with Google user data
3. Generate random password for OAuth users
4. Log: `[OAUTH] Processing Google OAuth for email: user@example.com`

### Error Handling
- **If OAuth fails**: Return 500 with message `"Demo mode only. No real keys needed!"`
- **Invalid email**: Return 400 with validation error
- **Missing email**: Return 400 with `"Email is required for demo Google OAuth"`

## 🔧 **Testing the Implementation**

### 1. Test Demo User Login
```bash
curl -X POST http://localhost:3000/api/auth/google/demo \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@authkit.com"}'
```

### 2. Test New User Creation
```bash
curl -X POST http://localhost:3000/api/auth/google/demo \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 3. Test Configuration Status
```bash
curl http://localhost:3000/api/auth/google/status
```

## 🚀 **Production Setup Instructions**

To use real Google OAuth in production:

### Step 1: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials

### Step 2: Configure Credentials
1. Set authorized redirect URIs:
   - `https://yourdomain.com/api/auth/google/callback`
2. Get your `CLIENT_ID` and `CLIENT_SECRET`

### Step 3: Update Code
```javascript
// Replace hardcoded values with environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
```

### Step 4: Environment Variables
```env
GOOGLE_CLIENT_ID=your-real-client-id
GOOGLE_CLIENT_SECRET=your-real-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

### Step 5: Implement Real OAuth Flow
1. Replace demo endpoints with real Google OAuth redirects
2. Handle actual OAuth callback with authorization code
3. Exchange code for access token
4. Fetch user profile from Google API
5. Remove demo-specific logic

## 🔒 **Security Features**

### httpOnly Cookies
- Refresh tokens stored in secure httpOnly cookies
- Prevents XSS attacks on OAuth tokens
- Same security as regular authentication

### Token Management
- JWT access tokens with 15-minute expiration
- Refresh token rotation on each use
- Database tracking of all refresh tokens

### Demo Safety
- Clear warnings about demo credentials
- Fails safely with descriptive error messages
- No real Google API calls made

## 📝 **Comments in Code**

The implementation includes the required comment:
```javascript
// This demo uses pre-registered Google credentials. Skip OAuth setup.
```

And comprehensive warnings:
```javascript
// ⚠️ WARNING: THIS IS FOR DEMO ONLY - NEVER USE IN PRODUCTION ⚠️
// These are hardcoded demo credentials for development/testing
// Replace with real Google OAuth credentials in production
```

---

**🎭 This is a complete demo implementation that simulates Google OAuth without requiring real Google credentials!**

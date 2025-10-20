#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

class SecurityAudit {
  constructor() {
    this.criticalIssues = [];
    this.warnings = [];
    this.fixMode = process.argv.includes('--fix');
    this.hasIssues = false;
  }

  // Print critical issue
  printCritical(message, fixHint = null) {
    console.log(`❌ Critical: ${message}${fixHint ? ` [FIX: ${fixHint}]` : ''}`);
    this.criticalIssues.push({ message, fixHint });
    this.hasIssues = true;
  }

  // Print warning
  printWarning(message) {
    console.log(`⚠️ Warn: ${message}`);
    this.warnings.push(message);
  }

  // Print success
  printSuccess(message) {
    console.log(`✅ ${message}`);
  }

  // 1. Check if httpOnly cookie is set for refresh token in /api/refresh_token route
  checkHttpOnlyCookie() {
    try {
      const authRoutesPath = path.join(__dirname, '../backend/routes/auth.js');
      const cookieAuthPath = path.join(__dirname, '../backend/middleware/cookieAuth.js');
      
      let content = '';
      
      if (fs.existsSync(authRoutesPath)) {
        content += fs.readFileSync(authRoutesPath, 'utf8');
      }
      
      if (fs.existsSync(cookieAuthPath)) {
        content += fs.readFileSync(cookieAuthPath, 'utf8');
      }
      
      // Check for refresh token route and httpOnly configuration
      const hasRefreshRoute = /router\.post\s*\(\s*['"`]\/refresh['"`]/gi.test(content);
      const hasHttpOnly = /httpOnly:\s*true/gi.test(content);
      const hasSecureCookieFunction = /setSecureRefreshTokenCookie/gi.test(content);
      
      if (hasRefreshRoute && (hasHttpOnly || hasSecureCookieFunction)) {
        this.printSuccess('Refresh token cookie has httpOnly protection');
      } else if (hasRefreshRoute) {
        this.printCritical('Refresh token cookie missing httpOnly!', 'npm run fix');
      } else {
        this.printCritical('No refresh token route found!', 'Add refresh token endpoint');
      }
    } catch (err) {
      this.printCritical(`Failed to check httpOnly cookie: ${err.message}`);
    }
  }

  // 2. Check JWT expiration - warn if > 1800 seconds (30 mins)
  checkJWTExpiration() {
    try {
      const jwtExpiration = parseInt(process.env.JWT_EXPIRATION) || 900;
      
      if (jwtExpiration > 1800) {
        this.printWarning('JWT expiration too long (30+ mins). Reduce to 15 mins.');
      } else {
        this.printSuccess(`JWT expiration is ${jwtExpiration} seconds (within 30 min limit)`);
      }
    } catch (err) {
      this.printCritical(`Failed to check JWT expiration: ${err.message}`);
    }
  }

  // 3. Check /api/me route for auth middleware
  checkApiRouteProtection() {
    try {
      const userRoutesPath = path.join(__dirname, '../backend/routes/user.js');
      
      if (fs.existsSync(userRoutesPath)) {
        const userRoutesContent = fs.readFileSync(userRoutesPath, 'utf8');
        
        // Check if /me route exists and has auth middleware
        const hasMeRoute = /router\.get\s*\(\s*['"`]\/me['"`]/gi.test(userRoutesContent);
        const hasAuthMiddleware = /authenticateToken/gi.test(userRoutesContent);
        
        if (hasMeRoute && hasAuthMiddleware) {
          this.printSuccess('/api/me route is properly protected with auth middleware');
        } else if (hasMeRoute) {
          this.printCritical('Unprotected route!', 'Add auth middleware');
        } else {
          this.printSuccess('No /api/me route found (or properly protected)');
        }
      } else {
        this.printSuccess('No user routes file found');
      }
    } catch (err) {
      this.printCritical(`Failed to check API route protection: ${err.message}`);
    }
  }

  // Auto-fix functionality for npm run fix
  async autoFix() {
    if (!this.fixMode) return;
    
    console.log('\n🔧 Auto-fixing issues...');
    let fixed = false;
    
    // 1. Fix httpOnly cookie if missing
    try {
      const authRoutesPath = path.join(__dirname, '../backend/routes/auth.js');
      if (fs.existsSync(authRoutesPath)) {
        let authContent = fs.readFileSync(authRoutesPath, 'utf8');
        
        // Add httpOnly: true to refresh token cookies
        const originalContent = authContent;
        authContent = authContent.replace(
          /res\.cookie\s*\(\s*['"`]refreshToken['"`]\s*,\s*[^,]+\s*,\s*{([^}]*)}/g,
          (match, options) => {
            if (!options.includes('httpOnly')) {
              const newOptions = options.trim() ? `${options.trim()}, httpOnly: true` : 'httpOnly: true';
              return match.replace(options, newOptions);
            }
            return match;
          }
        );
        
        if (authContent !== originalContent) {
          fs.writeFileSync(authRoutesPath, authContent);
          console.log('✅ Fixed: Added httpOnly flag to refresh token cookies');
          fixed = true;
        }
      }
    } catch (err) {
      console.log(`❌ Failed to fix httpOnly cookie: ${err.message}`);
    }
    
    // 2. Fix JWT expiration if too long
    try {
      const envPath = path.join(__dirname, '../.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        const originalContent = envContent;
        
        // Set JWT_EXPIRATION to 900 seconds (15 mins) if > 1800
        envContent = envContent.replace(
          /JWT_EXPIRATION=\d+/g,
          'JWT_EXPIRATION=900'
        );
        
        // Add JWT_EXPIRATION if it doesn't exist
        if (!envContent.includes('JWT_EXPIRATION=')) {
          envContent += '\nJWT_EXPIRATION=900\n';
        }
        
        if (envContent !== originalContent) {
          fs.writeFileSync(envPath, envContent);
          console.log('✅ Fixed: Set JWT expiration to 900 seconds (15 mins)');
          fixed = true;
        }
      }
    } catch (err) {
      console.log(`❌ Failed to fix JWT expiration: ${err.message}`);
    }
    
    if (!fixed) {
      console.log('ℹ️  No fixes needed or applied');
    }
  }

  // Run security audit
  async runAudit() {
    console.log('🛡️ AuthKit Security Audit\n');
    
    // Run all checks
    this.checkHttpOnlyCookie();
    this.checkJWTExpiration();
    this.checkApiRouteProtection();
    
    // Auto-fix if requested
    if (this.fixMode) {
      await this.autoFix();
    }
    
    // Return appropriate exit code
    if (this.hasIssues) {
      console.log('\n❌ Security audit failed - issues found!');
      process.exit(1);
    } else {
      console.log('\n✅ Security audit passed!');
      process.exit(0);
    }
  }
}

// Run the audit
if (require.main === module) {
  const audit = new SecurityAudit();
  audit.runAudit().catch(err => {
    console.error('❌ Security audit failed:', err);
    process.exit(1);
  });
}

module.exports = SecurityAudit;

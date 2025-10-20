#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

class SecurityAudit {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
    this.fixMode = process.argv.includes('--fix');
    this.verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  }

  // Add issue to the list
  addIssue(type, message, severity = 'FAIL', fix = null) {
    const issue = { type, message, severity, fix };
    
    if (severity === 'FAIL') {
      this.issues.push(issue);
    } else if (severity === 'WARN') {
      this.warnings.push(issue);
    } else {
      this.passed.push(issue);
    }
  }

  // Check if httpOnly cookie is set for refresh token
  checkHttpOnlyCookie() {
    console.log('🔍 Checking httpOnly cookie configuration...');
    
    try {
      const authRoutesPath = path.join(__dirname, '../backend/routes/auth.js');
      const authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
      
      // Check for httpOnly: true in cookie configuration
      const httpOnlyRegex = /httpOnly:\s*true/gi;
      const cookieRegex = /\.cookie\s*\(/gi;
      
      const hasHttpOnly = httpOnlyRegex.test(authRoutesContent);
      const hasCookie = cookieRegex.test(authRoutesContent);
      
      if (hasCookie && hasHttpOnly) {
        this.addIssue(
          'httpOnly_cookie',
          '✅ httpOnly cookie is properly configured for refresh tokens',
          'PASS'
        );
      } else if (hasCookie && !hasHttpOnly) {
        this.addIssue(
          'httpOnly_cookie',
          '❌ CRITICAL: Refresh token cookie is missing httpOnly flag - this is a security vulnerability!',
          'FAIL',
          'Add httpOnly: true to cookie configuration'
        );
      } else {
        this.addIssue(
          'httpOnly_cookie',
          '⚠️  No cookie configuration found - refresh tokens may not be using httpOnly cookies',
          'WARN'
        );
      }
    } catch (err) {
      this.addIssue(
        'httpOnly_cookie',
        `❌ Failed to check httpOnly cookie configuration: ${err.message}`,
        'FAIL'
      );
    }
  }

  // Check JWT expiration time
  checkJWTExpiration() {
    console.log('🔍 Checking JWT expiration configuration...');
    
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    
    // Parse expiration time
    const parseExpirationTime = (timeString) => {
      const match = timeString.match(/^(\d+)([smhd])$/);
      if (!match) return null;
      
      const [, value, unit] = match;
      const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
      
      return parseInt(value) * multipliers[unit];
    };
    
    const expirationSeconds = parseExpirationTime(jwtExpiresIn);
    
    if (expirationSeconds === null) {
      this.addIssue(
        'jwt_expiration',
        `❌ Invalid JWT expiration format: ${jwtExpiresIn}`,
        'FAIL'
      );
      return;
    }
    
    const thirtyMinutes = 30 * 60; // 30 minutes in seconds
    
    if (expirationSeconds > thirtyMinutes) {
      this.addIssue(
        'jwt_expiration',
        `⚠️  JWT expiration time (${jwtExpiresIn}) is longer than 30 minutes - consider shorter expiration for better security`,
        'WARN',
        'Set JWT_EXPIRES_IN to 15m or less in environment variables'
      );
    } else {
      this.addIssue(
        'jwt_expiration',
        `✅ JWT expiration time (${jwtExpiresIn}) is within recommended limits`,
        'PASS'
      );
    }
  }

  // Check if /api/ endpoints are properly protected
  checkApiEndpointProtection() {
    console.log('🔍 Checking API endpoint protection...');
    
    try {
      // Check main server file for authentication middleware
      const serverPath = path.join(__dirname, '../backend/index.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      // Check for blockUnauthenticatedApi middleware
      const hasApiProtection = /blockUnauthenticatedApi/gi.test(serverContent);
      
      if (hasApiProtection) {
        this.addIssue(
          'api_protection',
          '✅ API endpoints are protected with authentication middleware',
          'PASS'
        );
      } else {
        this.addIssue(
          'api_protection',
          '❌ CRITICAL: /api/ endpoints are not properly protected - unauthenticated access possible!',
          'FAIL',
          'Add blockUnauthenticatedApi middleware to protect /api/ routes'
        );
      }
      
      // Check auth middleware file
      const authMiddlewarePath = path.join(__dirname, '../backend/middleware/auth.js');
      if (fs.existsSync(authMiddlewarePath)) {
        const authContent = fs.readFileSync(authMiddlewarePath, 'utf8');
        
        // Check for proper 404 response on unauthenticated API access
        const has404Response = /404.*Not Found/gi.test(authContent);
        
        if (has404Response) {
          this.addIssue(
            'api_protection',
            '✅ Unauthenticated API requests return 404 (security through obscurity)',
            'PASS'
          );
        } else {
          this.addIssue(
            'api_protection',
            '⚠️  Consider returning 404 instead of 401 for unauthenticated API requests',
            'WARN'
          );
        }
      }
    } catch (err) {
      this.addIssue(
        'api_protection',
        `❌ Failed to check API endpoint protection: ${err.message}`,
        'FAIL'
      );
    }
  }

  // Check environment variables security
  checkEnvironmentSecurity() {
    console.log('🔍 Checking environment variables security...');
    
    const requiredSecrets = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'COOKIE_SECRET'
    ];
    
    const demoCredentials = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];
    
    // Check for required secrets
    requiredSecrets.forEach(secret => {
      const value = process.env[secret];
      if (!value) {
        this.addIssue(
          'environment_security',
          `❌ Missing required environment variable: ${secret}`,
          'FAIL',
          `Set ${secret} in your .env file`
        );
      } else if (value.includes('change-in-production') || value.length < 32) {
        this.addIssue(
          'environment_security',
          `⚠️  ${secret} appears to be using default/weak value`,
          'WARN',
          `Generate a strong random value for ${secret}`
        );
      } else {
        this.addIssue(
          'environment_security',
          `✅ ${secret} is properly configured`,
          'PASS'
        );
      }
    });
    
    // Check for demo credentials in production
    if (process.env.NODE_ENV === 'production') {
      demoCredentials.forEach(cred => {
        const value = process.env[cred];
        if (value && (value.includes('DEMO') || value.includes('AUTHKIT_DEMO'))) {
          this.addIssue(
            'environment_security',
            `❌ CRITICAL: Demo credentials detected in production for ${cred}!`,
            'FAIL',
            `Replace ${cred} with real production credentials`
          );
        }
      });
    }
  }

  // Check for security headers
  checkSecurityHeaders() {
    console.log('🔍 Checking security headers configuration...');
    
    try {
      const serverPath = path.join(__dirname, '../backend/index.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const securityChecks = [
        { name: 'Helmet', pattern: /helmet/gi, description: 'Security headers middleware' },
        { name: 'CORS', pattern: /cors/gi, description: 'CORS configuration' },
        { name: 'Rate Limiting', pattern: /rateLimit|express-rate-limit/gi, description: 'Rate limiting protection' }
      ];
      
      securityChecks.forEach(check => {
        if (check.pattern.test(serverContent)) {
          this.addIssue(
            'security_headers',
            `✅ ${check.description} is configured`,
            'PASS'
          );
        } else {
          this.addIssue(
            'security_headers',
            `⚠️  ${check.description} is not configured`,
            'WARN',
            `Add ${check.name} middleware for better security`
          );
        }
      });
    } catch (err) {
      this.addIssue(
        'security_headers',
        `❌ Failed to check security headers: ${err.message}`,
        'FAIL'
      );
    }
  }

  // Check database security
  checkDatabaseSecurity() {
    console.log('🔍 Checking database security configuration...');
    
    // Check for SQL injection protection
    try {
      const userModelPath = path.join(__dirname, '../backend/models/User.js');
      const userModelContent = fs.readFileSync(userModelPath, 'utf8');
      
      // Check for parameterized queries
      const hasParameterizedQueries = /\$\d+/g.test(userModelContent);
      
      if (hasParameterizedQueries) {
        this.addIssue(
          'database_security',
          '✅ Parameterized queries are used (SQL injection protection)',
          'PASS'
        );
      } else {
        this.addIssue(
          'database_security',
          '❌ CRITICAL: SQL queries may not be properly parameterized!',
          'FAIL',
          'Use parameterized queries to prevent SQL injection'
        );
      }
      
      // Check for password hashing
      const hasPasswordHashing = /bcrypt/gi.test(userModelContent);
      
      if (hasPasswordHashing) {
        this.addIssue(
          'database_security',
          '✅ Password hashing is implemented',
          'PASS'
        );
      } else {
        this.addIssue(
          'database_security',
          '❌ CRITICAL: Password hashing may not be implemented!',
          'FAIL',
          'Implement proper password hashing with bcrypt'
        );
      }
    } catch (err) {
      this.addIssue(
        'database_security',
        `❌ Failed to check database security: ${err.message}`,
        'FAIL'
      );
    }
  }

  // Attempt to fix issues automatically
  async autoFix() {
    if (!this.fixMode) return;
    
    console.log('\n🔧 Attempting to auto-fix issues...');
    
    // Fix httpOnly cookie if missing
    const httpOnlyIssue = this.issues.find(issue => 
      issue.type === 'httpOnly_cookie' && issue.severity === 'FAIL'
    );
    
    if (httpOnlyIssue) {
      try {
        const authRoutesPath = path.join(__dirname, '../backend/routes/auth.js');
        let authContent = fs.readFileSync(authRoutesPath, 'utf8');
        
        // Simple fix: replace cookie calls to include httpOnly
        authContent = authContent.replace(
          /res\.cookie\s*\(\s*['"`]refreshToken['"`]\s*,\s*refreshToken\s*,\s*{([^}]*)}/g,
          (match, options) => {
            if (!options.includes('httpOnly')) {
              const newOptions = options.trim() ? `${options.trim()}, httpOnly: true` : 'httpOnly: true';
              return `res.cookie('refreshToken', refreshToken, { ${newOptions} }`;
            }
            return match;
          }
        );
        
        fs.writeFileSync(authRoutesPath, authContent);
        console.log('✅ Fixed: Added httpOnly flag to refresh token cookies');
      } catch (err) {
        console.log(`❌ Failed to fix httpOnly cookie: ${err.message}`);
      }
    }
  }

  // Run all security checks
  async runAudit() {
    console.log('🛡️  AuthKit Security Audit Starting...\n');
    
    this.checkHttpOnlyCookie();
    this.checkJWTExpiration();
    this.checkApiEndpointProtection();
    this.checkEnvironmentSecurity();
    this.checkSecurityHeaders();
    this.checkDatabaseSecurity();
    
    // Attempt auto-fixes if requested
    await this.autoFix();
    
    this.printResults();
    
    // Exit with appropriate code
    process.exit(this.issues.length > 0 ? 1 : 0);
  }

  // Print audit results
  printResults() {
    console.log('\n📊 Security Audit Results');
    console.log('========================\n');
    
    // Print failures
    if (this.issues.length > 0) {
      console.log('❌ CRITICAL ISSUES:');
      this.issues.forEach(issue => {
        console.log(`   ${issue.message}`);
        if (issue.fix && this.verbose) {
          console.log(`   💡 Fix: ${issue.fix}`);
        }
      });
      console.log('');
    }
    
    // Print warnings
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(warning => {
        console.log(`   ${warning.message}`);
        if (warning.fix && this.verbose) {
          console.log(`   💡 Suggestion: ${warning.fix}`);
        }
      });
      console.log('');
    }
    
    // Print passed checks
    if (this.passed.length > 0 && this.verbose) {
      console.log('✅ PASSED CHECKS:');
      this.passed.forEach(passed => {
        console.log(`   ${passed.message}`);
      });
      console.log('');
    }
    
    // Summary
    const total = this.issues.length + this.warnings.length + this.passed.length;
    console.log(`📈 Summary: ${this.passed.length}/${total} checks passed, ${this.warnings.length} warnings, ${this.issues.length} critical issues`);
    
    if (this.issues.length > 0) {
      console.log('\n🚨 SECURITY AUDIT FAILED - Please fix critical issues before deploying to production!');
      if (!this.fixMode) {
        console.log('💡 Run with --fix flag to attempt automatic fixes');
      }
    } else if (this.warnings.length > 0) {
      console.log('\n⚠️  Security audit passed with warnings - consider addressing them for better security');
    } else {
      console.log('\n🎉 Security audit passed! Your AuthKit API appears to be properly secured.');
    }
    
    console.log('\n🔗 For more security best practices, visit: https://owasp.org/www-project-api-security/');
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

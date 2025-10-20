import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Code, Database, Lock, Key, Users, CheckCircle, Play, ExternalLink } from 'lucide-react';

const DemoPage = () => {
  const features = [
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'JWT Authentication',
      description: 'Secure JWT-based authentication with 15-minute access tokens and 7-day refresh tokens.',
      details: ['Access tokens expire in 15 minutes', 'Refresh tokens stored in httpOnly cookies', 'Automatic token refresh']
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Security Features',
      description: 'Comprehensive security controls including XSS protection and security auditing.',
      details: ['httpOnly cookies prevent XSS', 'Rate limiting protection', 'Automated security audit']
    },
    {
      icon: <Key className="w-6 h-6" />,
      title: 'Google OAuth',
      description: 'Demo Google OAuth integration with hardcoded credentials for testing.',
      details: ['Demo credentials included', 'Auto-create demo users', 'Production setup guide']
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'PostgreSQL Backend',
      description: 'Robust PostgreSQL database with connection pooling and migrations.',
      details: ['Connection pooling', 'Database migrations', 'Parameterized queries']
    }
  ];

  const demoSteps = [
    {
      step: 1,
      title: 'Try Demo Login',
      description: 'Use demo@authkit.com / password to test email authentication',
      action: 'Go to Login',
      link: '/login'
    },
    {
      step: 2,
      title: 'Test Registration',
      description: 'Create a new account with your own email address',
      action: 'Register Now',
      link: '/register'
    },
    {
      step: 3,
      title: 'Explore Dashboard',
      description: 'View your profile and account information after logging in',
      action: 'View Features',
      link: '#features'
    }
  ];

  const apiEndpoints = [
    { method: 'POST', path: '/api/auth/login', description: 'User login with email/password' },
    { method: 'POST', path: '/api/auth/register', description: 'Create new user account' },
    { method: 'POST', path: '/api/auth/refresh', description: 'Refresh access token' },
    { method: 'POST', path: '/api/auth/google/demo', description: 'Demo Google OAuth login' },
    { method: 'GET', path: '/api/user/me', description: 'Get current user profile' },
    { method: 'POST', path: '/api/auth/logout', description: 'Logout current session' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AuthKit Demo</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How AuthKit Works
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Explore the features and capabilities of AuthKit's secure authentication system. 
            Try the demo with real functionality or dive into the technical details.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Try Demo Now</span>
            </Link>
            <a
              href="https://github.com/Om7035/AuthKit"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Code className="w-5 h-5" />
              <span>View Source</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Demo Steps */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Try the Demo</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Follow these steps to experience AuthKit's authentication system in action.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {demoSteps.map((step) => (
              <div key={step.step} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-lg">{step.step}</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h4>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <Link
                  to={step.link}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <span>{step.action}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              AuthKit provides enterprise-grade security features out of the box.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">API Endpoints</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore the available API endpoints for authentication and user management.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Available Endpoints</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {apiEndpoints.map((endpoint, index) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-900">{endpoint.path}</code>
                  </div>
                  <span className="text-sm text-gray-600">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Demo Credentials</h3>
              <p className="text-gray-600 mb-6">
                Use these credentials to test the authentication system without creating an account.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <code className="text-sm font-mono text-blue-600">demo@authkit.com</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Password:</span>
                    <code className="text-sm font-mono text-blue-600">password</code>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Try Demo Login
                </Link>
                <Link
                  to="/register"
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Create New Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 AuthKit Demo. Built with Express.js, PostgreSQL, and React.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DemoPage;

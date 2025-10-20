import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Key, Users, ArrowRight, Play } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span className="font-medium">
                AuthKit Demo: Try login with <code className="bg-blue-700 px-2 py-1 rounded text-sm">demo@authkit.com</code> / <code className="bg-blue-700 px-2 py-1 rounded text-sm">password</code>
              </span>
            </div>
            <Link
              to="/demo"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
            >
              <span>See How It Works</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AuthKit</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Secure Authentication
            <span className="block text-blue-600">Made Simple</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A production-ready authentication API built with Express.js and PostgreSQL, 
            featuring strict security controls and comprehensive audit capabilities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Try Demo</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/demo"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>View Documentation</span>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">JWT Security</h3>
            <p className="text-gray-600">
              Secure JWT-based authentication with refresh tokens stored in httpOnly cookies for maximum security.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Security Audit</h3>
            <p className="text-gray-600">
              Automated security checking and fixing tools with comprehensive audit capabilities.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Key className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">OAuth Integration</h3>
            <p className="text-gray-600">
              Built-in Google OAuth support with demo credentials for easy testing and development.
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-16 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Test?</h3>
            <p className="text-gray-600 mb-6">
              Use our demo credentials to explore all features without any setup required.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto mb-6">
              <div className="text-sm text-gray-600 mb-2">Demo Credentials:</div>
              <div className="font-mono text-sm">
                <div>Email: <span className="text-blue-600">demo@authkit.com</span></div>
                <div>Password: <span className="text-blue-600">password</span></div>
              </div>
            </div>
            
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <span>Try Demo Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 AuthKit. Built with Express.js, PostgreSQL, and React.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { AUTH_CONFIG } from '../config/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-detect OAuth availability from config
  const isGoogleOAuthEnabled = AUTH_CONFIG.googleOAuthEnabled;
  const isEmailPasswordEnabled = AUTH_CONFIG.emailPasswordEnabled;

  // Configure axios to include cookies
  axios.defaults.withCredentials = true;

  // Add response interceptor for token refresh
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && error.config && !error.config._retry) {
          error.config._retry = true;
          
          try {
            await axios.post(API_ENDPOINTS.REFRESH);
            return axios(error.config);
          } catch (refreshError) {
            setUser(null);
            localStorage.removeItem('accessToken');
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(API_ENDPOINTS.USER_ME);
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.log('Not authenticated');
      localStorage.removeItem('accessToken');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(API_ENDPOINTS.LOGIN, {
        email,
        password
      });

      const { user, accessToken } = response.data.data;
      
      // Store access token
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setUser(user);
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(API_ENDPOINTS.REGISTER, userData);

      const { user, accessToken } = response.data.data;
      
      // Store access token
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setUser(user);
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const googleLogin = async (email) => {
    try {
      setError(null);
      const response = await axios.post(API_ENDPOINTS.GOOGLE_DEMO, {
        email
      });

      const { user, accessToken } = response.data.data;
      
      // Store access token
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setUser(user);
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Google login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await axios.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      localStorage.removeItem('accessToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const logoutAll = async () => {
    try {
      await axios.post(API_ENDPOINTS.LOGOUT_ALL);
    } catch (error) {
      console.log('Logout all error:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      localStorage.removeItem('accessToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    user,
    loading,
    error,
    isGoogleOAuthEnabled,
    isEmailPasswordEnabled,
    login,
    register,
    googleLogin,
    logout,
    logoutAll,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

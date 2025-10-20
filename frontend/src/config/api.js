// API Configuration for AuthKit Frontend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  LOGOUT_ALL: `${API_BASE_URL}/api/auth/logout-all`,
  
  // Google OAuth
  GOOGLE_AUTH: `${API_BASE_URL}/api/auth/google`,
  GOOGLE_DEMO: `${API_BASE_URL}/api/auth/google/demo`,
  GOOGLE_STATUS: `${API_BASE_URL}/api/auth/google/status`,
  
  // User
  USER_ME: `${API_BASE_URL}/api/user/me`,
  USER_SESSIONS: `${API_BASE_URL}/api/user/sessions`,
  
  // Health
  HEALTH: `${API_BASE_URL}/health`,
  STATUS: `${API_BASE_URL}/api/status`
};

export default API_ENDPOINTS;

import axios from 'axios';

// Get API base URL from environment variable or use default
// In production, this should be set to the actual API URL
const getBaseURL = () => {
  // Check for Vite environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default to relative path (works when served by same server)
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Check if debug mode is enabled
const isDebugMode = () => {
  return import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV;
};

// Request interceptor - add token to every request
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage on each request (not just at initialization)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (isDebugMode()) {
      console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (isDebugMode()) {
      console.log('API Response:', response.status, response.config.url, response.data);
    }
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

// Elections API
export const electionsAPI = {
  getAll: () => api.get('/elections'),
  getActive: () => api.get('/elections/active'),
  getById: (id) => api.get(`/elections/${id}`),
  create: (data) => api.post('/elections', data),
  updateStatus: (id, status) => api.patch(`/elections/${id}/status`, { status }),
  delete: (id) => api.delete(`/elections/${id}`)
};

// Coalitions API
export const coalitionsAPI = {
  getByElection: (electionId) => api.get(`/coalitions/election/${electionId}`),
  getById: (id) => api.get(`/coalitions/${id}`),
  create: (data) => api.post('/coalitions', data),
  delete: (id) => api.delete(`/coalitions/${id}`)
};

// Candidates API
export const candidatesAPI = {
  getByElection: (electionId) => api.get(`/candidates/election/${electionId}`),
  getById: (id) => api.get(`/candidates/${id}`),
  create: (formData) => api.post('/candidates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateImage: (id, formData) => api.patch(`/candidates/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/candidates/${id}`)
};

// Votes API
export const votesAPI = {
  cast: (data) => api.post('/votes', data),
  check: (electionId) => api.get(`/votes/check/${electionId}`)
};

// Results API
export const resultsAPI = {
  getByElection: (electionId) => api.get(`/results/${electionId}`),
  getAll: () => api.get('/results')
};

// Users API (Admin)
export const usersAPI = {
  getStats: () => api.get('/users/stats'),
  changePassword: (data) => api.post('/users/change-password', data)
};

export default api;


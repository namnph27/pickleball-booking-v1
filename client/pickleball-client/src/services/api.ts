import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Check if request is for admin API
    const isAdminRequest = config.url?.includes('/api/admin/');

    if (isAdminRequest) {
      // Use admin token for admin API requests
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken) {
        console.log('Using admin token for request:', config.url);
        config.headers.Authorization = `Bearer ${adminToken}`;
      } else {
        console.log('No admin token available for admin request:', config.url);
      }
    } else {
      // Use regular user token for non-admin requests
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Using user token for request:', config.url);
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('401 Unauthorized error for URL:', error.config.url);

      // Check if request was for admin API
      const isAdminRequest = error.config.url?.includes('/api/admin/');

      if (isAdminRequest) {
        console.log('Admin authentication failed, redirecting to admin login');
        // Clear admin data
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin');
        // Redirect to admin login
        window.location.href = '/admin/login';
      } else {
        console.log('User authentication failed, redirecting to user login');
        // Clear user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to user login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

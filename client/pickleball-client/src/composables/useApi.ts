import { ref } from 'vue';
import axios from 'axios';
import { useToast } from './useToast';

export function useApi() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const toast = useToast();

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
          console.log('useApi: Using admin token for request:', config.url);
          config.headers.Authorization = `Bearer ${adminToken}`;
        } else {
          console.log('useApi: No admin token available for admin request:', config.url);
        }
      } else {
        // Use regular user token for non-admin requests
        const token = localStorage.getItem('token');
        if (token) {
          console.log('useApi: Using user token for request:', config.url);
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
        console.log('useApi: 401 Unauthorized error for URL:', error.config.url);

        // Không xử lý lỗi 401 cho các request đăng nhập
        const isLoginRequest = error.config.url?.includes('/api/auth/login');

        if (isLoginRequest) {
          console.log('useApi: Login request failed with 401, not redirecting');
          // Không làm gì cả, để component xử lý lỗi
        } else {
          // Check if request was for admin API
          const isAdminRequest = error.config.url?.includes('/api/admin/');

          if (isAdminRequest) {
            console.log('useApi: Admin authentication failed, redirecting to admin login');
            // Clear admin data
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin');
            // Redirect to admin login
            window.location.href = '/admin/login';
          } else {
            console.log('useApi: User authentication failed, redirecting to user login');
            // Clear user data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to user login
            window.location.href = '/login';
          }
        }
      }
      return Promise.reject(error);
    }
  );

  const request = async <T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    showToast = true
  ): Promise<T> => {
    loading.value = true;
    error.value = null;

    try {
      // Check if user is authenticated for protected endpoints
      const token = localStorage.getItem('token');
      if (!url.includes('/api/auth/') && !token) {
        console.warn(`API ${method.toUpperCase()} request to ${url} without authentication token`);
      } else {
        console.log(`API ${method.toUpperCase()} request to ${url} with token:`, token ? 'Present' : 'Missing');
      }

      console.log(`API ${method.toUpperCase()} request to ${url}`, method !== 'get' ? data : undefined);

      const response = await api({
        method,
        url,
        data: method !== 'get' ? data : undefined,
        params: method === 'get' ? data : undefined
      });

      console.log(`API ${method.toUpperCase()} response from ${url}:`, response.data);

      if (showToast && response.data.message) {
        toast.success(response.data.message);
      }

      return response.data;
    } catch (err: any) {
      console.error(`API ${method.toUpperCase()} error for ${url}:`, err);

      // Log more detailed error information
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
      }

      if (showToast) {
        toast.apiError(err);
      }

      if (err.response && err.response.data && err.response.data.message) {
        error.value = err.response.data.message;
        console.error('Error message from server:', err.response.data.message);
      } else if (err.message) {
        error.value = err.message;
        console.error('Error message:', err.message);
      } else {
        error.value = 'An unknown error occurred';
        console.error('Unknown error occurred');
      }

      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    api,
    get: <T>(url: string, params?: any, showToast = true) => request<T>('get', url, params, showToast),
    post: <T>(url: string, data?: any, showToast = true) => request<T>('post', url, data, showToast),
    put: <T>(url: string, data?: any, showToast = true) => request<T>('put', url, data, showToast),
    delete: <T>(url: string, data?: any, showToast = true) => request<T>('delete', url, data, showToast)
  };
}

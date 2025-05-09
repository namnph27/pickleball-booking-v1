import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import router from '../router';
import { useApi } from '../composables/useApi';
import { useSocketService } from '../services/SocketService';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'court_owner';
  phone?: string;
  profile_image?: string;
  created_at: string;
  updated_at?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const loading = ref(false);
  const error = ref('');
  const twoFactorRequired = ref(false);
  const twoFactorToken = ref('');
  const { post, get } = useApi();

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isCourtOwner = computed(() => user.value?.role === 'court_owner');
  const isCustomer = computed(() => user.value?.role === 'customer');

  // Set user data
  function setUser(userData: User) {
    user.value = userData;
    localStorage.setItem('user', JSON.stringify(userData));
  }

  // Set token
  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }

  // Register a new user
  async function register(userData: any) {
    loading.value = true;
    error.value = '';

    try {
      console.log('Registering user with data:', userData);

      const response = await post<{
        token: string;
        user: User;
        message: string;
        requires_2fa_setup?: boolean;
        qr_code?: string;
      }>('/api/auth/register', userData, false);

      console.log('Registration API response:', response);

      // Check if 2FA setup is required
      if (response.requires_2fa_setup) {
        twoFactorRequired.value = true;
        twoFactorToken.value = response.token;
        return {
          requires_2fa_setup: true,
          qr_code: response.qr_code
        };
      }

      setToken(response.token);
      setUser(response.user);

      return response;
    } catch (err: any) {
      console.error('Registration error details:', err);
      error.value = err.response?.data?.message || 'Registration failed';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Login user
  async function login(credentials: { email: string; password: string }) {
    loading.value = true;
    error.value = '';

    try {
      const response = await post<{
        token: string;
        user: User;
        message: string;
        requires_2fa?: boolean;
        temp_token?: string;
      }>('/api/auth/login', credentials, false);

      // Check if 2FA is required
      if (response.requires_2fa) {
        twoFactorRequired.value = true;
        twoFactorToken.value = response.temp_token || '';
        return {
          requires_2fa: true
        };
      }

      setToken(response.token);
      setUser(response.user);

      return response;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Verify 2FA code
  async function verify2FA(code: string) {
    loading.value = true;
    error.value = '';

    try {
      const response = await post<{
        token: string;
        user: User;
        message: string;
      }>('/api/auth/verify-2fa', {
        token: twoFactorToken.value,
        code
      }, false);

      setToken(response.token);
      setUser(response.user);

      twoFactorRequired.value = false;
      twoFactorToken.value = '';

      return response;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Verification failed';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Setup 2FA
  async function setup2FA(code: string) {
    loading.value = true;
    error.value = '';

    try {
      const response = await post<{
        token: string;
        user: User;
        message: string;
      }>('/api/auth/setup-2fa', {
        token: twoFactorToken.value,
        code
      }, false);

      setToken(response.token);
      setUser(response.user);

      twoFactorRequired.value = false;
      twoFactorToken.value = '';

      return response;
    } catch (err: any) {
      error.value = err.response?.data?.message || '2FA setup failed';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Logout user
  function logout() {
    token.value = '';
    user.value = null;

    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];

    // Disconnect Socket.io
    const socketService = useSocketService();
    socketService.disconnectSocket();
    socketService.cleanup();

    // Redirect to login page
    router.push('/login');
  }

  // Get current user profile
  async function getProfile() {
    if (!token.value) return null;

    loading.value = true;

    try {
      const response = await get<{ user: User }>('/api/auth/profile', {}, false);
      setUser(response.user);
      return response.user;
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token expired or invalid
        logout();
      }
      error.value = err.response?.data?.message || 'Failed to get profile';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Initialize auth state
  function init() {
    if (token.value) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

      // Initialize Socket.io connection
      const socketService = useSocketService();
      socketService.initializeSocket();
      // Không cần gọi cleanup ở đây vì không có component lifecycle

      getProfile().catch(() => {
        // If getting profile fails, logout
        logout();
      });
    }
  }

  // Forgot password
  async function forgotPassword(email: string) {
    loading.value = true;
    error.value = '';

    try {
      const response = await post<{ message: string }>(
        '/api/auth/forgot-password',
        { email },
        false
      );
      return response;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to send reset link';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Reset password
  async function resetPassword(resetData: { token: string; password: string; password_confirmation: string }) {
    loading.value = true;
    error.value = '';

    try {
      const response = await post<{ message: string }>(
        '/api/auth/reset-password',
        resetData,
        false
      );
      return response;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to reset password';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  return {
    token,
    user,
    loading,
    error,
    twoFactorRequired,
    twoFactorToken,
    isAuthenticated,
    isAdmin,
    isCourtOwner,
    isCustomer,
    setUser,
    setToken,
    register,
    login,
    verify2FA,
    setup2FA,
    forgotPassword,
    resetPassword,
    logout,
    getProfile,
    init
  };
});

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
  approval_status?: 'pending' | 'approved' | 'rejected';
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
  const isPendingApproval = computed(() =>
    user.value?.role === 'court_owner' && user.value?.approval_status === 'pending'
  );
  const isApprovedCourtOwner = computed(() =>
    user.value?.role === 'court_owner' && user.value?.approval_status === 'approved'
  );
  const isRejected = computed(() =>
    user.value?.role === 'court_owner' && user.value?.approval_status === 'rejected'
  );

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
    console.log('Register function called with data:', userData);

    // Ensure loading state is reset at the beginning
    loading.value = true;
    error.value = '';

    try {
      console.log('Registering user with data:', userData);

      // Make sure we have all required fields
      if (!userData.name || !userData.email || !userData.password || !userData.phone) {
        console.error('Missing required fields in register function');
        throw new Error('Missing required fields');
      }

      // Make API request
      console.log('Making API request to /api/auth/register');

      try {
        // Sử dụng axios trực tiếp để có thêm thông tin lỗi chi tiết
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        console.log('API URL:', apiUrl);

        const axiosResponse = await axios.post(`${apiUrl}/api/auth/register`, userData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log('Registration API direct response:', axiosResponse);

        const response = axiosResponse.data;
        console.log('Registration API response data:', response);

        // Check if 2FA setup is required
        if (response.requires_2fa_setup) {
          twoFactorRequired.value = true;
          twoFactorToken.value = response.token;
          return {
            requires_2fa_setup: true,
            qr_code: response.qr_code
          };
        }

        // Set user data and token
        setToken(response.token);
        setUser(response.user);

        return response;
      } catch (axiosError: any) {
        console.error('Axios error during registration:', axiosError);
        console.error('Axios error response:', axiosError.response);

        if (axiosError.response?.data?.message) {
          error.value = axiosError.response.data.message;
        } else if (axiosError.message) {
          error.value = axiosError.message;
        } else {
          error.value = 'Registration failed - server error';
        }

        throw error.value;
      }
    } catch (err: any) {
      console.error('Registration error details:', err);

      // Improve error handling
      if (err.response?.data?.message) {
        error.value = err.response.data.message;
      } else if (typeof err === 'string') {
        error.value = err;
      } else if (err.message) {
        error.value = err.message;
      } else {
        error.value = 'Registration failed';
      }

      throw error.value;
    } finally {
      // Ensure loading state is always reset with a slight delay
      // to prevent UI flicker and ensure state is updated properly
      console.log('Resetting loading state in register function');
      setTimeout(() => {
        loading.value = false;
        console.log('Loading state reset to false');
      }, 300);
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
      console.error('Login error:', err);

      // Xử lý lỗi chi tiết hơn
      if (err.response?.status === 401) {
        // Tài khoản không tồn tại hoặc mật khẩu không đúng
        const errorMessage = err.response?.data?.message || '';
        // Trả về thông báo lỗi trực tiếp từ server
        error.value = errorMessage || 'Email hoặc mật khẩu không đúng';
      } else if (err.response?.status === 403) {
        // Tài khoản chưa được phê duyệt hoặc bị từ chối
        error.value = err.response?.data?.message || 'Tài khoản chưa được phê duyệt';
      } else {
        // Lỗi khác
        error.value = err.response?.data?.message || 'Đăng nhập thất bại';
      }

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

  // Delete rejected account
  async function deleteRejectedAccount() {
    loading.value = true;
    error.value = '';

    try {
      // Chỉ xóa tài khoản nếu là chủ sân bị từ chối
      if (user.value?.role === 'court_owner' && user.value?.approval_status === 'rejected') {
        try {
          // Sử dụng axios trực tiếp để gọi API DELETE
          const token = localStorage.getItem('token');
          const response = await axios.delete('/api/auth/delete-rejected-account', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log('Delete rejected account response:', response.data);
          return { success: true };
        } catch (error) {
          console.error('Error in deleteRejectedAccount:', error);
          throw 'Failed to delete rejected account';
        }
      } else {
        throw 'Account is not a rejected court owner';
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete rejected account';
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
    isPendingApproval,
    isApprovedCourtOwner,
    isRejected,
    setUser,
    setToken,
    register,
    login,
    verify2FA,
    setup2FA,
    forgotPassword,
    resetPassword,
    deleteRejectedAccount,
    logout,
    getProfile,
    init
  };
});

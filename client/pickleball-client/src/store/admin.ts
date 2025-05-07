import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import router from '../router';
import { useToast } from '../composables/useToast';

export const useAdminStore = defineStore('admin', () => {
  // Không gọi useToast ở đây, sẽ gọi trong từng hàm khi cần

  const token = ref(localStorage.getItem('admin_token') || '');
  const admin = ref(JSON.parse(localStorage.getItem('admin') || 'null'));
  const loading = ref(false);
  const error = ref('');

  const isAuthenticated = computed(() => !!token.value);
  const isSuperAdmin = computed(() => admin.value?.is_super_admin || admin.value?.role === 'super_admin');

  // Login admin
  async function login(credentials: { username: string; password: string }) {
    loading.value = true;
    error.value = '';

    try {
      const response = await axios.post('/api/admin/auth/login', credentials);

      token.value = response.data.token;
      admin.value = response.data.admin;

      // Save to localStorage
      localStorage.setItem('admin_token', token.value);
      localStorage.setItem('admin', JSON.stringify(admin.value));

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

      // Không sử dụng toast ở đây, để component gọi login tự xử lý thông báo
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Đăng nhập thất bại';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Logout admin
  function logout() {
    token.value = '';
    admin.value = null;

    // Remove from localStorage
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');

    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];

    // Redirect to admin login page
    router.push('/admin/login');

    // Không sử dụng toast ở đây
  }

  // Get current admin profile
  async function getProfile() {
    if (!token.value) return null;

    loading.value = true;

    try {
      const response = await axios.get('/api/admin/auth/profile');
      admin.value = response.data.admin;
      localStorage.setItem('admin', JSON.stringify(admin.value));
      return response.data.admin;
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

  // Change admin password
  async function changePassword(passwords: { current_password: string; new_password: string }) {
    loading.value = true;
    error.value = '';

    try {
      const response = await axios.post('/api/admin/auth/change-password', passwords);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to change password';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Create new admin (super admin only)
  async function createAdmin(adminData: any) {
    if (!isSuperAdmin.value) {
      error.value = 'Only super admins can create new admins';
      throw error.value;
    }

    loading.value = true;
    error.value = '';

    try {
      const response = await axios.post('/api/admin/auth/create', adminData);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create admin';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Initialize admin state
  function init() {
    if (token.value) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

      getProfile().catch((err) => {
        console.error('Lỗi khi lấy thông tin profile:', err);
        // If getting profile fails, logout
        logout();
      });
    }
  }

  return {
    token,
    admin,
    loading,
    error,
    isAuthenticated,
    isSuperAdmin,
    login,
    logout,
    getProfile,
    changePassword,
    createAdmin,
    init
  };
});

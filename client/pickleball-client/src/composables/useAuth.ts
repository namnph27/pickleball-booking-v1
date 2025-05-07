import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useApi } from './useApi';
import { useToast } from './useToast';

export function useAuth() {
  const authStore = useAuthStore();
  const router = useRouter();
  const { post } = useApi();
  const toast = useToast();

  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isCourtOwner = computed(() => authStore.isCourtOwner);
  const isCustomer = computed(() => authStore.isCustomer);
  const user = computed(() => authStore.user);
  const loading = computed(() => authStore.loading);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      await authStore.login(credentials);
      return true;
    } catch (error) {
      return false;
    }
  };

  const register = async (userData: any) => {
    try {
      await authStore.register(userData);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    authStore.logout();
    router.push('/login');
  };

  const updateProfile = async (profileData: any) => {
    try {
      const response = await post('/api/auth/profile', profileData);
      
      // Update user in store
      if (response && response.user) {
        authStore.setUser(response.user);
      }
      
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      return false;
    }
  };

  const changePassword = async (passwordData: { 
    current_password: string; 
    new_password: string; 
  }) => {
    try {
      await post('/api/auth/change-password', passwordData);
      toast.success('Password changed successfully');
      return true;
    } catch (error) {
      return false;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await post('/api/auth/forgot-password', { email });
      toast.success('Password reset instructions sent to your email');
      return true;
    } catch (error) {
      return false;
    }
  };

  const resetPassword = async (resetData: { 
    token: string; 
    email: string; 
    password: string; 
    password_confirmation: string 
  }) => {
    try {
      await post('/api/auth/reset-password', resetData);
      toast.success('Password has been reset successfully');
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    isAuthenticated,
    isCourtOwner,
    isCustomer,
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword
  };
}

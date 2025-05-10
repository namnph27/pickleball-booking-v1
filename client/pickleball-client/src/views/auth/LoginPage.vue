<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';
import { useAuthStore } from '../../store/auth';
import { useValidation } from '../../composables/useValidation';
import { useToast } from '../../composables/useToast';
import BaseInput from '../../components/base/BaseInput.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { loginSchema } = useValidation();
const toast = useToast();

// Form state
const showPassword = ref(false);
const loginError = ref('');
const twoFactorRequired = ref(false);
const twoFactorCode = ref('');
const twoFactorError = ref('');

// Create local refs for form fields
const emailInput = ref('');
const passwordInput = ref('');

// Redirect path after successful login
const redirectPath = computed(() => {
  // Nếu có redirect query parameter, sử dụng nó
  if (route.query.redirect) {
    return route.query.redirect.toString();
  }

  // Nếu không có redirect và user là chủ sân, điều hướng đến trang profile
  if (authStore.user?.role === 'court_owner') {
    return '/profile';
  }

  // Mặc định điều hướng đến trang chủ
  return '/';
});

// Form validation
const { handleSubmit, errors, resetForm } = useForm({
  validationSchema: loginSchema
});

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Handle form submission
const onSubmit = handleSubmit(async () => {
  try {
    loginError.value = '';

    const formData = {
      email: emailInput.value,
      password: passwordInput.value
    };

    const response = await authStore.login(formData);

    // Check if 2FA is required
    if (response.requires_2fa) {
      twoFactorRequired.value = true;
      return;
    }

    toast.success(t('auth.loginSuccess'));

    // Kiểm tra vai trò và trạng thái phê duyệt người dùng sau khi đăng nhập
    if (authStore.user?.role === 'court_owner') {
      if (authStore.isPendingApproval) {
        // Nếu là chủ sân đang chờ phê duyệt, chuyển đến trang thông báo
        router.push('/pending-approval');
      } else if (authStore.isRejected) {
        // Nếu là chủ sân bị từ chối, chuyển đến trang thông báo từ chối
        router.push('/rejected-account');
      } else {
        // Nếu là chủ sân đã được phê duyệt, chuyển đến trang profile
        router.push('/profile');
      }
    } else {
      router.push(redirectPath.value);
    }
  } catch (error) {
    console.error('Login error in component:', error);

    // Hiển thị thông báo lỗi chi tiết
    if (typeof error === 'string') {
      // Xử lý các trường hợp lỗi đặc biệt
      if (error === 'accountNotFound') {
        // Đây là trường hợp tài khoản không tồn tại (đã bị xóa)
        loginError.value = t('auth.accountNotFound');
      } else if (error === 'Invalid credentials') {
        // Trường hợp thông báo lỗi trực tiếp từ server
        loginError.value = t('auth.invalidCredentials');
      } else {
        // Các lỗi khác
        loginError.value = error;
      }
    } else {
      // Mặc định
      loginError.value = t('auth.loginFailed');
    }
  }
});

// Handle 2FA verification
const verifyTwoFactor = async () => {
  try {
    twoFactorError.value = '';

    if (!twoFactorCode.value) {
      twoFactorError.value = t('auth.codeRequired');
      return;
    }

    const response = await authStore.verify2FA(twoFactorCode.value);

    toast.success(t('auth.loginSuccess'));

    // Kiểm tra vai trò và trạng thái phê duyệt người dùng sau khi xác thực 2FA
    if (authStore.user?.role === 'court_owner') {
      if (authStore.isPendingApproval) {
        // Nếu là chủ sân đang chờ phê duyệt, chuyển đến trang thông báo
        router.push('/pending-approval');
      } else if (authStore.isRejected) {
        // Nếu là chủ sân bị từ chối, chuyển đến trang thông báo từ chối
        router.push('/rejected-account');
      } else {
        // Nếu là chủ sân đã được phê duyệt, chuyển đến trang profile
        router.push('/profile');
      }
    } else {
      router.push(redirectPath.value);
    }
  } catch (error) {
    twoFactorError.value = typeof error === 'string' ? error : t('auth.verificationFailed');
  }
};

// Switch to register page
const goToRegister = () => {
  router.push({
    path: '/register',
    query: route.query
  });
};

// Go to forgot password page
const goToForgotPassword = () => {
  router.push({
    path: '/forgot-password',
    query: route.query
  });
};

// Reset form when component is mounted
onMounted(() => {
  // Reset form and clear input values
  resetForm();
  emailInput.value = '';
  passwordInput.value = '';
});
</script>

<template>
  <div class="login-page">
    <div class="auth-container">
      <!-- Login Form -->
      <div v-if="!twoFactorRequired" class="auth-form-container">
        <div class="auth-header">
          <h1 class="auth-title">{{ t('auth.loginTitle') }}</h1>
          <p class="auth-subtitle">{{ t('auth.welcomeBack') }}</p>
        </div>

        <div v-if="loginError" class="auth-error">
          <BaseAlert type="error" :message="loginError" />
        </div>

        <form @submit.prevent="onSubmit" class="auth-form">
          <div class="form-group">
            <BaseInput
              v-model="emailInput"
              name="email"
              type="email"
              :label="t('common.email')"
              :placeholder="t('auth.emailPlaceholder')"
              :error="errors.email"
              required
              icon="pi-envelope"
            />
          </div>

          <div class="form-group">
            <BaseInput
              v-model="passwordInput"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              :label="t('common.password')"
              :placeholder="t('auth.passwordPlaceholder')"
              :error="errors.password"
              required
              icon="pi-lock"
            />
            <button
              type="button"
              class="password-toggle"
              @click="togglePasswordVisibility"
            >
              <i :class="`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'}`"></i>
            </button>
          </div>

          <div class="forgot-password">
            <a href="#" @click.prevent="goToForgotPassword">{{ t('auth.forgotPassword') }}</a>
          </div>

          <div class="form-actions">
            <BaseButton
              type="submit"
              :label="t('auth.loginButton')"
              variant="primary"
              full-width
              :loading="authStore.loading"
            />
          </div>
        </form>

        <div class="auth-footer">
          <p>
            {{ t('auth.noAccount') }}
            <a href="#" @click.prevent="goToRegister">{{ t('auth.registerHere') }}</a>
          </p>
        </div>
      </div>

      <!-- Two-Factor Authentication -->
      <div v-else class="auth-form-container">
        <div class="auth-header">
          <h1 class="auth-title">{{ t('auth.twoFactorAuth') }}</h1>
          <p class="auth-subtitle">{{ t('auth.enterCode') }}</p>
        </div>

        <div v-if="twoFactorError" class="auth-error">
          <BaseAlert type="error" :message="twoFactorError" />
        </div>

        <div class="two-factor-verification">
          <div class="verification-code">
            <BaseInput
              v-model="twoFactorCode"
              placeholder="000000"
              type="text"
              icon="pi-key"
            />
          </div>

          <div class="form-actions">
            <BaseButton
              :label="t('auth.verifyCode')"
              variant="primary"
              full-width
              :loading="authStore.loading"
              @click="verifyTwoFactor"
            />
          </div>

          <div class="resend-code">
            <a href="#" @click.prevent="onSubmit">{{ t('auth.resendCode') }}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 450px;
}

.auth-form-container {
  background-color: var(--white);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;

  .auth-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .auth-subtitle {
    color: var(--dark-gray);
  }
}

.auth-error {
  margin-bottom: 1.5rem;
}

.auth-form {
  .form-group {
    position: relative;
    margin-bottom: 1.5rem;

    .password-toggle {
      position: absolute;
      right: 1rem;
      top: 2.5rem;
      background: none;
      border: none;
      color: var(--dark-gray);
      cursor: pointer;

      &:hover {
        color: var(--text-color);
      }
    }
  }

  .forgot-password {
    text-align: right;
    margin-bottom: 1.5rem;

    a {
      font-size: 0.875rem;
      color: var(--secondary-color);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .form-actions {
    margin-top: 1rem;
  }
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.875rem;

  a {
    color: var(--primary-color);
    font-weight: 500;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.two-factor-verification {
  .verification-code {
    margin-bottom: 2rem;
  }

  .resend-code {
    margin-top: 1.5rem;
    text-align: center;

    a {
      font-size: 0.875rem;
      color: var(--secondary-color);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@media (max-width: 768px) {
  .login-page {
    padding: 1rem;
  }

  .auth-form-container {
    padding: 1.5rem;
  }

  .auth-header {
    .auth-title {
      font-size: 1.5rem;
    }
  }
}
</style>

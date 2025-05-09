<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';
import { useAuthStore } from '../../store/auth';
import { useValidation } from '../../composables/useValidation';
import { useToast } from '../../composables/useToast';
import BaseInput from '../../components/base/BaseInput.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { registerSchema } = useValidation();
const toast = useToast();

// Form state
const userRole = ref('customer');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const registrationError = ref('');
const twoFactorSetupRequired = ref(false);
const qrCodeUrl = ref('');
const twoFactorCode = ref('');
const twoFactorError = ref('');

// Create local refs for form fields
const nameInput = ref('');
const emailInput = ref('');
const phoneInput = ref('');
const idCardInput = ref('');
const taxCodeInput = ref('');
const passwordInput = ref('');
const passwordConfirmationInput = ref('');

// Redirect path after successful registration
const redirectPath = computed(() => route.query.redirect?.toString() || '/');

// Form validation
const { handleSubmit, errors, setFieldValue } = useForm({
  validationSchema: registerSchema,
  initialValues: {
    name: '',
    email: '',
    phone: '',
    id_card: '',
    tax_code: '',
    password: '',
    password_confirmation: '',
    role: 'customer'
  }
});

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// Theo dõi thay đổi của userRole và cập nhật vào form
watch(userRole, (newRole) => {
  setFieldValue('role', newRole);
});

// Sync form fields with vee-validate
watch(nameInput, (newValue) => {
  setFieldValue('name', newValue);
});

watch(emailInput, (newValue) => {
  setFieldValue('email', newValue);
});

watch(phoneInput, (newValue) => {
  setFieldValue('phone', newValue);
});

watch(idCardInput, (newValue) => {
  setFieldValue('id_card', newValue);
});

watch(taxCodeInput, (newValue) => {
  setFieldValue('tax_code', newValue);
});

watch(passwordInput, (newValue) => {
  setFieldValue('password', newValue);
});

watch(passwordConfirmationInput, (newValue) => {
  setFieldValue('password_confirmation', newValue);
});

// Handle form submission
const onSubmit = handleSubmit(async () => {
  try {
    registrationError.value = '';

    // Kiểm tra xem form có hợp lệ không
    if (Object.keys(errors.value).length > 0) {
      console.error('Form validation errors:', errors.value);
      registrationError.value = t('auth.formHasErrors');
      return;
    }

    const userData = {
      name: nameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      password: passwordInput.value,
      password_confirmation: passwordConfirmationInput.value,
      role: userRole.value
    };

    // Thêm thông tin CCCD và mã số thuế nếu là chủ sân
    if (userRole.value === 'court_owner') {
      userData.id_card = idCardInput.value;
      userData.tax_code = taxCodeInput.value;
    }

    console.log('Submitting registration data:', userData);

    // Kiểm tra dữ liệu trước khi gửi
    if (!userData.name || !userData.email || !userData.password || !userData.password_confirmation || !userData.phone) {
      console.error('Missing required fields');
      registrationError.value = t('auth.allFieldsRequired');
      return;
    }

    // Kiểm tra thông tin bắt buộc cho chủ sân
    if (userData.role === 'court_owner' && (!userData.id_card || !userData.tax_code)) {
      console.error('Missing required fields for court owner');
      registrationError.value = t('auth.allFieldsRequired');
      return;
    }

    // Kiểm tra mật khẩu khớp nhau
    if (userData.password !== userData.password_confirmation) {
      console.error('Passwords do not match');
      registrationError.value = t('auth.passwordsDoNotMatch');
      return;
    }

    const response = await authStore.register(userData);

    console.log('Registration response:', response);

    // Check if 2FA setup is required
    if (response.requires_2fa_setup) {
      twoFactorSetupRequired.value = true;
      qrCodeUrl.value = response.qr_code || '';
      return;
    }

    // Hiển thị thông báo phù hợp dựa trên vai trò
    if (userRole.value === 'court_owner') {
      toast.success(t('auth.courtOwnerRegistrationSuccess'));
      // Chuyển đến trang thông báo đang chờ phê duyệt
      router.push('/pending-approval');
    } else {
      toast.success(t('auth.registrationSuccess'));
      router.push(redirectPath.value);
    }
  } catch (error) {
    console.error('Registration error:', error);
    registrationError.value = typeof error === 'string' ? error : t('auth.registrationFailed');
  }
});

// Handle 2FA setup verification
const verifyTwoFactorSetup = async () => {
  try {
    twoFactorError.value = '';

    if (!twoFactorCode.value) {
      twoFactorError.value = t('auth.codeRequired');
      return;
    }

    await authStore.setup2FA(twoFactorCode.value);

    toast.success(t('auth.twoFactorSetupSuccess'));
    router.push(redirectPath.value);
  } catch (error) {
    twoFactorError.value = typeof error === 'string' ? error : t('auth.twoFactorSetupFailed');
  }
};

// Switch to login page
const goToLogin = () => {
  router.push({
    path: '/login',
    query: route.query
  });
};
</script>

<template>
  <div class="register-page">
    <div class="auth-container">
      <!-- Registration Form -->
      <div v-if="!twoFactorSetupRequired" class="auth-form-container">
        <div class="auth-header">
          <h1 class="auth-title">{{ t('auth.registerTitle') }}</h1>
          <p class="auth-subtitle">{{ t('auth.createAccountDesc') }}</p>
        </div>

        <div v-if="registrationError" class="auth-error">
          <BaseAlert type="error" :message="registrationError" />
        </div>

        <div class="role-selector">
          <span class="role-label">{{ t('auth.registerAs') }}</span>
          <div class="role-options">
            <button
              class="role-option"
              :class="{ 'role-option--active': userRole === 'customer' }"
              @click="userRole = 'customer'"
            >
              <i class="pi pi-user"></i>
              <span>{{ t('auth.customer') }}</span>
            </button>

            <button
              class="role-option"
              :class="{ 'role-option--active': userRole === 'court_owner' }"
              @click="userRole = 'court_owner'"
            >
              <i class="pi pi-building"></i>
              <span>{{ t('auth.courtOwner') }}</span>
            </button>
          </div>
        </div>

        <form @submit.prevent="onSubmit" class="auth-form">
          <div class="form-group">
            <BaseInput
              v-model="nameInput"
              name="name"
              :label="t('common.name')"
              :placeholder="t('auth.namePlaceholder')"
              :error="errors.name"
              required
              icon="pi-user"
            />
          </div>

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
              v-model="phoneInput"
              name="phone"
              :label="t('common.phone')"
              :placeholder="t('auth.phonePlaceholder')"
              :error="errors.phone"
              required
              icon="pi-phone"
            />
          </div>

          <!-- Thông tin bắt buộc cho chủ sân -->
          <template v-if="userRole === 'court_owner'">
            <div class="court-owner-notice">
              <BaseAlert type="info" :message="t('auth.courtOwnerApprovalNotice')" />
            </div>

            <div class="form-group">
              <BaseInput
                v-model="idCardInput"
                name="id_card"
                :label="t('auth.idCard')"
                :placeholder="t('auth.idCardPlaceholder')"
                :error="errors.id_card"
                required
                icon="pi-id-card"
              />
            </div>

            <div class="form-group">
              <BaseInput
                v-model="taxCodeInput"
                name="tax_code"
                :label="t('auth.taxCode')"
                :placeholder="t('auth.taxCodePlaceholder')"
                :error="errors.tax_code"
                required
                icon="pi-file"
              />
            </div>
          </template>

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

          <div class="form-group">
            <BaseInput
              v-model="passwordConfirmationInput"
              name="password_confirmation"
              :type="showConfirmPassword ? 'text' : 'password'"
              :label="t('common.confirmPassword')"
              :placeholder="t('auth.confirmPasswordPlaceholder')"
              :error="errors.password_confirmation"
              required
              icon="pi-lock"
            />
            <button
              type="button"
              class="password-toggle"
              @click="toggleConfirmPasswordVisibility"
            >
              <i :class="`pi ${showConfirmPassword ? 'pi-eye-slash' : 'pi-eye'}`"></i>
            </button>
          </div>

          <div class="password-requirements">
            <p>{{ t('auth.passwordRequirements') }}</p>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="register-button"
              :disabled="authStore.loading"
            >
              {{ authStore.loading ? t('common.loading') : t('auth.registerButton') }}
            </button>
          </div>
        </form>

        <div class="auth-footer">
          <p>
            {{ t('auth.haveAccount') }}
            <a href="#" @click.prevent="goToLogin">{{ t('auth.loginHere') }}</a>
          </p>
        </div>
      </div>

      <!-- Two-Factor Authentication Setup -->
      <div v-else class="auth-form-container">
        <div class="auth-header">
          <h1 class="auth-title">{{ t('auth.setupTwoFactor') }}</h1>
          <p class="auth-subtitle">{{ t('auth.scanQrCode') }}</p>
        </div>

        <div v-if="twoFactorError" class="auth-error">
          <BaseAlert type="error" :message="twoFactorError" />
        </div>

        <div class="two-factor-setup">
          <div class="qr-code-container">
            <img :src="qrCodeUrl" alt="QR Code" class="qr-code" />
          </div>

          <div class="verification-code">
            <BaseInput
              v-model="twoFactorCode"
              :label="t('auth.enterCodeToVerify')"
              placeholder="000000"
              type="text"
              icon="pi-key"
            />
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="register-button"
              :disabled="authStore.loading"
              @click="verifyTwoFactorSetup"
            >
              {{ authStore.loading ? t('common.loading') : t('auth.verifyCode') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 500px;
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

.court-owner-notice {
  margin-bottom: 1.5rem;
}

.role-selector {
  margin-bottom: 1.5rem;

  .role-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .role-options {
    display: flex;
    gap: 1rem;

    .role-option {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border: 1px solid var(--medium-gray);
      border-radius: 8px;
      background-color: var(--white);
      cursor: pointer;
      transition: all 0.2s ease;

      i {
        font-size: 1.5rem;
        color: var(--dark-gray);
      }

      span {
        font-size: 0.875rem;
        font-weight: 500;
      }

      &:hover {
        border-color: var(--primary-color);
      }

      &--active {
        border-color: var(--primary-color);
        background-color: rgba(76, 175, 80, 0.05);

        i {
          color: var(--primary-color);
        }
      }
    }
  }
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

  .password-requirements {
    font-size: 0.75rem;
    color: var(--dark-gray);
    margin-bottom: 1.5rem;
  }

  .form-actions {
    margin-top: 2rem;

    .register-button {
      width: 100%;
      padding: 0.75rem 1.5rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background-color: #061528;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
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

.two-factor-setup {
  .qr-code-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;

    .qr-code {
      max-width: 200px;
      border: 1px solid var(--medium-gray);
      border-radius: 8px;
      padding: 0.5rem;
    }
  }

  .verification-code {
    margin-bottom: 2rem;
  }
}

@media (max-width: 768px) {
  .register-page {
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

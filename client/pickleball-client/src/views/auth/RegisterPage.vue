<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';
import axios from 'axios';
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
const isSubmitting = ref(false);

// Create local refs for form fields
const nameInput = ref('');
const emailInput = ref('');
const phoneInput = ref('');
const idCardInput = ref('');
const taxCodeInput = ref('');
const passwordInput = ref('');
const passwordConfirmationInput = ref('');
const registerForm = ref<HTMLFormElement | null>(null);

// Redirect path after successful registration
const redirectPath = computed(() => route.query.redirect?.toString() || '/');

// Direct submit function for button click
const submitForm = () => {
  console.log('Direct submit function called');
  if (registerForm.value) {
    console.log('Submitting form directly');
    // Thêm log để kiểm tra dữ liệu form trước khi submit
    console.log('Form data before submit:', {
      name: nameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      password: passwordInput.value,
      password_confirmation: passwordConfirmationInput.value,
      role: userRole.value
    });
    registerForm.value.dispatchEvent(new Event('submit', { cancelable: true }));
  } else {
    console.error('Register form reference is null');
  }
};

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
const onSubmit = handleSubmit(async (values) => {
  console.log('Form submitted with values:', values);
  console.log('Form validation errors:', errors.value);

  // Prevent multiple submissions
  if (isSubmitting.value || authStore.loading) {
    console.log('Form submission prevented: already submitting');
    return;
  }

  try {
    // Set submitting state
    isSubmitting.value = true;

    // Reset error message
    registrationError.value = '';

    // Log validation state for debugging
    console.log('Form validation state:', { errors: errors.value, isValid: Object.keys(errors.value).length === 0 });

    // Prepare user data
    const userData = {
      name: nameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      password: passwordInput.value,
      password_confirmation: passwordConfirmationInput.value,
      role: userRole.value
    };

    // Add ID card and tax code for court owners
    if (userRole.value === 'court_owner') {
      userData.id_card = idCardInput.value;
      userData.tax_code = taxCodeInput.value;
    }

    console.log('Submitting registration data:', userData);

    // Validate required fields
    const missingFields = [];
    if (!userData.name) missingFields.push('name');
    if (!userData.email) missingFields.push('email');
    if (!userData.phone) missingFields.push('phone');
    if (!userData.password) missingFields.push('password');
    if (!userData.password_confirmation) missingFields.push('password_confirmation');

    if (userData.role === 'court_owner') {
      if (!userData.id_card) missingFields.push('id_card');
      if (!userData.tax_code) missingFields.push('tax_code');
    }

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      registrationError.value = t('auth.allFieldsRequired');
      isSubmitting.value = false;
      return;
    }

    // Validate password match
    if (userData.password !== userData.password_confirmation) {
      console.error('Passwords do not match');
      registrationError.value = t('auth.passwordsDoNotMatch');
      isSubmitting.value = false;
      return;
    }

    console.log('Calling authStore.register with data:', userData);

    try {
      // Submit registration
      const response = await authStore.register(userData);
      console.log('Registration response:', response);

      // Handle 2FA if required
      if (response && response.requires_2fa_setup) {
        twoFactorSetupRequired.value = true;
        qrCodeUrl.value = response.qr_code || '';
        return;
      }

      // Show success message and redirect
      if (userRole.value === 'court_owner') {
        toast.success(t('auth.courtOwnerRegistrationSuccess'));
        router.push('/pending-approval');
      } else {
        toast.success(t('auth.registrationSuccess'));
        router.push(redirectPath.value);
      }
    } catch (registerError) {
      console.error('Error during register API call:', registerError);
      // Format user-friendly error message
      if (typeof registerError === 'string') {
        registrationError.value = registerError;
      } else if (registerError.response?.data?.message) {
        // Handle specific API error messages
        const errorMessage = registerError.response.data.message;
        if (errorMessage.includes('email already exists')) {
          registrationError.value = t('auth.emailAlreadyExists') || 'This email is already registered. Please use a different email or try logging in.';
        } else if (errorMessage.includes('phone already exists')) {
          registrationError.value = t('auth.phoneAlreadyExists') || 'This phone number is already registered. Please use a different phone number.';
        } else {
          registrationError.value = errorMessage;
        }
      } else {
        registrationError.value = t('auth.registrationFailed');
      }
    }
  } catch (error) {
    console.error('Registration error in onSubmit:', error);
    // Provide a user-friendly error message
    if (typeof error === 'string') {
      // Clean up any technical details from the error message
      registrationError.value = error.replace(/Error: |ValidationError: |SequelizeValidationError: /g, '');
    } else {
      registrationError.value = t('auth.registrationFailed');
    }
  } finally {
    // Always reset submitting state
    setTimeout(() => {
      isSubmitting.value = false;
      console.log('Submission state reset to false');
    }, 100);
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

// Hàm đăng ký trực tiếp (không thông qua form submit)
const directRegister = async () => {
  console.log('Direct register function called');

  // Prevent multiple submissions
  if (isSubmitting.value || authStore.loading) {
    console.log('Direct registration prevented: already submitting');
    return;
  }

  try {
    // Set submitting state
    isSubmitting.value = true;

    // Reset error message
    registrationError.value = '';

    // Prepare user data
    const userData = {
      name: nameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      password: passwordInput.value,
      password_confirmation: passwordConfirmationInput.value,
      role: userRole.value
    };

    // Add ID card and tax code for court owners
    if (userRole.value === 'court_owner') {
      userData.id_card = idCardInput.value;
      userData.tax_code = taxCodeInput.value;
    }

    console.log('Direct registration data:', userData);

    // Validate required fields
    const missingFields = [];
    if (!userData.name) missingFields.push('name');
    if (!userData.email) missingFields.push('email');
    if (!userData.phone) missingFields.push('phone');
    if (!userData.password) missingFields.push('password');
    if (!userData.password_confirmation) missingFields.push('password_confirmation');

    if (userData.role === 'court_owner') {
      if (!userData.id_card) missingFields.push('id_card');
      if (!userData.tax_code) missingFields.push('tax_code');
    }

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      registrationError.value = t('auth.allFieldsRequired');
      return;
    }

    // Validate password match
    if (userData.password !== userData.password_confirmation) {
      console.error('Passwords do not match');
      registrationError.value = t('auth.passwordsDoNotMatch');
      return;
    }

    // Sử dụng axios trực tiếp để đăng ký
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('Direct API URL:', apiUrl);

      const response = await axios.post(`${apiUrl}/api/auth/register`, userData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Direct registration response:', response.data);

      // Handle 2FA if required
      if (response.data.requires_2fa_setup) {
        twoFactorSetupRequired.value = true;
        qrCodeUrl.value = response.data.qr_code || '';
        return;
      }

      // Set user data and token in store
      authStore.setToken(response.data.token);
      authStore.setUser(response.data.user);

      // Show success message and redirect
      if (userRole.value === 'court_owner') {
        toast.success(t('auth.courtOwnerRegistrationSuccess'));
        router.push('/pending-approval');
      } else {
        toast.success(t('auth.registrationSuccess'));
        router.push(redirectPath.value);
      }
    } catch (apiError) {
      console.error('Direct API error:', apiError);
      // Format user-friendly error message
      if (apiError.response?.data?.message) {
        // Handle specific API error messages
        const errorMessage = apiError.response.data.message;
        if (errorMessage.includes('email already exists')) {
          registrationError.value = t('auth.emailAlreadyExists') || 'This email is already registered. Please use a different email or try logging in.';
        } else if (errorMessage.includes('phone already exists')) {
          registrationError.value = t('auth.phoneAlreadyExists') || 'This phone number is already registered. Please use a different phone number.';
        } else {
          // Clean up any technical details from the error message
          registrationError.value = errorMessage.replace(/Error: |ValidationError: |SequelizeValidationError: /g, '');
        }
      } else if (apiError.message) {
        // Clean up any technical details from the error message
        registrationError.value = apiError.message.replace(/Error: |ValidationError: |SequelizeValidationError: /g, '');
      } else {
        registrationError.value = t('auth.registrationFailed');
      }
    }
  } catch (error) {
    console.error('Direct registration error:', error);
    // Provide a user-friendly error message
    if (typeof error === 'string') {
      // Clean up any technical details from the error message
      registrationError.value = error.replace(/Error: |ValidationError: |SequelizeValidationError: /g, '');
    } else {
      registrationError.value = t('auth.registrationFailed');
    }
  } finally {
    // Always reset submitting state
    setTimeout(() => {
      isSubmitting.value = false;
      console.log('Direct registration state reset to false');
    }, 100);
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
          <BaseAlert
            type="error"
            :title="t('common.error')"
            :message="registrationError"
            bordered
          />
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

        <form class="auth-form" ref="registerForm" @submit.prevent="onSubmit">
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
            <!-- Nút submit form -->
            <button
              type="submit"
              class="register-button"
              :disabled="authStore.loading || isSubmitting"
              style="display: none;"
            >
              {{ authStore.loading || isSubmitting ? t('common.loading') : t('auth.registerButton') }}
            </button>

            <!-- Nút đăng ký chính với sự kiện click trực tiếp -->
            <button
              type="button"
              class="register-button"
              :disabled="authStore.loading || isSubmitting"
              @click="directRegister"
            >
              {{ authStore.loading || isSubmitting ? t('common.loading') : t('auth.registerButton') }}
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
  border-radius: 8px;
  overflow: hidden;
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

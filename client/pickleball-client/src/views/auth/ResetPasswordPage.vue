<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useForm, useField } from 'vee-validate';
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
const { resetPasswordSchema } = useValidation();
const toast = useToast();

// Form state
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const resetError = ref('');
const resetSuccess = ref(false);

// Get token from route params
const token = computed(() => route.params.token?.toString() || '');

// Form validation
const { handleSubmit, errors } = useForm({
  validationSchema: resetPasswordSchema,
  initialValues: {
    token: token.value,
    password: '',
    password_confirmation: ''
  }
});

// Use useField for form fields
const { value: password } = useField('password');
const { value: password_confirmation } = useField('password_confirmation');

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// Handle form submission
const onSubmit = handleSubmit(async (formValues) => {
  try {
    resetError.value = '';

    await authStore.resetPassword({
      token: token.value,
      password: formValues.password,
      password_confirmation: formValues.password_confirmation
    });

    resetSuccess.value = true;
    toast.success(t('auth.passwordResetSuccess'));

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (error) {
    resetError.value = typeof error === 'string' ? error : t('auth.passwordResetFailed');
  }
});

// Go to login page
const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="reset-password-page">
    <div class="auth-container">
      <div class="auth-form-container">
        <div class="auth-header">
          <h1 class="auth-title">{{ t('auth.resetPasswordTitle') }}</h1>
          <p class="auth-subtitle">{{ t('auth.resetPasswordDesc') }}</p>
        </div>

        <div v-if="resetError" class="auth-error">
          <BaseAlert type="error" :message="resetError" />
        </div>

        <div v-if="resetSuccess" class="auth-success">
          <BaseAlert type="success" :message="t('auth.passwordResetSuccess')" />
        </div>

        <form v-if="!resetSuccess" @submit.prevent="onSubmit" class="auth-form">
          <div class="form-group">
            <BaseInput
              v-model="password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              :label="t('common.newPassword')"
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
              v-model="password_confirmation"
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
            <BaseButton
              type="submit"
              :label="t('auth.resetPasswordButton')"
              variant="primary"
              full-width
              :loading="authStore.loading"
            />
          </div>
        </form>

        <div v-else class="form-actions">
          <BaseButton
            :label="t('auth.backToLogin')"
            variant="outline"
            full-width
            @click="goToLogin"
          />
        </div>

        <div class="auth-footer">
          <p>
            {{ t('auth.rememberPassword') }}
            <a href="#" @click.prevent="goToLogin">{{ t('auth.loginHere') }}</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reset-password-page {
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
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.auth-header {
  margin-bottom: 2rem;
  text-align: center;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: #666;
  font-size: 1rem;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #666;

  &:hover {
    color: var(--primary-color);
  }
}

.password-requirements {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.form-actions {
  margin-top: 2rem;
}

.auth-error,
.auth-success {
  margin-bottom: 1.5rem;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;

  a {
    color: var(--primary-color);
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: 768px) {
  .auth-form-container {
    padding: 1.5rem;
  }

  .auth-title {
    font-size: 1.5rem;
  }
}
</style>

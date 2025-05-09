<script setup lang="ts">
import { ref } from 'vue';
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
const { forgotPasswordSchema } = useValidation();
const toast = useToast();

// Form state
const resetError = ref('');
const resetSuccess = ref(false);
const resetMessage = ref('');

// Form validation
const { handleSubmit, errors } = useForm({
  validationSchema: forgotPasswordSchema
});

// Use useField for email
const { value: email } = useField('email');

// Handle form submission
const onSubmit = handleSubmit(async (formValues) => {
  try {
    resetError.value = '';
    resetSuccess.value = false;

    // Call API to send password reset email
    await authStore.forgotPassword(formValues.email);

    resetSuccess.value = true;
    resetMessage.value = t('auth.resetLinkSent');
    toast.success(t('auth.resetLinkSent'));
  } catch (error) {
    resetError.value = typeof error === 'string' ? error : t('auth.resetLinkFailed');
  }
});

// Switch to login page
const goToLogin = () => {
  router.push({
    path: '/login',
    query: route.query
  });
};
</script>

<template>
  <div class="forgot-password-page">
    <div class="auth-container">
      <div class="auth-form-container">
        <div class="auth-header">
          <h1 class="auth-title">{{ t('auth.forgotPasswordTitle') }}</h1>
          <p class="auth-subtitle">{{ t('auth.forgotPasswordDesc') }}</p>
        </div>

        <div v-if="resetError" class="auth-error">
          <BaseAlert type="error" :message="resetError" />
        </div>

        <div v-if="resetSuccess" class="auth-success">
          <BaseAlert type="success" :message="resetMessage" />
        </div>

        <form v-if="!resetSuccess" @submit.prevent="onSubmit" class="auth-form">
          <div class="form-group">
            <BaseInput
              v-model="email"
              name="email"
              type="email"
              :label="t('common.email')"
              :placeholder="t('auth.emailPlaceholder')"
              :error="errors.email"
              required
              icon="pi-envelope"
            />
          </div>

          <div class="form-actions">
            <BaseButton
              type="submit"
              :label="t('auth.sendResetLink')"
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
.forgot-password-page {
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

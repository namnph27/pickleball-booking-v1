<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';
import { useAuthStore } from '../../store/auth';
import { useValidation } from '../../composables/useValidation';
import { useAuth } from '../../composables/useAuth';
import { useToast } from '../../composables/useToast';
import BaseLayout from '../../components/layout/BaseLayout.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseInput from '../../components/base/BaseInput.vue';
import BaseSelect from '../../components/base/BaseSelect.vue';
import BaseCard from '../../components/base/BaseCard.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseModal from '../../components/base/BaseModal.vue';

const { t, locale } = useI18n();
const authStore = useAuthStore();
const { profileSchema, changePasswordSchema } = useValidation();
const { updateProfile, changePassword, deleteAccount: deleteUserAccount } = useAuth();
const toast = useToast();

// State
const activeTab = ref('personal');
const showPasswordModal = ref(false);
const showDeleteModal = ref(false);
const isUpdating = ref(false);
const isChangingPassword = ref(false);
const isDeleting = ref(false);
const updateSuccess = ref(false);
const updateError = ref('');
const passwordError = ref('');
const deleteConfirmText = ref('');

// Computed properties
const user = computed(() => authStore.user);
const isCourtOwner = computed(() => authStore.isCourtOwner);

// Language options
const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' }
];

// Form values for profile
const profileForm = ref({
  name: user.value?.name || '',
  email: user.value?.email || '',
  phone: user.value?.phone || ''
});

// Form errors
const profileErrors = ref({
  name: '',
  email: '',
  phone: ''
});

// Form validation for password change
const { handleSubmit: handlePasswordSubmit, errors: passwordErrors, values: passwordValues, resetForm: resetPasswordForm } = useForm({
  validationSchema: changePasswordSchema
});

// Validate profile form
const validateProfileForm = () => {
  let isValid = true;
  profileErrors.value = {
    name: '',
    email: '',
    phone: ''
  };

  // Validate name
  if (!profileForm.value.name) {
    profileErrors.value.name = t('auth.requiredField');
    isValid = false;
  } else if (profileForm.value.name.length < 2) {
    profileErrors.value.name = t('validation.minLength', { min: 2 });
    isValid = false;
  }

  // Validate email
  if (!profileForm.value.email) {
    profileErrors.value.email = t('auth.requiredField');
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.value.email)) {
    profileErrors.value.email = t('auth.invalidEmail');
    isValid = false;
  }

  // Validate phone
  if (!profileForm.value.phone) {
    profileErrors.value.phone = t('auth.requiredField');
    isValid = false;
  } else if (!/^[0-9+\-\s()]{8,15}$/.test(profileForm.value.phone)) {
    profileErrors.value.phone = t('auth.invalidPhone');
    isValid = false;
  }

  return isValid;
};

// Update profile
const onProfileSubmit = async () => {
  if (!validateProfileForm()) {
    return;
  }

  isUpdating.value = true;
  updateSuccess.value = false;
  updateError.value = '';

  try {
    const success = await updateProfile({
      name: profileForm.value.name,
      email: profileForm.value.email,
      phone: profileForm.value.phone
    });

    if (success) {
      updateSuccess.value = true;
      toast.success(t('profile.profileUpdated'));
    }
  } catch (error) {
    updateError.value = typeof error === 'string' ? error : t('profile.updateError');
  } finally {
    isUpdating.value = false;
  }
};

// Change password
const onPasswordSubmit = handlePasswordSubmit(async (formValues) => {
  isChangingPassword.value = true;
  passwordError.value = '';

  try {
    const success = await changePassword({
      current_password: formValues.current_password,
      new_password: formValues.new_password
    });

    if (success) {
      showPasswordModal.value = false;
      resetPasswordForm();
      toast.success(t('profile.passwordChanged'));
    }
  } catch (error) {
    passwordError.value = typeof error === 'string' ? error : t('profile.passwordChangeError');
  } finally {
    isChangingPassword.value = false;
  }
});

// Delete account
const deleteAccount = async () => {
  if (deleteConfirmText.value !== user.value?.email) {
    toast.error(t('profile.confirmEmailMismatch'));
    return;
  }

  isDeleting.value = true;

  try {
    // Call API to delete account
    const success = await deleteUserAccount();

    if (success) {
      showDeleteModal.value = false;
      // Đăng xuất và chuyển hướng sẽ được xử lý trong useAuth.ts
    }
    // Không cần throw error ở đây vì lỗi đã được xử lý trong useAuth.ts
  } catch (error) {
    console.error('Error in deleteAccount:', error);
    // Thông báo lỗi đã được xử lý trong useAuth.ts
  } finally {
    isDeleting.value = false;
  }
};

// Change language
const changeLanguage = (lang: string) => {
  locale.value = lang;
};

// Reset forms when user data changes
onMounted(() => {
  if (user.value) {
    profileForm.value = {
      name: user.value.name,
      email: user.value.email,
      phone: user.value.phone || ''
    };
  }
});

// Watch for user changes
watch(() => user.value, (newUser) => {
  if (newUser) {
    profileForm.value = {
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || ''
    };
  }
});
</script>

<template>
  <BaseLayout :title="t('profile.myProfile')">
    <div class="profile-page">
      <div class="profile-container">
        <!-- Profile Tabs -->
        <div class="profile-tabs">
          <button
            class="tab-button"
            :class="{ 'active': activeTab === 'personal' }"
            @click="activeTab = 'personal'"
          >
            <i class="pi pi-user"></i>
            <span>{{ t('profile.personalInfo') }}</span>
          </button>

          <button
            class="tab-button"
            :class="{ 'active': activeTab === 'settings' }"
            @click="activeTab = 'settings'"
          >
            <i class="pi pi-cog"></i>
            <span>{{ t('profile.accountSettings') }}</span>
          </button>

          <button
            v-if="isCourtOwner"
            class="tab-button"
            :class="{ 'active': activeTab === 'court-owner' }"
            @click="activeTab = 'court-owner'"
          >
            <i class="pi pi-building"></i>
            <span>{{ t('profile.courtOwnerInfo') }}</span>
          </button>
        </div>

        <!-- Personal Information Tab -->
        <div v-if="activeTab === 'personal'" class="profile-content">
          <BaseCard>
            <template #header>
              <h2 class="section-title">{{ t('profile.personalInfo') }}</h2>
            </template>

            <div v-if="updateSuccess" class="update-success">
              <BaseAlert type="success" :message="t('profile.profileUpdated')" />
            </div>

            <div v-if="updateError" class="update-error">
              <BaseAlert type="error" :message="updateError" />
            </div>

            <form @submit.prevent="onProfileSubmit" class="profile-form">
              <div class="form-group">
                <BaseInput
                  v-model="profileForm.name"
                  name="name"
                  :label="t('common.name')"
                  :error="profileErrors.name"
                  required
                />
              </div>

              <div class="form-group">
                <BaseInput
                  v-model="profileForm.email"
                  name="email"
                  type="email"
                  :label="t('common.email')"
                  :error="profileErrors.email"
                  required
                  disabled
                />
              </div>

              <div class="form-group">
                <BaseInput
                  v-model="profileForm.phone"
                  name="phone"
                  :label="t('common.phone')"
                  :error="profileErrors.phone"
                  required
                />
              </div>

              <div class="form-actions">
                <BaseButton
                  type="submit"
                  :label="t('profile.updateProfile')"
                  variant="primary"
                  :loading="isUpdating"
                />
              </div>
            </form>
          </BaseCard>
        </div>

        <!-- Account Settings Tab -->
        <div v-else-if="activeTab === 'settings'" class="profile-content">
          <BaseCard>
            <template #header>
              <h2 class="section-title">{{ t('profile.accountSettings') }}</h2>
            </template>

            <div class="settings-section">
              <h3 class="settings-title">{{ t('profile.security') }}</h3>

              <div class="settings-item">
                <div class="settings-info">
                  <h4>{{ t('profile.changePassword') }}</h4>
                  <p>{{ t('profile.passwordDescription') }}</p>
                </div>

                <BaseButton
                  :label="t('profile.changePassword')"
                  variant="outline"
                  @click="showPasswordModal = true"
                />
              </div>

              <div class="settings-item">
                <div class="settings-info">
                  <h4>{{ t('profile.twoFactorAuth') }}</h4>
                  <p>{{ t('profile.twoFactorDescription') }}</p>
                </div>

                <BaseButton
                  :label="t('profile.setup2FA')"
                  variant="outline"
                />
              </div>
            </div>

            <div class="settings-section">
              <h3 class="settings-title">{{ t('profile.preferences') }}</h3>

              <div class="settings-item">
                <div class="settings-info">
                  <h4>{{ t('profile.notifications') }}</h4>
                  <p>{{ t('profile.notificationsDescription') }}</p>
                </div>

                <div class="notification-toggles">
                  <div class="toggle-item">
                    <label class="toggle-label">
                      <input type="checkbox" checked />
                      <span class="toggle-switch"></span>
                      {{ t('profile.emailNotifications') }}
                    </label>
                  </div>

                  <div class="toggle-item">
                    <label class="toggle-label">
                      <input type="checkbox" />
                      <span class="toggle-switch"></span>
                      {{ t('profile.smsNotifications') }}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-section danger-zone">
              <h3 class="settings-title">{{ t('profile.dangerZone') }}</h3>

              <div class="settings-item">
                <div class="settings-info">
                  <h4>{{ t('profile.deleteAccount') }}</h4>
                  <p>{{ t('profile.deleteAccountDescription') }}</p>
                </div>

                <BaseButton
                  :label="t('profile.deleteAccount')"
                  variant="danger"
                  @click="showDeleteModal = true"
                />
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Court Owner Information Tab -->
        <div v-else-if="activeTab === 'court-owner'" class="profile-content">
          <BaseCard>
            <template #header>
              <h2 class="section-title">{{ t('profile.courtOwnerInfo') }}</h2>
            </template>

            <div class="court-owner-info">
              <div class="info-section">
                <h3 class="info-title">{{ t('profile.businessInfo') }}</h3>

                <div class="info-item">
                  <span class="info-label">{{ t('profile.businessName') }}:</span>
                  <span class="info-value">{{ user?.name }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">{{ t('profile.businessEmail') }}:</span>
                  <span class="info-value">{{ user?.email }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">{{ t('profile.businessPhone') }}:</span>
                  <span class="info-value">{{ user?.phone || t('profile.notProvided') }}</span>
                </div>
              </div>

              <div class="court-stats">
                <h3 class="info-title">{{ t('profile.courtStats') }}</h3>

                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">0</div>
                    <div class="stat-label">{{ t('profile.totalCourts') }}</div>
                  </div>

                  <div class="stat-card">
                    <div class="stat-value">$0</div>
                    <div class="stat-label">{{ t('profile.totalRevenue') }}</div>
                  </div>
                </div>
              </div>

              <div class="court-actions">
                <BaseButton
                  :label="t('profile.manageCourts')"
                  variant="primary"
                  icon="pi-building"
                  @click="$router.push('/owner/courts')"
                />
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <BaseModal
      v-model="showPasswordModal"
      :title="t('profile.changePassword')"
      :ok-text="t('profile.updatePassword')"
      :cancel-text="t('common.cancel')"
      :loading="isChangingPassword"
      @ok="onPasswordSubmit"
    >
      <div v-if="passwordError" class="modal-error">
        <BaseAlert type="error" :message="passwordError" />
      </div>

      <form @submit.prevent="onPasswordSubmit" class="password-form">
        <div class="form-group">
          <BaseInput
            v-model="passwordValues.current_password"
            name="current_password"
            type="password"
            :label="t('profile.currentPassword')"
            :error="passwordErrors.current_password"
            required
          />
        </div>

        <div class="form-group">
          <BaseInput
            v-model="passwordValues.new_password"
            name="new_password"
            type="password"
            :label="t('profile.newPassword')"
            :error="passwordErrors.new_password"
            required
          />
        </div>

        <div class="form-group">
          <BaseInput
            v-model="passwordValues.confirm_new_password"
            name="confirm_new_password"
            type="password"
            :label="t('profile.confirmNewPassword')"
            :error="passwordErrors.confirm_new_password"
            required
          />
        </div>
      </form>

      <div class="password-requirements">
        <p>{{ t('auth.passwordRequirements') }}</p>
      </div>
    </BaseModal>

    <!-- Delete Account Modal -->
    <BaseModal
      v-model="showDeleteModal"
      :title="t('profile.deleteAccount')"
      :ok-text="t('profile.confirmDelete')"
      :cancel-text="t('common.cancel')"
      ok-variant="danger"
      :loading="isDeleting"
      @ok="deleteAccount"
    >
      <BaseAlert type="error" :title="t('profile.deleteWarning')" :message="t('profile.deleteConfirmation')" />

      <div class="delete-confirmation">
        <p>{{ t('profile.typeEmailToConfirm') }}</p>

        <BaseInput
          v-model="deleteConfirmText"
          :placeholder="user?.email"
        />
      </div>
    </BaseModal>
  </BaseLayout>
</template>

<style scoped lang="scss">
.profile-page {
  display: flex;
  justify-content: center;
}

.profile-container {
  width: 100%;
  max-width: 800px;
}

.profile-tabs {
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--medium-gray);

  .tab-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    color: var(--dark-gray);
    cursor: pointer;
    position: relative;

    i {
      font-size: 1.125rem;
    }

    &.active {
      color: var(--primary-color);

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: var(--primary-color);
      }
    }
  }
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.profile-form {
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-actions {
    margin-top: 2rem;
  }
}

.update-success,
.update-error {
  margin-bottom: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--light-gray);

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  &.danger-zone {
    background-color: rgba(244, 67, 54, 0.05);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid rgba(244, 67, 54, 0.2);
  }

  .settings-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
  }

  .settings-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }

    .settings-info {
      flex: 1;

      h4 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
      }

      p {
        font-size: 0.875rem;
        color: var(--dark-gray);
        margin: 0;
      }
    }

    .notification-toggles {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .toggle-item {
        .toggle-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;

          input {
            display: none;
          }

          .toggle-switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 20px;
            background-color: var(--medium-gray);
            border-radius: 20px;
            transition: all 0.3s;

            &::after {
              content: '';
              position: absolute;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background-color: white;
              top: 1px;
              left: 1px;
              transition: all 0.3s;
            }
          }

          input:checked + .toggle-switch {
            background-color: var(--primary-color);

            &::after {
              transform: translateX(20px);
            }
          }
        }
      }
    }
  }
}

.court-owner-info {
  .info-section {
    margin-bottom: 2rem;

    .info-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .info-item {
      display: flex;
      margin-bottom: 0.75rem;

      .info-label {
        width: 150px;
        font-weight: 500;
      }

      .info-value {
        color: var(--dark-gray);
      }
    }
  }

  .court-stats {
    margin-bottom: 2rem;

    .info-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;

      .stat-card {
        background-color: var(--light-gray);
        padding: 1.5rem;
        border-radius: 8px;
        text-align: center;

        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--primary-color);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--dark-gray);
        }
      }
    }
  }

  .court-actions {
    display: flex;
    gap: 1rem;
  }
}

.modal-error {
  margin-bottom: 1.5rem;
}

.password-form {
  .form-group {
    margin-bottom: 1.5rem;
  }
}

.password-requirements {
  font-size: 0.75rem;
  color: var(--dark-gray);
  margin-top: 1rem;
}

.delete-confirmation {
  margin-top: 1.5rem;

  p {
    margin-bottom: 1rem;
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .profile-tabs {
    flex-direction: column;
    border-bottom: none;
    gap: 0.5rem;
    margin-bottom: 1.5rem;

    .tab-button {
      padding: 0.75rem;
      border-radius: 4px;
      border: 1px solid var(--medium-gray);

      &.active {
        background-color: var(--primary-color);
        color: white;
        border-color: var(--primary-color);

        &::after {
          display: none;
        }
      }
    }
  }

  .settings-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;

    .settings-info {
      width: 100%;
    }
  }

  .court-stats {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }

  .court-actions {
    flex-direction: column;
  }
}
</style>

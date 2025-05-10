<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { onMounted, ref } from 'vue';
import BaseModal from '../../components/base/BaseModal.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

// State cho modal xác nhận
const showConfirmModal = ref(false);
const isDeleting = ref(false);

// Kiểm tra xem người dùng có phải là chủ sân bị từ chối không
onMounted(() => {
  if (!authStore.isAuthenticated) {
    // Nếu không đăng nhập, chuyển hướng đến trang đăng nhập
    router.push('/login');
    return;
  }

  if (!authStore.isCourtOwner) {
    // Nếu không phải chủ sân, chuyển hướng đến trang chủ
    router.push('/');
    return;
  }

  if (!authStore.isRejected) {
    // Nếu không phải bị từ chối, chuyển hướng đến trang chủ
    router.push('/');
    return;
  }
});

// Ngăn chặn việc rời khỏi trang này nếu người dùng là chủ sân bị từ chối
onBeforeRouteLeave((to, from, next) => {
  // Chỉ cho phép đi đến trang đăng nhập (đăng xuất)
  if (to.path === '/login') {
    next();
  } else if (authStore.isRejected) {
    // Nếu bị từ chối và cố gắng đi đến trang khác, chặn lại
    next(false);
  } else {
    next();
  }
});

// Hàm để mở modal xác nhận
const openConfirmModal = () => {
  showConfirmModal.value = true;
};

// Hàm để xử lý khi người dùng xác nhận trong modal
const handleConfirm = async () => {
  try {
    isDeleting.value = true;

    // Gọi API để xóa tài khoản
    const result = await authStore.deleteRejectedAccount();
    console.log('Account deleted successfully:', result);

    // Đăng xuất
    await authStore.logout();
    // Chuyển hướng đến trang đăng nhập
    router.push('/login');
  } catch (error) {
    console.error('Error during account deletion or logout:', error);

    // Hiển thị thông báo lỗi nhưng vẫn tiếp tục đăng xuất
    alert(t('auth.accountDeleteErrorButLogout'));

    // Vẫn đăng xuất ngay cả khi xóa tài khoản thất bại
    try {
      await authStore.logout();
      router.push('/login');
    } catch (logoutError) {
      console.error('Error during logout after deletion failure:', logoutError);
      // Nếu cả đăng xuất cũng thất bại, vẫn chuyển hướng đến trang đăng nhập
      router.push('/login');
    }
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div class="rejected-account-page">
    <div class="rejection-container">
      <div class="rejection-icon">
        <i class="pi pi-times-circle"></i>
      </div>

      <h1 class="rejection-title">{{ t('auth.rejectedAccountTitle') }}</h1>

      <p class="rejection-message">
        {{ t('auth.rejectedAccountMessage') }}
      </p>

      <div class="rejection-info">
        <h2>{{ t('auth.whatToDoNext') }}</h2>
        <ul>
          <li>{{ t('auth.contactAdminInfo') }}</li>
          <li>{{ t('auth.provideMoreInfoSuggestion') }}</li>
          <li>{{ t('auth.registerNewAccountSuggestion') }}</li>
        </ul>
      </div>

      <div class="account-deletion-notice">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ t('auth.rejectedAccountDeletionNotice') }}</p>
      </div>

      <div class="rejection-actions">
        <button class="logout-button" @click="openConfirmModal">
          <i class="pi pi-sign-out"></i>
          <span>{{ t('auth.logoutAndDelete') }}</span>
        </button>
      </div>

      <!-- Modal xác nhận đăng xuất và xóa tài khoản -->
      <BaseModal
        v-model="showConfirmModal"
        :title="t('auth.confirmAction')"
        :ok-text="t('auth.proceedLogoutDelete')"
        :cancel-text="t('common.cancel')"
        ok-variant="danger"
        :loading="isDeleting"
        @ok="handleConfirm"
      >
        <div class="confirm-modal-content">
          <div class="confirm-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>

          <h3 class="confirm-title">{{ t('auth.accountDeletionWarning') }}</h3>

          <p class="confirm-message">
            {{ t('auth.rejectedAccountLogoutConfirm') }}
          </p>

          <div class="confirm-details">
            <p>{{ t('auth.afterDeletionInfo') }}</p>
          </div>
        </div>
      </BaseModal>
    </div>
  </div>
</template>

<style scoped lang="scss">
.rejected-account-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
  background-color: var(--background-color);
}

.rejection-container {
  max-width: 600px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  text-align: center;
}

.rejection-icon {
  font-size: 4rem;
  color: var(--danger-color);
  margin-bottom: 1.5rem;
}

.rejection-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.rejection-message {
  font-size: 1.1rem;
  color: var(--text-color);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.rejection-info {
  text-align: left;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--light-gray);
  border-radius: 8px;

  h2 {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-color);
  }

  ul {
    padding-left: 1.5rem;

    li {
      margin-bottom: 0.8rem;
      line-height: 1.5;
      color: var(--text-color);
    }
  }
}

.account-deletion-notice {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(255, 87, 87, 0.1);
  border-left: 4px solid var(--danger-color);
  border-radius: 4px;
  display: flex;
  align-items: flex-start;

  i {
    color: var(--danger-color);
    font-size: 1.5rem;
    margin-right: 1rem;
    margin-top: 0.2rem;
  }

  p {
    margin: 0;
    color: var(--text-color);
    line-height: 1.5;
    font-size: 0.95rem;
  }
}

.account-deletion-warning {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: rgba(255, 193, 7, 0.1);
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;

  i {
    color: #ffc107;
    font-size: 1.5rem;
    margin-right: 1rem;
    margin-top: 0.2rem;
  }

  p {
    margin: 0;
    color: var(--text-color);
    line-height: 1.5;
    font-size: 0.95rem;
    font-weight: 500;
  }
}

.rejection-actions {
  display: flex;
  justify-content: center;
}

.confirm-modal-content {
  text-align: center;
  padding: 1rem 0;

  .confirm-icon {
    font-size: 3rem;
    color: var(--danger-color);
    margin-bottom: 1rem;

    i {
      animation: pulse 1.5s infinite;
    }
  }

  .confirm-title {
    color: var(--danger-color);
    font-size: 1.4rem;
    margin-bottom: 1rem;
  }

  .confirm-message {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .confirm-details {
    background-color: rgba(255, 193, 7, 0.1);
    border-left: 4px solid #ffc107;
    padding: 1rem;
    text-align: left;
    border-radius: 4px;

    p {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.5;
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.logout-button {
  background: linear-gradient(135deg, #e53935, #d32f2f);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1.2rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  max-width: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  box-shadow: 0 6px 12px rgba(211, 47, 47, 0.3);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
  margin-top: 1rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  i {
    font-size: 1.4rem;
    transition: transform 0.3s;
  }

  &:hover {
    background: linear-gradient(135deg, #f44336, #e53935);
    transform: translateY(-3px);
    box-shadow: 0 8px 15px rgba(211, 47, 47, 0.4);

    &::before {
      transform: translateX(100%);
    }

    i {
      transform: translateX(-3px);
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 8px rgba(211, 47, 47, 0.3);
  }
}
</style>

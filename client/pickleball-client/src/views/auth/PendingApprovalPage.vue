<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { onMounted } from 'vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

// Kiểm tra xem người dùng có phải là chủ sân đang chờ phê duyệt không
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

  if (!authStore.isPendingApproval) {
    // Nếu không phải đang chờ phê duyệt, chuyển hướng đến trang chủ
    router.push('/');
    return;
  }
});

// Ngăn chặn việc rời khỏi trang này nếu người dùng là chủ sân đang chờ phê duyệt
onBeforeRouteLeave((to, from, next) => {
  // Chỉ cho phép đi đến trang đăng nhập (đăng xuất)
  if (to.path === '/login') {
    next();
  } else if (authStore.isPendingApproval) {
    // Nếu đang chờ phê duyệt và cố gắng đi đến trang khác, chặn lại
    next(false);
  } else {
    next();
  }
});

// Hàm để đăng xuất và quay lại trang đăng nhập
const logout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="pending-approval-page">
    <div class="approval-container">
      <div class="approval-icon">
        <i class="pi pi-clock"></i>
      </div>

      <h1 class="approval-title">{{ t('auth.pendingApprovalTitle') }}</h1>

      <p class="approval-message">
        {{ t('auth.pendingApprovalMessage') }}
      </p>

      <div class="approval-info">
        <h2>{{ t('auth.whatHappensNext') }}</h2>
        <ul>
          <li>{{ t('auth.adminReviewInfo') }}</li>
          <li>{{ t('auth.emailNotificationInfo') }}</li>
          <li>{{ t('auth.approvalTimeInfo') }}</li>
        </ul>
      </div>

      <div class="approval-actions">
        <button class="logout-button" @click="logout">
          {{ t('auth.logout') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pending-approval-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.approval-container {
  width: 100%;
  max-width: 600px;
  background-color: var(--white);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  text-align: center;
}

.approval-icon {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: 1.5rem;

  i {
    background-color: rgba(76, 175, 80, 0.1);
    border-radius: 50%;
    padding: 1rem;
  }
}

.approval-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.approval-message {
  font-size: 1.1rem;
  color: var(--dark-gray);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.approval-info {
  text-align: left;
  background-color: rgba(76, 175, 80, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;

  h2 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-color);
  }

  ul {
    padding-left: 1.5rem;

    li {
      margin-bottom: 0.75rem;
      color: var(--dark-gray);
      line-height: 1.5;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.approval-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;

  button {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .logout-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    width: 100%;
    max-width: 200px;

    &:hover {
      background-color: #061528;
    }
  }
}

@media (max-width: 768px) {
  .pending-approval-page {
    padding: 1rem;
  }

  .approval-container {
    padding: 1.5rem;
  }

  .approval-actions {
    flex-direction: column;

    button {
      width: 100%;
    }
  }
}
</style>

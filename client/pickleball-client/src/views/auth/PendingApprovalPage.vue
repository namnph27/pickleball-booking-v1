<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

// Hàm để đăng xuất và quay lại trang đăng nhập
const logout = async () => {
  await authStore.logout();
  router.push('/login');
};

// Hàm để quay lại trang chủ
const goToHome = () => {
  router.push('/');
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
        <button class="home-button" @click="goToHome">
          {{ t('common.backToHome') }}
        </button>
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
  
  .home-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    
    &:hover {
      background-color: #061528;
    }
  }
  
  .logout-button {
    background-color: transparent;
    color: var(--dark-gray);
    border: 1px solid var(--medium-gray);
    
    &:hover {
      color: var(--text-color);
      border-color: var(--dark-gray);
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

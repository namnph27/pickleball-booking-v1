<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BaseButton from '../../components/base/BaseButton.vue';

const { t } = useI18n();
const router = useRouter();

const goHome = () => {
  router.push('/');
};

const goBack = () => {
  router.go(-1);
};
</script>

<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-code">404</div>
      <h1 class="error-title">{{ t('errors.pageNotFound') }}</h1>
      <p class="error-message">{{ t('errors.pageNotFoundMessage') }}</p>
      
      <div class="error-actions">
        <BaseButton 
          :label="t('errors.goHome')" 
          variant="primary"
          @click="goHome"
        />
        
        <BaseButton 
          :label="t('errors.goBack')" 
          variant="outline"
          @click="goBack"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.error-container {
  text-align: center;
  max-width: 500px;
}

.error-code {
  font-size: 8rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.error-message {
  color: var(--dark-gray);
  margin-bottom: 2rem;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

@media (max-width: 768px) {
  .error-code {
    font-size: 6rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
}
</style>

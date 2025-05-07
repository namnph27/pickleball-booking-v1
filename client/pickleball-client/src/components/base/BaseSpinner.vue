<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value: string) => ['small', 'medium', 'large'].includes(value)
  },
  color: {
    type: String,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary', 'white', 'dark'].includes(value)
  },
  label: {
    type: String,
    default: ''
  },
  fullPage: {
    type: Boolean,
    default: false
  }
});

const { t } = useI18n();

const spinnerClasses = computed(() => {
  return [
    'base-spinner',
    `base-spinner--${props.size}`,
    `base-spinner--${props.color}`,
    props.fullPage ? 'base-spinner--full-page' : ''
  ];
});

const spinnerLabel = computed(() => {
  return props.label || t('common.loading');
});
</script>

<template>
  <div :class="spinnerClasses">
    <div class="base-spinner__container">
      <div class="base-spinner__icon">
        <i class="pi pi-spin pi-spinner"></i>
      </div>
      <div v-if="spinnerLabel" class="base-spinner__label">{{ spinnerLabel }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.base-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  
  &--full-page {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 9999;
  }
  
  &__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
  }
  
  &__label {
    font-weight: 500;
  }
  
  // Size variants
  &--small {
    .base-spinner__icon {
      font-size: 1.25rem;
    }
    
    .base-spinner__label {
      font-size: 0.75rem;
    }
  }
  
  &--medium {
    .base-spinner__icon {
      font-size: 2rem;
    }
    
    .base-spinner__label {
      font-size: 0.875rem;
    }
  }
  
  &--large {
    .base-spinner__icon {
      font-size: 3rem;
    }
    
    .base-spinner__label {
      font-size: 1rem;
    }
  }
  
  // Color variants
  &--primary {
    .base-spinner__icon,
    .base-spinner__label {
      color: var(--primary-color);
    }
  }
  
  &--secondary {
    .base-spinner__icon,
    .base-spinner__label {
      color: var(--secondary-color);
    }
  }
  
  &--white {
    .base-spinner__icon,
    .base-spinner__label {
      color: white;
    }
  }
  
  &--dark {
    .base-spinner__icon,
    .base-spinner__label {
      color: var(--text-color);
    }
  }
}
</style>

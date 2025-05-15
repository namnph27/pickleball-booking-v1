<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value: string) => ['info', 'success', 'warning', 'error'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  dismissible: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
  },
  bordered: {
    type: Boolean,
    default: true
  },
  filled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const isVisible = ref(true);

const alertClasses = computed(() => {
  return [
    'base-alert',
    `base-alert--${props.type}`,
    props.bordered ? 'base-alert--bordered' : '',
    props.filled ? 'base-alert--filled' : ''
  ];
});

const defaultIcons = {
  info: 'pi-info-circle',
  success: 'pi-check-circle',
  warning: 'pi-exclamation-triangle',
  error: 'pi-times-circle'
};

const alertIcon = computed(() => {
  return props.icon || defaultIcons[props.type as keyof typeof defaultIcons];
});

const close = () => {
  isVisible.value = false;
  emit('close');
};
</script>

<template>
  <div v-if="isVisible" :class="alertClasses" role="alert">
    <div class="base-alert__icon">
      <i :class="`pi ${alertIcon}`"></i>
    </div>

    <div class="base-alert__content">
      <h4 v-if="title" class="base-alert__title">{{ title }}</h4>
      <p v-if="message" class="base-alert__message">{{ message }}</p>
      <slot></slot>
    </div>

    <button
      v-if="dismissible"
      class="base-alert__close"
      @click="close"
      aria-label="Close alert"
    >
      <i class="pi pi-times"></i>
    </button>
  </div>
</template>

<style scoped lang="scss">
.base-alert {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  position: relative;

  &--info {
    background-color: rgba(33, 150, 243, 0.1);
    color: #0277bd;

    .base-alert__icon {
      color: #0277bd;
    }

    &.base-alert--bordered {
      border-left: 4px solid #0277bd;
    }

    &.base-alert--filled {
      background-color: #2196f3;
      color: white;

      .base-alert__icon,
      .base-alert__close {
        color: white;
      }
    }
  }

  &--success {
    background-color: rgba(76, 175, 80, 0.1);
    color: #2e7d32;

    .base-alert__icon {
      color: #2e7d32;
    }

    &.base-alert--bordered {
      border-left: 4px solid #2e7d32;
    }

    &.base-alert--filled {
      background-color: #4caf50;
      color: white;

      .base-alert__icon,
      .base-alert__close {
        color: white;
      }
    }
  }

  &--warning {
    background-color: rgba(255, 152, 0, 0.1);
    color: #ef6c00;

    .base-alert__icon {
      color: #ef6c00;
    }

    &.base-alert--bordered {
      border-left: 4px solid #ef6c00;
    }

    &.base-alert--filled {
      background-color: #ff9800;
      color: white;

      .base-alert__icon,
      .base-alert__close {
        color: white;
      }
    }
  }

  &--error {
    background-color: rgba(244, 67, 54, 0.1);
    color: #c62828;

    .base-alert__icon {
      color: #c62828;
    }

    &.base-alert--bordered {
      border-left: 4px solid #c62828;
    }

    &.base-alert--filled {
      background-color: #f44336;
      color: white;

      .base-alert__icon,
      .base-alert__close {
        color: white;
      }
    }
  }

  &__icon {
    margin-right: 0.75rem;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__content {
    flex-grow: 1;
  }

  &__title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
  }

  &__message {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
    word-break: break-word;
  }

  &__close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    font-size: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    color: inherit;

    &:hover {
      opacity: 1;
    }
  }
}

@media (max-width: 768px) {
  .base-alert {
    padding: 0.75rem;

    &__icon {
      font-size: 1.125rem;
    }

    &__title {
      font-size: 0.9375rem;
    }

    &__message {
      font-size: 0.8125rem;
    }
  }
}
</style>

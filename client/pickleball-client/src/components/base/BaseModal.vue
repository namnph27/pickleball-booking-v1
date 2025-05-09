<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseButton from './BaseButton.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  // Thêm prop visible để tương thích với v-model:visible
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value: string) => ['small', 'medium', 'large', 'fullscreen'].includes(value)
  },
  persistent: {
    type: Boolean,
    default: false
  },
  hideClose: {
    type: Boolean,
    default: false
  },
  hideFooter: {
    type: Boolean,
    default: false
  },
  // Thêm prop footer để tương thích với :footer="false"
  footer: {
    type: [Boolean, String],
    default: true
  },
  okText: {
    type: String,
    default: ''
  },
  cancelText: {
    type: String,
    default: ''
  },
  okVariant: {
    type: String,
    default: 'primary'
  },
  cancelVariant: {
    type: String,
    default: 'outline'
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'update:visible', 'ok', 'cancel']);

const { t } = useI18n();

// Sử dụng visible nếu được cung cấp, nếu không thì sử dụng modelValue
const isOpen = ref(props.visible || props.modelValue);
const modalRef = ref<HTMLElement | null>(null);

// Sync với v-model
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue;
  if (newValue) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

// Sync với v-model:visible
watch(() => props.visible, (newValue) => {
  isOpen.value = newValue;
  if (newValue) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

// Emit cả hai sự kiện khi isOpen thay đổi
watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
  emit('update:visible', newValue);
});

const modalClasses = computed(() => {
  return [
    'base-modal',
    `base-modal--${props.size}`,
    isOpen.value ? 'base-modal--open' : ''
  ];
});

const handleOk = () => {
  emit('ok');
};

const handleCancel = () => {
  if (!props.loading) {
    isOpen.value = false;
    emit('cancel');
  }
};

const handleBackdropClick = (event: MouseEvent) => {
  if (!props.persistent && event.target === event.currentTarget) {
    handleCancel();
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (!props.persistent && event.key === 'Escape' && isOpen.value) {
    handleCancel();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="base-modal__backdrop"
      @click="handleBackdropClick"
    >
      <div
        ref="modalRef"
        :class="modalClasses"
        role="dialog"
        aria-modal="true"
      >
        <div class="base-modal__header">
          <h3 v-if="title" class="base-modal__title">{{ title }}</h3>
          <slot name="header"></slot>
          <button
            v-if="!hideClose"
            class="base-modal__close"
            @click="handleCancel"
            :disabled="loading"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="base-modal__body">
          <slot></slot>
        </div>

        <div v-if="!hideFooter && footer !== false" class="base-modal__footer">
          <slot name="footer">
            <BaseButton
              :label="cancelText || t('common.cancel')"
              :variant="cancelVariant"
              @click="handleCancel"
              :disabled="loading"
            />
            <BaseButton
              :label="okText || t('common.confirm')"
              :variant="okVariant"
              @click="handleOk"
              :loading="loading"
            />
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.base-modal {
  &__backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  &.base-modal {
    background-color: var(--white);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 2rem);
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.3s ease;
    width: 100%;

    &--open {
      opacity: 1;
      transform: scale(1);
    }

    &--small {
      max-width: 400px;
    }

    &--medium {
      max-width: 600px;
    }

    &--large {
      max-width: 800px;
    }

    &--fullscreen {
      max-width: none;
      width: calc(100% - 2rem);
      height: calc(100% - 2rem);
      border-radius: 0;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    padding: 1.25rem;
    border-bottom: 1px solid var(--light-gray);
    position: relative;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    flex-grow: 1;
  }

  &__close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.25rem;
    color: var(--dark-gray);
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;

    &:hover {
      color: var(--text-color);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__body {
    padding: 1.5rem;
    overflow-y: auto;
    flex-grow: 1;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.25rem;
    border-top: 1px solid var(--light-gray);
  }
}

@media (max-width: 768px) {
  .base-modal {
    &.base-modal {
      &--small,
      &--medium,
      &--large {
        max-width: calc(100% - 2rem);
      }
    }

    &__header {
      padding: 1rem;
    }

    &__body {
      padding: 1.25rem;
    }

    &__footer {
      padding: 1rem;
    }
  }
}
</style>

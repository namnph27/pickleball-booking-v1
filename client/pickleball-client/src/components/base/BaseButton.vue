<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary', 'outline', 'text', 'danger', 'success'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value: string) => ['small', 'medium', 'large'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
  },
  iconPosition: {
    type: String,
    default: 'left',
    validator: (value: string) => ['left', 'right'].includes(value)
  },
  type: {
    type: String,
    default: 'button',
    validator: (value: string) => ['button', 'submit', 'reset'].includes(value)
  }
});

const emit = defineEmits(['click']);

const buttonClasses = computed(() => {
  return [
    'base-button',
    `base-button--${props.variant}`,
    `base-button--${props.size}`,
    props.fullWidth ? 'base-button--full-width' : '',
    props.disabled || props.loading ? 'base-button--disabled' : '',
    props.icon && !props.label ? 'base-button--icon-only' : '',
  ];
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <i v-if="loading" class="pi pi-spin pi-spinner button-icon"></i>
    <template v-else>
      <i v-if="icon && iconPosition === 'left'" :class="`pi ${icon} button-icon`"></i>
      <span v-if="label" class="button-label">{{ label }}</span>
      <i v-if="icon && iconPosition === 'right'" :class="`pi ${icon} button-icon`"></i>
      <slot></slot>
    </template>
  </button>
</template>

<style scoped lang="scss">
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
  font-family: 'Noto Sans', 'Roboto', sans-serif;
  gap: 0.5rem;

  &--primary {
    background-color: var(--primary-color);
    color: white;

    &:hover:not(.base-button--disabled) {
      background-color: #061528; /* Darker shade of #0A2342 */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  &--secondary {
    background-color: var(--secondary-color);
    color: white;

    &:hover:not(.base-button--disabled) {
      background-color: #0d71c5; /* Darker shade of #1E90FF */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  &--outline {
    background-color: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);

    &:hover:not(.base-button--disabled) {
      background-color: rgba(10, 35, 66, 0.1);
    }
  }

  &--text {
    background-color: transparent;
    color: var(--primary-color);

    &:hover:not(.base-button--disabled) {
      background-color: rgba(10, 35, 66, 0.1);
    }
  }

  &--danger {
    background-color: #f44336;
    color: white;

    &:hover:not(.base-button--disabled) {
      background-color: #d32f2f; /* Darker shade of #f44336 */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  &--success {
    background-color: #4caf50;
    color: white;

    &:hover:not(.base-button--disabled) {
      background-color: #3d8b40; /* Darker shade of #4caf50 */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  &--small {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  &--medium {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  &--large {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }

  &--full-width {
    width: 100%;
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  &--icon-only {
    padding: 0.75rem;
    border-radius: 50%;
  }

  .button-icon {
    font-size: 1em;
  }

  .button-label {
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .base-button {
    &--small {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    &--medium {
      padding: 0.6rem 1.2rem;
      font-size: 0.9rem;
    }

    &--large {
      padding: 0.8rem 1.6rem;
      font-size: 1rem;
    }
  }
}
</style>

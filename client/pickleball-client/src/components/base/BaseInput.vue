<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useField } from 'vee-validate';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  name: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
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
  autocomplete: {
    type: String,
    default: 'off'
  },
  validateOnInput: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'input']);

// Tạo một local ref để theo dõi giá trị input
const localValue = ref(props.modelValue);

// Nếu name được cung cấp, sử dụng vee-validate
const { value: fieldValue, errorMessage } = props.name
  ? useField(props.name, undefined, {
      initialValue: props.modelValue,
      validateOnValueUpdate: props.validateOnInput
    })
  : { value: ref(props.modelValue), errorMessage: ref('') };

// Tạo một computed để theo dõi giá trị hiển thị
const inputValue = computed({
  get: () => {
    // Ưu tiên sử dụng giá trị từ vee-validate nếu có
    return props.name ? fieldValue.value : localValue.value;
  },
  set: (newValue) => {
    // Cập nhật cả giá trị local và vee-validate
    localValue.value = newValue;
    if (props.name) {
      fieldValue.value = newValue;
    }
    // Emit sự kiện để cập nhật v-model
    emit('update:modelValue', newValue);
  }
});

// Đồng bộ với v-model
watch(() => props.modelValue, (newValue) => {
  if (newValue !== localValue.value) {
    localValue.value = newValue;
    if (props.name && newValue !== fieldValue.value) {
      fieldValue.value = newValue;
    }
  }
});

const displayError = computed(() => {
  return props.error || errorMessage.value;
});

const inputClasses = computed(() => {
  return [
    'base-input__field',
    props.icon ? `base-input__field--with-icon-${props.iconPosition}` : '',
    displayError.value ? 'base-input__field--error' : '',
    props.disabled ? 'base-input__field--disabled' : ''
  ];
});

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newValue = props.type === 'number' ? Number(target.value) : target.value;

  // Cập nhật giá trị thông qua computed setter
  inputValue.value = newValue;

  // Emit sự kiện input
  emit('input', event);
};

const onBlur = (event: FocusEvent) => {
  emit('blur', event);
};

const onFocus = (event: FocusEvent) => {
  emit('focus', event);
};
</script>

<template>
  <div class="base-input">
    <label v-if="label" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required">*</span>
    </label>

    <div class="base-input__container">
      <i v-if="icon && iconPosition === 'left'" :class="`pi ${icon} base-input__icon base-input__icon--left`"></i>

      <input
        :type="type"
        :value="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :class="inputClasses"
        @input="onInput"
        @blur="onBlur"
        @focus="onFocus"
      />

      <i v-if="icon && iconPosition === 'right'" :class="`pi ${icon} base-input__icon base-input__icon--right`"></i>
    </div>

    <div v-if="displayError" class="base-input__error">
      {{ displayError }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.base-input {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  width: 100%;

  &__label {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text-color);
  }

  &__required {
    color: #f44336;
    margin-left: 0.25rem;
  }

  &__container {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__field {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 1px solid var(--medium-gray);
    border-radius: 4px;
    background-color: var(--white);
    transition: all 0.2s ease;
    outline: none;
    font-family: inherit;

    &:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
    }

    &--with-icon-left {
      padding-left: 2.5rem;
    }

    &--with-icon-right {
      padding-right: 2.5rem;
    }

    &--error {
      border-color: #f44336;

      &:focus {
        box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
      }
    }

    &--disabled {
      background-color: var(--light-gray);
      cursor: not-allowed;
    }

    &::placeholder {
      color: var(--dark-gray);
      opacity: 0.7;
    }
  }

  &__icon {
    position: absolute;
    color: var(--dark-gray);
    font-size: 1rem;

    &--left {
      left: 1rem;
    }

    &--right {
      right: 1rem;
    }
  }

  &__error {
    font-size: 0.75rem;
    color: #f44336;
    margin-top: 0.25rem;
  }
}

@media (max-width: 768px) {
  .base-input {
    &__field {
      padding: 0.6rem 0.8rem;
      font-size: 0.9rem;
    }
  }
}
</style>

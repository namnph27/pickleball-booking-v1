<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useField } from 'vee-validate';

const props = defineProps({
  modelValue: {
    type: String,
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
  rows: {
    type: [String, Number],
    default: 3
  },
  maxlength: {
    type: [String, Number],
    default: null
  },
  validateOnInput: {
    type: Boolean,
    default: false
  },
  resize: {
    type: String,
    default: 'vertical',
    validator: (value: string) => ['none', 'vertical', 'horizontal', 'both'].includes(value)
  }
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'input']);

// Tạo một local ref để theo dõi giá trị textarea
const localValue = ref(props.modelValue);

// Nếu name được cung cấp, sử dụng vee-validate
const { value: fieldValue, errorMessage } = props.name
  ? useField(props.name, undefined, {
      initialValue: props.modelValue,
      validateOnValueUpdate: props.validateOnInput
    })
  : { value: ref(props.modelValue), errorMessage: ref('') };

// Tạo một computed để theo dõi giá trị hiển thị
const textareaValue = computed({
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

const textareaClasses = computed(() => {
  return [
    'base-textarea__field',
    displayError.value ? 'base-textarea__field--error' : '',
    props.disabled ? 'base-textarea__field--disabled' : '',
    `base-textarea__field--resize-${props.resize}`
  ];
});

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  
  // Cập nhật giá trị thông qua computed setter
  textareaValue.value = target.value;
  
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
  <div class="base-textarea">
    <label v-if="label" class="base-textarea__label">
      {{ label }}
      <span v-if="required" class="base-textarea__required">*</span>
    </label>

    <div class="base-textarea__container">
      <textarea
        :value="textareaValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        :maxlength="maxlength"
        :class="textareaClasses"
        @input="onInput"
        @blur="onBlur"
        @focus="onFocus"
      ></textarea>
    </div>

    <div v-if="displayError" class="base-textarea__error">
      {{ displayError }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.base-textarea {
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
    min-height: 100px;

    &:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
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

    &--resize-none {
      resize: none;
    }

    &--resize-vertical {
      resize: vertical;
    }

    &--resize-horizontal {
      resize: horizontal;
    }

    &--resize-both {
      resize: both;
    }

    &::placeholder {
      color: var(--dark-gray);
      opacity: 0.7;
    }
  }

  &__error {
    font-size: 0.75rem;
    color: #f44336;
    margin-top: 0.25rem;
  }
}

@media (max-width: 768px) {
  .base-textarea {
    &__field {
      padding: 0.6rem 0.8rem;
      font-size: 0.9rem;
    }
  }
}
</style>

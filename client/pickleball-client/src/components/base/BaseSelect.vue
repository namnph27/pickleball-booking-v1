<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useField } from 'vee-validate';

interface Option {
  value: string | number;
  label: string;
}

const props = defineProps({
  modelValue: {
    type: [String, Number, Array],
    default: ''
  },
  options: {
    type: Array as () => Option[],
    default: () => []
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select an option'
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
  error: {
    type: String,
    default: ''
  },
  multiple: {
    type: Boolean,
    default: false
  },
  validateOnInput: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// If name is provided, use vee-validate
const { value: selectValue, errorMessage } = props.name
  ? useField(props.name, undefined, {
      initialValue: props.modelValue,
      validateOnValueUpdate: props.validateOnInput
    })
  : { value: ref(props.modelValue), errorMessage: ref('') };

// Sync with v-model
watch(() => props.modelValue, (newValue) => {
  if (newValue !== selectValue.value) {
    selectValue.value = newValue;
  }
});

watch(selectValue, (newValue) => {
  emit('update:modelValue', newValue);
});

const displayError = computed(() => {
  return props.error || errorMessage.value;
});

const selectClasses = computed(() => {
  return [
    'base-select__field',
    displayError.value ? 'base-select__field--error' : '',
    props.disabled ? 'base-select__field--disabled' : ''
  ];
});

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;

  if (props.multiple) {
    const selectedOptions = Array.from(target.selectedOptions).map(option => option.value);
    selectValue.value = selectedOptions;
  } else {
    selectValue.value = target.value;
  }

  emit('change', event);
};
</script>

<template>
  <div class="base-select">
    <label v-if="label" class="base-select__label">
      {{ label }}
      <span v-if="required" class="base-select__required">*</span>
    </label>

    <div class="base-select__container">
      <select
        v-model="selectValue"
        :disabled="disabled"
        :multiple="multiple"
        :class="selectClasses"
      >
        <option v-if="!multiple" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <i class="pi pi-chevron-down base-select__icon"></i>
    </div>

    <div v-if="displayError" class="base-select__error">
      {{ displayError }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.base-select {
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
    appearance: none;
    cursor: pointer;

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

    &[multiple] {
      padding: 0.5rem;

      option {
        padding: 0.5rem;
        margin-bottom: 0.25rem;
        border-radius: 2px;

        &:checked {
          background-color: rgba(76, 175, 80, 0.1);
          color: var(--primary-color);
        }
      }
    }
  }

  &__icon {
    position: absolute;
    right: 1rem;
    color: var(--dark-gray);
    font-size: 0.875rem;
    pointer-events: none;
  }

  &__error {
    font-size: 0.75rem;
    color: #f44336;
    margin-top: 0.25rem;
  }
}

@media (max-width: 768px) {
  .base-select {
    &__field {
      padding: 0.6rem 0.8rem;
      font-size: 0.9rem;
    }
  }
}
</style>

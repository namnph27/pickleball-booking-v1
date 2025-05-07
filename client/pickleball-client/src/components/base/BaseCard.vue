<script setup lang="ts">
import { computed, useSlots } from 'vue';

const slots = useSlots();
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  imageAlt: {
    type: String,
    default: 'Card image'
  },
  imageHeight: {
    type: String,
    default: '200px'
  },
  bordered: {
    type: Boolean,
    default: true
  },
  elevated: {
    type: Boolean,
    default: false
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  padding: {
    type: String,
    default: 'normal',
    validator: (value: string) => ['none', 'small', 'normal', 'large'].includes(value)
  }
});

const cardClasses = computed(() => {
  return [
    'base-card',
    props.bordered ? 'base-card--bordered' : '',
    props.elevated ? 'base-card--elevated' : '',
    props.hoverable ? 'base-card--hoverable' : '',
    `base-card--padding-${props.padding}`
  ];
});

const hasHeader = computed(() => {
  return !!props.title || !!props.subtitle || !!slots.header;
});

const hasFooter = computed(() => {
  return !!slots.footer;
});
</script>

<template>
  <div :class="cardClasses">
    <!-- Card Image -->
    <div v-if="image || slots.image" class="base-card__image-container" :style="{ height: imageHeight }">
      <slot name="image">
        <img :src="image" :alt="imageAlt" class="base-card__image" />
      </slot>
    </div>

    <!-- Card Header -->
    <div v-if="hasHeader" class="base-card__header">
      <slot name="header">
        <h3 v-if="title" class="base-card__title">{{ title }}</h3>
        <p v-if="subtitle" class="base-card__subtitle">{{ subtitle }}</p>
      </slot>
    </div>

    <!-- Card Content -->
    <div class="base-card__content">
      <slot></slot>
    </div>

    <!-- Card Footer -->
    <div v-if="hasFooter" class="base-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.base-card {
  background-color: var(--white);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;

  &--bordered {
    border: 1px solid var(--medium-gray);
  }

  &--elevated {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &--hoverable {
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  &--padding-none {
    .base-card__header,
    .base-card__content,
    .base-card__footer {
      padding: 0;
    }
  }

  &--padding-small {
    .base-card__header,
    .base-card__content,
    .base-card__footer {
      padding: 0.75rem;
    }
  }

  &--padding-normal {
    .base-card__header,
    .base-card__content,
    .base-card__footer {
      padding: 1.25rem;
    }
  }

  &--padding-large {
    .base-card__header,
    .base-card__content,
    .base-card__footer {
      padding: 2rem;
    }
  }

  &__image-container {
    width: 100%;
    overflow: hidden;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__header {
    border-bottom: 1px solid var(--light-gray);
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--text-color);
  }

  &__subtitle {
    font-size: 0.875rem;
    color: var(--dark-gray);
    margin: 0;
  }

  &__footer {
    border-top: 1px solid var(--light-gray);
  }
}

@media (max-width: 768px) {
  .base-card {
    &--padding-normal {
      .base-card__header,
      .base-card__content,
      .base-card__footer {
        padding: 1rem;
      }
    }

    &--padding-large {
      .base-card__header,
      .base-card__content,
      .base-card__footer {
        padding: 1.5rem;
      }
    }

    &__title {
      font-size: 1.125rem;
    }
  }
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  backLink: {
    type: [String, Object],
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  fluid: {
    type: Boolean,
    default: false
  },
  centered: {
    type: Boolean,
    default: false
  },
  noPadding: {
    type: Boolean,
    default: false
  }
});

const { t } = useI18n();
const route = useRoute();

const containerClasses = computed(() => {
  return [
    'base-layout__container',
    props.fluid ? 'base-layout__container--fluid' : '',
    props.centered ? 'base-layout__container--centered' : '',
    props.noPadding ? 'base-layout__container--no-padding' : ''
  ];
});

const pageTitle = computed(() => {
  const title = props.title || route.meta.title || '';
  // Nếu title bắt đầu bằng một key i18n (ví dụ: 'joinCourt.title'), thì dịch nó
  return title.includes('.') ? t(title) : title;
});
</script>

<template>
  <div class="base-layout">
    <div v-if="pageTitle || subtitle || backLink || $slots.header" class="base-layout__header">
      <div :class="containerClasses">
        <div class="base-layout__header-content">
          <div class="base-layout__header-left">
            <router-link
              v-if="backLink"
              :to="backLink"
              class="base-layout__back-link"
            >
              <i class="pi pi-arrow-left"></i>
              <span>{{ t('common.back') }}</span>
            </router-link>

            <div v-if="pageTitle || subtitle" class="base-layout__titles">
              <h1 v-if="pageTitle" class="base-layout__title">{{ pageTitle }}</h1>
              <p v-if="subtitle" class="base-layout__subtitle">{{ subtitle }}</p>
            </div>
          </div>

          <div v-if="$slots.headerActions" class="base-layout__header-actions">
            <slot name="headerActions"></slot>
          </div>
        </div>

        <slot name="header"></slot>
      </div>
    </div>

    <div class="base-layout__content">
      <div :class="containerClasses">
        <div v-if="loading" class="base-layout__loading">
          <slot name="loading">
            <div class="base-layout__loading-spinner">
              <i class="pi pi-spin pi-spinner"></i>
              <span>{{ t('common.loading') }}</span>
            </div>
          </slot>
        </div>

        <slot v-else></slot>
      </div>
    </div>

    <div v-if="$slots.footer" class="base-layout__footer">
      <div :class="containerClasses">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.base-layout {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &__container {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 0 1.5rem;

    @media (min-width: 1200px) {
      max-width: 1200px;
    }

    @media (min-width: 1400px) {
      max-width: 1320px;
    }

    @media (min-width: 1600px) {
      max-width: 1480px;
    }

    @media (min-width: 1920px) {
      max-width: 1800px;
    }

    &--fluid {
      max-width: none;
    }

    &--centered {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    &--no-padding {
      padding: 0;
    }
  }

  &__header {
    padding: 1.5rem 0;
    border-bottom: 1px solid var(--light-gray);
    margin-bottom: 2rem;

    &-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &-left {
      display: flex;
      align-items: center;
    }

    &-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  }

  &__back-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-color);
    font-weight: 500;
    margin-right: 1.5rem;
    text-decoration: none;

    &:hover {
      color: var(--primary-color);
    }

    i {
      font-size: 0.875rem;
    }
  }

  &__titles {
    display: flex;
    flex-direction: column;
  }

  &__title {
    font-size: 1.75rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-color);
  }

  &__subtitle {
    font-size: 1rem;
    color: var(--dark-gray);
    margin: 0.5rem 0 0 0;
  }

  &__content {
    flex-grow: 1;
    padding-bottom: 2rem;
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;

    &-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: var(--primary-color);

      i {
        font-size: 2rem;
      }

      span {
        font-size: 0.875rem;
        font-weight: 500;
      }
    }
  }

  &__footer {
    margin-top: auto;
    padding: 2rem 0;
    border-top: 1px solid var(--light-gray);
  }
}

@media (max-width: 768px) {
  .base-layout {
    &__container {
      padding: 0 1rem;
    }

    &__header {
      padding: 1rem 0;
      margin-bottom: 1.5rem;

      &-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      &-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }

    &__title {
      font-size: 1.5rem;
    }

    &__subtitle {
      font-size: 0.875rem;
    }
  }
}
</style>

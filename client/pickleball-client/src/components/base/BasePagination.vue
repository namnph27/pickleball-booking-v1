<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  maxVisibleButtons: {
    type: Number,
    default: 5
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value: string) => ['small', 'medium', 'large'].includes(value)
  }
});

const emit = defineEmits(['update:currentPage', 'page-change']);

const isFirstPage = computed(() => props.currentPage === 1);
const isLastPage = computed(() => props.currentPage === props.totalPages);

const paginationClasses = computed(() => {
  return [
    'base-pagination',
    `base-pagination--${props.size}`
  ];
});

const pages = computed(() => {
  const { currentPage, totalPages, maxVisibleButtons } = props;
  
  if (totalPages <= maxVisibleButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const halfVisibleButtons = Math.floor(maxVisibleButtons / 2);
  let startPage = Math.max(currentPage - halfVisibleButtons, 1);
  let endPage = Math.min(startPage + maxVisibleButtons - 1, totalPages);
  
  if (endPage - startPage + 1 < maxVisibleButtons) {
    startPage = Math.max(endPage - maxVisibleButtons + 1, 1);
  }
  
  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
});

const changePage = (page: number) => {
  if (page === props.currentPage) return;
  
  emit('update:currentPage', page);
  emit('page-change', page);
};

const goToFirstPage = () => {
  changePage(1);
};

const goToPreviousPage = () => {
  if (!isFirstPage.value) {
    changePage(props.currentPage - 1);
  }
};

const goToNextPage = () => {
  if (!isLastPage.value) {
    changePage(props.currentPage + 1);
  }
};

const goToLastPage = () => {
  changePage(props.totalPages);
};
</script>

<template>
  <div v-if="totalPages > 1" :class="paginationClasses">
    <!-- First Page Button -->
    <button 
      class="base-pagination__button base-pagination__button--first" 
      :disabled="isFirstPage"
      @click="goToFirstPage"
      aria-label="Go to first page"
    >
      <i class="pi pi-angle-double-left"></i>
    </button>
    
    <!-- Previous Page Button -->
    <button 
      class="base-pagination__button base-pagination__button--prev" 
      :disabled="isFirstPage"
      @click="goToPreviousPage"
      aria-label="Go to previous page"
    >
      <i class="pi pi-angle-left"></i>
    </button>
    
    <!-- Page Buttons -->
    <template v-for="page in pages" :key="page">
      <button 
        class="base-pagination__button" 
        :class="{ 'base-pagination__button--active': page === currentPage }"
        @click="changePage(page)"
        :aria-current="page === currentPage ? 'page' : undefined"
      >
        {{ page }}
      </button>
    </template>
    
    <!-- Next Page Button -->
    <button 
      class="base-pagination__button base-pagination__button--next" 
      :disabled="isLastPage"
      @click="goToNextPage"
      aria-label="Go to next page"
    >
      <i class="pi pi-angle-right"></i>
    </button>
    
    <!-- Last Page Button -->
    <button 
      class="base-pagination__button base-pagination__button--last" 
      :disabled="isLastPage"
      @click="goToLastPage"
      aria-label="Go to last page"
    >
      <i class="pi pi-angle-double-right"></i>
    </button>
  </div>
</template>

<style scoped lang="scss">
.base-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  
  &__button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--white);
    border: 1px solid var(--medium-gray);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled):not(.base-pagination__button--active) {
      background-color: var(--light-gray);
      border-color: var(--dark-gray);
    }
    
    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
    }
    
    &--active {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
      font-weight: 500;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  &--small {
    .base-pagination__button {
      height: 30px;
      width: 30px;
      font-size: 0.75rem;
    }
  }
  
  &--medium {
    .base-pagination__button {
      height: 36px;
      width: 36px;
      font-size: 0.875rem;
    }
  }
  
  &--large {
    .base-pagination__button {
      height: 42px;
      width: 42px;
      font-size: 1rem;
    }
  }
}

@media (max-width: 768px) {
  .base-pagination {
    gap: 0.125rem;
    
    &--medium {
      .base-pagination__button {
        height: 32px;
        width: 32px;
      }
    }
    
    &--large {
      .base-pagination__button {
        height: 38px;
        width: 38px;
      }
    }
  }
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseSpinner from './BaseSpinner.vue';
import BasePagination from './BasePagination.vue';

interface Column {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

const props = defineProps({
  columns: {
    type: Array as () => Column[],
    required: true
  },
  data: {
    type: Array as () => any[],
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  striped: {
    type: Boolean,
    default: true
  },
  bordered: {
    type: Boolean,
    default: true
  },
  hoverable: {
    type: Boolean,
    default: true
  },
  paginated: {
    type: Boolean,
    default: false
  },
  pageSize: {
    type: Number,
    default: 10
  },
  sortField: {
    type: String,
    default: ''
  },
  sortOrder: {
    type: Number,
    default: 1 // 1 for ascending, -1 for descending
  },
  emptyMessage: {
    type: String,
    default: ''
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selectedRows: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['row-click', 'sort', 'update:selectedRows', 'page-change']);

const { t } = useI18n();

const currentPage = ref(1);
const currentSortField = ref(props.sortField);
const currentSortOrder = ref(props.sortOrder);
const selectedRowsInternal = ref(props.selectedRows);

// Sync with props
watch(() => props.sortField, (newValue) => {
  currentSortField.value = newValue;
});

watch(() => props.sortOrder, (newValue) => {
  currentSortOrder.value = newValue;
});

watch(() => props.selectedRows, (newValue) => {
  selectedRowsInternal.value = newValue;
});

// Computed properties
const tableClasses = computed(() => {
  return [
    'base-table',
    props.striped ? 'base-table--striped' : '',
    props.bordered ? 'base-table--bordered' : '',
    props.hoverable ? 'base-table--hoverable' : ''
  ];
});

const sortedData = computed(() => {
  if (!currentSortField.value) return props.data;

  return [...props.data].sort((a, b) => {
    const valueA = a[currentSortField.value];
    const valueB = b[currentSortField.value];

    if (valueA === valueB) return 0;

    const result = valueA > valueB ? 1 : -1;
    return result * currentSortOrder.value;
  });
});

const paginatedData = computed(() => {
  if (!props.paginated) return sortedData.value;

  const start = (currentPage.value - 1) * props.pageSize;
  const end = start + props.pageSize;

  return sortedData.value.slice(start, end);
});

const totalPages = computed(() => {
  if (!props.paginated) return 1;

  return Math.ceil(sortedData.value.length / props.pageSize);
});

const emptyMessageText = computed(() => {
  return props.emptyMessage || t('common.noData');
});

// Methods
const handleSort = (column: Column) => {
  if (!column.sortable) return;

  if (currentSortField.value === column.field) {
    currentSortOrder.value = currentSortOrder.value * -1;
  } else {
    currentSortField.value = column.field;
    currentSortOrder.value = 1;
  }

  emit('sort', { field: currentSortField.value, order: currentSortOrder.value });
};

const handleRowClick = (row: any, index: number, event: MouseEvent) => {
  emit('row-click', { row, index, event });
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  emit('page-change', page);
};

const toggleRowSelection = (row: any) => {
  if (!props.selectable) return;

  const index = selectedRowsInternal.value.findIndex(selectedRow => selectedRow === row);

  if (index === -1) {
    selectedRowsInternal.value = [...selectedRowsInternal.value, row];
  } else {
    selectedRowsInternal.value = selectedRowsInternal.value.filter((_, i) => i !== index);
  }

  emit('update:selectedRows', selectedRowsInternal.value);
};

const isRowSelected = (row: any) => {
  return selectedRowsInternal.value.includes(row);
};

const getSortIcon = (column: Column) => {
  if (!column.sortable) return '';

  if (currentSortField.value !== column.field) {
    return 'pi-sort';
  }

  return currentSortOrder.value === 1 ? 'pi-sort-up' : 'pi-sort-down';
};
</script>

<template>
  <div class="base-table-container">
    <div class="base-table-wrapper">
      <table :class="tableClasses">
        <thead>
          <tr>
            <th v-if="selectable" class="base-table__checkbox-column">
              <!-- Header checkbox could be added here for select all functionality -->
            </th>
            <th
              v-for="column in columns"
              :key="column.field"
              :class="[
                column.sortable ? 'base-table__sortable-column' : '',
                column.align ? `base-table__column--${column.align}` : ''
              ]"
              :style="column.width ? { width: column.width } : {}"
              @click="handleSort(column)"
            >
              {{ column.header }}
              <i
                v-if="column.sortable"
                :class="`pi ${getSortIcon(column)} base-table__sort-icon`"
              ></i>
            </th>
            <th v-if="$slots.actions" class="base-table__actions-column">
              {{ t('common.actions') }}
            </th>
          </tr>
        </thead>

        <tbody>
          <template v-if="!loading && paginatedData.length > 0">
            <tr
              v-for="(row, rowIndex) in paginatedData"
              :key="rowIndex"
              :class="{ 'base-table__row--selected': isRowSelected(row) }"
              @click="handleRowClick(row, rowIndex, $event)"
            >
              <td v-if="selectable" class="base-table__checkbox-column">
                <input
                  type="checkbox"
                  :checked="isRowSelected(row)"
                  @click.stop="toggleRowSelection(row)"
                />
              </td>

              <td
                v-for="column in columns"
                :key="column.field"
                :class="column.align ? `base-table__column--${column.align}` : ''"
              >
                <slot :name="`cell(${column.field})`" :row="row" :value="row[column.field]">
                  {{ row[column.field] }}
                </slot>
              </td>

              <td v-if="$slots.actions" class="base-table__actions-column">
                <slot name="actions" :row="row" :index="rowIndex"></slot>
              </td>
            </tr>
          </template>

          <tr v-else-if="loading">
            <td :colspan="selectable ? columns.length + 2 : columns.length + 1" class="base-table__loading-cell">
              <BaseSpinner size="small" />
            </td>
          </tr>

          <tr v-else>
            <td :colspan="selectable ? columns.length + 2 : columns.length + 1" class="base-table__empty-cell">
              {{ emptyMessageText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="paginated && totalPages > 1" class="base-table__pagination">
      <BasePagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "sass:color";
.base-table-container {
  width: 100%;
}

.base-table-wrapper {
  overflow-x: auto;
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
  }

  th {
    font-weight: 600;
    background-color: var(--light-gray);
    color: var(--text-color);
    white-space: nowrap;
  }

  &--bordered {
    th, td {
      border: 1px solid var(--medium-gray);
    }
  }

  &--striped {
    tbody tr:nth-child(even) {
      background-color: rgba(0, 0, 0, 0.02);
    }
  }

  &--hoverable {
    tbody tr:hover {
      background-color: rgba(76, 175, 80, 0.05);
    }
  }

  &__sortable-column {
    cursor: pointer;
    user-select: none;

    &:hover {
      background-color: color.adjust(#f5f5f5, $lightness: -5%);
    }
  }

  &__sort-icon {
    margin-left: 0.5rem;
    font-size: 0.75rem;
  }

  &__column {
    &--center {
      text-align: center;
    }

    &--right {
      text-align: right;
    }
  }

  &__checkbox-column {
    width: 40px;
    text-align: center;
  }

  &__actions-column {
    width: 1%;
    white-space: nowrap;
    text-align: center;
  }

  &__row--selected {
    background-color: rgba(76, 175, 80, 0.1) !important;
  }

  &__loading-cell,
  &__empty-cell {
    text-align: center;
    padding: 2rem !important;
    color: var(--dark-gray);
  }

  &__pagination {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .base-table {
    th, td {
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
    }
  }
}
</style>

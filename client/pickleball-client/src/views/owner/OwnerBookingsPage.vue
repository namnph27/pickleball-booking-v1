<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCourtStore } from '../../store/court';
import { useBookingStore } from '../../store/booking';
import { useToast } from '../../composables/useToast';
import BaseLayout from '../../components/layout/BaseLayout.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseCard from '../../components/base/BaseCard.vue';
import BaseSpinner from '../../components/base/BaseSpinner.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseModal from '../../components/base/BaseModal.vue';
import BaseSelect from '../../components/base/BaseSelect.vue';
import BaseTable from '../../components/base/BaseTable.vue';

const { t } = useI18n();
const courtStore = useCourtStore();
const bookingStore = useBookingStore();
const toast = useToast();

// State
const activeTab = ref('upcoming');
const viewMode = ref('table'); // 'table' or 'grid'
const selectedCourt = ref<number | null>(null);
const selectedStatus = ref('');
const showStatusModal = ref(false);
const bookingToUpdate = ref<number | null>(null);
const newStatus = ref('');
const isUpdating = ref(false);

// Computed properties
const courts = computed(() => courtStore.courts);
const bookings = computed(() => bookingStore.bookings);
const loading = computed(() => courtStore.loading || bookingStore.loading);

// Court options
const courtOptions = computed(() => {
  return [
    { value: '', label: t('courtOwner.allCourts') },
    ...courts.value.map(court => ({
      value: court.id.toString(),
      label: court.name
    }))
  ];
});

// Status options
const statusOptions = computed(() => [
  { value: '', label: t('courtOwner.allStatuses') },
  { value: 'pending', label: t('booking.pending') },
  { value: 'confirmed', label: t('booking.confirmed') },
  { value: 'cancelled', label: t('booking.cancelled') },
  { value: 'completed', label: t('booking.completed') }
]);

// Status update options
const statusUpdateOptions = computed(() => [
  { value: 'confirmed', label: t('booking.confirmed') },
  { value: 'cancelled', label: t('booking.cancelled') },
  { value: 'completed', label: t('booking.completed') }
]);

// Table columns
const columns = computed(() => [
  { field: 'id', header: 'ID', sortable: true },
  { field: 'court_name', header: t('courts.court'), sortable: true },
  { field: 'user_name', header: t('booking.customer'), sortable: true },
  { field: 'start_time', header: t('booking.dateTime'), sortable: true },
  { field: 'total_price', header: t('booking.price'), sortable: true, align: 'right' },
  { field: 'status', header: t('booking.status'), sortable: true }
]);

// Filtered bookings
const filteredBookings = computed(() => {
  let filtered = [...bookings.value];

  // Filter by court
  if (selectedCourt.value) {
    filtered = filtered.filter(booking => booking.court_id === selectedCourt.value);
  }

  // Filter by status
  if (selectedStatus.value) {
    filtered = filtered.filter(booking => booking.status === selectedStatus.value);
  }

  // Filter by tab
  if (activeTab.value === 'upcoming') {
    filtered = filtered.filter(booking =>
      (booking.status === 'pending' || booking.status === 'confirmed') &&
      new Date(booking.start_time) > new Date()
    );
  } else if (activeTab.value === 'past') {
    filtered = filtered.filter(booking =>
      booking.status === 'completed' ||
      booking.status === 'cancelled' ||
      new Date(booking.start_time) <= new Date()
    );
  }

  // Sort by date (newest first for past, soonest first for upcoming)
  filtered.sort((a, b) => {
    const dateA = new Date(a.start_time).getTime();
    const dateB = new Date(b.start_time).getTime();
    return activeTab.value === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  return filtered;
});

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time
const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format date and time for table
const formatDateTime = (dateString: string) => {
  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
};

// Get status class
const getStatusClass = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'status-confirmed';
    case 'pending':
      return 'status-pending';
    case 'cancelled':
      return 'status-cancelled';
    case 'completed':
      return 'status-completed';
    default:
      return '';
  }
};

// Open status update modal
const openStatusModal = (bookingId: number) => {
  const booking = bookings.value.find(b => b.id === bookingId);
  if (!booking) return;

  bookingToUpdate.value = bookingId;
  newStatus.value = booking.status;
  showStatusModal.value = true;
};

// Update booking status
const updateBookingStatus = async () => {
  if (!bookingToUpdate.value || !newStatus.value) return;

  isUpdating.value = true;

  try {
    await bookingStore.updateBookingStatus(bookingToUpdate.value, newStatus.value as any);

    toast.success(t('courtOwner.statusUpdated'));
    showStatusModal.value = false;
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.updateError'));
  } finally {
    isUpdating.value = false;
    bookingToUpdate.value = null;
  }
};

// Fetch courts and bookings on mount
onMounted(async () => {
  try {
    // Reset bookings array before fetching new data
    bookingStore.reset();

    // Fetch courts first
    await courtStore.getCourtsByOwner();

    // Then fetch bookings for all courts
    if (courts.value.length > 0) {
      for (let i = 0; i < courts.value.length; i++) {
        const court = courts.value[i];
        // Use append=true for all courts except the first one
        await bookingStore.getCourtBookings(court.id, i > 0);
      }
    }

    console.log(`Loaded ${bookings.value.length} bookings for ${courts.value.length} courts`);
  } catch (error) {
    console.error('Error loading bookings data:', error);
    toast.error(typeof error === 'string' ? error : t('courtOwner.fetchError'));
  }
});
</script>

<template>
  <BaseLayout :title="t('courtOwner.courtBookings')">
    <!-- Header Actions -->
    <template #headerActions>
      <div class="view-toggle">
        <button
          class="toggle-button"
          :class="{ 'active': viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          <i class="pi pi-th-large"></i>
        </button>

        <button
          class="toggle-button"
          :class="{ 'active': viewMode === 'table' }"
          @click="viewMode = 'table'"
        >
          <i class="pi pi-list"></i>
        </button>
      </div>
    </template>

    <!-- Tabs -->
    <div class="booking-tabs">
      <button
        class="tab-button"
        :class="{ 'active': activeTab === 'upcoming' }"
        @click="activeTab = 'upcoming'"
      >
        {{ t('booking.upcomingBookings') }}
      </button>

      <button
        class="tab-button"
        :class="{ 'active': activeTab === 'past' }"
        @click="activeTab = 'past'"
      >
        {{ t('booking.pastBookings') }}
      </button>
    </div>

    <!-- Filters -->
    <div class="booking-filters">
      <div class="filter-group">
        <BaseSelect
          v-model="selectedCourt"
          :options="courtOptions"
          :placeholder="t('courtOwner.selectCourt')"
        />
      </div>

      <div class="filter-group">
        <BaseSelect
          v-model="selectedStatus"
          :options="statusOptions"
          :placeholder="t('courtOwner.selectStatus')"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bookings-loading">
      <BaseSpinner />
    </div>

    <!-- No Bookings -->
    <div v-else-if="filteredBookings.length === 0" class="no-bookings">
      <i class="pi pi-calendar-times no-bookings-icon"></i>
      <h3>{{ activeTab === 'upcoming' ? t('courtOwner.noUpcomingBookings') : t('courtOwner.noPastBookings') }}</h3>
      <p>{{ t('courtOwner.bookingsDescription') }}</p>
    </div>

    <!-- Table View -->
    <div v-else-if="viewMode === 'table'" class="bookings-table">
      <BaseTable
        :columns="columns"
        :data="filteredBookings"
        :loading="loading"
        striped
        hoverable
      >
        <!-- ID Column -->
        <template #cell(id)="{ value }">
          #{{ value }}
        </template>

        <!-- Date/Time Column -->
        <template #cell(start_time)="{ value }">
          {{ formatDateTime(value) }}
        </template>

        <!-- Price Column -->
        <template #cell(total_price)="{ value }">
          ${{ value.toFixed(2) }}
        </template>

        <!-- Status Column -->
        <template #cell(status)="{ value }">
          <span :class="['status-badge', getStatusClass(value)]">
            {{ t(`booking.${value}`) }}
          </span>
        </template>

        <!-- Actions Column -->
        <template #actions="{ row }">
          <div class="table-actions">
            <button
              class="action-button"
              @click="openStatusModal(row.id)"
              title="Update Status"
            >
              <i class="pi pi-sync"></i>
            </button>
          </div>
        </template>
      </BaseTable>
    </div>

    <!-- Grid View -->
    <div v-else class="bookings-grid">
      <BaseCard
        v-for="booking in filteredBookings"
        :key="booking.id"
        class="booking-card"
      >
        <template #header>
          <div class="booking-header">
            <div class="booking-id">
              <span class="id-label">{{ t('booking.bookingId') }}:</span>
              <span class="id-value">#{{ booking.id }}</span>
            </div>

            <div class="booking-status">
              <span :class="['status-badge', getStatusClass(booking.status)]">
                {{ t(`booking.${booking.status}`) }}
              </span>
            </div>
          </div>
        </template>

        <div class="booking-details">
          <div class="booking-info">
            <div class="info-item">
              <span class="info-label">{{ t('courts.court') }}:</span>
              <span class="info-value">{{ booking.court_name }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">{{ t('booking.customer') }}:</span>
              <span class="info-value">{{ booking.user_name }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">{{ t('booking.date') }}:</span>
              <span class="info-value">{{ formatDate(booking.start_time) }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">{{ t('booking.time') }}:</span>
              <span class="info-value">{{ formatTime(booking.start_time) }} - {{ formatTime(booking.end_time) }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">{{ t('booking.price') }}:</span>
              <span class="info-value">${{ booking.total_price.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="booking-actions">
            <BaseButton
              :label="t('courtOwner.updateStatus')"
              variant="primary"
              @click="openStatusModal(booking.id)"
            />
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- Update Status Modal -->
    <BaseModal
      v-model="showStatusModal"
      :title="t('courtOwner.updateBookingStatus')"
      :ok-text="t('courtOwner.updateStatus')"
      :cancel-text="t('common.cancel')"
      :loading="isUpdating"
      @ok="updateBookingStatus"
    >
      <div class="status-form">
        <div class="form-group">
          <BaseSelect
            v-model="newStatus"
            :label="t('booking.status')"
            :options="statusUpdateOptions"
            required
          />
        </div>

        <div class="status-info">
          <BaseAlert
            v-if="newStatus === 'confirmed'"
            type="success"
            :message="t('courtOwner.confirmStatusInfo')"
          />

          <BaseAlert
            v-else-if="newStatus === 'cancelled'"
            type="warning"
            :message="t('courtOwner.cancelStatusInfo')"
          />

          <BaseAlert
            v-else-if="newStatus === 'completed'"
            type="info"
            :message="t('courtOwner.completeStatusInfo')"
          />
        </div>
      </div>
    </BaseModal>
  </BaseLayout>
</template>

<style scoped lang="scss">
.view-toggle {
  display: flex;

  .toggle-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--medium-gray);
    color: var(--dark-gray);
    cursor: pointer;

    &:first-child {
      border-radius: 4px 0 0 4px;
    }

    &:last-child {
      border-radius: 0 4px 4px 0;
    }

    &.active {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }
  }
}

.booking-tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--medium-gray);

  .tab-button {
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    color: var(--dark-gray);
    cursor: pointer;
    position: relative;

    &.active {
      color: var(--primary-color);

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: var(--primary-color);
      }
    }
  }
}

.booking-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .filter-group {
    width: 250px;
  }
}

.bookings-loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.no-bookings {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  text-align: center;

  .no-bookings-icon {
    font-size: 3rem;
    color: var(--dark-gray);
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--dark-gray);
    margin-bottom: 1.5rem;
    max-width: 500px;
  }
}

.bookings-table {
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;

    &.status-confirmed {
      background-color: rgba(76, 175, 80, 0.1);
      color: #2e7d32;
    }

    &.status-pending {
      background-color: rgba(255, 152, 0, 0.1);
      color: #ef6c00;
    }

    &.status-cancelled {
      background-color: rgba(244, 67, 54, 0.1);
      color: #c62828;
    }

    &.status-completed {
      background-color: rgba(33, 150, 243, 0.1);
      color: #0277bd;
    }
  }

  .table-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;

    .action-button {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: 1px solid var(--medium-gray);
      border-radius: 4px;
      color: var(--dark-gray);
      cursor: pointer;

      &:hover {
        background-color: var(--light-gray);
        color: var(--text-color);
      }
    }
  }
}

.bookings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.booking-card {
  .booking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    .booking-id {
      .id-label {
        font-weight: 500;
        margin-right: 0.25rem;
      }

      .id-value {
        font-weight: 600;
      }
    }

    .booking-status {
      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;

        &.status-confirmed {
          background-color: rgba(76, 175, 80, 0.1);
          color: #2e7d32;
        }

        &.status-pending {
          background-color: rgba(255, 152, 0, 0.1);
          color: #ef6c00;
        }

        &.status-cancelled {
          background-color: rgba(244, 67, 54, 0.1);
          color: #c62828;
        }

        &.status-completed {
          background-color: rgba(33, 150, 243, 0.1);
          color: #0277bd;
        }
      }
    }
  }

  .booking-details {
    .booking-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .info-item {
        display: flex;

        .info-label {
          width: 100px;
          font-weight: 500;
        }

        .info-value {
          flex: 1;
        }
      }
    }
  }

  .booking-actions {
    display: flex;
    justify-content: flex-end;
  }
}

.status-form {
  .form-group {
    margin-bottom: 1.5rem;
  }

  .status-info {
    margin-bottom: 1rem;
  }
}

@media (max-width: 768px) {
  .booking-tabs {
    .tab-button {
      flex: 1;
      padding: 0.75rem;
      text-align: center;
    }
  }

  .booking-filters {
    flex-direction: column;

    .filter-group {
      width: 100%;
    }
  }

  .bookings-grid {
    grid-template-columns: 1fr;
  }
}
</style>

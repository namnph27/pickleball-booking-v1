<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useBookingStore } from '../../store/booking';
import { useToast } from '../../composables/useToast';
import BaseLayout from '../../components/layout/BaseLayout.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseCard from '../../components/base/BaseCard.vue';
import BaseSpinner from '../../components/base/BaseSpinner.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseModal from '../../components/base/BaseModal.vue';

const { t } = useI18n();
const router = useRouter();
const bookingStore = useBookingStore();
const toast = useToast();

// State
const activeTab = ref('upcoming');
const showCancelModal = ref(false);
const bookingToCancel = ref<number | null>(null);
const isCancelling = ref(false);

// Computed properties
const upcomingBookings = computed(() => bookingStore.upcomingBookings);
const pastBookings = computed(() => bookingStore.pastBookings);
const loading = computed(() => bookingStore.loading);

// Format date
const formatDate = (dateString: string) => {
  try {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return 'Invalid Date';
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
};

// Format time
const formatTime = (timeString: string) => {
  try {
    if (!timeString) return 'N/A';

    const date = new Date(timeString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid time string:', timeString);
      return 'Invalid Time';
    }

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Error';
  }
};

// Get booking status class
const getStatusClass = (status: string) => {
  if (!status) {
    console.warn('Booking status is undefined or null');
    return 'status-unknown';
  }

  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'status-confirmed';
    case 'pending':
      return 'status-pending';
    case 'cancelled':
      return 'status-cancelled';
    case 'completed':
      return 'status-completed';
    default:
      console.warn('Unknown booking status:', status);
      return 'status-unknown';
  }
};

// View booking details
const viewBookingDetails = (bookingId: number) => {
  router.push(`/bookings/${bookingId}`);
};

// Open cancel booking modal
const openCancelModal = (bookingId: number) => {
  bookingToCancel.value = bookingId;
  showCancelModal.value = true;
};

// Cancel booking
const cancelBooking = async () => {
  if (!bookingToCancel.value) return;

  isCancelling.value = true;

  try {
    await bookingStore.cancelBooking(bookingToCancel.value);
    toast.success(t('booking.cancelSuccess'));
    showCancelModal.value = false;
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('booking.cancelError'));
  } finally {
    isCancelling.value = false;
    bookingToCancel.value = null;
  }
};

// Fetch bookings on mount
onMounted(async () => {
  console.log('BookingsPage: Fetching user bookings...');
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('BookingsPage: No authentication token found');
      toast.error(t('common.authRequired'));
      router.push('/login');
      return;
    }

    // Fetch bookings
    const bookings = await bookingStore.getUserBookings();
    console.log('BookingsPage: Bookings fetched successfully:', bookings);

    // If no bookings were returned, log a message
    if (!bookings || bookings.length === 0) {
      console.log('BookingsPage: No bookings found for this user');
    }
  } catch (error) {
    console.error('BookingsPage: Error fetching bookings:', error);
    toast.error(typeof error === 'string' ? error : t('booking.fetchError'));
  }
});
</script>

<template>
  <BaseLayout :title="t('booking.myBookings')">
    <!-- Tabs -->
    <div class="booking-tabs">
      <button
        class="tab-button"
        :class="{ 'active': activeTab === 'upcoming' }"
        @click="activeTab = 'upcoming'"
      >
        {{ t('booking.upcomingBookings') }}
        <span v-if="upcomingBookings.length > 0" class="tab-count">{{ upcomingBookings.length }}</span>
      </button>

      <button
        class="tab-button"
        :class="{ 'active': activeTab === 'past' }"
        @click="activeTab = 'past'"
      >
        {{ t('booking.pastBookings') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bookings-loading">
      <BaseSpinner />
    </div>

    <!-- Upcoming Bookings -->
    <div v-else-if="activeTab === 'upcoming'" class="bookings-container">
      <div v-if="upcomingBookings.length === 0" class="no-bookings">
        <i class="pi pi-calendar-times no-bookings-icon"></i>
        <h3>{{ t('booking.noUpcomingBookings') }}</h3>
        <p>{{ t('booking.bookingsDescription') }}</p>
        <BaseButton
          :label="t('booking.findCourts')"
          variant="primary"
          @click="router.push('/courts')"
        />
      </div>

      <div v-else class="bookings-grid">
        <BaseCard
          v-for="booking in upcomingBookings"
          :key="booking.id"
          class="booking-card"
        >
          <template #header>
            <div class="booking-header">
              <div class="booking-court">
                <h3 class="court-name">{{ booking.court_name || 'Unknown Court' }}</h3>
                <p class="court-location">
                  <i class="pi pi-map-marker"></i> {{ booking.location || 'Unknown Location' }}
                </p>
              </div>

              <div class="booking-status">
                <span :class="['status-badge', getStatusClass(booking.status)]">
                  {{ booking.status ? t(`booking.${booking.status}`) : t('booking.unknown') }}
                </span>
              </div>
            </div>
          </template>

          <div class="booking-details">
            <div class="booking-info">
              <div class="info-item">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(booking.start_time) }}</span>
              </div>

              <div class="info-item">
                <i class="pi pi-clock"></i>
                <span>{{ formatTime(booking.start_time) }} - {{ formatTime(booking.end_time) }}</span>
              </div>

              <div class="info-item">
                <i class="pi pi-dollar"></i>
                <span>${{ (typeof booking.total_price === 'number' ? booking.total_price : parseFloat(booking.total_price) || 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="booking-actions">
              <BaseButton
                :label="t('common.details')"
                variant="outline"
                @click="viewBookingDetails(booking.id)"
              />

              <BaseButton
                v-if="booking.status !== 'cancelled'"
                :label="t('booking.cancelBooking')"
                variant="danger"
                @click="openCancelModal(booking.id)"
              />
            </div>
          </template>
        </BaseCard>
      </div>
    </div>

    <!-- Past Bookings -->
    <div v-else-if="activeTab === 'past'" class="bookings-container">
      <div v-if="pastBookings.length === 0" class="no-bookings">
        <i class="pi pi-calendar-times no-bookings-icon"></i>
        <h3>{{ t('booking.noPastBookings') }}</h3>
        <p>{{ t('booking.bookingsDescription') }}</p>
        <BaseButton
          :label="t('booking.findCourts')"
          variant="primary"
          @click="router.push('/courts')"
        />
      </div>

      <div v-else class="bookings-grid">
        <BaseCard
          v-for="booking in pastBookings"
          :key="booking.id"
          class="booking-card"
        >
          <template #header>
            <div class="booking-header">
              <div class="booking-court">
                <h3 class="court-name">{{ booking.court_name || 'Unknown Court' }}</h3>
                <p class="court-location">
                  <i class="pi pi-map-marker"></i> {{ booking.location || 'Unknown Location' }}
                </p>
              </div>

              <div class="booking-status">
                <span :class="['status-badge', getStatusClass(booking.status)]">
                  {{ booking.status ? t(`booking.${booking.status}`) : t('booking.unknown') }}
                </span>
              </div>
            </div>
          </template>

          <div class="booking-details">
            <div class="booking-info">
              <div class="info-item">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(booking.start_time) }}</span>
              </div>

              <div class="info-item">
                <i class="pi pi-clock"></i>
                <span>{{ formatTime(booking.start_time) }} - {{ formatTime(booking.end_time) }}</span>
              </div>

              <div class="info-item">
                <i class="pi pi-dollar"></i>
                <span>${{ (typeof booking.total_price === 'number' ? booking.total_price : parseFloat(booking.total_price) || 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="booking-actions">
              <BaseButton
                :label="t('common.details')"
                variant="outline"
                @click="viewBookingDetails(booking.id)"
              />

              <BaseButton
                v-if="booking.status === 'completed'"
                :label="t('booking.writeReview')"
                variant="secondary"
                @click="router.push(`/courts/${booking.court_id}/review`)"
              />
            </div>
          </template>
        </BaseCard>
      </div>
    </div>

    <!-- Cancel Booking Modal -->
    <BaseModal
      v-model="showCancelModal"
      :title="t('booking.cancelConfirmation')"
      :ok-text="t('booking.confirmCancel')"
      :cancel-text="t('common.back')"
      ok-variant="danger"
      :loading="isCancelling"
      @ok="cancelBooking"
    >
      <BaseAlert type="warning" :message="t('booking.cancelWarning')" />

      <div class="cancellation-policy">
        <h4>{{ t('booking.cancellationPolicy') }}</h4>
        <ul>
          <li>{{ t('booking.cancellationPolicy1') }}</li>
          <li>{{ t('booking.cancellationPolicy2') }}</li>
          <li>{{ t('booking.cancellationPolicy3') }}</li>
        </ul>
      </div>
    </BaseModal>
  </BaseLayout>
</template>

<style scoped lang="scss">
.booking-tabs {
  display: flex;
  margin-bottom: 2rem;
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

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background-color: var(--primary-color);
      color: white;
      border-radius: 50%;
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }
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

.bookings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.booking-card {
  height: 100%;

  .booking-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .booking-court {
      .court-name {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
      }

      .court-location {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--dark-gray);

        i {
          color: var(--primary-color);
        }
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

        &.status-unknown {
          background-color: rgba(158, 158, 158, 0.1);
          color: #616161;
        }
      }
    }
  }

  .booking-details {
    margin: 1rem 0;

    .booking-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .info-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        i {
          color: var(--primary-color);
          width: 16px;
        }
      }
    }
  }

  .booking-actions {
    display: flex;
    gap: 0.5rem;
  }
}

.cancellation-policy {
  margin-top: 1.5rem;

  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  ul {
    padding-left: 1.5rem;

    li {
      margin-bottom: 0.5rem;
      color: var(--dark-gray);
    }
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

  .bookings-grid {
    grid-template-columns: 1fr;
  }

  .booking-card {
    .booking-header {
      flex-direction: column;
      gap: 0.5rem;

      .booking-status {
        align-self: flex-start;
      }
    }

    .booking-actions {
      flex-direction: column;
    }
  }
}
</style>

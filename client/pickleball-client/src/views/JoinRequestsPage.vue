<template>
  <BaseLayout>
    <div class="join-requests-page">
      <div class="join-requests-container">

        <div class="tabs">
          <div
            class="tab"
            :class="{ active: activeTab === 'received' }"
            @click="activeTab = 'received'"
          >
            {{ t('joinRequests.receivedRequests') }}
          </div>

          <div
            class="tab"
            :class="{ active: activeTab === 'sent' }"
            @click="activeTab = 'sent'"
          >
            {{ t('joinRequests.sentRequests') }}
          </div>
        </div>

        <!-- Received Requests Tab -->
        <div v-if="activeTab === 'received'" class="tab-content">
          <div v-if="isLoading" class="loading-container">
            <BaseSpinner size="large" />
          </div>

          <div v-else-if="myBookings.length === 0" class="no-results">
            <BaseAlert type="info">
              {{ t('joinRequests.noBookings') }}
            </BaseAlert>
          </div>

          <template v-else>
            <div v-for="booking in myBookings" :key="booking.id" class="booking-card">
              <BaseCard>
                <div class="booking-header">
                  <h2 class="booking-title">{{ booking.court_name }}</h2>
                  <div class="booking-date">
                    {{ formatDate(booking.start_time) }} | {{ formatTimeRange(booking.start_time, booking.end_time) }}
                  </div>
                </div>

                <div class="booking-details">
                  <div class="booking-info">
                    <div class="info-item">
                      <div class="info-label">{{ t('joinRequests.location') }}:</div>
                      <div class="info-value">{{ booking.location }}</div>
                    </div>

                    <div class="info-item">
                      <div class="info-label">{{ t('joinRequests.skillLevel') }}:</div>
                      <div class="info-value">{{ getSkillLevelLabel(booking.skill_level) }}</div>
                    </div>

                    <div class="info-item">
                      <div class="info-label">{{ t('joinRequests.players') }}:</div>
                      <div class="info-value">{{ booking.current_players }} / {{ booking.needed_players }}</div>
                    </div>

                    <div class="info-item">
                      <div class="info-label">{{ t('joinRequests.allowJoin') }}:</div>
                      <div class="info-value">
                        <span :class="booking.allow_join ? 'status-enabled' : 'status-disabled'">
                          {{ booking.allow_join ? t('common.enabled') : t('common.disabled') }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="booking-actions">
                    <BaseButton
                      :label="booking.allow_join ? t('joinRequests.disableJoin') : t('joinRequests.enableJoin')"
                      :variant="booking.allow_join ? 'secondary' : 'primary'"
                      @click="toggleAllowJoin(booking)"
                      :loading="loadingBookingId === booking.id"
                    />
                  </div>
                </div>

                <div v-if="getJoinRequestsForBooking(booking.id).length > 0" class="join-requests-list">
                  <h3 class="requests-title">{{ t('joinRequests.pendingRequests') }}</h3>

                  <div v-for="request in getJoinRequestsForBooking(booking.id)" :key="request.id" class="request-item">
                    <div class="request-info">
                      <div class="request-user">
                        <i class="pi pi-user"></i>
                        <span>{{ request.user_name }}</span>
                      </div>

                      <div class="request-details">
                        <div class="request-players">
                          {{ t('joinRequests.playersCount', { count: request.players_count }) }}
                        </div>

                        <div class="request-date">
                          {{ formatDateTime(request.created_at) }}
                        </div>
                      </div>

                      <div v-if="request.message" class="request-message">
                        "{{ request.message }}"
                      </div>

                      <div class="request-contact">
                        <div class="contact-item">
                          <i class="pi pi-envelope"></i>
                          <span>{{ request.user_email }}</span>
                        </div>

                        <div class="contact-item">
                          <i class="pi pi-phone"></i>
                          <span>{{ request.user_phone }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="request-actions">
                      <BaseButton
                        :label="t('joinRequests.approve')"
                        variant="success"
                        @click="respondToRequest(request.id, 'approved')"
                        :loading="loadingRequestId === request.id && loadingAction === 'approved'"
                      />

                      <BaseButton
                        :label="t('joinRequests.reject')"
                        variant="danger"
                        @click="respondToRequest(request.id, 'rejected')"
                        :loading="loadingRequestId === request.id && loadingAction === 'rejected'"
                      />
                    </div>
                  </div>
                </div>

                <div v-else-if="booking.allow_join" class="no-requests">
                  {{ t('joinRequests.noRequests') }}
                </div>
              </BaseCard>
            </div>
          </template>
        </div>

        <!-- Sent Requests Tab -->
        <div v-if="activeTab === 'sent'" class="tab-content">
          <div v-if="isLoading" class="loading-container">
            <BaseSpinner size="large" />
          </div>

          <div v-else-if="myJoinRequests.length === 0" class="no-results">
            <BaseAlert type="info">
              {{ t('joinRequests.noSentRequests') }}
            </BaseAlert>
          </div>

          <template v-else>
            <div v-for="request in myJoinRequests" :key="request.id" class="request-card">
              <BaseCard>
                <div class="request-header">
                  <h2 class="request-title">{{ request.court_name }}</h2>
                  <div class="request-status" :class="`status-${request.status}`">
                    {{ getStatusLabel(request.status) }}
                  </div>
                </div>

                <div class="request-details">
                  <div class="info-item">
                    <div class="info-label">{{ t('joinRequests.location') }}:</div>
                    <div class="info-value">{{ request.court_location }}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">{{ t('joinRequests.date') }}:</div>
                    <div class="info-value">{{ formatDate(request.start_time) }}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">{{ t('joinRequests.time') }}:</div>
                    <div class="info-value">{{ formatTimeRange(request.start_time, request.end_time) }}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">{{ t('joinRequests.bookedBy') }}:</div>
                    <div class="info-value">{{ request.booker_name }}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">{{ t('joinRequests.playersCount') }}:</div>
                    <div class="info-value">{{ request.players_count }}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">{{ t('joinRequests.requestDate') }}:</div>
                    <div class="info-value">{{ formatDateTime(request.created_at) }}</div>
                  </div>

                  <div v-if="request.message" class="info-item">
                    <div class="info-label">{{ t('joinRequests.message') }}:</div>
                    <div class="info-value">{{ request.message }}</div>
                  </div>
                </div>
              </BaseCard>
            </div>
          </template>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toast-notification';
import { useJoinCourtService } from '../services/JoinCourtService';
import { useBookingService } from '../services/BookingService';
import BaseLayout from '../components/layout/BaseLayout.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import BaseAlert from '../components/base/BaseAlert.vue';
import BaseSpinner from '../components/base/BaseSpinner.vue';

const { t } = useI18n();
const toast = useToast();
const joinCourtService = useJoinCourtService();
const bookingService = useBookingService();

// State
const activeTab = ref('received');
const isLoading = ref(true);
const myBookings = ref([]);
const joinRequests = ref([]);
const myJoinRequests = ref([]);
const loadingBookingId = ref(null);
const loadingRequestId = ref(null);
const loadingAction = ref(null);

// Options
const skillLevelOptions = computed(() => [
  { value: 'beginner', label: t('common.beginner') },
  { value: 'intermediate', label: t('common.intermediate') },
  { value: 'advanced', label: t('common.advanced') }
]);

// Methods
const fetchData = async () => {
  isLoading.value = true;

  try {
    // Fetch bookings and join requests in parallel
    const [bookingsResponse, requestsResponse, myRequestsResponse] = await Promise.all([
      bookingService.getUserBookings(),
      activeTab.value === 'received' ? fetchAllJoinRequests() : Promise.resolve([]),
      activeTab.value === 'sent' ? joinCourtService.getUserJoinRequests() : Promise.resolve({ join_requests: [] })
    ]);

    myBookings.value = bookingsResponse.bookings.filter(b => b.status === 'confirmed');
    joinRequests.value = requestsResponse;
    myJoinRequests.value = myRequestsResponse.join_requests;
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error(t('joinRequests.fetchError'));
  } finally {
    isLoading.value = false;
  }
};

const fetchAllJoinRequests = async () => {
  try {
    // Get all bookings first
    const bookingsResponse = await bookingService.getUserBookings();
    const confirmedBookings = bookingsResponse.bookings.filter(b => b.status === 'confirmed');

    // Fetch join requests for each booking
    const requests = [];
    for (const booking of confirmedBookings) {
      try {
        const response = await joinCourtService.getJoinRequests(booking.id);
        const pendingRequests = response.join_requests.filter(r => r.status === 'pending');
        requests.push(...pendingRequests);
      } catch (error) {
        console.error(`Error fetching join requests for booking ${booking.id}:`, error);
      }
    }

    return requests;
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return [];
  }
};

const getJoinRequestsForBooking = (bookingId) => {
  return joinRequests.value.filter(request => request.booking_id === bookingId);
};

const toggleAllowJoin = async (booking) => {
  loadingBookingId.value = booking.id;

  try {
    const newAllowJoin = !booking.allow_join;

    await bookingService.updateBooking(booking.id, {
      allow_join: newAllowJoin
    });

    // Update local state
    booking.allow_join = newAllowJoin;

    toast.success(
      newAllowJoin
        ? t('joinRequests.joinEnabled')
        : t('joinRequests.joinDisabled')
    );
  } catch (error) {
    console.error('Error toggling allow join:', error);
    toast.error(t('joinRequests.updateError'));
  } finally {
    loadingBookingId.value = null;
  }
};

const respondToRequest = async (requestId, status) => {
  loadingRequestId.value = requestId;
  loadingAction.value = status;

  try {
    await joinCourtService.respondToJoinRequest(requestId, status);

    // Remove the request from the list
    joinRequests.value = joinRequests.value.filter(request => request.id !== requestId);

    // Refresh bookings to update player counts
    const bookingsResponse = await bookingService.getUserBookings();
    myBookings.value = bookingsResponse.bookings.filter(b => b.status === 'confirmed');

    toast.success(
      status === 'approved'
        ? t('joinRequests.requestApproved')
        : t('joinRequests.requestRejected')
    );
  } catch (error) {
    console.error('Error responding to request:', error);
    toast.error(error.response?.data?.message || t('joinRequests.responseError'));
  } finally {
    loadingRequestId.value = null;
    loadingAction.value = null;
  }
};

// Formatters
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const formatTimeRange = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  return `${start.getHours()}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours()}:${end.getMinutes().toString().padStart(2, '0')}`;
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString('vi-VN')} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getSkillLevelLabel = (skillLevel) => {
  if (!skillLevel) return t('common.any');

  const option = skillLevelOptions.value.find(opt => opt.value === skillLevel);
  return option ? option.label : skillLevel;
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return t('joinRequests.statusPending');
    case 'approved': return t('joinRequests.statusApproved');
    case 'rejected': return t('joinRequests.statusRejected');
    default: return status;
  }
};

// Watch for tab changes
watch(activeTab, () => {
  fetchData();
});

// Lifecycle
onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.join-requests-page {
  display: flex;
  justify-content: center;
}

.join-requests-container {
  width: 100%;
  max-width: 800px;
  padding: 0 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.tab {
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab:hover {
  color: var(--primary-color);
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.no-results {
  padding: 2rem 0;
}

.booking-card,
.request-card {
  margin-bottom: 1.5rem;
}

.booking-header,
.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.booking-title,
.request-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.booking-date {
  color: var(--dark-gray);
}

.booking-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.booking-info {
  flex: 1;
}

.info-item {
  display: flex;
  margin-bottom: 0.5rem;
}

.info-label {
  font-weight: 500;
  min-width: 120px;
}

.status-enabled {
  color: #4caf50;
  font-weight: 500;
}

.status-disabled {
  color: #f44336;
  font-weight: 500;
}

.requests-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.request-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.request-info {
  flex: 1;
}

.request-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.request-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.request-players {
  font-weight: 500;
}

.request-date {
  color: var(--dark-gray);
  font-size: 0.9rem;
}

.request-message {
  margin: 0.5rem 0;
  font-style: italic;
  color: var(--dark-gray);
}

.request-contact {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.request-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
}

.no-requests {
  color: var(--dark-gray);
  font-style: italic;
  text-align: center;
  padding: 1rem 0;
}

.request-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-pending {
  background-color: #ffecb3;
  color: #ff8f00;
}

.status-approved {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-rejected {
  background-color: #ffebee;
  color: #f44336;
}

@media (max-width: 768px) {
  .booking-details {
    flex-direction: column;
  }

  .booking-actions {
    margin-top: 1rem;
  }

  .request-item {
    flex-direction: column;
  }

  .request-actions {
    flex-direction: row;
    margin-top: 1rem;
  }
}
</style>

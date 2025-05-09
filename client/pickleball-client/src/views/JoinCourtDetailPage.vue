<template>
  <BaseLayout>
    <div class="join-court-detail-page">
      <div class="join-court-detail-container">
        <div v-if="isLoading" class="loading-container">
          <BaseSpinner size="large" />
        </div>

        <div v-else-if="!booking" class="not-found">
          <BaseAlert type="error">
            {{ t('joinCourt.courtNotFound') }}
          </BaseAlert>

          <div class="back-button">
            <BaseButton
              :label="t('common.backToList')"
              icon="pi-arrow-left"
              @click="router.push('/join-court')"
            />
          </div>
        </div>

        <template v-else>
          <div class="back-link">
            <BaseButton
              :label="t('common.backToList')"
              icon="pi-arrow-left"
              variant="text"
              @click="router.push('/join-court')"
            />
          </div>

          <div class="court-detail-grid">
            <!-- Court Info -->
            <div class="court-info-section">
              <BaseCard>
                <div class="court-image">
                  <img :src="booking.image_url || '/images/default-court.jpg'" :alt="booking.court_name" />
                  <div class="court-skill-level" v-if="booking.skill_level">
                    {{ getSkillLevelLabel(booking.skill_level) }}
                  </div>
                </div>

                <div class="court-info">
                  <h1 class="court-name">{{ booking.court_name }}</h1>

                  <div class="court-location">
                    <i class="pi pi-map-marker"></i>
                    <span>{{ booking.location }}</span>
                  </div>

                  <div class="court-time">
                    <i class="pi pi-calendar"></i>
                    <span>{{ formatDate(booking.start_time) }}</span>
                  </div>

                  <div class="court-time">
                    <i class="pi pi-clock"></i>
                    <span>{{ formatTimeRange(booking.start_time, booking.end_time) }}</span>
                  </div>

                  <div class="court-price">
                    <i class="pi pi-money-bill"></i>
                    <span>{{ formatPrice(booking.total_price) }}</span>
                  </div>

                  <div class="court-players">
                    <i class="pi pi-users"></i>
                    <span>{{ t('joinCourt.playersCount', { current: booking.current_players, needed: booking.needed_players }) }}</span>
                  </div>

                  <div class="court-spots">
                    <i class="pi pi-user-plus"></i>
                    <span>{{ t('joinCourt.spotsAvailable', { count: spotsAvailable }) }}</span>
                  </div>
                </div>
              </BaseCard>
            </div>

            <!-- Booking Info -->
            <div class="booking-info-section">
              <BaseCard>
                <template #header>
                  <h2 class="section-title">{{ t('joinCourt.bookingInfo') }}</h2>
                </template>

                <div class="booking-info">
                  <div class="info-row">
                    <div class="info-label">{{ t('joinCourt.bookedBy') }}:</div>
                    <div class="info-value">{{ booking.user_name }}</div>
                  </div>

                  <div class="info-row">
                    <div class="info-label">{{ t('joinCourt.contactPhone') }}:</div>
                    <div class="info-value">{{ booking.user_phone }}</div>
                  </div>

                  <div class="info-row">
                    <div class="info-label">{{ t('joinCourt.date') }}:</div>
                    <div class="info-value">{{ formatDate(booking.start_time) }}</div>
                  </div>

                  <div class="info-row">
                    <div class="info-label">{{ t('joinCourt.time') }}:</div>
                    <div class="info-value">{{ formatTimeRange(booking.start_time, booking.end_time) }}</div>
                  </div>

                  <div class="info-row">
                    <div class="info-label">{{ t('joinCourt.price') }}:</div>
                    <div class="info-value">{{ formatPrice(booking.total_price) }}</div>
                  </div>

                  <div class="info-row">
                    <div class="info-label">{{ t('joinCourt.skillLevel') }}:</div>
                    <div class="info-value">{{ getSkillLevelLabel(booking.skill_level) }}</div>
                  </div>
                </div>

                <div class="join-action">
                  <BaseButton
                    :label="t('joinCourt.joinNow')"
                    icon="pi-user-plus"
                    @click="openJoinModal"
                    :disabled="spotsAvailable <= 0"
                  />
                </div>
              </BaseCard>
            </div>

            <!-- Players -->
            <div class="players-section">
              <BaseCard>
                <template #header>
                  <h2 class="section-title">{{ t('joinCourt.currentPlayers') }}</h2>
                </template>

                <div class="players-list">
                  <div v-for="player in players" :key="player.id" class="player-item">
                    <div class="player-avatar">
                      <i class="pi pi-user"></i>
                    </div>

                    <div class="player-info">
                      <div class="player-name">
                        {{ player.name }}
                        <span v-if="player.is_booker" class="booker-badge">{{ t('joinCourt.booker') }}</span>
                      </div>

                      <div class="player-count">
                        {{ t('joinCourt.bringingPlayers', { count: player.players_count }) }}
                      </div>
                    </div>
                  </div>

                  <div v-if="spotsAvailable > 0" class="player-item empty-spot">
                    <div class="player-avatar empty">
                      <i class="pi pi-plus"></i>
                    </div>

                    <div class="player-info">
                      <div class="player-name">{{ t('joinCourt.emptySpot') }}</div>
                      <div class="player-count">
                        {{ t('joinCourt.spotsAvailable', { count: spotsAvailable }) }}
                      </div>
                    </div>
                  </div>
                </div>
              </BaseCard>
            </div>

            <!-- Payment Info -->
            <div class="payment-info-section">
              <BaseCard>
                <template #header>
                  <h2 class="section-title">{{ t('joinCourt.paymentInfo') }}</h2>
                </template>

                <div class="payment-info">
                  <BaseAlert type="info">
                    {{ t('joinCourt.paymentInfoText') }}
                  </BaseAlert>
                </div>
              </BaseCard>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Join Court Modal -->
    <BaseModal
      v-model:visible="showJoinModal"
      :title="t('joinCourt.joinRequest')"
      :footer="false"
    >
      <div class="join-modal-content" v-if="booking">
        <div class="court-summary">
          <h3>{{ booking.court_name }}</h3>

          <div class="summary-info">
            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.date') }}:</div>
              <div class="info-value">{{ formatDate(booking.start_time) }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.time') }}:</div>
              <div class="info-value">{{ formatTimeRange(booking.start_time, booking.end_time) }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.location') }}:</div>
              <div class="info-value">{{ booking.location }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.bookedBy') }}:</div>
              <div class="info-value">{{ booking.user_name }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.contactPhone') }}:</div>
              <div class="info-value">{{ booking.user_phone }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.price') }}:</div>
              <div class="info-value">{{ formatPrice(booking.total_price) }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.skillLevel') }}:</div>
              <div class="info-value">{{ getSkillLevelLabel(booking.skill_level) }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.spotsAvailable') }}:</div>
              <div class="info-value">{{ spotsAvailable }}</div>
            </div>
          </div>
        </div>

        <div class="join-form">
          <h3>{{ t('joinCourt.yourInfo') }}</h3>

          <div class="form-group">
            <label>{{ t('joinCourt.playersCount') }}</label>
            <div class="number-input">
              <button
                type="button"
                class="number-btn"
                @click="playersCount = Math.max(1, playersCount - 1)"
                :disabled="playersCount <= 1"
              >
                <i class="pi pi-minus"></i>
              </button>
              <span class="number-value">{{ playersCount }}</span>
              <button
                type="button"
                class="number-btn"
                @click="playersCount = Math.min(spotsAvailable, playersCount + 1)"
                :disabled="playersCount >= spotsAvailable"
              >
                <i class="pi pi-plus"></i>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('joinCourt.message') }}</label>
            <BaseTextarea
              v-model="joinMessage"
              :placeholder="t('joinCourt.messagePlaceholder')"
              rows="3"
            />
          </div>

          <BaseAlert type="info">
            {{ t('joinCourt.paymentInfo') }}
          </BaseAlert>

          <div class="form-actions">
            <BaseButton
              :label="t('common.cancel')"
              variant="secondary"
              @click="showJoinModal = false"
              :disabled="isJoinLoading"
            />

            <BaseButton
              :label="t('joinCourt.sendRequest')"
              @click="sendJoinRequest"
              :loading="isJoinLoading"
            />
          </div>
        </div>
      </div>
    </BaseModal>
  </BaseLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toast-notification';
import { useJoinCourtService } from '../services/JoinCourtService';
import { useRoute, useRouter } from 'vue-router';
import BaseLayout from '../components/layout/BaseLayout.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import BaseAlert from '../components/base/BaseAlert.vue';
import BaseModal from '../components/base/BaseModal.vue';
import BaseSpinner from '../components/base/BaseSpinner.vue';
import BaseTextarea from '../components/base/BaseTextarea.vue';

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const joinCourtService = useJoinCourtService();

// State
const isLoading = ref(true);
const isJoinLoading = ref(false);
const booking = ref(null);
const players = ref([]);
const showJoinModal = ref(false);
const playersCount = ref(1);
const joinMessage = ref('');

// Computed
const spotsAvailable = computed(() => {
  if (!booking.value) return 0;
  return booking.value.needed_players - booking.value.current_players;
});

// Options
const skillLevelOptions = computed(() => [
  { value: 'beginner', label: t('common.beginner') },
  { value: 'intermediate', label: t('common.intermediate') },
  { value: 'advanced', label: t('common.advanced') }
]);

// Methods
const fetchCourtDetails = async () => {
  isLoading.value = true;

  try {
    const id = parseInt(route.params.id);
    const response = await joinCourtService.getJoinableCourtDetails(id);

    booking.value = response.booking;
    players.value = response.players;
  } catch (error) {
    console.error('Error fetching court details:', error);
    toast.error(t('joinCourt.fetchDetailError'));
    booking.value = null;
  } finally {
    isLoading.value = false;
  }
};

const openJoinModal = () => {
  playersCount.value = 1;
  joinMessage.value = '';
  showJoinModal.value = true;
};

const sendJoinRequest = async () => {
  if (!booking.value) return;

  isJoinLoading.value = true;

  try {
    await joinCourtService.sendJoinRequest({
      booking_id: booking.value.id,
      players_count: playersCount.value,
      message: joinMessage.value
    });

    toast.success(t('joinCourt.requestSent'));
    showJoinModal.value = false;

    // Refresh the details
    fetchCourtDetails();
  } catch (error) {
    console.error('Error sending join request:', error);
    toast.error(error.response?.data?.message || t('joinCourt.requestError'));
  } finally {
    isJoinLoading.value = false;
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

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const getSkillLevelLabel = (skillLevel) => {
  if (!skillLevel) return t('common.any');

  const option = skillLevelOptions.value.find(opt => opt.value === skillLevel);
  return option ? option.label : skillLevel;
};

// Lifecycle
onMounted(() => {
  fetchCourtDetails();
});
</script>

<style scoped lang="scss">
.join-court-detail-page {
  display: flex;
  justify-content: center;
}

.join-court-detail-container {
  width: 100%;
  max-width: 1200px;
  padding: 0 1rem;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.not-found {
  padding: 2rem 0;
  text-align: center;
}

.back-button {
  margin-top: 1.5rem;
}

.back-link {
  margin-bottom: 1rem;
}

.court-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.court-info-section {
  grid-column: 1 / 3;
}

.court-image {
  position: relative;
  height: 300px;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
}

.court-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.court-skill-level {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.court-info {
  padding: 1.5rem;
}

.court-name {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.court-location,
.court-time,
.court-price,
.court-players,
.court-spots {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: var(--dark-gray);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.booking-info {
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.info-label {
  font-weight: 500;
}

.join-action {
  display: flex;
  justify-content: center;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.player-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
}

.player-avatar.empty {
  background-color: #e0e0e0;
  color: #757575;
}

.player-info {
  flex: 1;
}

.player-name {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.booker-badge {
  font-size: 0.7rem;
  background-color: var(--primary-color);
  color: white;
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
}

.player-count {
  font-size: 0.9rem;
  color: var(--dark-gray);
}

.empty-spot {
  border: 1px dashed #ccc;
  background-color: #f5f5f5;
}

.join-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.court-summary {
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.join-form {
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.number-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.number-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1px solid var(--primary-color);
  background-color: white;
  color: var(--primary-color);
  cursor: pointer;
  transition: all 0.2s;
}

.number-btn:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
}

.number-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.number-value {
  font-weight: 600;
  font-size: 1.1rem;
  min-width: 1.5rem;
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .court-detail-grid {
    grid-template-columns: 1fr;
  }

  .court-info-section {
    grid-column: 1;
  }
}
</style>

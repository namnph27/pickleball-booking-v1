<template>
  <BaseLayout>
    <div class="join-court-page">
      <div class="join-court-container">
        <!-- Filters -->
        <div class="filters-section">
          <BaseCard>
            <template #header>
              <h2 class="section-title">{{ t('joinCourt.filters') }}</h2>
            </template>

            <div class="filters-form">
              <div class="filter-row">
                <div class="filter-group">
                  <label>{{ t('joinCourt.date') }}</label>
                  <BaseInput
                    v-model="filters.date"
                    type="date"
                    :min="minDate"
                  />
                </div>

                <div class="filter-group">
                  <label>{{ t('joinCourt.skillLevel') }}</label>
                  <BaseSelect
                    v-model="filters.skill_level"
                    :options="skillLevelOptions"
                    :placeholder="t('joinCourt.anySkillLevel')"
                  />
                </div>
              </div>

              <div class="filter-row">
                <div class="filter-group">
                  <label>{{ t('joinCourt.location') }}</label>
                  <BaseSelect
                    v-model="filters.location"
                    :options="districtOptions"
                    :placeholder="t('joinCourt.anyLocation')"
                  />
                </div>

                <div class="filter-group">
                  <label>{{ t('joinCourt.priceRange') }}</label>
                  <BaseSelect
                    v-model="filters.price_range"
                    :options="priceRangeOptions"
                    :placeholder="t('joinCourt.anyPrice')"
                  />
                </div>
              </div>

              <div class="filter-row">
                <div class="filter-group">
                  <label>{{ t('joinCourt.playersNeeded') }}</label>
                  <BaseSelect
                    v-model="filters.players_needed"
                    :options="playersNeededOptions"
                    :placeholder="t('joinCourt.anyNumber')"
                  />
                </div>

                <div class="filter-actions">
                  <BaseButton
                    :label="t('joinCourt.search')"
                    icon="pi-search"
                    @click="searchCourts"
                    :loading="isLoading"
                  />

                  <BaseButton
                    :label="t('joinCourt.reset')"
                    variant="secondary"
                    @click="resetFilters"
                    :disabled="isLoading"
                  />
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Results -->
        <div class="results-section">
          <div v-if="isLoading" class="loading-container">
            <BaseSpinner size="large" />
          </div>

          <div v-else-if="joinableCourts.length === 0" class="no-results">
            <BaseAlert type="info">
              {{ t('joinCourt.noResults') }}
            </BaseAlert>
          </div>

          <div v-else class="courts-grid">
            <BaseCard v-for="court in joinableCourts" :key="court.id" class="court-card">
              <div class="court-image">
                <img :src="getCourtImage(court)" :alt="court.court_name" />
                <div class="court-skill-level" v-if="court.skill_level">
                  {{ getSkillLevelLabel(court.skill_level) }}
                </div>
              </div>

              <div class="court-details">
                <h3 class="court-name">{{ court.court_name }}</h3>

                <div class="court-location">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ court.location }}</span>
                </div>

                <div class="court-time">
                  <i class="pi pi-calendar"></i>
                  <span>{{ formatDate(court.start_time) }}</span>
                </div>

                <div class="court-time">
                  <i class="pi pi-clock"></i>
                  <span>{{ formatTimeRange(court.start_time, court.end_time) }}</span>
                </div>

                <div class="court-price">
                  <i class="pi pi-money-bill"></i>
                  <span>{{ formatPrice(court.total_price) }}</span>
                </div>

                <div class="court-players">
                  <i class="pi pi-users"></i>
                  <span>{{ t('joinCourt.playersCount', { current: court.current_players, needed: court.needed_players }) }}</span>
                </div>

                <div class="court-spots">
                  <i class="pi pi-user-plus"></i>
                  <span>{{ t('joinCourt.spotsAvailable', { count: court.spots_available }) }}</span>
                </div>

                <div class="court-actions">
                  <BaseButton
                    :label="t('joinCourt.viewDetails')"
                    variant="secondary"
                    @click="viewCourtDetails(court.id)"
                  />

                  <BaseButton
                    :label="t('joinCourt.joinNow')"
                    @click="openJoinModal(court)"
                  />
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>

    <!-- Join Court Modal -->
    <BaseModal
      v-model:visible="showJoinModal"
      :title="t('joinCourt.joinRequest')"
      :footer="false"
    >
      <div class="join-modal-content" v-if="selectedCourt">
        <div class="court-summary">
          <h3>{{ selectedCourt.court_name }}</h3>

          <div class="summary-info">
            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.date') }}:</div>
              <div class="info-value">{{ formatDate(selectedCourt.start_time) }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.time') }}:</div>
              <div class="info-value">{{ formatTimeRange(selectedCourt.start_time, selectedCourt.end_time) }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.location') }}:</div>
              <div class="info-value">{{ selectedCourt.location }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.bookedBy') }}:</div>
              <div class="info-value">{{ selectedCourt.user_name }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.contactPhone') }}:</div>
              <div class="info-value">{{ selectedCourt.user_phone }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.price') }}:</div>
              <div class="info-value">{{ formatPrice(selectedCourt.total_price) }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.skillLevel') }}:</div>
              <div class="info-value">{{ getSkillLevelLabel(selectedCourt.skill_level) }}</div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ t('joinCourt.spotsAvailable') }}:</div>
              <div class="info-value">{{ selectedCourt.spots_available }}</div>
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
                @click="playersCount = Math.min(selectedCourt.spots_available, playersCount + 1)"
                :disabled="playersCount >= selectedCourt.spots_available"
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
import { useRouter } from 'vue-router';
import BaseLayout from '../components/layout/BaseLayout.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseInput from '../components/base/BaseInput.vue';
import BaseSelect from '../components/base/BaseSelect.vue';
import BaseButton from '../components/base/BaseButton.vue';
import BaseAlert from '../components/base/BaseAlert.vue';
import BaseModal from '../components/base/BaseModal.vue';
import BaseSpinner from '../components/base/BaseSpinner.vue';
import BaseTextarea from '../components/base/BaseTextarea.vue';

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const joinCourtService = useJoinCourtService();

// State
const isLoading = ref(false);
const isJoinLoading = ref(false);
const joinableCourts = ref([]);
const showJoinModal = ref(false);
const selectedCourt = ref(null);
const playersCount = ref(1);
const joinMessage = ref('');

// Filters
const filters = ref({
  date: new Date().toISOString().split('T')[0], // Today
  skill_level: '',
  location: '',
  price_range: '',
  players_needed: ''
});

// Options
const skillLevelOptions = computed(() => [
  { value: 'beginner', label: t('common.beginner') },
  { value: 'intermediate', label: t('common.intermediate') },
  { value: 'advanced', label: t('common.advanced') }
]);

// Danh sách các quận của TP.HCM
const districtOptions = computed(() => [
  { value: '', label: 'Tất cả các quận' },
  { value: 'quan_1', label: 'Quận 1' },
  { value: 'quan_3', label: 'Quận 3' },
  { value: 'quan_4', label: 'Quận 4' },
  { value: 'quan_5', label: 'Quận 5' },
  { value: 'quan_6', label: 'Quận 6' },
  { value: 'quan_7', label: 'Quận 7' },
  { value: 'quan_8', label: 'Quận 8' },
  { value: 'quan_10', label: 'Quận 10' },
  { value: 'quan_11', label: 'Quận 11' },
  { value: 'quan_12', label: 'Quận 12' },
  { value: 'binh_thanh', label: 'Quận Bình Thạnh' },
  { value: 'phu_nhuan', label: 'Quận Phú Nhuận' },
  { value: 'go_vap', label: 'Quận Gò Vấp' },
  { value: 'tan_binh', label: 'Quận Tân Bình' },
  { value: 'tan_phu', label: 'Quận Tân Phú' },
  { value: 'binh_tan', label: 'Quận Bình Tân' },
  { value: 'thu_duc', label: 'Thành phố Thủ Đức' },
  { value: 'binh_chanh', label: 'Huyện Bình Chánh' },
  { value: 'nha_be', label: 'Huyện Nhà Bè' },
  { value: 'can_gio', label: 'Huyện Cần Giờ' },
  { value: 'cu_chi', label: 'Huyện Củ Chi' },
  { value: 'hoc_mon', label: 'Huyện Hóc Môn' }
]);

const priceRangeOptions = computed(() => [
  { value: '0-200000', label: '0 - 200,000 VND' },
  { value: '200000-400000', label: '200,000 - 400,000 VND' },
  { value: '400000-600000', label: '400,000 - 600,000 VND' },
  { value: '600000-1000000', label: '600,000 - 1,000,000 VND' },
  { value: '1000000+', label: '> 1,000,000 VND' }
]);

const playersNeededOptions = computed(() => [
  { value: '1', label: '1 ' + t('joinCourt.player') },
  { value: '2', label: '2 ' + t('joinCourt.players') },
  { value: '3', label: '3 ' + t('joinCourt.players') },
  { value: '4+', label: '4+ ' + t('joinCourt.players') }
]);

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

// Methods
const searchCourts = async () => {
  isLoading.value = true;

  try {
    // Parse price range
    let minPrice, maxPrice;
    if (filters.value.price_range) {
      const range = filters.value.price_range.split('-');
      minPrice = parseInt(range[0]);
      maxPrice = range[1] === '+' ? undefined : parseInt(range[1]);
    }

    // Parse players needed
    let playersNeeded;
    if (filters.value.players_needed) {
      playersNeeded = filters.value.players_needed.endsWith('+')
        ? parseInt(filters.value.players_needed.replace('+', ''))
        : parseInt(filters.value.players_needed);
    }

    // Lấy tên quận/huyện từ giá trị đã chọn
    const locationLabel = filters.value.location ?
      districtOptions.value.find(d => d.value === filters.value.location)?.label : '';

    const response = await joinCourtService.getJoinableCourts({
      date: filters.value.date,
      skill_level: filters.value.skill_level,
      location: locationLabel, // Sử dụng tên quận/huyện thay vì giá trị
      min_price: minPrice,
      max_price: maxPrice,
      players_needed: playersNeeded
    });

    joinableCourts.value = response.joinable_courts;
  } catch (error) {
    console.error('Error fetching joinable courts:', error);
    toast.error(t('joinCourt.fetchError'));
  } finally {
    isLoading.value = false;
  }
};

const resetFilters = () => {
  filters.value = {
    date: new Date().toISOString().split('T')[0],
    skill_level: '',
    location: '',
    price_range: '',
    players_needed: ''
  };

  searchCourts();
};

const viewCourtDetails = (id) => {
  router.push(`/join-court/${id}`);
};

const openJoinModal = (court) => {
  selectedCourt.value = court;
  playersCount.value = 1;
  joinMessage.value = '';
  showJoinModal.value = true;
};

const sendJoinRequest = async () => {
  if (!selectedCourt.value) return;

  isJoinLoading.value = true;

  try {
    await joinCourtService.sendJoinRequest({
      booking_id: selectedCourt.value.id,
      players_count: playersCount.value,
      message: joinMessage.value
    });

    toast.success(t('joinCourt.requestSent'));
    showJoinModal.value = false;

    // Refresh the list
    searchCourts();
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

// Get court image with proper URL
const getCourtImage = (court) => {
  if (court.image_url) {
    // If image URL starts with /uploads, it's a server-side image
    if (court.image_url.startsWith('/uploads')) {
      // Use the API URL from environment variables
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${apiUrl}${court.image_url}`;
    }
    return court.image_url;
  }

  // Fallback to default image
  return '/images/default-court.jpg';
};

// Lifecycle
onMounted(() => {
  searchCourts();
});
</script>

<style scoped lang="scss">
.join-court-page {
  display: flex;
  justify-content: center;
}

.join-court-container {
  width: 100%;
  max-width: 1200px;
  padding: 0 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.filters-section {
  margin-bottom: 2rem;
}

.filters-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
}

.filter-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  font-size: 0.9rem;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.no-results {
  padding: 2rem 0;
}

.courts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.court-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.court-image {
  position: relative;
  height: 180px;
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

.court-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  flex: 1;
}

.court-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.court-location,
.court-time,
.court-price,
.court-players,
.court-spots {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--dark-gray);
  font-size: 0.9rem;
}

.court-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
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

.info-row {
  display: flex;
  justify-content: space-between;
}

.info-label {
  font-weight: 500;
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
  .filter-row {
    flex-direction: column;
  }

  .courts-grid {
    grid-template-columns: 1fr;
  }
}
</style>

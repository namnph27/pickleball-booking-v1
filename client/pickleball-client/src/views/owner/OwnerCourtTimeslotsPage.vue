<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useCourtStore } from '../../store/court';
import { useCourtService, type CourtTimeslot } from '../../services/CourtService';
import { useToast } from '../../composables/useToast';
import BaseLayout from '../../components/layout/BaseLayout.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseCard from '../../components/base/BaseCard.vue';
import BaseSpinner from '../../components/base/BaseSpinner.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseModal from '../../components/base/BaseModal.vue';
import BaseInput from '../../components/base/BaseInput.vue';
import BaseSelect from '../../components/base/BaseSelect.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const courtStore = useCourtStore();
const courtService = useCourtService();
const toast = useToast();

// State
const courtId = computed(() => Number(route.params.id));
const timeslots = ref<CourtTimeslot[]>([]);
const loading = ref(false);
const showEditModal = ref(false);
const showCopyModal = ref(false);
const showDeleteDateModal = ref(false);
const isSubmitting = ref(false);
const selectedTimeslot = ref<CourtTimeslot | null>(null);
const copyFromDayOfWeek = ref(1); // Default to Monday

// Check if there are specific date timeslots
const hasSpecificDateTimeslots = computed(() => {
  return timeslots.value.some(timeslot => timeslot.specific_date === selectedDate.value);
});

// Date selection
const today = new Date();
const selectedDate = ref(today.toISOString().split('T')[0]);
const selectedDayOfWeek = computed(() => new Date(selectedDate.value).getDay());

// Future dates for selection
const futureDates = computed(() => {
  const dates = [];
  const currentDate = new Date();

  // Add today and next 30 days
  for (let i = 0; i < 31; i++) {
    const date = new Date();
    date.setDate(currentDate.getDate() + i);

    const dateString = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('vi-VN', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    dates.push({
      value: dateString,
      label: `${dayName} (${formattedDate})`,
      dayOfWeek: date.getDay()
    });
  }

  return dates;
});

// Fixed timeslots from 6:00 to 23:00
const fixedTimeslots = computed(() => {
  const slots = [];

  for (let hour = 6; hour < 23; hour++) {
    const startHour = hour.toString().padStart(2, '0');
    const endHour = (hour + 1).toString().padStart(2, '0');

    slots.push({
      startTime: `${startHour}:00:00`,
      endTime: `${endHour}:00:00`,
      displayTime: `${startHour}:00 - ${endHour}:00`
    });
  }

  return slots;
});

// Form state
const dayOfWeek = ref(1);
const startTime = ref('');
const endTime = ref('');
const price = ref(0);
const isAvailable = ref(true);

// Day of week options
const dayOptions = computed(() => [
  { value: 1, label: t('common.monday') },
  { value: 2, label: t('common.tuesday') },
  { value: 3, label: t('common.wednesday') },
  { value: 4, label: t('common.thursday') },
  { value: 5, label: t('common.friday') },
  { value: 6, label: t('common.saturday') },
  { value: 0, label: t('common.sunday') }
]);

// Grouped timeslots by day
const groupedTimeslots = computed(() => {
  const grouped: Record<number, CourtTimeslot[]> = {};

  // Initialize all days
  for (let i = 0; i <= 6; i++) {
    grouped[i] = [];
  }

  // Group timeslots by day
  timeslots.value.forEach(timeslot => {
    grouped[timeslot.day_of_week].push(timeslot);
  });

  // Sort timeslots by start time
  for (const day in grouped) {
    grouped[Number(day)].sort((a, b) => {
      return a.start_time.localeCompare(b.start_time);
    });
  }

  return grouped;
});

// Get timeslots for the selected day
const selectedDayTimeslots = computed(() => {
  return groupedTimeslots.value[selectedDayOfWeek.value] || [];
});

// Map fixed timeslots to actual timeslots
const mappedTimeslots = computed(() => {
  const result = [];

  for (const fixedSlot of fixedTimeslots.value) {
    // Find if there's a matching timeslot for this time period
    const existingTimeslot = selectedDayTimeslots.value.find(
      ts => ts.start_time === fixedSlot.startTime && ts.end_time === fixedSlot.endTime
    );

    if (existingTimeslot) {
      result.push({
        ...existingTimeslot,
        displayTime: fixedSlot.displayTime
      });
    } else {
      // Create a placeholder for timeslots that don't exist yet
      result.push({
        id: 0, // Will be used to identify placeholders
        court_id: courtId.value,
        day_of_week: selectedDayOfWeek.value,
        start_time: fixedSlot.startTime,
        end_time: fixedSlot.endTime,
        price: 0,
        is_available: true,
        displayTime: fixedSlot.displayTime,
        isPlaceholder: true
      });
    }
  }

  return result;
});

// Format time
const formatTime = (timeString: string) => {
  const date = new Date(`2000-01-01T${timeString}`);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
};

// Open edit modal for a specific timeslot
const openTimeslotModal = (timeslot: any) => {
  selectedTimeslot.value = timeslot;

  // Populate form
  dayOfWeek.value = timeslot.day_of_week;
  startTime.value = timeslot.start_time;
  endTime.value = timeslot.end_time;
  price.value = timeslot.price || 0;
  isAvailable.value = timeslot.is_available;

  showEditModal.value = true;
};

// Open edit modal
const openEditModal = (timeslot: CourtTimeslot) => {
  selectedTimeslot.value = timeslot;

  // Populate form
  dayOfWeek.value = timeslot.day_of_week;
  startTime.value = timeslot.start_time;
  endTime.value = timeslot.end_time;
  price.value = timeslot.price || 0;
  isAvailable.value = timeslot.is_available;

  showEditModal.value = true;
};

// Update timeslot
const updateTimeslot = async () => {
  if (!selectedTimeslot.value || !startTime.value || !endTime.value) {
    toast.error(t('courtOwner.timeslotTimeRequired'));
    return;
  }

  isSubmitting.value = true;

  try {
    // Get the day of week from the selected date
    const date = new Date(selectedDate.value);
    const dayOfWeekFromDate = date.getDay();

    const timeslotData = {
      day_of_week: dayOfWeekFromDate,
      start_time: startTime.value,
      end_time: endTime.value,
      price: Number(price.value),
      is_available: isAvailable.value,
      specific_date: selectedDate.value
    };

    await courtService.updateTimeslot(courtId.value, selectedTimeslot.value.id, timeslotData);

    toast.success(t('courtOwner.timeslotUpdated'));
    showEditModal.value = false;

    // Refresh timeslots
    fetchTimeslots();
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.timeslotUpdateError'));
  } finally {
    isSubmitting.value = false;
  }
};

// Toggle timeslot availability
const toggleAvailability = async (timeslot: CourtTimeslot) => {
  try {
    // If it's not a placeholder and has an ID, just update it directly
    if (!(timeslot as any).isPlaceholder && timeslot.id) {
      await courtService.updateTimeslot(courtId.value, timeslot.id, {
        is_available: !timeslot.is_available
      });

      toast.success(
        timeslot.is_available
          ? t('courtOwner.timeslotMarkedUnavailable')
          : t('courtOwner.timeslotMarkedAvailable')
      );

      // Refresh timeslots
      fetchTimeslots();
      return;
    }

    // For placeholders or default timeslots, we need to check if a specific date override exists
    try {
      // First check if a specific date override already exists
      const response = await courtService.getTimeslotsByDate(courtId.value, selectedDate.value);

      // Find exact match for this timeslot
      const existingTimeslot = response.timeslots.find(
        ts =>
          ts.start_time === timeslot.start_time &&
          ts.end_time === timeslot.end_time &&
          ts.specific_date === selectedDate.value
      );

      if (existingTimeslot) {
        // Update existing specific date timeslot
        await courtService.updateTimeslot(courtId.value, existingTimeslot.id, {
          is_available: !existingTimeslot.is_available
        });

        toast.success(
          existingTimeslot.is_available
            ? t('courtOwner.timeslotMarkedUnavailable')
            : t('courtOwner.timeslotMarkedAvailable')
        );
      } else {
        // Create new specific date override
        const timeslotData = {
          court_id: courtId.value,
          day_of_week: timeslot.day_of_week,
          start_time: timeslot.start_time,
          end_time: timeslot.end_time,
          price: Number(timeslot.price || 0),
          is_available: false, // Always start as unavailable when creating from placeholder
          specific_date: selectedDate.value
        };

        await courtService.createTimeslot(courtId.value, timeslotData);
        toast.success(t('courtOwner.timeslotMarkedUnavailable'));
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      throw error;
    }

    // Refresh timeslots
    fetchTimeslots();
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.timeslotUpdateError'));
  }
};

// Quick update price
const quickUpdatePrice = async (timeslot: any, newPrice: number) => {
  try {
    // If it's not a placeholder and has an ID, just update it directly
    if (!timeslot.isPlaceholder && timeslot.id) {
      await courtService.updateTimeslot(courtId.value, timeslot.id, {
        price: newPrice
      });

      toast.success(t('courtOwner.timeslotUpdated'));

      // Refresh timeslots
      fetchTimeslots();
      return;
    }

    // For placeholders or default timeslots, we need to check if a specific date override exists
    try {
      // First check if a specific date override already exists
      const response = await courtService.getTimeslotsByDate(courtId.value, selectedDate.value);

      // Find exact match for this timeslot
      const existingTimeslot = response.timeslots.find(
        ts =>
          ts.start_time === timeslot.start_time &&
          ts.end_time === timeslot.end_time &&
          ts.specific_date === selectedDate.value
      );

      if (existingTimeslot) {
        // Update existing specific date timeslot
        await courtService.updateTimeslot(courtId.value, existingTimeslot.id, {
          price: newPrice
        });
        toast.success(t('courtOwner.timeslotUpdated'));
      } else {
        // Create new specific date override
        const timeslotData = {
          court_id: courtId.value,
          day_of_week: timeslot.day_of_week,
          start_time: timeslot.start_time,
          end_time: timeslot.end_time,
          price: newPrice,
          is_available: timeslot.is_available,
          specific_date: selectedDate.value
        };

        await courtService.createTimeslot(courtId.value, timeslotData);
        toast.success(t('courtOwner.timeslotAdded'));
      }
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }

    // Refresh timeslots
    fetchTimeslots();
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.timeslotUpdateError'));
  }
};

// Fetch court timeslots for the selected date
const fetchTimeslots = async () => {
  loading.value = true;

  try {
    // Get timeslots for the selected date
    const response = await courtService.getTimeslotsByDate(courtId.value, selectedDate.value);
    timeslots.value = response.timeslots;
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.timeslotsFetchError'));
  } finally {
    loading.value = false;
  }
};

// Watch for date changes to reload timeslots
watch(selectedDate, () => {
  fetchTimeslots();
});

// Open copy modal
const openCopyModal = () => {
  // Set default day of week to the selected date's day of week
  const date = new Date(selectedDate.value);
  copyFromDayOfWeek.value = date.getDay();
  showCopyModal.value = true;
};

// Open delete date modal
const openDeleteDateModal = () => {
  showDeleteDateModal.value = true;
};

// Copy timeslots from day of week to specific date
const copyTimeslots = async () => {
  isSubmitting.value = true;

  try {
    await courtService.copyDayOfWeekTimeslotsToDate(
      courtId.value,
      copyFromDayOfWeek.value,
      selectedDate.value
    );

    toast.success(t('courtOwner.timeslotsCopied'));
    showCopyModal.value = false;

    // Refresh timeslots
    fetchTimeslots();
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'timeslots' in error) {
      toast.error(t('courtOwner.timeslotsAlreadyExist'));
    } else {
      toast.error(typeof error === 'string' ? error : t('courtOwner.timeslotsCopyError'));
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Delete all timeslots for a specific date
const deleteAllTimeslotsForDate = async () => {
  isSubmitting.value = true;

  try {
    await courtService.deleteTimeslotsByDate(courtId.value, selectedDate.value);

    toast.success(t('courtOwner.timeslotsDeleted'));
    showDeleteDateModal.value = false;

    // Refresh timeslots
    fetchTimeslots();
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.timeslotsDeleteError'));
  } finally {
    isSubmitting.value = false;
  }
};

// Fetch court details and timeslots on mount
onMounted(async () => {
  if (!courtId.value) {
    router.push('/owner/courts');
    return;
  }

  try {
    await courtStore.getCourtById(courtId.value);
    await fetchTimeslots();
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.fetchError'));
    router.push('/owner/courts');
  }
});
</script>

<template>
  <BaseLayout
    :title="t('courtOwner.manageTimeslots')"
    :subtitle="courtStore.currentCourt?.name"
    :back-link="`/owner/courts`"
    :loading="courtStore.loading"
  >
    <!-- Header Actions -->
    <template #headerActions>
      <!-- No add timeslot button as timeslots are system-defined -->
    </template>

    <!-- Main Content -->
    <div v-if="courtStore.currentCourt" class="timeslots-container">
      <!-- Loading State -->
      <div v-if="loading" class="timeslots-loading">
        <BaseSpinner />
      </div>

      <!-- Date Selection -->
      <div v-else class="date-selection">
        <h3 class="section-title">{{ t('courtOwner.selectDate') }}</h3>
        <div class="date-selector">
          <BaseSelect
            :modelValue="selectedDate"
            @update:modelValue="selectedDate = $event"
            :options="futureDates"
            :label="t('courtOwner.date')"
          />
        </div>

        <div class="date-actions">
          <BaseButton
            :label="t('courtOwner.copyFromDayOfWeek')"
            variant="outline"
            icon="pi-copy"
            @click="openCopyModal"
          />

          <BaseButton
            v-if="hasSpecificDateTimeslots"
            :label="t('courtOwner.deleteAllForDate')"
            variant="danger"
            icon="pi-trash"
            @click="openDeleteDateModal"
          />
        </div>

        <div class="timeslots-header">
          <h3 class="section-title">{{ t('courtOwner.timeslots') }}</h3>
          <p class="section-subtitle">
            {{ t('courtOwner.timeslotsDescription') }}
          </p>
          <BaseAlert type="info" message="Các khung giờ được hệ thống hiển thị ở trang này là mặc định và chủ sân sẽ không thể thay đổi được. Chủ sân chỉ có thể cập nhật giá sân, đóng hoặc mở các khung giờ." />
        </div>

        <!-- Fixed Timeslots Grid -->
        <div class="fixed-timeslots-grid">
          <BaseCard
            v-for="timeslot in mappedTimeslots"
            :key="`${timeslot.day_of_week}-${timeslot.start_time}`"
            :class="['timeslot-card', { 'timeslot-card--placeholder': timeslot.isPlaceholder }]"
          >
            <div class="timeslot-time">
              <i class="pi pi-clock"></i>
              <span>{{ timeslot.displayTime }}</span>
            </div>

            <div class="timeslot-price">
              <i class="pi pi-money-bill"></i>
              <span>{{ formatPrice(timeslot.price) }}</span>

              <!-- Quick Price Buttons -->
              <div class="quick-price-buttons">
                <button
                  v-for="quickPrice in [100000, 150000, 200000]"
                  :key="quickPrice"
                  class="quick-price-button"
                  @click="quickUpdatePrice(timeslot, quickPrice)"
                >
                  {{ formatPrice(quickPrice) }}
                </button>
              </div>
            </div>

            <div class="timeslot-status">
              <span :class="['status-badge', timeslot.is_available ? 'available' : 'unavailable']">
                {{ timeslot.is_available ? t('courts.available') : t('courts.unavailable') }}
              </span>
            </div>

            <div class="timeslot-actions">
              <button
                class="action-button"
                @click="openTimeslotModal(timeslot)"
                title="Edit"
              >
                <i class="pi pi-pencil"></i>
              </button>

              <button
                class="action-button"
                @click="toggleAvailability(timeslot)"
                :title="timeslot.is_available ? 'Mark Unavailable' : 'Mark Available'"
              >
                <i :class="`pi ${timeslot.is_available ? 'pi-eye-slash' : 'pi-eye'}`"></i>
              </button>

              <!-- Delete button removed as timeslots are system-defined -->
            </div>
          </BaseCard>
        </div>
      </div>
    </div>

    <!-- Add Timeslot Modal removed as timeslots are system-defined -->

    <!-- Edit Timeslot Modal -->
    <BaseModal
      :modelValue="showEditModal"
      @update:modelValue="showEditModal = $event"
      :title="t('courtOwner.editTimeslot')"
      :ok-text="t('courtOwner.updateTimeslot')"
      :cancel-text="t('common.cancel')"
      :loading="isSubmitting"
      @ok="updateTimeslot"
    >
      <div class="timeslot-form">
        <div class="form-group">
          <BaseSelect
            :modelValue="dayOfWeek"
            @update:modelValue="dayOfWeek = $event"
            :label="t('courtOwner.dayOfWeek')"
            :options="dayOptions"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <BaseInput
              :modelValue="startTime"
              @update:modelValue="startTime = $event"
              type="time"
              :label="t('courtOwner.startTime')"
              required
            />
          </div>

          <div class="form-group">
            <BaseInput
              :modelValue="endTime"
              @update:modelValue="endTime = $event"
              type="time"
              :label="t('courtOwner.endTime')"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <BaseInput
            :modelValue="price"
            @update:modelValue="price = $event"
            type="number"
            :label="t('courts.price')"
            :placeholder="t('courtOwner.pricePlaceholder')"
            min="0"
            step="10000"
          />
        </div>

        <div class="form-group">
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                :checked="isAvailable"
                @change="isAvailable = $event.target.checked"
              />
              <span>{{ t('courtOwner.timeslotAvailable') }}</span>
            </label>
          </div>
        </div>
      </div>
    </BaseModal>

    <!-- Delete Timeslot Modal removed as timeslots are system-defined -->

    <!-- Copy Timeslots Modal -->
    <BaseModal
      :modelValue="showCopyModal"
      @update:modelValue="showCopyModal = $event"
      :title="t('courtOwner.copyTimeslots')"
      :ok-text="t('courtOwner.copyTimeslots')"
      :cancel-text="t('common.cancel')"
      :loading="isSubmitting"
      @ok="copyTimeslots"
    >
      <div class="copy-timeslots-form">
        <p>{{ t('courtOwner.copyTimeslotsDescription') }}</p>

        <div class="form-group">
          <BaseSelect
            :modelValue="copyFromDayOfWeek"
            @update:modelValue="copyFromDayOfWeek = $event"
            :label="t('courtOwner.copyFromDayOfWeek')"
            :options="dayOptions"
            required
          />
        </div>

        <div class="form-group">
          <div class="date-display">
            <span class="date-label">{{ t('courtOwner.copyToDate') }}:</span>
            <span class="date-value">{{ selectedDate }}</span>
          </div>
        </div>

        <BaseAlert type="info" :message="t('courtOwner.copyTimeslotsInfo')" />
      </div>
    </BaseModal>

    <!-- Delete Date Timeslots Modal -->
    <BaseModal
      :modelValue="showDeleteDateModal"
      @update:modelValue="showDeleteDateModal = $event"
      :title="t('courtOwner.deleteAllForDate')"
      :ok-text="t('courtOwner.confirmDelete')"
      :cancel-text="t('common.cancel')"
      ok-variant="danger"
      :loading="isSubmitting"
      @ok="deleteAllTimeslotsForDate"
    >
      <BaseAlert type="warning" :message="t('courtOwner.deleteAllForDateWarning')" />

      <div class="delete-confirmation">
        <p>{{ t('courtOwner.deleteAllForDateConfirmation') }}</p>

        <div class="date-display">
          <span class="date-label">{{ t('courtOwner.date') }}:</span>
          <span class="date-value">{{ selectedDate }}</span>
        </div>
      </div>
    </BaseModal>
  </BaseLayout>
</template>

<style scoped lang="scss">
.timeslots-loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.date-selection {
  margin-bottom: 2rem;

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }

  .section-subtitle {
    color: var(--dark-gray);
    margin-bottom: 1rem;
  }

  .date-selector {
    max-width: 500px;
    margin-bottom: 1rem;
  }

  .date-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .timeslots-header {
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--light-gray);
    padding-bottom: 0.5rem;
  }

  .date-display {
    background-color: var(--light-gray);
    padding: 0.75rem;
    border-radius: 4px;
    margin: 1rem 0;

    .date-label {
      font-weight: 500;
      margin-right: 0.5rem;
    }

    .date-value {
      font-weight: 600;
    }
  }

  .copy-timeslots-form {
    p {
      margin-bottom: 1rem;
    }
  }
}

.fixed-timeslots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.no-timeslots {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  text-align: center;

  .no-timeslots-icon {
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

.timeslot-card {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  transition: all 0.2s ease;

  &--placeholder {
    background-color: rgba(0, 0, 0, 0.02);
    border: 1px dashed var(--medium-gray);
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .timeslot-time {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--light-gray);

    i {
      color: var(--primary-color);
    }
  }

  .timeslot-price {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;

    i {
      color: #4caf50;
      margin-right: 0.5rem;
    }

    span {
      font-weight: 500;
      font-size: 1.1rem;
    }

    .quick-price-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;

      .quick-price-button {
        background-color: var(--light-gray);
        border: none;
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: var(--primary-color);
          color: white;
        }
      }
    }
  }

  .timeslot-status {
    margin-bottom: 1rem;

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;

      &.available {
        background-color: rgba(76, 175, 80, 0.1);
        color: #2e7d32;
      }

      &.unavailable {
        background-color: rgba(244, 67, 54, 0.1);
        color: #c62828;
      }
    }
  }

  .timeslot-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
    justify-content: flex-end;

    .action-button {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: 1px solid var(--medium-gray);
      border-radius: 4px;
      color: var(--dark-gray);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--light-gray);
        color: var(--text-color);
      }

      &--danger:hover {
        background-color: rgba(244, 67, 54, 0.1);
        color: #f44336;
        border-color: #f44336;
      }
    }
  }
}

.timeslot-form {
  .form-group {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .checkbox-group {
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;

      input {
        width: 18px;
        height: 18px;
      }
    }
  }
}

.delete-confirmation {
  margin-top: 1.5rem;

  p {
    margin-bottom: 1rem;
  }

  .timeslot-details {
    background-color: var(--light-gray);
    padding: 1rem;
    border-radius: 8px;

    .detail-item {
      display: flex;
      margin-bottom: 0.5rem;

      &:last-child {
        margin-bottom: 0;
      }

      .detail-label {
        width: 100px;
        font-weight: 500;
      }
    }
  }
}

@media (max-width: 768px) {
  .fixed-timeslots-grid {
    grid-template-columns: 1fr;
  }

  .timeslot-form {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
}
</style>

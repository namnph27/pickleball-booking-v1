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
import BaseTooltip from '../../components/base/BaseTooltip.vue';

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
const savedScrollPosition = ref(0); // To save scroll position

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
  const result: Array<CourtTimeslot & { displayTime: string, isPlaceholder?: boolean }> = [];

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

// Check if a timeslot is within the 2-day restriction window
const isTimeslotRestricted = (timeslotDate: string) => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Reset time to start of day

  const selectedTimeslotDate = new Date(timeslotDate);
  selectedTimeslotDate.setHours(0, 0, 0, 0); // Reset time to start of day

  // Calculate the difference in days
  const timeDifference = selectedTimeslotDate.getTime() - currentDate.getTime();
  const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

  // Return true if the timeslot is less than 2 days in the future
  return daysDifference < 2;
};

// Open edit modal for a specific timeslot
const openTimeslotModal = (timeslot: CourtTimeslot & { isPlaceholder?: boolean }) => {
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

  // Check if the timeslot is within the 2-day restriction window
  if (isTimeslotRestricted(selectedDate.value)) {
    // Only block price updates, allow availability changes
    const originalTimeslot = selectedTimeslot.value;
    if (originalTimeslot.price !== Number(price.value)) {
      toast.error(t('courtOwner.timeslotPriceRestricted'));
      return;
    }
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

    // Refresh timeslots while preserving scroll position
    fetchTimeslots(true);
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.timeslotUpdateError'));
  } finally {
    isSubmitting.value = false;
  }
};

// Toggle timeslot availability
const toggleAvailability = async (timeslot: CourtTimeslot & { isPlaceholder?: boolean }) => {
  try {
    // If it's not a placeholder and has an ID, just update it directly
    if (!timeslot.isPlaceholder && timeslot.id) {
      await courtService.updateTimeslot(courtId.value, timeslot.id, {
        is_available: !timeslot.is_available
      });

      toast.success(
        timeslot.is_available
          ? t('courtOwner.timeslotMarkedUnavailable')
          : t('courtOwner.timeslotMarkedAvailable')
      );

      // Refresh timeslots while preserving scroll position
      fetchTimeslots(true);
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

    // Refresh timeslots while preserving scroll position
    fetchTimeslots(true);
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.timeslotUpdateError'));
  }
};

// Quick update price
const quickUpdatePrice = async (timeslot: CourtTimeslot & { isPlaceholder?: boolean }, newPrice: number) => {
  try {
    // Check if the timeslot is within the 2-day restriction window
    if (isTimeslotRestricted(selectedDate.value)) {
      toast.error(t('courtOwner.timeslotPriceRestricted'));
      return;
    }

    // If it's not a placeholder and has an ID, just update it directly
    if (!timeslot.isPlaceholder && timeslot.id) {
      await courtService.updateTimeslot(courtId.value, timeslot.id, {
        price: newPrice
      });

      toast.success(t('courtOwner.timeslotUpdated'));

      // Refresh timeslots while preserving scroll position
      fetchTimeslots(true);
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

    // Refresh timeslots while preserving scroll position
    fetchTimeslots(true);
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.timeslotUpdateError'));
  }
};

// Save current scroll position
const saveScrollPosition = () => {
  savedScrollPosition.value = window.scrollY;
};

// Restore saved scroll position
const restoreScrollPosition = () => {
  setTimeout(() => {
    window.scrollTo({
      top: savedScrollPosition.value,
      behavior: 'auto'
    });
  }, 100); // Small delay to ensure DOM has updated
};

// Fetch court timeslots for the selected date
const fetchTimeslots = async (preserveScroll = false) => {
  if (preserveScroll) {
    saveScrollPosition();
  }

  loading.value = true;

  try {
    // Get timeslots for the selected date
    const response = await courtService.getTimeslotsByDate(courtId.value, selectedDate.value);
    timeslots.value = response.timeslots;
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.timeslotsFetchError'));
  } finally {
    loading.value = false;

    if (preserveScroll) {
      restoreScrollPosition();
    }
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
          <div class="timeslots-info">
            <div class="timeslots-info-icon">
              <i class="pi pi-info-circle"></i>
            </div>
            <div class="timeslots-info-content">
              <h4>Quản lý khung giờ cố định</h4>
              <p>
                Các khung giờ từ 6:00 đến 23:00 được hệ thống tạo sẵn và không thể thay đổi. Với mỗi khung giờ, bạn chỉ có thể:
              </p>
              <ul>
                <li><i class="pi pi-money-bill"></i> <strong>Thay đổi giá</strong> - Cập nhật giá cho từng khung giờ</li>
                <li><i class="pi pi-check-circle"></i> <strong>Đánh dấu khả dụng</strong> - Cho phép người chơi đặt sân trong khung giờ này</li>
                <li><i class="pi pi-times-circle"></i> <strong>Đánh dấu không khả dụng</strong> - Khóa khung giờ này khi sân đang bảo trì hoặc không thể sử dụng</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Fixed Timeslots Grid -->
        <div class="fixed-timeslots-grid">
          <BaseCard
            v-for="timeslot in mappedTimeslots"
            :key="`${timeslot.day_of_week}-${timeslot.start_time}`"
            :class="['timeslot-card', {
              'timeslot-card--placeholder': timeslot.isPlaceholder,
              'timeslot-card--restricted': isTimeslotRestricted(selectedDate.value)
            }]"
          >
            <!-- Fixed Time Header -->
            <div class="timeslot-time">
              <i class="pi pi-clock"></i>
              <span>{{ timeslot.displayTime }}</span>
              <div class="fixed-badge">
                <i class="pi pi-lock"></i>
                <span>Cố định</span>
              </div>
            </div>

            <!-- Price Section -->
            <div class="timeslot-price">
              <div class="price-header">
                <i class="pi pi-money-bill"></i>
                <span class="price-label">Giá:</span>
                <span class="price-value">{{ formatPrice(timeslot.price) }}</span>

                <!-- Restriction indicator -->
                <BaseTooltip v-if="isTimeslotRestricted(selectedDate.value)" class="restriction-indicator">
                  <template #trigger>
                    <i class="pi pi-exclamation-triangle"></i>
                  </template>
                  <template #content>
                    <div>{{ t('courtOwner.timeslotPriceRestrictedTooltip') }}</div>
                  </template>
                </BaseTooltip>
              </div>

              <!-- Quick Price Buttons -->
              <div class="quick-price-buttons">
                <button
                  v-for="quickPrice in [100000, 150000, 200000, 250000]"
                  :key="quickPrice"
                  class="quick-price-button"
                  @click="quickUpdatePrice(timeslot, quickPrice)"
                  :class="{
                    'active': timeslot.price === quickPrice,
                    'disabled': isTimeslotRestricted(selectedDate.value)
                  }"
                  :disabled="isTimeslotRestricted(selectedDate.value)"
                >
                  {{ formatPrice(quickPrice) }}
                </button>
              </div>
            </div>

            <!-- Availability Status -->
            <div class="timeslot-status">
              <div class="status-header">
                <i class="pi pi-check-circle" v-if="timeslot.is_available"></i>
                <i class="pi pi-times-circle" v-else></i>
                <span class="status-label">Trạng thái:</span>
                <span :class="['status-badge', timeslot.is_available ? 'available' : 'unavailable']">
                  {{ timeslot.is_available ? t('courts.available') : t('courts.unavailable') }}
                </span>
              </div>

              <!-- Toggle Availability Button -->
              <button
                class="toggle-availability-button"
                @click="toggleAvailability(timeslot)"
                :class="{ 'available': timeslot.is_available, 'unavailable': !timeslot.is_available }"
              >
                {{ timeslot.is_available ? 'Đánh dấu không khả dụng' : 'Đánh dấu khả dụng' }}
                <i :class="`pi ${timeslot.is_available ? 'pi-eye-slash' : 'pi-eye'}`"></i>
              </button>
            </div>

            <!-- Edit Button -->
            <div class="timeslot-actions">
              <button
                class="edit-button"
                @click="openTimeslotModal(timeslot)"
                :class="{ 'edit-button--restricted': isTimeslotRestricted(selectedDate.value) }"
              >
                <i class="pi pi-pencil"></i>
                <span>{{ isTimeslotRestricted(selectedDate.value) ? 'Chỉnh sửa trạng thái' : 'Chỉnh sửa giá & trạng thái' }}</span>
              </button>
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
        <div class="timeslot-info">
          <div class="timeslot-info-item">
            <span class="info-label">{{ t('courtOwner.dayOfWeek') }}:</span>
            <span class="info-value">{{ dayOptions.find(d => d.value === dayOfWeek)?.label }}</span>
          </div>
          <div class="timeslot-info-item">
            <span class="info-label">{{ t('courtOwner.time') }}:</span>
            <span class="info-value">{{ formatTime(startTime) }} - {{ formatTime(endTime) }}</span>
          </div>

          <!-- Hidden inputs to maintain the values -->
          <input type="hidden" v-model="dayOfWeek" />
          <input type="hidden" v-model="startTime" />
          <input type="hidden" v-model="endTime" />
        </div>

        <BaseAlert
          v-if="isTimeslotRestricted(selectedDate.value)"
          type="warning"
          :message="t('courtOwner.timeslotPriceRestrictedAlert')"
        />
        <BaseAlert
          v-else
          type="info"
          message="Khung giờ cố định không thể thay đổi. Bạn chỉ có thể điều chỉnh giá và trạng thái khả dụng."
        />

        <div class="form-group price-input">
          <BaseInput
            :modelValue="price"
            @update:modelValue="price = $event"
            type="number"
            :label="t('courts.price')"
            :placeholder="t('courtOwner.pricePlaceholder')"
            min="0"
            step="10000"
            :disabled="isTimeslotRestricted(selectedDate.value)"
          />

          <div class="quick-price-suggestions">
            <span class="suggestions-label">Giá đề xuất:</span>
            <div class="quick-price-buttons">
              <button
                v-for="quickPrice in [100000, 150000, 200000, 250000]"
                :key="quickPrice"
                class="quick-price-button"
                @click="price = quickPrice"
                :class="{
                  'active': price === quickPrice,
                  'disabled': isTimeslotRestricted(selectedDate.value)
                }"
                :disabled="isTimeslotRestricted(selectedDate.value)"
              >
                {{ formatPrice(quickPrice) }}
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <div class="availability-toggle">
            <span class="toggle-label">{{ t('courtOwner.timeslotAvailable') }}</span>
            <label class="switch">
              <input
                type="checkbox"
                :checked="isAvailable"
                @change="isAvailable = ($event.target as HTMLInputElement).checked"
              />
              <span class="slider round"></span>
            </label>
            <span class="toggle-status">{{ isAvailable ? t('courts.available') : t('courts.unavailable') }}</span>
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
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--light-gray);
    padding-bottom: 1rem;

    .section-title {
      margin-bottom: 1rem;
    }

    .timeslots-info {
      display: flex;
      background-color: #e8f5e9;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;

      .timeslots-info-icon {
        flex-shrink: 0;
        margin-right: 1rem;

        i {
          font-size: 2rem;
          color: #4caf50;
        }
      }

      .timeslots-info-content {
        h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          color: #2e7d32;
        }

        p {
          margin: 0 0 0.75rem 0;
          color: #333;
        }

        ul {
          margin: 0;
          padding-left: 1.5rem;

          li {
            margin-bottom: 0.5rem;

            i {
              color: #4caf50;
              margin-right: 0.5rem;
            }

            strong {
              color: #2e7d32;
            }
          }
        }
      }
    }
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
  padding: 1.25rem;
  transition: all 0.2s ease;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  &--placeholder {
    background-color: rgba(0, 0, 0, 0.02);
    border: 1px dashed var(--medium-gray);
  }

  &--restricted {
    .price-header {
      position: relative;

      .restriction-indicator {
        margin-left: 0.5rem;

        i {
          color: #f57c00;
          font-size: 1rem;
        }
      }
    }
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
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--light-gray);
    position: relative;

    i {
      color: var(--primary-color);
    }

    .fixed-badge {
      position: absolute;
      right: 0;
      top: 0;
      background-color: #f1f1f1;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;

      i {
        color: #666;
        font-size: 0.7rem;
      }

      span {
        font-size: 0.75rem;
        font-weight: 500;
        color: #666;
      }
    }
  }

  .timeslot-price {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--light-gray);

    .price-header {
      display: flex;
      align-items: center;

      i {
        color: #4caf50;
        margin-right: 0.5rem;
      }

      .price-label {
        font-weight: 500;
        margin-right: 0.5rem;
        color: #666;
      }

      .price-value {
        font-weight: 600;
        font-size: 1.1rem;
        color: #333;
      }
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
        padding: 0.35rem 0.75rem;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: var(--primary-color);
          color: white;
        }

        &.active {
          background-color: var(--primary-color);
          color: white;
        }

        &.disabled {
          opacity: 0.6;
          cursor: not-allowed;

          &:hover {
            background-color: var(--light-gray);
            color: inherit;
          }
        }
      }
    }
  }

  .timeslot-status {
    margin-bottom: 1.25rem;

    .status-header {
      display: flex;
      align-items: center;
      margin-bottom: 0.75rem;

      i {
        margin-right: 0.5rem;

        &.pi-check-circle {
          color: #4caf50;
        }

        &.pi-times-circle {
          color: #f44336;
        }
      }

      .status-label {
        font-weight: 500;
        margin-right: 0.5rem;
        color: #666;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
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

    .toggle-availability-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;

      &.available {
        background-color: rgba(244, 67, 54, 0.1);
        color: #c62828;

        &:hover {
          background-color: rgba(244, 67, 54, 0.2);
        }
      }

      &.unavailable {
        background-color: rgba(76, 175, 80, 0.1);
        color: #2e7d32;

        &:hover {
          background-color: rgba(76, 175, 80, 0.2);
        }
      }
    }
  }

  .timeslot-actions {
    display: flex;
    margin-top: auto;

    .edit-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.75rem;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: #0056b3; /* Darker blue for better contrast */
        color: white; /* Ensure text remains white on hover */
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); /* Add shadow for better visual feedback */
      }

      &--restricted {
        background-color: #5c6bc0; /* Different color to indicate restricted functionality */

        &:hover {
          background-color: #3f51b5;
        }
      }

      i {
        font-size: 0.9rem;
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

    &.price-input {
      margin-top: 1.5rem;
    }
  }

  .timeslot-info {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;

    .timeslot-info-item {
      display: flex;
      margin-bottom: 0.5rem;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        width: 120px;
        font-weight: 500;
        color: #666;
      }

      .info-value {
        font-weight: 600;
        color: #333;
      }
    }
  }

  .quick-price-suggestions {
    margin-top: 1rem;

    .suggestions-label {
      display: block;
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .quick-price-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;

      .quick-price-button {
        background-color: var(--light-gray);
        border: none;
        border-radius: 4px;
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: var(--primary-color);
          color: white;
        }

        &.active {
          background-color: var(--primary-color);
          color: white;
        }
      }
    }
  }

  .availability-toggle {
    display: flex;
    align-items: center;
    gap: 1rem;

    .toggle-label {
      font-weight: 500;
    }

    .toggle-status {
      font-weight: 500;

      &.available {
        color: #2e7d32;
      }

      &.unavailable {
        color: #c62828;
      }
    }

    /* Toggle Switch Styles */
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;

      input {
        opacity: 0;
        width: 0;
        height: 0;

        &:checked + .slider {
          background-color: #4caf50;
        }

        &:checked + .slider:before {
          transform: translateX(26px);
        }
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;

        &:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }

        &.round {
          border-radius: 24px;

          &:before {
            border-radius: 50%;
          }
        }
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

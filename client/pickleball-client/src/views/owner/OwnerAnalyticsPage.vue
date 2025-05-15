<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCourtStore } from '../../store/court';
import { useBookingStore } from '../../store/booking';
import { useToast } from '../../composables/useToast';
import BaseLayout from '../../components/layout/BaseLayout.vue';
import BaseCard from '../../components/base/BaseCard.vue';
import BaseSpinner from '../../components/base/BaseSpinner.vue';
import BaseSelect from '../../components/base/BaseSelect.vue';

const { t } = useI18n();
const courtStore = useCourtStore();
const bookingStore = useBookingStore();
const toast = useToast();

// State
const selectedCourt = ref<number | null>(null);
const selectedPeriod = ref('month');
const loading = ref(false);

// Computed properties
const courts = computed(() => courtStore.courts);
const bookings = computed(() => bookingStore.bookings);

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

// Period options
const periodOptions = [
  { value: 'week', label: t('analytics.lastWeek') },
  { value: 'month', label: t('analytics.lastMonth') },
  { value: 'quarter', label: t('analytics.lastQuarter') },
  { value: 'year', label: t('analytics.lastYear') }
];

// Filtered bookings
const filteredBookings = computed(() => {
  let filtered = [...bookings.value];

  // Filter by court
  if (selectedCourt.value) {
    filtered = filtered.filter(booking => booking.court_id === selectedCourt.value);
  }

  // Filter by period
  const now = new Date();
  let startDate = new Date();

  switch (selectedPeriod.value) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  filtered = filtered.filter(booking => new Date(booking.created_at) >= startDate);

  return filtered;
});

// Analytics data
const totalBookings = computed(() => filteredBookings.value.length);

const totalRevenue = computed(() => {
  return filteredBookings.value.reduce((sum, booking) => sum + booking.total_price, 0);
});

const completedBookings = computed(() => {
  return filteredBookings.value.filter(booking => booking.status === 'completed').length;
});

const cancelledBookings = computed(() => {
  return filteredBookings.value.filter(booking => booking.status === 'cancelled').length;
});

const bookingsByStatus = computed(() => {
  const statusCounts = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0
  };

  filteredBookings.value.forEach(booking => {
    statusCounts[booking.status as keyof typeof statusCounts]++;
  });

  return statusCounts;
});

const bookingsByDay = computed(() => {
  const dayCounts = {
    0: 0, // Sunday
    1: 0, // Monday
    2: 0, // Tuesday
    3: 0, // Wednesday
    4: 0, // Thursday
    5: 0, // Friday
    6: 0  // Saturday
  };

  filteredBookings.value.forEach(booking => {
    const day = new Date(booking.start_time).getDay();
    dayCounts[day as keyof typeof dayCounts]++;
  });

  return dayCounts;
});

const popularTimeSlots = computed(() => {
  const timeSlots: Record<string, number> = {};

  filteredBookings.value.forEach(booking => {
    const hour = new Date(booking.start_time).getHours();
    const timeSlot = `${hour}:00 - ${hour + 1}:00`;

    if (timeSlots[timeSlot]) {
      timeSlots[timeSlot]++;
    } else {
      timeSlots[timeSlot] = 1;
    }
  });

  // Sort by popularity
  return Object.entries(timeSlots)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([timeSlot, count]) => ({ timeSlot, count }));
});

// Format currency
const formatCurrency = (value: number) => {
  return `$${value.toFixed(2)}`;
};

// Get day name
const getDayName = (day: number) => {
  const days = [
    t('common.sunday'),
    t('common.monday'),
    t('common.tuesday'),
    t('common.wednesday'),
    t('common.thursday'),
    t('common.friday'),
    t('common.saturday')
  ];

  return days[day];
};

// Fetch courts and bookings on mount
onMounted(async () => {
  loading.value = true;

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
    console.error('Error loading analytics data:', error);
    toast.error(typeof error === 'string' ? error : t('courtOwner.fetchError'));
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <BaseLayout :title="t('courtOwner.analytics')">
    <!-- Filters -->
    <div class="analytics-filters">
      <div class="filter-group">
        <BaseSelect
          v-model="selectedCourt"
          :options="courtOptions"
          :placeholder="t('courtOwner.selectCourt')"
        />
      </div>

      <div class="filter-group">
        <BaseSelect
          v-model="selectedPeriod"
          :options="periodOptions"
          :placeholder="t('analytics.selectPeriod')"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="analytics-loading">
      <BaseSpinner />
    </div>

    <!-- Analytics Content -->
    <div v-else class="analytics-content">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <BaseCard class="summary-card">
          <div class="summary-icon">
            <i class="pi pi-calendar-check"></i>
          </div>

          <div class="summary-data">
            <div class="summary-value">{{ totalBookings }}</div>
            <div class="summary-label">{{ t('analytics.totalBookings') }}</div>
          </div>
        </BaseCard>

        <BaseCard class="summary-card">
          <div class="summary-icon">
            <i class="pi pi-dollar"></i>
          </div>

          <div class="summary-data">
            <div class="summary-value">{{ formatCurrency(totalRevenue) }}</div>
            <div class="summary-label">{{ t('analytics.totalRevenue') }}</div>
          </div>
        </BaseCard>

        <BaseCard class="summary-card">
          <div class="summary-icon">
            <i class="pi pi-check-circle"></i>
          </div>

          <div class="summary-data">
            <div class="summary-value">{{ completedBookings }}</div>
            <div class="summary-label">{{ t('analytics.completedBookings') }}</div>
          </div>
        </BaseCard>

        <BaseCard class="summary-card">
          <div class="summary-icon">
            <i class="pi pi-times-circle"></i>
          </div>

          <div class="summary-data">
            <div class="summary-value">{{ cancelledBookings }}</div>
            <div class="summary-label">{{ t('analytics.cancelledBookings') }}</div>
          </div>
        </BaseCard>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Bookings by Status -->
        <BaseCard class="chart-card">
          <template #header>
            <h3 class="chart-title">{{ t('analytics.bookingsByStatus') }}</h3>
          </template>

          <div class="status-chart">
            <div
              v-for="(count, status) in bookingsByStatus"
              :key="status"
              class="status-bar"
            >
              <div class="status-label">{{ t(`booking.${status}`) }}</div>
              <div class="bar-container">
                <div
                  class="bar"
                  :class="`status-${status}`"
                  :style="{ width: `${totalBookings > 0 ? (count / totalBookings) * 100 : 0}%` }"
                ></div>
                <div class="bar-value">{{ count }}</div>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Bookings by Day -->
        <BaseCard class="chart-card">
          <template #header>
            <h3 class="chart-title">{{ t('analytics.bookingsByDay') }}</h3>
          </template>

          <div class="day-chart">
            <div
              v-for="day in [0, 1, 2, 3, 4, 5, 6]"
              :key="day"
              class="day-bar"
            >
              <div class="day-label">{{ getDayName(day) }}</div>
              <div class="bar-container">
                <div
                  class="bar"
                  :style="{
                    width: `${Math.max(...Object.values(bookingsByDay)) > 0 ?
                      (bookingsByDay[day] / Math.max(...Object.values(bookingsByDay))) * 100 : 0}%`
                  }"
                ></div>
                <div class="bar-value">{{ bookingsByDay[day] }}</div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Additional Analytics -->
      <div class="additional-analytics">
        <!-- Popular Time Slots -->
        <BaseCard class="analytics-card">
          <template #header>
            <h3 class="chart-title">{{ t('analytics.popularTimeSlots') }}</h3>
          </template>

          <div class="popular-times">
            <div
              v-for="(item, index) in popularTimeSlots"
              :key="index"
              class="popular-time-item"
            >
              <div class="time-slot">{{ item.timeSlot }}</div>
              <div class="time-count">{{ item.count }} {{ t('analytics.bookings') }}</div>
              <div class="popularity-bar">
                <div
                  class="bar"
                  :style="{
                    width: `${popularTimeSlots.length > 0 && popularTimeSlots[0].count > 0 ?
                      (item.count / popularTimeSlots[0].count) * 100 : 0}%`
                  }"
                ></div>
              </div>
            </div>

            <div v-if="popularTimeSlots.length === 0" class="no-data">
              {{ t('analytics.noDataAvailable') }}
            </div>
          </div>
        </BaseCard>

        <!-- Revenue Trends -->
        <BaseCard class="analytics-card">
          <template #header>
            <h3 class="chart-title">{{ t('analytics.revenueTrends') }}</h3>
          </template>

          <div class="revenue-trends">
            <div class="trend-placeholder">
              <i class="pi pi-chart-line"></i>
              <p>{{ t('analytics.revenueChartPlaceholder') }}</p>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </BaseLayout>
</template>

<style scoped lang="scss">
.analytics-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .filter-group {
    width: 250px;
  }
}

.analytics-loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;

  .summary-card {
    display: flex;
    align-items: center;
    padding: 1.5rem;

    .summary-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: rgba(76, 175, 80, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;

      i {
        font-size: 1.5rem;
        color: var(--primary-color);
      }
    }

    .summary-data {
      .summary-value {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
      }

      .summary-label {
        font-size: 0.875rem;
        color: var(--dark-gray);
      }
    }

    &:nth-child(2) {
      .summary-icon {
        background-color: rgba(33, 150, 243, 0.1);

        i {
          color: #2196f3;
        }
      }
    }

    &:nth-child(3) {
      .summary-icon {
        background-color: rgba(76, 175, 80, 0.1);

        i {
          color: #4caf50;
        }
      }
    }

    &:nth-child(4) {
      .summary-icon {
        background-color: rgba(244, 67, 54, 0.1);

        i {
          color: #f44336;
        }
      }
    }
  }
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  .chart-card {
    .chart-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }
  }
}

.status-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .status-bar {
    .status-label {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .bar-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .bar {
        height: 24px;
        border-radius: 4px;
        min-width: 20px;
        transition: width 0.3s ease;

        &.status-pending {
          background-color: #ff9800;
        }

        &.status-confirmed {
          background-color: #4caf50;
        }

        &.status-cancelled {
          background-color: #f44336;
        }

        &.status-completed {
          background-color: #2196f3;
        }
      }

      .bar-value {
        font-weight: 500;
      }
    }
  }
}

.day-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .day-bar {
    .day-label {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .bar-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .bar {
        height: 24px;
        background-color: var(--primary-color);
        border-radius: 4px;
        min-width: 20px;
        transition: width 0.3s ease;
      }

      .bar-value {
        font-weight: 500;
      }
    }
  }
}

.additional-analytics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  .analytics-card {
    .chart-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }
  }
}

.popular-times {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .popular-time-item {
    .time-slot {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .time-count {
      font-size: 0.875rem;
      color: var(--dark-gray);
      margin-bottom: 0.5rem;
    }

    .popularity-bar {
      .bar {
        height: 8px;
        background-color: var(--primary-color);
        border-radius: 4px;
        transition: width 0.3s ease;
      }
    }
  }

  .no-data {
    padding: 2rem 0;
    text-align: center;
    color: var(--dark-gray);
  }
}

.revenue-trends {
  .trend-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;

    i {
      font-size: 3rem;
      color: var(--light-gray);
      margin-bottom: 1rem;
    }

    p {
      color: var(--dark-gray);
      text-align: center;
    }
  }
}

@media (max-width: 992px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-section,
  .additional-analytics {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .analytics-filters {
    flex-direction: column;

    .filter-group {
      width: 100%;
    }
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useCourtStore } from '../store/court';
import { useAuthStore } from '../store/auth';
import BaseLayout from '../components/layout/BaseLayout.vue';
import BaseButton from '../components/base/BaseButton.vue';
import BaseSpinner from '../components/base/BaseSpinner.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseAlert from '../components/base/BaseAlert.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const courtStore = useCourtStore();
const authStore = useAuthStore();

const courtId = computed(() => Number(route.params.id));
const court = computed(() => courtStore.currentCourt);
const loading = computed(() => courtStore.loading);
const error = computed(() => courtStore.error);

const selectedDate = ref(new Date());
const availability = ref<any[]>([]);
const availabilityLoading = ref(false);
const selectedTimeSlot = ref<any>(null);

// Format date for API request
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// Get court availability for selected date
const getAvailability = async () => {
  if (!courtId.value) return;

  availabilityLoading.value = true;
  try {
    const formattedDate = formatDate(selectedDate.value);
    availability.value = await courtStore.getCourtAvailability(courtId.value, formattedDate);
  } catch (err) {
    console.error('Error fetching availability:', err);
  } finally {
    availabilityLoading.value = false;
  }
};

// Select time slot
const selectTimeSlot = (timeSlot: any) => {
  if (timeSlot.available) {
    selectedTimeSlot.value = timeSlot;
  }
};

// Proceed to booking
const proceedToBooking = () => {
  if (!selectedTimeSlot.value) return;

  if (!authStore.isAuthenticated) {
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    });
    return;
  }

  router.push({
    path: `/courts/${courtId.value}/book`,
    query: {
      date: formatDate(selectedDate.value),
      start_time: selectedTimeSlot.value.start_time,
      end_time: selectedTimeSlot.value.end_time
    }
  });
};

// Format time
const formatTime = (timeString: string) => {
  const date = new Date(`2000-01-01T${timeString}`);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Get court image with proper URL
const getCourtImage = (court: any) => {
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

// Change date
const changeDate = (days: number) => {
  const newDate = new Date(selectedDate.value);
  newDate.setDate(newDate.getDate() + days);
  selectedDate.value = newDate;
};

// Format date for display
const formattedDate = computed(() => {
  return selectedDate.value.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Check if date is today
const isToday = computed(() => {
  const today = new Date();
  return selectedDate.value.toDateString() === today.toDateString();
});

// Format phone number to more readable format (e.g., 0912 345 678)
const formatPhoneNumber = (phone) => {
  if (!phone) return '';

  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    // For 10-digit numbers (most Vietnamese numbers)
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 11) {
    // For 11-digit numbers
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else {
    // For other lengths, just add spaces every 3 digits
    return cleaned.replace(/(\d{4})(\d{3})(\d+)/, '$1 $2 $3');
  }
};

// Fetch court details and availability on mount
onMounted(async () => {
  if (!courtId.value) return;

  try {
    await courtStore.getCourtById(courtId.value);
    await getAvailability();
  } catch (err) {
    console.error('Error fetching court details:', err);
  }
});

// Watch for date changes
watch(selectedDate, () => {
  selectedTimeSlot.value = null;
  getAvailability();
});
</script>

<template>
  <BaseLayout
    :loading="loading"
    :back-link="'/courts'"
  >
    <template v-if="court">
      <div class="court-detail">
        <!-- Court Header -->
        <div class="court-header">
          <div class="court-image-container">
            <img
              :src="getCourtImage(court)"
              :alt="court.name"
              class="court-image"
            />
          </div>

          <div class="court-info">
            <h1 class="court-name">{{ court.name }}</h1>

            <div class="court-meta">
              <div class="meta-item">
                <i class="pi pi-map-marker"></i>
                <span>{{ court.location }}</span>
              </div>

              <div class="meta-item">
                <i class="pi pi-users"></i>
                <span>{{ t(`common.${court.skill_level}`) }}</span>
              </div>

              <div class="meta-item">
                <i class="pi pi-dollar"></i>
                <span v-if="court.price_display">{{ court.price_display }}</span>
                <span v-else>{{ court.hourly_rate.toLocaleString() }} VNĐ {{ t('courts.perHour') }}</span>
              </div>
            </div>

            <p v-if="court.description" class="court-description">
              {{ court.description }}
            </p>

            <div class="court-actions">
              <BaseButton
                :label="t('courts.bookNow')"
                variant="primary"
                size="large"
                icon="pi-calendar-plus"
                @click="proceedToBooking"
                :disabled="!selectedTimeSlot"
                class="book-button"
              />
            </div>
          </div>
        </div>

        <!-- Court Availability -->
        <div class="court-availability">
          <h2 class="section-title">{{ t('courts.availability') }}</h2>

          <div class="date-selector">
            <BaseButton
              icon="pi-chevron-left"
              variant="outline"
              @click="changeDate(-1)"
              :disabled="isToday"
            />

            <div class="selected-date">
              <span class="date-label">{{ formattedDate }}</span>
            </div>

            <BaseButton
              icon="pi-chevron-right"
              variant="outline"
              @click="changeDate(1)"
            />
          </div>

          <div v-if="availabilityLoading" class="availability-loading">
            <BaseSpinner size="small" />
          </div>

          <div v-else-if="availability.length === 0" class="no-availability">
            <BaseAlert
              type="info"
              :message="t('courts.noAvailabilityForDate')"
            />
          </div>

          <div v-else class="time-slots">
            <div
              v-for="slot in availability"
              :key="`${slot.start_time}-${slot.end_time}`"
              class="time-slot"
              :class="{
                'time-slot--available': slot.available,
                'time-slot--unavailable': !slot.available,
                'time-slot--selected': selectedTimeSlot &&
                  selectedTimeSlot.start_time === slot.start_time &&
                  selectedTimeSlot.end_time === slot.end_time
              }"
              @click="selectTimeSlot(slot)"
            >
              <div class="time-slot__time">
                {{ formatTime(slot.start_time) }} - {{ formatTime(slot.end_time) }}
              </div>
              <div class="time-slot__status">
                <span v-if="slot.available" class="status-available">
                  {{ t('courts.available') }}
                </span>
                <span v-else class="status-unavailable">
                  {{ t('courts.unavailable') }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="selectedTimeSlot" class="selected-slot-info">
            <BaseAlert type="success">
              <template #default>
                <div class="selected-slot-content">
                  <div>
                    <strong>{{ t('booking.selectedTime') }}:</strong>
                    {{ formatTime(selectedTimeSlot.start_time) }} - {{ formatTime(selectedTimeSlot.end_time) }}
                  </div>
                  <div>
                    <strong>{{ t('booking.totalPrice') }}:</strong>
                    {{ selectedTimeSlot.price.toLocaleString() }} VNĐ
                  </div>
                </div>
              </template>
            </BaseAlert>
          </div>
        </div>

        <!-- Court Details -->
        <div class="court-details">
          <div class="details-section">
            <h2 class="section-title">{{ t('courts.amenities') }}</h2>
            <ul class="amenities-list">
              <li class="amenity-item">
                <i class="pi pi-check"></i>
                <span>{{ t('amenities.parking') }}</span>
              </li>
              <li class="amenity-item">
                <i class="pi pi-check"></i>
                <span>{{ t('amenities.restrooms') }}</span>
              </li>
              <li class="amenity-item">
                <i class="pi pi-check"></i>
                <span>{{ t('amenities.waterFountain') }}</span>
              </li>
              <li class="amenity-item">
                <i class="pi pi-check"></i>
                <span>{{ t('amenities.lighting') }}</span>
              </li>
            </ul>
          </div>

          <div class="details-section">
            <h2 class="section-title">{{ t('courts.location') }}</h2>
            <div class="location-map">
              <!-- Map placeholder - would be replaced with actual map component -->
              <div class="map-placeholder">
                <i class="pi pi-map"></i>
                <span>{{ t('courts.mapPlaceholder') }}</span>
              </div>

              <div class="location-address">
                <i class="pi pi-map-marker"></i>
                <span>{{ court.location }}</span>
              </div>

              <div v-if="court.district_name" class="location-district">
                <i class="pi pi-map"></i>
                <span>{{ court.district_name }}</span>
              </div>
              <div v-else-if="court.district" class="location-district">
                <i class="pi pi-map"></i>
                <span>{{ court.district }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="contact-information">
          <h2 class="section-title">Thông tin liên hệ</h2>
          <div class="contact-card">
            <div class="contact-header">
              <i class="pi pi-id-card contact-header-icon"></i>
              <h3>Thông tin chủ sân</h3>
            </div>

            <div class="contact-details">
              <div v-if="court.owner_name" class="contact-item">
                <i class="pi pi-user contact-icon"></i>
                <div>
                  <span class="contact-label">Chủ sân</span>
                  <span class="contact-value">{{ court.owner_name }}</span>
                </div>
              </div>

              <div class="contact-item">
                <i class="pi pi-phone contact-icon"></i>
                <div>
                  <span class="contact-label">Điện thoại</span>
                  <a
                    v-if="court.owner_phone"
                    :href="`tel:${court.owner_phone}`"
                    class="contact-value phone-link"
                  >
                    {{ formatPhoneNumber(court.owner_phone) }}
                  </a>
                  <span v-else class="contact-value text-muted">Chưa cập nhật</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Similar Courts -->
        <div v-if="courtStore.courts.length > 1" class="similar-courts">
          <h2 class="section-title">{{ t('courts.similarCourts') }}</h2>

          <div class="similar-courts-grid">
            <BaseCard
              v-for="similarCourt in courtStore.courts.filter(c => c.id !== court.id).slice(0, 3)"
              :key="similarCourt.id"
              :image="getCourtImage(similarCourt)"
              :image-alt="similarCourt.name"
              hoverable
              class="similar-court-card"
              @click="router.push(`/courts/${similarCourt.id}`)"
            >
              <template #header>
                <h3 class="court-name">{{ similarCourt.name }}</h3>
                <p class="court-location">
                  <i class="pi pi-map-marker"></i> {{ similarCourt.location }}
                </p>
              </template>

              <div class="court-price">
                <span class="price-value" v-if="similarCourt.price_display">{{ similarCourt.price_display }}</span>
                <span class="price-value" v-else>{{ similarCourt.hourly_rate.toLocaleString() }} VNĐ</span>
                <span class="price-unit">{{ t('courts.perHour') }}</span>
              </div>

              <template #footer>
                <BaseButton
                  :label="t('courts.viewDetails')"
                  variant="outline"
                  full-width
                />
              </template>
            </BaseCard>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="error">
      <BaseAlert
        type="error"
        :title="t('errors.error')"
        :message="error"
      />

      <div class="error-actions">
        <BaseButton
          :label="t('common.back')"
          variant="outline"
          @click="router.push('/courts')"
        />
      </div>
    </template>
  </BaseLayout>
</template>

<style scoped lang="scss">
.court-detail {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.court-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  .court-image-container {
    border-radius: 8px;
    overflow: hidden;
    height: 400px;

    .court-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .court-info {
    display: flex;
    flex-direction: column;

    .court-name {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .court-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 1.5rem;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--dark-gray);

        i {
          color: var(--primary-color);
        }
      }
    }

    .court-description {
      margin-bottom: 2rem;
      line-height: 1.6;
      color: var(--text-color);
    }

    .court-actions {
      margin-top: auto;
      display: flex;

      .book-button {
        flex: 1;
      }
    }
  }
}

.court-availability {
  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .date-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;

    .selected-date {
      flex: 1;
      text-align: center;
      font-weight: 500;
      font-size: 1.125rem;
    }
  }

  .availability-loading,
  .no-availability {
    display: flex;
    justify-content: center;
    padding: 2rem 0;
  }

  .time-slots {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;

    .time-slot {
      border: 1px solid var(--medium-gray);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all 0.2s ease;

      &--available {
        cursor: pointer;

        &:hover {
          border-color: var(--primary-color);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }

      &--unavailable {
        opacity: 0.6;
        background-color: var(--light-gray);
      }

      &--selected {
        border-color: var(--primary-color);
        background-color: rgba(76, 175, 80, 0.1);
      }

      &__time {
        font-weight: 500;
      }

      &__status {
        font-size: 0.875rem;

        .status-available {
          color: var(--primary-color);
        }

        .status-unavailable {
          color: var(--dark-gray);
        }
      }
    }
  }

  .selected-slot-info {
    margin-top: 1.5rem;

    .selected-slot-content {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
  }
}

.court-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  .details-section {
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
  }

  .amenities-list {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    .amenity-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        color: var(--primary-color);
      }
    }
  }

  .location-map {
    .map-placeholder {
      height: 200px;
      background-color: var(--light-gray);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--dark-gray);
      margin-bottom: 1rem;

      i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }
    }

    .location-address,
    .location-district {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;

      i {
        color: var(--primary-color);
      }
    }

    .location-district {
      i {
        color: #4caf50;
      }
    }
  }
}

.contact-information {
  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .contact-card {
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    .contact-header {
      background-color: rgba(30, 144, 255, 0.1);
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid rgba(10, 35, 66, 0.05);

      .contact-header-icon {
        color: var(--primary-color);
        font-size: 1.5rem;
      }

      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary-color);
      }
    }

    .contact-details {
      padding: 1.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;

      .contact-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;

        .contact-icon {
          color: var(--primary-color);
          font-size: 1.25rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(30, 144, 255, 0.1);
          border-radius: 50%;
          flex-shrink: 0;
        }

        div {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .contact-label {
          font-size: 0.875rem;
          color: var(--dark-gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .contact-value {
          font-weight: 600;
          color: var(--text-color);
          font-size: 1.1rem;
        }

        .phone-link {
          color: var(--primary-color);
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;

          &:hover {
            color: #0056b3;
            text-decoration: underline;
          }

          &::after {
            content: '\e93b'; /* PrimeIcons phone icon */
            font-family: 'primeicons';
            font-size: 0.8rem;
            margin-left: 0.5rem;
            opacity: 0.7;
          }
        }

        .text-muted {
          color: var(--dark-gray);
          font-style: italic;
          font-weight: normal;
        }
      }
    }
  }
}

.similar-courts {
  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .similar-courts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
  }

  .similar-court-card {
    .court-name {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .court-location {
      font-size: 0.875rem;
      color: var(--dark-gray);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .court-price {
      margin: 1rem 0;

      .price-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary-color);
      }

      .price-unit {
        font-size: 0.875rem;
        color: var(--dark-gray);
      }
    }
  }
}

.error-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

@media (max-width: 992px) {
  .court-header {
    grid-template-columns: 1fr;

    .court-image-container {
      height: 300px;
    }
  }

  .court-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .court-detail {
    gap: 2rem;
  }

  .court-header {
    .court-info {
      .court-name {
        font-size: 1.5rem;
      }

      .court-meta {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  }

  .time-slots {
    grid-template-columns: 1fr 1fr;
  }

  .amenities-list {
    grid-template-columns: 1fr;
  }
}
</style>

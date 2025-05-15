<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useCourtStore } from '../store/court';
import { useBookingStore } from '../store/booking';
import { usePromotionService } from '../services/PromotionService';
import { useToast } from '../composables/useToast';
import BaseLayout from '../components/layout/BaseLayout.vue';
import BaseButton from '../components/base/BaseButton.vue';
import BaseInput from '../components/base/BaseInput.vue';
import BaseSelect from '../components/base/BaseSelect.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseAlert from '../components/base/BaseAlert.vue';
import BaseModal from '../components/base/BaseModal.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const courtStore = useCourtStore();
const bookingStore = useBookingStore();
const promotionService = usePromotionService();
const toast = useToast();

// Get court ID and booking parameters from route
const courtId = computed(() => Number(route.params.id));
const bookingDate = ref(route.query.date?.toString() || '');
const startTime = ref(route.query.start_time?.toString() || '');
const endTime = ref(route.query.end_time?.toString() || '');

// Booking state
const promotionCode = ref('');
const paymentMethod = ref('online_payment');
const paymentGateway = ref('vnpay');
const isPromoApplied = ref(false);
const isPromoLoading = ref(false);
const promoError = ref('');
const showPaymentModal = ref(false);

// Join Court state
const skillLevel = ref('');
const currentPlayers = ref(1);
const neededPlayers = ref(4);
const allowJoin = ref(false);

// Payment details
const isProcessingPayment = ref(false);

// Computed properties
const court = computed(() => courtStore.currentCourt);
const selectedTimeSlot = computed(() => {
  if (!startTime.value || !endTime.value) return null;

  return {
    start_time: startTime.value,
    end_time: endTime.value
  };
});

// Calculate duration in hours
const duration = computed(() => {
  if (!startTime.value || !endTime.value) return 1;

  const start = new Date(`2000-01-01T${startTime.value}`);
  const end = new Date(`2000-01-01T${endTime.value}`);

  // Calculate difference in milliseconds and convert to hours
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
});

// Calculate price based on selected timeslot
const price = computed(() => {
  if (!court.value || !selectedTimeSlot.value) return 0;

  // Find the timeslot that matches the selected time
  const timeslot = courtStore.courtTimeslots.find(ts =>
    ts.start_time === selectedTimeSlot.value?.start_time &&
    ts.end_time === selectedTimeSlot.value?.end_time
  );

  // If timeslot has a specific price, use it, otherwise use court's hourly rate
  return timeslot?.price || (court.value.hourly_rate * duration.value);
});

const subtotal = computed(() => price.value);

const discount = computed(() => {
  return bookingStore.discountAmount;
});

const total = computed(() => {
  return subtotal.value - discount.value;
});

const formattedDate = computed(() => {
  if (!bookingDate.value) return '';
  const date = new Date(bookingDate.value);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const formattedTime = computed(() => {
  if (!startTime.value || !endTime.value) return '';
  return `${formatTime(startTime.value)} - ${formatTime(endTime.value)}`;
});

const paymentMethods = computed(() => [
  { value: 'online_payment', label: t('booking.onlinePayment'), gateways: [
    { value: 'vnpay', label: 'VNPay', icon: '/images/payment/vnpay.png' },
    { value: 'momo', label: 'MoMo', icon: '/images/payment/momo.png' }
  ]},
  { value: 'bank_transfer', label: t('booking.bankTransfer'), icon: '/images/payment/Vietcombank.png' }
]);



const skillLevelOptions = computed(() => [
  { value: 'beginner', label: t('common.beginner') },
  { value: 'intermediate', label: t('common.intermediate') },
  { value: 'advanced', label: t('common.advanced') }
]);

// Format time
const formatTime = (timeString: string) => {
  const date = new Date(`2000-01-01T${timeString}`);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Apply promotion code
const applyPromotion = async () => {
  if (!promotionCode.value) {
    promoError.value = t('booking.enterPromoCode');
    return;
  }

  isPromoLoading.value = true;
  promoError.value = '';

  try {
    const response = await promotionService.verifyPromotionCode(promotionCode.value);

    if (response.valid) {
      isPromoApplied.value = true;

      // Calculate discount
      const discountPercent = response.promotion?.discount_percent || 0;
      const discountAmount = (subtotal.value * discountPercent) / 100;
      bookingStore.discountAmount = discountAmount;

      toast.success(t('booking.promoApplied'));
    } else {
      promoError.value = response.message || t('booking.invalidPromoCode');
      isPromoApplied.value = false;
      bookingStore.discountAmount = 0;
    }
  } catch (error) {
    promoError.value = typeof error === 'string' ? error : t('booking.promoError');
    isPromoApplied.value = false;
    bookingStore.discountAmount = 0;
  } finally {
    isPromoLoading.value = false;
  }
};

// Remove promotion code
const removePromotion = () => {
  promotionCode.value = '';
  isPromoApplied.value = false;
  bookingStore.discountAmount = 0;
  promoError.value = '';
};

// Create booking
const createBooking = async () => {
  if (!court.value || !bookingDate.value || !startTime.value || !endTime.value) {
    toast.error(t('booking.missingDetails'));
    return;
  }

  // Validate skill level if allow join is enabled
  if (allowJoin.value && !skillLevel.value) {
    toast.error(t('booking.skillLevelRequired'));
    return;
  }

  try {
    const bookingData = {
      court_id: courtId.value,
      start_time: `${bookingDate.value}T${startTime.value}`,
      end_time: `${bookingDate.value}T${endTime.value}`,
      promotion_code: isPromoApplied.value ? promotionCode.value : undefined,
      skill_level: allowJoin.value ? skillLevel.value : undefined,
      current_players: allowJoin.value ? currentPlayers.value : undefined,
      needed_players: allowJoin.value ? neededPlayers.value : undefined,
      allow_join: allowJoin.value
    };

    await bookingStore.createBooking(bookingData);

    // Show payment modal
    showPaymentModal.value = true;
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('booking.bookingError'));
  }
};

// Process payment
const processPayment = async () => {
  if (!bookingStore.currentBooking) {
    toast.error(t('booking.noBookingToProcess'));
    return;
  }

  // Validate payment method selection
  if (paymentMethod.value === 'online_payment' && !paymentGateway.value) {
    toast.error(t('booking.selectPaymentGateway'));
    return;
  }

  isProcessingPayment.value = true;

  try {
    const paymentData = {
      booking_id: bookingStore.currentBooking.id,
      payment_method: paymentMethod.value,
      payment_gateway: paymentMethod.value === 'online_payment' ? paymentGateway.value : undefined
    };

    // Simplified payment flow - assume payment is successful
    const payment = await bookingStore.processPayment(paymentData);

    toast.success(t('booking.paymentSuccessful'));

    // Close modal and redirect to payment success page
    showPaymentModal.value = false;
    router.push({
      path: '/payment/success',
      query: { payment_id: payment.id, booking_id: bookingStore.currentBooking.id }
    });
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('booking.paymentFailed'));
  } finally {
    isProcessingPayment.value = false;
  }
};

// Cancel booking
const cancelBooking = async () => {
  if (!bookingStore.currentBooking) return;

  try {
    // Just close the payment modal without canceling the booking in the database
    // This allows the user to stay on the current page with all their booking information intact
    showPaymentModal.value = false;
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('booking.cancelError'));
  }
};

// Fetch court details on mount
onMounted(async () => {
  if (!courtId.value) {
    router.push('/courts');
    return;
  }

  try {
    await courtStore.getCourtById(courtId.value);

    // Get timeslots for the selected date
    if (bookingDate.value) {
      await courtStore.getCourtTimeslots(courtId.value);
    }
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courts.fetchError'));
    router.push('/courts');
  }
});
</script>

<template>
  <BaseLayout
    :title="t('booking.bookCourt')"
    :back-link="`/courts/${courtId}`"
    :loading="courtStore.loading"
  >
    <template v-if="court">
      <div class="booking-page">
        <div class="booking-container">
          <!-- Booking Details -->
          <div class="booking-details">
            <BaseCard>
              <template #header>
                <h2 class="section-title">{{ t('booking.bookingDetails') }}</h2>
              </template>

              <div class="court-info">
                <h3 class="court-name">{{ court.name }}</h3>
                <p class="court-location">
                  <i class="pi pi-map-marker"></i> {{ court.location }}
                </p>
              </div>

              <div class="booking-info">
                <div class="info-item">
                  <span class="info-label">{{ t('booking.bookingDate') }}:</span>
                  <span class="info-value">{{ formattedDate }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">{{ t('booking.bookingTime') }}:</span>
                  <span class="info-value">{{ formattedTime }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">{{ t('booking.duration') }}:</span>
                  <span class="info-value">{{ duration }} {{ t('booking.hours') }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">{{ t('booking.price') }}:</span>
                  <span class="info-value">{{ formatCurrency(price) }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">{{ t('common.skillLevel') }}:</span>
                  <span class="info-value">{{ t(`common.${court.skill_level}`) }}</span>
                </div>
              </div>
            </BaseCard>
          </div>

          <!-- Find Teammates Section -->
          <div class="find-teammates-section">
            <BaseCard>
              <template #header>
                <h2 class="section-title">{{ t('booking.findTeammates') }}</h2>
              </template>

              <div class="find-teammates-form">
                <div class="find-teammates-toggle">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="allowJoin" />
                    <span class="toggle-text">{{ t('booking.allowJoin') }}</span>
                  </label>
                </div>

                <div v-if="allowJoin" class="find-teammates-options">
                  <div class="form-group">
                    <label>{{ t('booking.skillLevel') }}</label>
                    <BaseSelect
                      v-model="skillLevel"
                      :options="skillLevelOptions"
                      :placeholder="t('booking.selectSkillLevel')"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label>{{ t('booking.currentPlayers') }}</label>
                    <div class="number-input">
                      <button
                        type="button"
                        class="number-btn"
                        @click="currentPlayers = Math.max(1, currentPlayers - 1)"
                        :disabled="currentPlayers <= 1"
                      >
                        <i class="pi pi-minus"></i>
                      </button>
                      <span class="number-value">{{ currentPlayers }}</span>
                      <button
                        type="button"
                        class="number-btn"
                        @click="currentPlayers = Math.min(neededPlayers - 1, currentPlayers + 1)"
                        :disabled="currentPlayers >= neededPlayers - 1"
                      >
                        <i class="pi pi-plus"></i>
                      </button>
                    </div>
                  </div>

                  <div class="form-group">
                    <label>{{ t('booking.neededPlayers') }}</label>
                    <div class="number-input">
                      <button
                        type="button"
                        class="number-btn"
                        @click="neededPlayers = Math.max(currentPlayers + 1, neededPlayers - 1)"
                        :disabled="neededPlayers <= currentPlayers + 1"
                      >
                        <i class="pi pi-minus"></i>
                      </button>
                      <span class="number-value">{{ neededPlayers }}</span>
                      <button
                        type="button"
                        class="number-btn"
                        @click="neededPlayers = Math.min(8, neededPlayers + 1)"
                        :disabled="neededPlayers >= 8"
                      >
                        <i class="pi pi-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="allowJoin" class="find-teammates-info">
                  <BaseAlert type="info">
                    {{ t('booking.findTeammatesInfo') }}
                  </BaseAlert>
                </div>
              </div>
            </BaseCard>
          </div>

          <!-- Promotion Code -->
          <div class="promotion-section">
            <BaseCard>
              <template #header>
                <h2 class="section-title">{{ t('booking.promoCode') }}</h2>
              </template>

              <div v-if="!isPromoApplied" class="promo-form">
                <div class="promo-input">
                  <BaseInput
                    v-model="promotionCode"
                    :placeholder="t('booking.enterPromoCode')"
                    :error="promoError"
                  />
                </div>

                <BaseButton
                  :label="t('booking.applyPromo')"
                  variant="secondary"
                  :loading="isPromoLoading"
                  @click="applyPromotion"
                />
              </div>

              <div v-else class="promo-applied">
                <div class="promo-badge">
                  <i class="pi pi-check-circle"></i>
                  <span>{{ promotionCode }}</span>
                </div>

                <BaseButton
                  icon="pi-times"
                  variant="text"
                  @click="removePromotion"
                />
              </div>
            </BaseCard>
          </div>

          <!-- Payment Method -->
          <!-- <div class="payment-method-section">
            <BaseCard>
              <template #header>
                <h2 class="section-title">{{ t('booking.paymentMethod') }}</h2>
              </template>

              <div class="payment-methods">
                <BaseSelect
                  v-model="paymentMethod"
                  :options="paymentMethods"
                  :label="t('booking.selectPaymentMethod')"
                />
              </div>
            </BaseCard>
          </div> -->

          <!-- Order Summary -->
          <div class="order-summary">
            <BaseCard>
              <template #header>
                <h2 class="section-title">{{ t('booking.orderSummary') }}</h2>
              </template>

              <div class="summary-items">
                <div class="summary-item">
                  <span class="item-label">{{ t('booking.subtotal') }}</span>
                  <span class="item-value">{{ formatCurrency(subtotal) }}</span>
                </div>

                <div v-if="discount > 0" class="summary-item discount">
                  <span class="item-label">{{ t('booking.discount') }}</span>
                  <span class="item-value">-{{ formatCurrency(discount) }}</span>
                </div>

                <div class="summary-item total">
                  <span class="item-label">{{ t('booking.totalPrice') }}</span>
                  <span class="item-value">{{ formatCurrency(total) }}</span>
                </div>
              </div>

              <div class="booking-actions">
                <BaseButton
                  :label="t('booking.confirmBooking')"
                  variant="primary"
                  full-width
                  size="large"
                  :loading="bookingStore.loading"
                  @click="createBooking"
                />
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </template>

    <!-- Payment Modal -->
    <BaseModal
      v-model="showPaymentModal"
      :title="t('booking.processPayment')"
      :ok-text="t('booking.payNow')"
      :cancel-text="t('common.cancel')"
      :loading="isProcessingPayment"
      @ok="processPayment"
      @cancel="cancelBooking"
    >
      <div v-if="bookingStore.currentBooking" class="payment-modal-content">
        <div class="booking-summary">
          <h3>{{ t('booking.bookingDetails') }}</h3>

          <div class="summary-info">
            <div class="info-row">
              <span class="info-label">{{ t('courts.court') }}:</span>
              <span class="info-value">{{ court?.name }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">{{ t('booking.bookingDate') }}:</span>
              <span class="info-value">{{ formattedDate }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">{{ t('booking.bookingTime') }}:</span>
              <span class="info-value">{{ formattedTime }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">{{ t('booking.totalPrice') }}:</span>
              <span class="info-value">{{ formatCurrency(total) }}</span>
            </div>
          </div>
        </div>

        <div class="payment-method-selection">
          <h3>{{ t('booking.selectPaymentMethod') }}</h3>

          <div class="payment-methods-list">
            <div
              v-for="method in paymentMethods"
              :key="method.value"
              :class="['payment-method-item', { active: paymentMethod === method.value }]"
              @click="paymentMethod = method.value"
            >
              <div class="method-icon" v-if="method.icon">
                <img :src="method.icon" :alt="method.label">
              </div>
              <div class="method-name">{{ method.label }}</div>
            </div>
          </div>

          <!-- Online Payment Gateways -->
          <div v-if="paymentMethod === 'online_payment'" class="payment-gateways">
            <h4>{{ t('booking.selectGateway') }}</h4>

            <div class="payment-gateways-list">
              <div
                v-for="gateway in paymentMethods.find(m => m.value === 'online_payment')?.gateways"
                :key="gateway.value"
                :class="['payment-gateway-item', { active: paymentGateway === gateway.value }]"
                @click="paymentGateway = gateway.value"
              >
                <div class="gateway-icon">
                  <img :src="gateway.icon" :alt="gateway.label">
                </div>
                <div class="gateway-name">{{ gateway.label }}</div>
              </div>
            </div>
          </div>

          <!-- Bank Transfer Info -->
          <div v-if="paymentMethod === 'bank_transfer'" class="bank-transfer-info">
            <BaseAlert type="info">
              <h4>{{ t('booking.bankTransferInfo') }}</h4>
              <div class="bank-details">
                <p><strong>Ngân hàng:</strong> Vietcombank</p>
                <p><strong>Số tài khoản:</strong> 1234567890</p>
                <p><strong>Tên tài khoản:</strong> Pickleball Zone</p>
                <p><strong>Nội dung chuyển khoản:</strong> PB-{{ bookingStore.currentBooking?.id }}</p>
              </div>
            </BaseAlert>
          </div>
        </div>

        <!-- <BaseAlert type="success" class="payment-note">
          Đây là phiên bản demo, thanh toán sẽ được xử lý tự động thành công khi bạn bấm "Thanh toán ngay". Không cần thông tin thẻ hoặc tài khoản thực.
        </BaseAlert> -->
      </div>
    </BaseModal>
  </BaseLayout>
</template>

<style scoped lang="scss">
.booking-page {
  display: flex;
  justify-content: center;
}

.booking-container {
  width: 100%;
  max-width: 800px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.court-info {
  margin-bottom: 1.5rem;

  .court-name {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .court-location {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--dark-gray);

    i {
      color: var(--primary-color);
    }
  }
}

.find-teammates-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.find-teammates-toggle {
  margin-bottom: 0.5rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.toggle-text {
  margin-left: 0.5rem;
  font-weight: 500;
}

.find-teammates-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.9rem;
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

.find-teammates-info {
  margin-top: 0.5rem;
}

.booking-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .info-item {
    display: flex;
    justify-content: space-between;

    .info-label {
      font-weight: 500;
    }

    .info-value {
      color: var(--dark-gray);
    }
  }
}

.promo-form {
  display: flex;
  gap: 1rem;

  .promo-input {
    flex: 1;
  }
}

.promo-applied {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .promo-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: rgba(76, 175, 80, 0.1);
    border-radius: 4px;

    i {
      color: var(--primary-color);
    }

    span {
      font-weight: 500;
    }
  }
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  .summary-item {
    display: flex;
    justify-content: space-between;

    &.discount {
      color: #f44336;
    }

    &.total {
      font-weight: 600;
      font-size: 1.125rem;
      padding-top: 0.75rem;
      margin-top: 0.75rem;
      border-top: 1px solid var(--light-gray);
    }
  }
}

.payment-modal-content {
  .booking-summary {
    margin-bottom: 1.5rem;

    h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .summary-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .info-row {
        display: flex;
        justify-content: space-between;

        .info-label {
          font-weight: 500;
        }
      }
    }
  }

  .payment-form {
    h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
  }

  .payment-method-selection {
    margin-bottom: 1.5rem;

    h3, h4 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    h4 {
      font-size: 1rem;
      margin-top: 1.5rem;
    }
  }

  .payment-methods-list {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .payment-method-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    border: 1px solid var(--light-gray);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 120px;

    &:hover {
      border-color: var(--primary-color);
      background-color: rgba(var(--primary-rgb), 0.05);
    }

    &.active {
      border-color: var(--primary-color);
      background-color: rgba(var(--primary-rgb), 0.1);
    }

    .method-icon {
      height: 40px;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;

      img {
        max-height: 100%;
        max-width: 100%;
      }
    }

    .method-name {
      font-weight: 500;
      text-align: center;
    }
  }

  .payment-gateways-list {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .payment-gateway-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    border: 1px solid var(--light-gray);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 100px;

    &:hover {
      border-color: var(--primary-color);
      background-color: rgba(var(--primary-rgb), 0.05);
    }

    &.active {
      border-color: var(--primary-color);
      background-color: rgba(var(--primary-rgb), 0.1);
    }

    .gateway-icon {
      height: 40px;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;

      img {
        max-height: 100%;
        max-width: 100%;
      }
    }

    .gateway-name {
      font-weight: 500;
      text-align: center;
    }
  }

  .bank-transfer-info {
    margin-top: 1rem;

    .bank-details {
      margin-top: 0.5rem;

      p {
        margin: 0.5rem 0;
      }
    }
  }

  .payment-note {
    margin-top: 1.5rem;
  }
}

@media (max-width: 768px) {
  .promo-form {
    flex-direction: column;
  }

  .payment-modal-content {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
}
</style>

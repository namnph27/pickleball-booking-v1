<template>
  <div class="payment-result">
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>{{ $t('common.loading') }}</p>
    </div>

    <div v-else class="result-container">
      <div v-if="success" class="success-result">
        <div class="result-header">
          <div class="result-icon success animate-success">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="confetti-animation">
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
          </div>
          <h2 class="success-title">{{ $t('payment.paymentSuccess') }}</h2>
          <p class="success-message">{{ $t('payment.paymentSuccessMessage') }}</p>
        </div>

        <div class="payment-card">
          <div class="card-header">
            <h3>{{ $t('payment.paymentDetails') }}</h3>
          </div>
          <div class="payment-details">
            <!-- <div class="detail-row">
              <div class="detail-label">{{ $t('payment.amount') }}:</div>
              <div class="detail-value highlight">{{ formatCurrency(paymentAmount) }}</div>
            </div> -->
            <div class="detail-row">
              <div class="detail-label">{{ $t('payment.method') }}:</div>
              <div class="detail-value">{{ formatPaymentMethod(payment?.payment_method, payment?.payment_gateway) }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">{{ $t('payment.transactionId') }}:</div>
              <div class="detail-value">{{ payment?.transaction_id || '-' }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">{{ $t('payment.date') }}:</div>
              <div class="detail-value">{{ formatDateTime(payment?.created_at) }}</div>
            </div>
          </div>
        </div>

        <div v-if="bookingDetails" class="booking-card">
          <div class="card-header">
            <h3>{{ $t('booking.bookingDetails') }}</h3>
            <div class="booking-id">{{ $t('payment.bookingId') }}: #{{ payment?.booking_id }}</div>
          </div>
          <div class="booking-details">
            <div class="detail-row">
              <div class="detail-icon"><i class="pi pi-map-marker"></i></div>
              <div class="detail-content">
                <div class="detail-label">{{ $t('courts.court') }}</div>
                <div class="detail-value">{{ bookingDetails.court_name }}</div>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-icon"><i class="pi pi-calendar"></i></div>
              <div class="detail-content">
                <div class="detail-label">{{ $t('booking.bookingTime') }}</div>
                <div class="detail-value booking-time">
                  <div class="booking-date">{{ formatBookingDate(bookingDetails.start_time) }}</div>
                  <div class="booking-hours">{{ formatBookingHours(bookingDetails.start_time, bookingDetails.end_time) }}</div>
                </div>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-icon"><i class="pi pi-check-circle"></i></div>
              <div class="detail-content">
                <div class="detail-label">{{ $t('booking.status') }}</div>
                <div class="detail-value status-confirmed">{{ $t('booking.confirmed') }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <Button
            :label="$t('common.backToHome')"
            icon="pi pi-home"
            class="p-button-primary home-button"
            @click="goToHome"
          />
        </div>
      </div>

      <div v-else class="error-result">
        <div class="result-header">
          <div class="result-icon error">
            <i class="pi pi-times-circle"></i>
          </div>
          <h2 class="error-title">{{ $t('payment.paymentFailed') }}</h2>
          <p class="error-message">{{ errorMessage || $t('payment.paymentFailedMessage') }}</p>
        </div>

        <div class="action-buttons">
          <Button
            :label="$t('common.backToHome')"
            icon="pi pi-home"
            class="p-button-primary home-button"
            @click="goToHome"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { usePaymentService } from '@/services/PaymentService';
import type { Payment } from '@/services/PaymentService';
import { useBookingService } from '@/services/BookingService';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const paymentService = usePaymentService();
const bookingService = useBookingService();

// State
const loading = ref(true);
const success = ref(false);
const payment = ref<Payment | null>(null);
const bookingDetails = ref<any>(null);
const errorMessage = ref('');

// Computed properties
const paymentAmount = computed(() => {
  // Always prioritize the booking's total_price if available
  if (bookingDetails.value?.total_price) {
    return bookingDetails.value.total_price;
  }
  // Fall back to payment amount if booking price is not available
  return payment.value?.amount || 0;
});

// Methods
const formatPaymentMethod = (method?: string, gateway?: string) => {
  if (method === 'online_payment' && gateway) {
    const gatewayNames: Record<string, string> = {
      momo: 'MoMo',
      vnpay: 'VNPay',
      bank_transfer: t('payment.bankTransfer')
    };

    return gatewayNames[gateway] || gateway;
  }

  const methodNames: Record<string, string> = {
    reward_points: t('payment.rewardPoints'),
    credit_card: t('payment.creditCard'),
    paypal: 'PayPal',
    bank_transfer: t('payment.bankTransfer')
  };

  return method ? methodNames[method] || method : '-';
};

// Format just the date part of the booking time
const formatBookingDate = (startTime?: string): string => {
  if (!startTime) return '-';

  const start = new Date(startTime);

  // Format the date part with weekday
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return start.toLocaleDateString('vi-VN', dateOptions);
};

// Format just the hours part of the booking time
const formatBookingHours = (startTime?: string, endTime?: string): string => {
  if (!startTime || !endTime) return '-';

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Format the time part
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };

  const startTimeStr = start.toLocaleTimeString('vi-VN', timeOptions);
  const endTimeStr = end.toLocaleTimeString('vi-VN', timeOptions);

  // Return formatted time range
  return `${startTimeStr} - ${endTimeStr}`;
};

// Navigate to home page
const goToHome = () => {
  router.push('/');
};

// Lifecycle hooks
onMounted(async () => {
  try {
    const paymentId = route.query.payment_id;
    const bookingId = route.query.booking_id;

    if (route.path.includes('/success')) {
      success.value = true;

      // First fetch booking details if booking_id is available
      if (bookingId) {
        try {
          const { booking } = await bookingService.getBookingById(Number(bookingId));
          bookingDetails.value = booking;
          console.log('Booking details:', booking);
        } catch (err) {
          console.error('Error fetching booking details:', err);
        }
      }

      // Then fetch payment details
      if (paymentId) {
        try {
          const { payment: paymentData } = await paymentService.getPaymentById(Number(paymentId));

          // Always ensure payment amount matches booking total_price if available
          if (bookingDetails.value?.total_price) {
            // Log if there's a discrepancy between payment amount and booking total_price
            if (paymentData.amount !== bookingDetails.value.total_price) {
              console.log('Payment amount discrepancy detected:');
              console.log('Payment amount:', paymentData.amount);
              console.log('Booking total_price:', bookingDetails.value.total_price);

              // Update payment amount to match booking total_price
              paymentData.amount = bookingDetails.value.total_price;
            }
          } else if (!paymentData.amount || paymentData.amount === 0) {
            console.warn('Both payment amount and booking total_price are missing or zero');
          }

          payment.value = paymentData;
          console.log('Final payment details:', payment.value);
        } catch (err) {
          console.error('Error fetching payment details:', err);
        }
      }
    } else {
      success.value = false;
      errorMessage.value = route.query.error?.toString() || '';
    }
  } catch (error: any) {
    success.value = false;
    errorMessage.value = error.message || '';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.payment-result {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: 'Roboto', sans-serif;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.result-container {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  padding: 0;
  text-align: center;
  overflow: hidden;
}

.success-result, .error-result {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-header {
  position: relative;
  width: 100%;
  padding: 40px 20px;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
  margin-bottom: 30px;
  overflow: hidden;
}

.error-result .result-header {
  background: linear-gradient(135deg, #f44336, #c62828);
}

.result-icon {
  font-size: 80px;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
}

.result-icon.success {
  color: white;
}

.result-icon.error {
  color: white;
}

.animate-success {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title, .error-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 10px;
  position: relative;
  z-index: 2;
}

.success-message, .error-message {
  font-size: 1.1rem;
  max-width: 80%;
  margin: 0 auto 10px;
  line-height: 1.5;
  position: relative;
  z-index: 2;
}

.payment-card, .booking-card {
  width: 90%;
  margin: 0 auto 30px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.payment-card:hover, .booking-card:hover {
  transform: translateY(-5px);
}

.card-header {
  background-color: #f5f5f5;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.booking-id {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.payment-details, .booking-details {
  padding: 20px;
  background-color: white;
}

.detail-row {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
}

.booking-details .detail-row {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
}

.booking-details .detail-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-icon {
  font-size: 1.5rem;
  color: #4caf50;
  margin-right: 15px;
  width: 40px;
  text-align: center;
}

.detail-content {
  flex: 1;
}

.detail-label {
  font-weight: 600;
  color: #555;
  margin-bottom: 5px;
  width: 40%;
}

.detail-value {
  color: #333;
  width: 60%;
}

.booking-details .detail-label {
  font-size: 0.9rem;
  width: 100%;
}

.booking-details .detail-value {
  font-size: 1.1rem;
  font-weight: 500;
  width: 100%;
}

.booking-time {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.booking-date {
  font-weight: 600;
  color: #333;
}

.booking-hours {
  color: #4caf50;
  font-weight: 700;
}

.highlight {
  color: #4caf50;
  font-weight: 700;
  font-size: 1.1rem;
}

.status-confirmed {
  color: #4caf50;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin: 30px 0;
}

.home-button {
  padding: 12px 30px;
  font-size: 1.1rem;
  border-radius: 30px;
  background-color: #4caf50;
  border-color: #4caf50;
  transition: all 0.3s ease;
}

.home-button:hover {
  background-color: #388e3c;
  border-color: #388e3c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* Confetti Animation */
.confetti-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 30px;
  background: #ffd700;
  top: -10px;
  opacity: 0;
}

.confetti-piece:nth-child(1) {
  left: 7%;
  transform: rotate(15deg);
  animation: makeItRain 3s infinite ease-out;
  animation-delay: 0.2s;
  background: #7d32f2;
}

.confetti-piece:nth-child(2) {
  left: 14%;
  transform: rotate(45deg);
  animation: makeItRain 3s infinite ease-out;
  animation-delay: 0.4s;
  background: #ff5722;
}

.confetti-piece:nth-child(3) {
  left: 21%;
  transform: rotate(60deg);
  animation: makeItRain 3s infinite ease-out;
  animation-delay: 0.6s;
  background: #ff9800;
}

.confetti-piece:nth-child(4) {
  left: 28%;
  transform: rotate(90deg);
  animation: makeItRain 3s infinite ease-out;
  animation-delay: 0.8s;
  background: #f44336;
}

.confetti-piece:nth-child(5) {
  left: 35%;
  transform: rotate(120deg);
  animation: makeItRain 3s infinite ease-out;
  animation-delay: 1s;
  background: #4caf50;
}

.confetti-piece:nth-child(6) {
  left: 42%;
  transform: rotate(150deg);
  animation: makeItRain 3s infinite ease-out;
  animation-delay: 1.2s;
  background: #2196f3;
}

.confetti-piece:nth-child(7) {
  left: 49%;
  transform: rotate(30deg);
  animation: makeItRain 3s infinite ease-out;
  animation-delay: 1.4s;
  background: #e91e63;
}

.confetti-piece:nth-child(8) {
  left: 56%;
  transform: rotate(60deg);
  animation: makeItRain 3s infinite ease-out;
  animation-delay: 1.6s;
  background: #00bcd4;
}

.confetti-piece:nth-child(9) {
  left: 63%;
  transform: rotate(90deg);
  animation: makeItRain 3s infinite ease-out;
  animation-delay: 1.8s;
  background: #ffeb3b;
}

.confetti-piece:nth-child(10) {
  left: 70%;
  transform: rotate(120deg);
  animation: makeItRain 3s infinite ease-out;
  animation-delay: 2s;
  background: #9c27b0;
}

@keyframes makeItRain {
  from {
    opacity: 0;
    transform: translateY(0) scale(0.3) rotate(3deg);
  }
  50% {
    opacity: 1;
    transform: translateY(200px) scale(0.8) rotate(60deg);
  }
  to {
    opacity: 0;
    transform: translateY(400px) scale(0.3) rotate(180deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .payment-result {
    padding: 15px 10px;
  }

  .result-header {
    padding: 30px 15px;
  }

  .success-title, .error-title {
    font-size: 1.6rem;
  }

  .success-message, .error-message {
    font-size: 1rem;
    max-width: 95%;
  }

  .payment-card, .booking-card {
    width: 95%;
  }

  .detail-label, .detail-value {
    width: 50%;
  }

  .result-icon {
    font-size: 60px;
  }

  .home-button {
    padding: 10px 20px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-label, .detail-value {
    width: 100%;
  }

  .detail-label {
    margin-bottom: 5px;
  }

  .booking-details .detail-row {
    flex-direction: row;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .booking-id {
    margin-top: 5px;
  }
}
</style>

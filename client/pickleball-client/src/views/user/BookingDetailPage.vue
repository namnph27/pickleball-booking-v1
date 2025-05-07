<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useBookingStore } from '../../store/booking';
import { useToast } from '../../composables/useToast';
import BaseLayout from '../../components/layout/BaseLayout.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseCard from '../../components/base/BaseCard.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseModal from '../../components/base/BaseModal.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const bookingStore = useBookingStore();
const toast = useToast();

// State
const bookingId = computed(() => Number(route.params.id));
const showCancelModal = ref(false);
const isCancelling = ref(false);
const showPaymentModal = ref(false);
const isProcessingPayment = ref(false);

// Payment details
const paymentMethod = ref('credit_card');
const cardNumber = ref('');
const cardHolder = ref('');
const expiryDate = ref('');
const cvv = ref('');

// Computed properties
const booking = computed(() => bookingStore.currentBooking);
const loading = computed(() => bookingStore.loading);

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time
const formatTime = (timeString: string) => {
  if (!timeString) return '';
  const date = new Date(timeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Calculate duration in hours
const getDuration = () => {
  if (!booking.value) return 0;
  
  const start = new Date(booking.value.start_time);
  const end = new Date(booking.value.end_time);
  const durationMs = end.getTime() - start.getTime();
  return Math.round(durationMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal place
};

// Get status class
const getStatusClass = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'status-confirmed';
    case 'pending':
      return 'status-pending';
    case 'cancelled':
      return 'status-cancelled';
    case 'completed':
      return 'status-completed';
    default:
      return '';
  }
};

// Open cancel booking modal
const openCancelModal = () => {
  showCancelModal.value = true;
};

// Cancel booking
const cancelBooking = async () => {
  if (!booking.value) return;
  
  isCancelling.value = true;
  
  try {
    await bookingStore.cancelBooking(booking.value.id);
    toast.success(t('booking.cancelSuccess'));
    showCancelModal.value = false;
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('booking.cancelError'));
  } finally {
    isCancelling.value = false;
  }
};

// Open payment modal
const openPaymentModal = () => {
  showPaymentModal.value = true;
};

// Process payment
const processPayment = async () => {
  if (!booking.value) return;
  
  // Validate payment details
  if (paymentMethod.value === 'credit_card' || paymentMethod.value === 'debit_card') {
    if (!cardNumber.value || !cardHolder.value || !expiryDate.value || !cvv.value) {
      toast.error(t('booking.incompletePaymentDetails'));
      return;
    }
  }
  
  isProcessingPayment.value = true;
  
  try {
    const paymentData = {
      booking_id: booking.value.id,
      payment_method: paymentMethod.value,
      card_number: cardNumber.value,
      card_holder: cardHolder.value,
      expiry_date: expiryDate.value,
      cvv: cvv.value
    };
    
    await bookingStore.processPayment(paymentData);
    
    toast.success(t('booking.paymentSuccessful'));
    showPaymentModal.value = false;
    
    // Refresh booking details
    await bookingStore.getBookingById(booking.value.id);
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('booking.paymentFailed'));
  } finally {
    isProcessingPayment.value = false;
  }
};

// Fetch booking details on mount
onMounted(async () => {
  if (!bookingId.value) {
    router.push('/bookings');
    return;
  }
  
  try {
    await bookingStore.getBookingById(bookingId.value);
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('booking.fetchError'));
    router.push('/bookings');
  }
});
</script>

<template>
  <BaseLayout 
    :title="t('booking.bookingDetails')" 
    :back-link="'/bookings'"
    :loading="loading"
  >
    <template v-if="booking">
      <div class="booking-detail">
        <!-- Booking Status -->
        <div class="booking-status-container">
          <BaseCard>
            <div class="booking-status">
              <div class="status-info">
                <h2 class="booking-id">{{ t('booking.bookingId') }}: #{{ booking.id }}</h2>
                <span :class="['status-badge', getStatusClass(booking.status)]">
                  {{ t(`booking.${booking.status}`) }}
                </span>
              </div>
              
              <div class="booking-actions">
                <BaseButton 
                  v-if="booking.status !== 'cancelled' && booking.status !== 'completed'"
                  :label="t('booking.cancelBooking')" 
                  variant="danger"
                  @click="openCancelModal"
                />
                
                <BaseButton 
                  v-if="booking.status === 'pending'"
                  :label="t('booking.payNow')" 
                  variant="primary"
                  @click="openPaymentModal"
                />
              </div>
            </div>
          </BaseCard>
        </div>
        
        <div class="booking-content">
          <!-- Court Details -->
          <div class="booking-section">
            <BaseCard>
              <template #header>
                <h3 class="section-title">{{ t('courts.courtDetails') }}</h3>
              </template>
              
              <div class="court-info">
                <div v-if="booking.image_url" class="court-image">
                  <img :src="booking.image_url" :alt="booking.court_name" />
                </div>
                
                <div class="court-details">
                  <h3 class="court-name">{{ booking.court_name }}</h3>
                  
                  <div class="info-item">
                    <i class="pi pi-map-marker"></i>
                    <span>{{ booking.location }}</span>
                  </div>
                  
                  <BaseButton 
                    :label="t('courts.viewCourt')" 
                    variant="outline"
                    icon="pi-external-link"
                    @click="router.push(`/courts/${booking.court_id}`)"
                  />
                </div>
              </div>
            </BaseCard>
          </div>
          
          <!-- Booking Details -->
          <div class="booking-section">
            <BaseCard>
              <template #header>
                <h3 class="section-title">{{ t('booking.bookingDetails') }}</h3>
              </template>
              
              <div class="booking-info">
                <div class="info-row">
                  <div class="info-label">{{ t('booking.bookingDate') }}</div>
                  <div class="info-value">{{ formatDate(booking.start_time) }}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">{{ t('booking.bookingTime') }}</div>
                  <div class="info-value">{{ formatTime(booking.start_time) }} - {{ formatTime(booking.end_time) }}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">{{ t('booking.duration') }}</div>
                  <div class="info-value">{{ getDuration() }} {{ t('booking.hours') }}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">{{ t('booking.totalPrice') }}</div>
                  <div class="info-value">${{ booking.total_price.toFixed(2) }}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">{{ t('booking.paymentStatus') }}</div>
                  <div class="info-value">
                    <span :class="['payment-status', booking.status === 'pending' ? 'status-pending' : 'status-paid']">
                      {{ booking.status === 'pending' ? t('booking.unpaid') : t('booking.paid') }}
                    </span>
                  </div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">{{ t('booking.bookedOn') }}</div>
                  <div class="info-value">{{ formatDate(booking.created_at) }}</div>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
        
        <!-- Additional Information -->
        <div class="booking-section">
          <BaseCard>
            <template #header>
              <h3 class="section-title">{{ t('booking.additionalInfo') }}</h3>
            </template>
            
            <div class="additional-info">
              <BaseAlert 
                v-if="booking.status === 'confirmed'" 
                type="success"
                :title="t('booking.readyToPlay')"
                :message="t('booking.arriveEarly')"
              />
              
              <BaseAlert 
                v-else-if="booking.status === 'pending'" 
                type="warning"
                :title="t('booking.pendingPayment')"
                :message="t('booking.completePayment')"
              />
              
              <BaseAlert 
                v-else-if="booking.status === 'cancelled'" 
                type="error"
                :title="t('booking.bookingCancelled')"
                :message="t('booking.bookAgain')"
              />
              
              <div class="cancellation-policy">
                <h4>{{ t('booking.cancellationPolicy') }}</h4>
                <ul>
                  <li>{{ t('booking.cancellationPolicy1') }}</li>
                  <li>{{ t('booking.cancellationPolicy2') }}</li>
                  <li>{{ t('booking.cancellationPolicy3') }}</li>
                </ul>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>
    
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
    
    <!-- Payment Modal -->
    <BaseModal
      v-model="showPaymentModal"
      :title="t('booking.processPayment')"
      :ok-text="t('booking.payNow')"
      :cancel-text="t('common.cancel')"
      :loading="isProcessingPayment"
      @ok="processPayment"
    >
      <div class="payment-modal-content">
        <div class="booking-summary">
          <h3>{{ t('booking.bookingDetails') }}</h3>
          
          <div class="summary-info">
            <div class="info-row">
              <span class="info-label">{{ t('courts.court') }}:</span>
              <span class="info-value">{{ booking?.court_name }}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">{{ t('booking.bookingDate') }}:</span>
              <span class="info-value">{{ formatDate(booking?.start_time || '') }}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">{{ t('booking.bookingTime') }}:</span>
              <span class="info-value">{{ formatTime(booking?.start_time || '') }} - {{ formatTime(booking?.end_time || '') }}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">{{ t('booking.totalPrice') }}:</span>
              <span class="info-value">${{ booking?.total_price.toFixed(2) }}</span>
            </div>
          </div>
        </div>
        
        <div class="payment-form">
          <h3>{{ t('booking.paymentMethod') }}</h3>
          
          <div class="payment-methods">
            <div class="payment-method-option">
              <input 
                type="radio" 
                id="credit-card" 
                value="credit_card" 
                v-model="paymentMethod"
              />
              <label for="credit-card">{{ t('booking.creditCard') }}</label>
            </div>
            
            <div class="payment-method-option">
              <input 
                type="radio" 
                id="debit-card" 
                value="debit_card" 
                v-model="paymentMethod"
              />
              <label for="debit-card">{{ t('booking.debitCard') }}</label>
            </div>
            
            <div class="payment-method-option">
              <input 
                type="radio" 
                id="paypal" 
                value="paypal" 
                v-model="paymentMethod"
              />
              <label for="paypal">{{ t('booking.paypal') }}</label>
            </div>
          </div>
          
          <div v-if="paymentMethod === 'credit_card' || paymentMethod === 'debit_card'" class="card-details">
            <div class="form-group">
              <label for="card-number">{{ t('booking.cardNumber') }}</label>
              <input 
                type="text" 
                id="card-number" 
                v-model="cardNumber" 
                placeholder="1234 5678 9012 3456"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="card-holder">{{ t('booking.cardHolder') }}</label>
              <input 
                type="text" 
                id="card-holder" 
                v-model="cardHolder" 
                placeholder="John Doe"
                class="form-input"
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="expiry-date">{{ t('booking.expiryDate') }}</label>
                <input 
                  type="text" 
                  id="expiry-date" 
                  v-model="expiryDate" 
                  placeholder="MM/YY"
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label for="cvv">{{ t('booking.cvv') }}</label>
                <input 
                  type="password" 
                  id="cvv" 
                  v-model="cvv" 
                  placeholder="123"
                  class="form-input"
                />
              </div>
            </div>
          </div>
          
          <div v-else-if="paymentMethod === 'paypal'" class="paypal-info">
            <BaseAlert type="info">
              {{ t('booking.redirectToPaypal') }}
            </BaseAlert>
          </div>
        </div>
      </div>
    </BaseModal>
  </BaseLayout>
</template>

<style scoped lang="scss">
.booking-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.booking-status-container {
  margin-bottom: 1rem;
}

.booking-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .status-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .booking-id {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }
    
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
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
    }
  }
  
  .booking-actions {
    display: flex;
    gap: 1rem;
  }
}

.booking-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.court-info {
  display: flex;
  gap: 1.5rem;
  
  .court-image {
    width: 120px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .court-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    
    .court-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      i {
        color: var(--primary-color);
      }
    }
  }
}

.booking-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
  .info-row {
    display: flex;
    justify-content: space-between;
    
    .info-label {
      font-weight: 500;
    }
    
    .payment-status {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      
      &.status-paid {
        background-color: rgba(76, 175, 80, 0.1);
        color: #2e7d32;
      }
      
      &.status-pending {
        background-color: rgba(255, 152, 0, 0.1);
        color: #ef6c00;
      }
    }
  }
}

.additional-info {
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
      margin: 1.5rem 0 1rem 0;
    }
    
    .payment-methods {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      
      .payment-method-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }
    
    .card-details {
      .form-group {
        margin-bottom: 1rem;
        
        label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--medium-gray);
          border-radius: 4px;
          font-size: 1rem;
          
          &:focus {
            outline: none;
            border-color: var(--primary-color);
          }
        }
      }
      
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
    }
  }
}

@media (max-width: 992px) {
  .booking-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .booking-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    
    .booking-actions {
      width: 100%;
      flex-direction: column;
    }
  }
  
  .court-info {
    flex-direction: column;
    
    .court-image {
      width: 100%;
      height: 200px;
    }
  }
  
  .payment-modal-content {
    .card-details {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>

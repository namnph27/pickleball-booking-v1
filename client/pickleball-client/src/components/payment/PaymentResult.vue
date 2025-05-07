<template>
  <div class="payment-result">
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>{{ $t('payment.loading') }}</p>
    </div>
    
    <div v-else class="result-container">
      <div v-if="success" class="success-result">
        <div class="result-icon success">
          <i class="pi pi-check-circle"></i>
        </div>
        <h2>{{ $t('payment.successTitle') }}</h2>
        <p>{{ $t('payment.successMessage') }}</p>
        
        <div class="payment-details">
          <div class="detail-row">
            <div class="detail-label">{{ $t('payment.bookingId') }}:</div>
            <div class="detail-value">{{ payment?.booking_id }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">{{ $t('payment.amount') }}:</div>
            <div class="detail-value">{{ formatCurrency(payment?.amount) }}</div>
          </div>
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
        
        <div class="action-buttons">
          <Button 
            :label="$t('payment.viewReceipt')" 
            icon="pi pi-file-pdf" 
            class="p-button-outlined" 
            @click="viewReceipt"
          />
          <Button 
            :label="$t('payment.backToBookings')" 
            icon="pi pi-calendar" 
            @click="goToBookings"
          />
        </div>
      </div>
      
      <div v-else class="failure-result">
        <div class="result-icon failure">
          <i class="pi pi-times-circle"></i>
        </div>
        <h2>{{ $t('payment.failureTitle') }}</h2>
        <p>{{ errorMessage || $t('payment.failureMessage') }}</p>
        
        <div class="action-buttons">
          <Button 
            :label="$t('payment.tryAgain')" 
            icon="pi pi-refresh" 
            class="p-button-outlined" 
            @click="tryAgain"
          />
          <Button 
            :label="$t('payment.backToBookings')" 
            icon="pi pi-calendar" 
            @click="goToBookings"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { usePaymentService, Payment } from '@/services/PaymentService';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const paymentService = usePaymentService();

// State
const loading = ref(true);
const success = ref(false);
const payment = ref<Payment | null>(null);
const errorMessage = ref('');

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
    paypal: 'PayPal'
  };
  
  return method ? methodNames[method] || method : '-';
};

const viewReceipt = async () => {
  if (!payment.value?.id) return;
  
  try {
    const { receipt_url } = await paymentService.getPaymentReceipt(payment.value.id);
    
    // Open receipt in new window
    window.open(receipt_url, '_blank');
  } catch (error) {
    console.error('Error getting receipt:', error);
  }
};

const goToBookings = () => {
  router.push('/bookings');
};

const tryAgain = () => {
  // Go back to booking details
  if (route.query.booking_id) {
    router.push(`/bookings/${route.query.booking_id}`);
  } else {
    router.push('/bookings');
  }
};

// Lifecycle hooks
onMounted(async () => {
  try {
    const paymentId = route.query.payment_id;
    
    if (route.path.includes('/success')) {
      success.value = true;
      
      if (paymentId) {
        const { payment: paymentData } = await paymentService.getPaymentById(Number(paymentId));
        payment.value = paymentData;
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
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.result-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  text-align: center;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.result-icon.success {
  color: #4caf50;
}

.result-icon.failure {
  color: #f44336;
}

.payment-details {
  margin: 30px 0;
  text-align: left;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
}

.detail-label {
  font-weight: bold;
  width: 40%;
}

.detail-value {
  width: 60%;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}
</style>

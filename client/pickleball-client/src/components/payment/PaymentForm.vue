<template>
  <div class="payment-form">
    <h2>{{ $t('payment.title') }}</h2>
    
    <div class="booking-details">
      <h3>{{ $t('payment.bookingDetails') }}</h3>
      <div class="details-row">
        <div class="detail-item">
          <label>{{ $t('booking.court') }}:</label>
          <span>{{ booking?.court_name }}</span>
        </div>
        <div class="detail-item">
          <label>{{ $t('booking.date') }}:</label>
          <span>{{ formatDate(booking?.start_time) }}</span>
        </div>
      </div>
      <div class="details-row">
        <div class="detail-item">
          <label>{{ $t('booking.time') }}:</label>
          <span>{{ formatTime(booking?.start_time) }} - {{ formatTime(booking?.end_time) }}</span>
        </div>
        <div class="detail-item">
          <label>{{ $t('booking.totalPrice') }}:</label>
          <span class="price">{{ formatCurrency(booking?.total_price) }}</span>
        </div>
      </div>
    </div>
    
    <div class="payment-methods">
      <h3>{{ $t('payment.selectMethod') }}</h3>
      
      <div class="payment-method-options">
        <div 
          v-for="method in paymentMethods" 
          :key="method.value"
          :class="['payment-method-option', { active: selectedMethod === method.value }]"
          @click="selectPaymentMethod(method.value)"
        >
          <div class="method-icon">
            <i :class="method.icon"></i>
          </div>
          <div class="method-details">
            <div class="method-name">{{ method.label }}</div>
            <div class="method-description">{{ method.description }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Online Payment Gateway Selection -->
    <div v-if="selectedMethod === 'online_payment'" class="payment-gateways">
      <h3>{{ $t('payment.selectGateway') }}</h3>
      
      <div class="payment-gateway-options">
        <div 
          v-for="gateway in paymentGateways" 
          :key="gateway.name"
          :class="['payment-gateway-option', { active: selectedGateway === gateway.name }]"
          @click="selectPaymentGateway(gateway.name)"
        >
          <div class="gateway-logo">
            <img :src="getGatewayLogo(gateway.name)" :alt="gateway.displayName">
          </div>
          <div class="gateway-name">{{ gateway.displayName }}</div>
        </div>
      </div>
    </div>
    
    <!-- Reward Points Payment -->
    <div v-if="selectedMethod === 'reward_points'" class="reward-points-payment">
      <div class="points-info">
        <div class="available-points">
          <label>{{ $t('payment.availablePoints') }}:</label>
          <span>{{ userPoints }}</span>
        </div>
        <div class="required-points">
          <label>{{ $t('payment.requiredPoints') }}:</label>
          <span>{{ requiredPoints }}</span>
        </div>
      </div>
      
      <div v-if="userPoints < requiredPoints" class="points-warning">
        <i class="pi pi-exclamation-triangle"></i>
        {{ $t('payment.insufficientPoints') }}
      </div>
    </div>
    
    <div class="payment-actions">
      <Button 
        :label="$t('common.cancel')" 
        class="p-button-outlined p-button-secondary" 
        @click="cancel"
      />
      <Button 
        :label="$t('payment.processPayment')" 
        class="p-button-primary" 
        :disabled="!isPaymentValid"
        :loading="loading"
        @click="processPayment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import { usePaymentService, PaymentGateway } from '@/services/PaymentService';
import { useUserService } from '@/services/UserService';
import { formatDate, formatTime, formatCurrency } from '@/utils/formatters';

const { t } = useI18n();
const toast = useToast();
const paymentService = usePaymentService();
const userService = useUserService();

const props = defineProps<{
  booking: any;
}>();

const emit = defineEmits<{
  (e: 'payment-success', payment: any): void;
  (e: 'payment-cancel'): void;
}>();

// State
const loading = ref(false);
const selectedMethod = ref('');
const selectedGateway = ref('');
const paymentGateways = ref<PaymentGateway[]>([]);
const userPoints = ref(0);

// Computed
const requiredPoints = computed(() => {
  return props.booking?.total_price ? Math.floor(props.booking.total_price * 100) : 0;
});

const isPaymentValid = computed(() => {
  if (!selectedMethod.value) return false;
  
  if (selectedMethod.value === 'online_payment' && !selectedGateway.value) {
    return false;
  }
  
  if (selectedMethod.value === 'reward_points' && userPoints.value < requiredPoints.value) {
    return false;
  }
  
  return true;
});

// Payment methods
const paymentMethods = [
  {
    value: 'online_payment',
    label: t('payment.methods.online'),
    description: t('payment.methods.onlineDescription'),
    icon: 'pi pi-credit-card'
  },
  {
    value: 'reward_points',
    label: t('payment.methods.rewardPoints'),
    description: t('payment.methods.rewardPointsDescription'),
    icon: 'pi pi-star'
  }
];

// Methods
const selectPaymentMethod = (method: string) => {
  selectedMethod.value = method;
  
  // Reset gateway selection when changing payment method
  if (method !== 'online_payment') {
    selectedGateway.value = '';
  }
};

const selectPaymentGateway = (gateway: string) => {
  selectedGateway.value = gateway;
};

const getGatewayLogo = (gatewayName: string) => {
  const logos: Record<string, string> = {
    momo: '/images/payment/momo-logo.png',
    vnpay: '/images/payment/vnpay-logo.png',
    bank_transfer: '/images/payment/bank-transfer-logo.png'
  };
  
  return logos[gatewayName] || '/images/payment/default-logo.png';
};

const processPayment = async () => {
  try {
    loading.value = true;
    
    const paymentData = {
      booking_id: props.booking.id,
      payment_method: selectedMethod.value,
      payment_gateway: selectedMethod.value === 'online_payment' ? selectedGateway.value : undefined
    };
    
    const response = await paymentService.processPayment(paymentData);
    
    if (response.redirect_url) {
      // Redirect to payment gateway
      window.location.href = response.redirect_url;
    } else {
      // Payment processed successfully
      toast.add({
        severity: 'success',
        summary: t('payment.success'),
        detail: t('payment.successMessage'),
        life: 3000
      });
      
      emit('payment-success', response.payment);
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('payment.error'),
      detail: error.message || t('payment.errorMessage'),
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  emit('payment-cancel');
};

// Lifecycle hooks
onMounted(async () => {
  try {
    // Get active payment gateways
    const { gateways } = await paymentService.getActivePaymentGateways();
    paymentGateways.value = gateways;
    
    // Get user reward points
    const { points } = await userService.getUserRewardPoints();
    userPoints.value = points;
  } catch (error) {
    console.error('Error loading payment data:', error);
  }
});
</script>

<style scoped>
.payment-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.booking-details {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.details-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.detail-item {
  flex: 1;
}

.detail-item label {
  font-weight: bold;
  margin-right: 5px;
}

.price {
  font-weight: bold;
  color: #2196f3;
}

.payment-methods {
  margin-bottom: 20px;
}

.payment-method-options {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.payment-method-option {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 250px;
}

.payment-method-option:hover {
  border-color: #2196f3;
  background-color: #f5f9ff;
}

.payment-method-option.active {
  border-color: #2196f3;
  background-color: #e3f2fd;
}

.method-icon {
  font-size: 24px;
  margin-right: 15px;
  color: #2196f3;
}

.method-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.method-description {
  font-size: 0.9em;
  color: #666;
}

.payment-gateways {
  margin-bottom: 20px;
}

.payment-gateway-options {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.payment-gateway-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 120px;
}

.payment-gateway-option:hover {
  border-color: #2196f3;
  background-color: #f5f9ff;
}

.payment-gateway-option.active {
  border-color: #2196f3;
  background-color: #e3f2fd;
}

.gateway-logo {
  height: 40px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.gateway-logo img {
  max-height: 100%;
  max-width: 100%;
}

.gateway-name {
  font-size: 0.9em;
  text-align: center;
}

.reward-points-payment {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.points-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.available-points, .required-points {
  flex: 1;
}

.available-points label, .required-points label {
  font-weight: bold;
  margin-right: 5px;
}

.points-warning {
  color: #f44336;
  margin-top: 10px;
}

.payment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>

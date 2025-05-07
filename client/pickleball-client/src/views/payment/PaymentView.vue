<template>
  <div class="payment-view">
    <div class="container">
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
      </div>
      
      <div v-else-if="!booking" class="error-container">
        <div class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          <h3>{{ $t('payment.bookingNotFound') }}</h3>
          <p>{{ $t('payment.bookingNotFoundMessage') }}</p>
          <Button 
            :label="$t('common.backToBookings')" 
            icon="pi pi-arrow-left" 
            @click="goToBookings"
          />
        </div>
      </div>
      
      <div v-else>
        <PaymentForm 
          :booking="booking" 
          @payment-success="handlePaymentSuccess"
          @payment-cancel="goToBookingDetails"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import PaymentForm from '@/components/payment/PaymentForm.vue';
import { useBookingService } from '@/services/BookingService';

const route = useRoute();
const router = useRouter();
const bookingService = useBookingService();

// State
const loading = ref(true);
const booking = ref<any>(null);

// Methods
const loadBooking = async () => {
  try {
    loading.value = true;
    
    const bookingId = route.params.id;
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }
    
    const { booking: bookingData } = await bookingService.getBookingById(Number(bookingId));
    booking.value = bookingData;
  } catch (error) {
    console.error('Error loading booking:', error);
    booking.value = null;
  } finally {
    loading.value = false;
  }
};

const handlePaymentSuccess = (payment: any) => {
  // Redirect to payment success page
  router.push({
    path: '/payment/success',
    query: { payment_id: payment.id, booking_id: booking.value?.id }
  });
};

const goToBookingDetails = () => {
  router.push(`/bookings/${booking.value?.id}`);
};

const goToBookings = () => {
  router.push('/bookings');
};

// Lifecycle hooks
onMounted(() => {
  loadBooking();
});
</script>

<style scoped>
.payment-view {
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.error-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.error-message {
  text-align: center;
  max-width: 400px;
}

.error-message i {
  font-size: 48px;
  color: #f44336;
  margin-bottom: 20px;
}
</style>

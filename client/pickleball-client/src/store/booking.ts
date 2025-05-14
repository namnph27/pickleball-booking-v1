import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useBookingService, type Booking, type BookingRequest, type Payment } from '../services/BookingService';
import { usePromotionService } from '../services/PromotionService';

export const useBookingStore = defineStore('booking', () => {
  const bookingService = useBookingService();
  const promotionService = usePromotionService();

  const bookings = ref<Booking[]>([]);
  const currentBooking = ref<Booking | null>(null);
  const payments = ref<Payment[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const appliedPromotion = ref<{
    code: string;
    discount_percent: number;
  } | null>(null);
  const discountAmount = ref(0);

  // Computed properties
  const upcomingBookings = computed(() => {
    return bookings.value.filter(booking =>
      booking.status !== 'cancelled' &&
      booking.status !== 'completed' &&
      new Date(booking.start_time) > new Date()
    ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  });

  const pastBookings = computed(() => {
    return bookings.value.filter(booking =>
      booking.status === 'completed' ||
      booking.status === 'cancelled' ||
      new Date(booking.start_time) <= new Date()
    ).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  });

  // Create a new booking
  async function createBooking(bookingData: BookingRequest) {
    loading.value = true;
    error.value = null;

    try {
      const response = await bookingService.createBooking(bookingData);
      currentBooking.value = response.booking;
      appliedPromotion.value = response.applied_promotion;
      discountAmount.value = response.discount_amount;

      // Add the new booking to the bookings array
      bookings.value.push(response.booking);

      return response;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to create booking';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Get user bookings
  async function getUserBookings() {
    loading.value = true;
    error.value = null;

    try {
      const response = await bookingService.getUserBookings();
      bookings.value = response.bookings;
      return response.bookings;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch bookings';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Get booking by ID
  async function getBookingById(id: number) {
    loading.value = true;
    error.value = null;

    try {
      const response = await bookingService.getBookingById(id);
      currentBooking.value = response.booking;
      return response.booking;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch booking details';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Cancel booking
  async function cancelBooking(id: number) {
    loading.value = true;
    error.value = null;

    try {
      await bookingService.cancelBooking(id);

      // Update the booking status in the bookings array
      const index = bookings.value.findIndex(b => b.id === id);
      if (index !== -1) {
        bookings.value[index].status = 'cancelled';
      }

      // Update currentBooking if it's the same booking
      if (currentBooking.value && currentBooking.value.id === id) {
        currentBooking.value.status = 'cancelled';
      }

      return true;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to cancel booking';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Get court bookings (for court owners)
  async function getCourtBookings(courtId: number) {
    loading.value = true;
    error.value = null;

    try {
      const response = await bookingService.getCourtBookings(courtId);
      bookings.value = response.bookings;
      return response.bookings;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch court bookings';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Update booking status (for court owners)
  async function updateBookingStatus(id: number, status: 'confirmed' | 'cancelled' | 'completed') {
    loading.value = true;
    error.value = null;

    try {
      const response = await bookingService.updateBookingStatus(id, status);

      // Update the booking in the bookings array
      const index = bookings.value.findIndex(b => b.id === id);
      if (index !== -1) {
        bookings.value[index] = response.booking;
      }

      // Update currentBooking if it's the same booking
      if (currentBooking.value && currentBooking.value.id === id) {
        currentBooking.value = response.booking;
      }

      return response.booking;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to update booking status';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Process payment
  async function processPayment(paymentData: {
    booking_id: number;
    payment_method: string;
    payment_gateway?: string;
    return_url?: string;
    cancel_url?: string;
  }) {
    loading.value = true;
    error.value = null;

    try {
      const response = await bookingService.processPayment(paymentData);

      // If there's a redirect URL, we would normally redirect the user
      // For demo purposes, we'll just return the payment
      if (response.redirect_url) {
        console.log('Would redirect to:', response.redirect_url);
      }

      // Update the booking status to confirmed
      if (currentBooking.value && currentBooking.value.id === paymentData.booking_id) {
        currentBooking.value.status = 'confirmed';
      }

      // Update the booking in the bookings array
      const index = bookings.value.findIndex(b => b.id === paymentData.booking_id);
      if (index !== -1) {
        bookings.value[index].status = 'confirmed';
      }

      return response.payment;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Payment processing failed';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Get user payments
  async function getUserPayments() {
    loading.value = true;
    error.value = null;

    try {
      const response = await bookingService.getUserPayments();
      payments.value = response.payments;
      return response.payments;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch payments';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Verify promotion code
  async function verifyPromotionCode(code: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await promotionService.verifyPromotionCode(code);

      if (response.valid && response.promotion) {
        appliedPromotion.value = {
          code: response.promotion.code,
          discount_percent: response.promotion.discount_percent
        };
      } else {
        appliedPromotion.value = null;
      }

      return response;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to verify promotion code';
      appliedPromotion.value = null;
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Apply promotion to booking
  async function applyPromotion(bookingId: number, code: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await promotionService.applyPromotion(bookingId, code);

      if (response.success) {
        discountAmount.value = response.discount_amount;

        // Update the booking total price if it's the current booking
        if (currentBooking.value && currentBooking.value.id === bookingId) {
          currentBooking.value.total_price = response.new_total;
        }
      }

      return response;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to apply promotion';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Reset state
  function reset() {
    bookings.value = [];
    currentBooking.value = null;
    payments.value = [];
    error.value = null;
    appliedPromotion.value = null;
    discountAmount.value = 0;
  }

  return {
    bookings,
    currentBooking,
    payments,
    loading,
    error,
    appliedPromotion,
    discountAmount,
    upcomingBookings,
    pastBookings,
    createBooking,
    getUserBookings,
    getBookingById,
    cancelBooking,
    getCourtBookings,
    updateBookingStatus,
    processPayment,
    getUserPayments,
    verifyPromotionCode,
    applyPromotion,
    reset
  };
});

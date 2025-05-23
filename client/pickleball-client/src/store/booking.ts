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
    try {
      if (!bookings.value || !Array.isArray(bookings.value)) {
        console.error('BookingStore: bookings is not an array:', bookings.value);
        return [];
      }

      return bookings.value.filter(booking => {
        try {
          if (!booking) {
            console.warn('BookingStore: Invalid booking object in upcomingBookings filter');
            return false;
          }

          // Check if start_time is valid
          if (!booking.start_time) {
            console.warn('BookingStore: Missing start_time in booking:', booking.id);
            return false;
          }

          const startTime = new Date(booking.start_time);

          // Check if date is valid
          if (isNaN(startTime.getTime())) {
            console.error('BookingStore: Invalid start_time in booking:', booking.id, booking.start_time);
            return false;
          }

          return booking.status !== 'cancelled' &&
                 booking.status !== 'completed' &&
                 startTime > new Date();
        } catch (error) {
          console.error('BookingStore: Error filtering upcoming booking:', error, booking);
          return false;
        }
      }).sort((a, b) => {
        try {
          const aTime = new Date(a.start_time).getTime();
          const bTime = new Date(b.start_time).getTime();

          if (isNaN(aTime) || isNaN(bTime)) {
            console.error('BookingStore: Invalid date in sort:', a.start_time, b.start_time);
            return 0;
          }

          return aTime - bTime;
        } catch (error) {
          console.error('BookingStore: Error sorting upcoming bookings:', error);
          return 0;
        }
      });
    } catch (error) {
      console.error('BookingStore: Error computing upcomingBookings:', error);
      return [];
    }
  });

  const pastBookings = computed(() => {
    try {
      if (!bookings.value || !Array.isArray(bookings.value)) {
        console.error('BookingStore: bookings is not an array:', bookings.value);
        return [];
      }

      return bookings.value.filter(booking => {
        try {
          if (!booking) {
            console.warn('BookingStore: Invalid booking object in pastBookings filter');
            return false;
          }

          // Check if start_time is valid
          if (!booking.start_time) {
            console.warn('BookingStore: Missing start_time in booking:', booking.id);
            return false;
          }

          const startTime = new Date(booking.start_time);

          // Check if date is valid
          if (isNaN(startTime.getTime())) {
            console.error('BookingStore: Invalid start_time in booking:', booking.id, booking.start_time);
            return false;
          }

          return booking.status === 'completed' ||
                 booking.status === 'cancelled' ||
                 startTime <= new Date();
        } catch (error) {
          console.error('BookingStore: Error filtering past booking:', error, booking);
          return false;
        }
      }).sort((a, b) => {
        try {
          const aTime = new Date(a.start_time).getTime();
          const bTime = new Date(b.start_time).getTime();

          if (isNaN(aTime) || isNaN(bTime)) {
            console.error('BookingStore: Invalid date in sort:', a.start_time, b.start_time);
            return 0;
          }

          return bTime - aTime; // Sort in descending order (newest first)
        } catch (error) {
          console.error('BookingStore: Error sorting past bookings:', error);
          return 0;
        }
      });
    } catch (error) {
      console.error('BookingStore: Error computing pastBookings:', error);
      return [];
    }
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
    console.log('BookingStore: Getting user bookings...');

    try {
      // Reset bookings array before fetching new data
      bookings.value = [];

      const response = await bookingService.getUserBookings();
      console.log('BookingStore: User bookings response:', response);

      if (response && response.bookings) {
        console.log('BookingStore: Setting bookings:', response.bookings);

        // Ensure all required fields are present in each booking
        const processedBookings = response.bookings.map(booking => ({
          ...booking,
          // Provide default values for potentially missing fields
          court_name: booking.court_name || 'Unknown Court',
          location: booking.location || 'Unknown Location',
          image_url: booking.image_url || '',
          // Format dates if needed
          start_time: booking.start_time,
          end_time: booking.end_time,
          // Ensure numeric values
          total_price: typeof booking.total_price === 'number' ? booking.total_price : parseFloat(booking.total_price) || 0
        }));

        bookings.value = processedBookings;
        return processedBookings;
      } else {
        console.log('BookingStore: No bookings found in response or empty array returned');
        // Return empty array instead of throwing an error
        bookings.value = [];
        return [];
      }
    } catch (err: any) {
      console.error('BookingStore: Error fetching bookings:', err);
      error.value = typeof err === 'string' ? err : (err.message || 'Failed to fetch bookings');
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
  async function getCourtBookings(courtId: number, append: boolean = false) {
    loading.value = true;
    error.value = null;

    try {
      const response = await bookingService.getCourtBookings(courtId);

      // Process the bookings to ensure they have court_id
      const processedBookings = response.bookings.map(booking => ({
        ...booking,
        court_id: booking.court_id || courtId,
      }));

      if (append) {
        // Append new bookings to the existing array, avoiding duplicates
        const existingIds = new Set(bookings.value.map(b => b.id));
        const newBookings = processedBookings.filter(b => !existingIds.has(b.id));
        bookings.value = [...bookings.value, ...newBookings];
      } else {
        // Replace all bookings
        bookings.value = processedBookings;
      }

      return processedBookings;
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

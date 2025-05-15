import { useApi } from '../composables/useApi';

export interface Booking {
  id: number;
  court_id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  skill_level?: string;
  current_players?: number;
  needed_players?: number;
  allow_join?: boolean;
  created_at: string;
  updated_at?: string;
  court_name?: string;
  location?: string;
  image_url?: string;
  user_name?: string;
}

export interface BookingRequest {
  court_id: number;
  start_time: string;
  end_time: string;
  promotion_code?: string;
  skill_level?: string;
  current_players?: number;
  needed_players?: number;
  allow_join?: boolean;
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
  created_at: string;
}

export function useBookingService() {
  const { get, post, put } = useApi();

  // Booking endpoints
  const createBooking = (bookingData: BookingRequest) => {
    // Pass false as the third parameter to prevent showing toast message
    return post<{
      booking: Booking;
      discount_amount: number;
      applied_promotion: { code: string; discount_percent: number } | null;
    }>('/api/bookings', bookingData, false);
  };

  const getUserBookings = () => {
    console.log('BookingService: Calling getUserBookings API endpoint...');

    // Ensure the token is in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('BookingService: No authentication token found');
      throw new Error('Authentication required');
    }

    // Make the API request with explicit showToast=false to handle errors in the component
    return get<{ bookings: Booking[] }>('/api/bookings/my-bookings', undefined, false);
  };

  const getBookingById = (id: number) => {
    return get<{ booking: Booking }>(`/api/bookings/${id}`);
  };

  const cancelBooking = (id: number) => {
    return post<{ message: string }>(`/api/bookings/${id}/cancel`);
  };

  // Court owner booking endpoints
  const getCourtBookings = (courtId: number) => {
    return get<{ bookings: Booking[] }>(`/api/bookings/court/${courtId}`);
  };

  const updateBookingStatus = (id: number, status: 'confirmed' | 'cancelled' | 'completed') => {
    return put<{ booking: Booking }>(`/api/bookings/${id}/status`, { status });
  };

  // Payment endpoints
  const processPayment = (paymentData: {
    booking_id: number;
    payment_method: string;
    payment_gateway?: string;
    return_url?: string;
    cancel_url?: string;
  }) => {
    return post<{ payment: Payment; redirect_url?: string }>('/api/payments', paymentData);
  };

  const getPaymentById = (id: number) => {
    return get<{ payment: Payment }>(`/api/bookings/payment/${id}`);
  };

  const getUserPayments = () => {
    return get<{ payments: Payment[] }>('/api/bookings/payments');
  };

  const getPaymentReceipt = (id: number) => {
    return get<{ receipt_url: string }>(`/api/bookings/payment/${id}/receipt`);
  };

  return {
    createBooking,
    getUserBookings,
    getBookingById,
    cancelBooking,
    getCourtBookings,
    updateBookingStatus,
    processPayment,
    getPaymentById,
    getUserPayments,
    getPaymentReceipt
  };
}

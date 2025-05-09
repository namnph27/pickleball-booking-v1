import { useApiService } from './ApiService';
import type { JoinableBooking, BookingJoinRequest, BookingPlayer } from '../types/index';

export function useJoinCourtService() {
  const { get, post, put } = useApiService();

  // Get joinable courts with filters
  const getJoinableCourts = (filters?: {
    date?: string;
    skill_level?: string;
    location?: string;
    min_price?: number;
    max_price?: number;
    players_needed?: number;
    limit?: number;
    offset?: number;
  }) => {
    return get<{ joinable_courts: JoinableBooking[] }>('/api/bookings/join/joinable', filters);
  };

  // Get joinable court details
  const getJoinableCourtDetails = (id: number) => {
    return get<{
      booking: JoinableBooking;
      players: BookingPlayer[];
      spots_available: number;
    }>(`/api/bookings/join/joinable/${id}`);
  };

  // Send join request
  const sendJoinRequest = (data: {
    booking_id: number;
    players_count: number;
    message?: string;
  }) => {
    return post<{
      message: string;
      join_request: BookingJoinRequest;
    }>('/api/bookings/join/request', data);
  };

  // Get join requests for a booking
  const getJoinRequests = (bookingId: number) => {
    return get<{ join_requests: BookingJoinRequest[] }>(
      `/api/bookings/join/requests/booking/${bookingId}`
    );
  };

  // Get user's join requests
  const getUserJoinRequests = () => {
    return get<{ join_requests: BookingJoinRequest[] }>('/api/bookings/join/requests/user');
  };

  // Respond to join request
  const respondToJoinRequest = (id: number, status: 'approved' | 'rejected') => {
    return put<{
      message: string;
      join_request: BookingJoinRequest;
    }>(`/api/bookings/join/request/${id}/respond`, { status });
  };

  return {
    getJoinableCourts,
    getJoinableCourtDetails,
    sendJoinRequest,
    getJoinRequests,
    getUserJoinRequests,
    respondToJoinRequest
  };
}

import { useApi } from '../composables/useApi';

export interface Court {
  id: number;
  name: string;
  description: string;
  location: string;
  district?: string;
  district_name?: string;
  hourly_rate: number;
  owner_id: number;
  owner_name?: string;
  owner_phone?: string;
  skill_level: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CourtSearchParams {
  query?: string;
  skill_level?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  date?: string;
  district?: string;
  time_slot?: string;
  price_range?: string;
}

export interface CourtTimeslot {
  id: number;
  court_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  price: number;
  is_available: boolean;
}

export function useCourtService() {
  const { get, post, put, delete: del } = useApi();

  // Public court endpoints
  const getAllCourts = () => {
    return get<{ courts: Court[] }>('/api/courts');
  };

  const getAvailableCourts = () => {
    return get<{ courts: Court[] }>('/api/courts/available');
  };

  const searchCourts = (params: CourtSearchParams) => {
    return get<{ courts: Court[] }>('/api/courts/search', params);
  };

  const getCourtById = (id: number) => {
    console.log('Calling API to get court by ID:', id);
    return get<{ court: Court, timeslots: CourtTimeslot[] }>(`/api/courts/${id}`);
  };

  const getCourtTimeslots = (courtId: number) => {
    return get<{ timeslots: CourtTimeslot[] }>(`/api/courts/${courtId}/timeslots`);
  };

  const getCourtAvailability = (courtId: number, date: string) => {
    return get<{ availability: any[] }>(`/api/courts/${courtId}/availability`, { date });
  };

  // Court owner endpoints
  const createCourt = (courtData: Partial<Court>) => {
    return post<{ court: Court }>('/api/courts', courtData);
  };

  const updateCourt = (id: number, courtData: Partial<Court>) => {
    return put<{ court: Court }>(`/api/courts/${id}`, courtData);
  };

  const deleteCourt = (id: number) => {
    return del<{ message: string }>(`/api/courts/${id}`);
  };

  const getCourtsByOwner = () => {
    return get<{ courts: Court[] }>('/api/courts/owner/my-courts');
  };

  // Court timeslot management
  const createTimeslot = (courtId: number, timeslotData: Partial<CourtTimeslot>) => {
    return post<{ timeslot: CourtTimeslot }>(`/api/courts/${courtId}/timeslots`, timeslotData);
  };

  const updateTimeslot = (courtId: number, timeslotId: number, timeslotData: Partial<CourtTimeslot>) => {
    return put<{ timeslot: CourtTimeslot }>(`/api/courts/${courtId}/timeslots/${timeslotId}`, timeslotData);
  };

  const deleteTimeslot = (courtId: number, timeslotId: number) => {
    return del<{ message: string }>(`/api/courts/${courtId}/timeslots/${timeslotId}`);
  };

  return {
    getAllCourts,
    getAvailableCourts,
    searchCourts,
    getCourtById,
    getCourtTimeslots,
    getCourtAvailability,
    createCourt,
    updateCourt,
    deleteCourt,
    getCourtsByOwner,
    createTimeslot,
    updateTimeslot,
    deleteTimeslot
  };
}

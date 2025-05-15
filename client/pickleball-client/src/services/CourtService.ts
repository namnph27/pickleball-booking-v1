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
  // Price range fields
  min_price?: number;
  max_price?: number;
  price_display?: string;
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
  specific_date?: string;
  is_default_timeslot?: boolean;
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

    // Security check for court owners
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.role === 'court_owner') {
      // Check if the user owns this court
      try {
        const storedCourts = localStorage.getItem('owner_courts');
        if (storedCourts) {
          const userCourts = JSON.parse(storedCourts);
          if (userCourts.length > 0 && !userCourts.some(court => court.id === id)) {
            console.warn('Court owner attempting to access court they do not own:', id);
            return Promise.reject('You do not have permission to access this court');
          }
        }
      } catch (e) {
        console.error('Error checking court ownership:', e);
      }
    }

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
    // Security check for court owners
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.role === 'court_owner') {
      // Check if the user owns this court
      try {
        const storedCourts = localStorage.getItem('owner_courts');
        if (storedCourts) {
          const userCourts = JSON.parse(storedCourts);
          if (userCourts.length > 0 && !userCourts.some(court => court.id === courtId)) {
            console.warn('Court owner attempting to create timeslot for court they do not own:', courtId);
            return Promise.reject('You do not have permission to create timeslots for this court');
          }
        }
      } catch (e) {
        console.error('Error checking court ownership for timeslot creation:', e);
      }
    }

    // Pass showToast: false to prevent automatic display of server messages
    return post<{ timeslot: CourtTimeslot }>(`/api/courts/${courtId}/timeslots`, timeslotData, false);
  };

  const updateTimeslot = (courtId: number, timeslotId: number, timeslotData: Partial<CourtTimeslot>) => {
    // Pass showToast: false to prevent automatic display of server messages
    return put<{ timeslot: CourtTimeslot }>(`/api/courts/timeslots/${timeslotId}`, timeslotData, false);
  };

  const deleteTimeslot = (courtId: number, timeslotId: number) => {
    // Pass showToast: false to prevent automatic display of server messages
    return del<{ message: string }>(`/api/courts/timeslots/${timeslotId}`, undefined, false);
  };

  const getTimeslotsByDate = (courtId: number, date: string) => {
    // Security check for court owners
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.role === 'court_owner') {
      // Check if the user owns this court
      try {
        const storedCourts = localStorage.getItem('owner_courts');
        if (storedCourts) {
          const userCourts = JSON.parse(storedCourts);
          if (userCourts.length > 0 && !userCourts.some(court => court.id === courtId)) {
            console.warn('Court owner attempting to access timeslots for court they do not own:', courtId);
            return Promise.reject('You do not have permission to access timeslots for this court');
          }
        }
      } catch (e) {
        console.error('Error checking court ownership for timeslots:', e);
      }
    }

    return get<{ timeslots: CourtTimeslot[] }>(`/api/courts/${courtId}/timeslots/by-date`, { date });
  };

  const getAvailableTimeslotsByDate = (courtId: number, date: string) => {
    return get<{ timeslots: CourtTimeslot[] }>(`/api/courts/${courtId}/timeslots/available`, { date });
  };

  const copyDayOfWeekTimeslotsToDate = (courtId: number, dayOfWeek: number, specificDate: string) => {
    // Pass showToast: false to prevent automatic display of server messages
    return post<{ timeslots: CourtTimeslot[], message: string }>(`/api/courts/${courtId}/timeslots/copy-day`, {
      day_of_week: dayOfWeek,
      specific_date: specificDate
    }, false);
  };

  const deleteTimeslotsByDate = (courtId: number, specificDate: string) => {
    // Pass showToast: false to prevent automatic display of server messages
    return del<{ message: string }>(`/api/courts/${courtId}/timeslots/by-date`, {
      specific_date: specificDate
    }, false);
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
    deleteTimeslot,
    getTimeslotsByDate,
    getAvailableTimeslotsByDate,
    copyDayOfWeekTimeslotsToDate,
    deleteTimeslotsByDate
  };
}

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useCourtService, type Court, type CourtSearchParams, type CourtTimeslot } from '../services/CourtService';

export const useCourtStore = defineStore('court', () => {
  const courtService = useCourtService();

  const courts = ref<Court[]>([]);
  const currentCourt = ref<Court | null>(null);
  const courtTimeslots = ref<CourtTimeslot[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const searchParams = ref<CourtSearchParams>({});

  const filteredCourts = computed(() => {
    let filtered = [...courts.value];

    // Filter by search query
    if (searchParams.value.query) {
      const query = searchParams.value.query.toLowerCase();
      filtered = filtered.filter(court =>
        court.name.toLowerCase().includes(query) ||
        court.location.toLowerCase().includes(query) ||
        (court.description && court.description.toLowerCase().includes(query))
      );
    }

    // Filter by skill level
    if (searchParams.value.skill_level) {
      filtered = filtered.filter(court =>
        court.skill_level === searchParams.value.skill_level ||
        court.skill_level === 'all'
      );
    }

    // Filter by location/district
    if (searchParams.value.location) {
      const location = searchParams.value.location.toLowerCase();
      filtered = filtered.filter(court =>
        court.location.toLowerCase().includes(location)
      );
    }

    // Filter by price range
    if (searchParams.value.min_price !== undefined) {
      filtered = filtered.filter(court => court.hourly_rate >= (searchParams.value.min_price || 0));
    }

    if (searchParams.value.max_price !== undefined) {
      filtered = filtered.filter(court => court.hourly_rate <= (searchParams.value.max_price || Infinity));
    }

    // Filter by date is now handled by the backend
    // The backend will return courts that are available on the selected date

    return filtered;
  });

  // Fetch all courts
  async function fetchCourts() {
    loading.value = true;
    error.value = null;

    try {
      const response = await courtService.getAllCourts();
      courts.value = response.courts;
      return response.courts;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch courts';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Fetch available courts
  async function fetchAvailableCourts() {
    loading.value = true;
    error.value = null;

    try {
      const response = await courtService.getAvailableCourts();
      courts.value = response.courts;
      return response.courts;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch available courts';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Search courts
  async function searchCourts(params: CourtSearchParams) {
    loading.value = true;
    error.value = null;
    searchParams.value = params;

    try {
      const response = await courtService.searchCourts(params);
      courts.value = response.courts;
      return response.courts;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to search courts';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Get court by ID
  async function getCourtById(id: number) {
    loading.value = true;
    error.value = null;

    try {
      const response = await courtService.getCourtById(id);
      currentCourt.value = response.court;
      return response.court;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch court details';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Get court timeslots
  async function getCourtTimeslots(courtId: number) {
    loading.value = true;
    error.value = null;

    try {
      const response = await courtService.getCourtTimeslots(courtId);
      courtTimeslots.value = response.timeslots;
      return response.timeslots;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch court timeslots';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Get court availability for a specific date
  async function getCourtAvailability(courtId: number, date: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await courtService.getCourtAvailability(courtId, date);
      return response.availability;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch court availability';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Create a new court (for court owners)
  async function createCourt(courtData: Partial<Court>) {
    loading.value = true;
    error.value = null;

    try {
      const response = await courtService.createCourt(courtData);
      return response.court;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to create court';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Update a court (for court owners)
  async function updateCourt(id: number, courtData: Partial<Court>) {
    loading.value = true;
    error.value = null;

    try {
      const response = await courtService.updateCourt(id, courtData);

      // Update the court in the courts array
      const index = courts.value.findIndex(c => c.id === id);
      if (index !== -1) {
        courts.value[index] = response.court;
      }

      // Update currentCourt if it's the same court
      if (currentCourt.value && currentCourt.value.id === id) {
        currentCourt.value = response.court;
      }

      return response.court;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to update court';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Delete a court (for court owners)
  async function deleteCourt(id: number) {
    loading.value = true;
    error.value = null;

    try {
      await courtService.deleteCourt(id);

      // Remove the court from the courts array
      courts.value = courts.value.filter(c => c.id !== id);

      // Clear currentCourt if it's the same court
      if (currentCourt.value && currentCourt.value.id === id) {
        currentCourt.value = null;
      }

      return true;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to delete court';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Get courts by owner (for court owners)
  async function getCourtsByOwner() {
    loading.value = true;
    error.value = null;

    try {
      const response = await courtService.getCourtsByOwner();
      courts.value = response.courts;
      return response.courts;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch owner courts';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Reset state
  function reset() {
    courts.value = [];
    currentCourt.value = null;
    courtTimeslots.value = [];
    error.value = null;
    searchParams.value = {};
  }

  return {
    courts,
    currentCourt,
    courtTimeslots,
    loading,
    error,
    searchParams,
    filteredCourts,
    fetchCourts,
    fetchAvailableCourts,
    searchCourts,
    getCourtById,
    getCourtTimeslots,
    getCourtAvailability,
    createCourt,
    updateCourt,
    deleteCourt,
    getCourtsByOwner,
    reset
  };
});

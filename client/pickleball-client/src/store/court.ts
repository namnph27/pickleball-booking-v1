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

    // Reset search parameters
    searchParams.value = {};

    console.log('Fetching all available courts');

    try {
      const response = await courtService.getAvailableCourts();
      console.log('Available courts response:', response);

      courts.value = response.courts;
      return response.courts;
    } catch (err: any) {
      console.error('Error in fetchAvailableCourts:', err);
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

    // Update search parameters
    searchParams.value = { ...params };

    console.log('Searching courts with params:', searchParams.value);

    try {
      // Clean up undefined and empty string values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
      );

      console.log('Clean search params:', cleanParams);

      const response = await courtService.searchCourts(cleanParams);
      console.log('Search response:', response);

      courts.value = response.courts;
      return response.courts;
    } catch (err: any) {
      console.error('Error in searchCourts:', err);
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
      console.log('Getting court by ID in store:', id);
      const response = await courtService.getCourtById(id);
      console.log('API response:', response);

      if (!response || !response.court) {
        console.error('Court not found in API response');
        throw new Error('Court not found');
      }

      console.log('Court data received in store:', response.court);

      // Make sure all required fields are present
      if (!response.court.name || !response.court.location || !response.court.district) {
        console.warn('Court data is missing required fields:', response.court);
      }

      // Set the current court
      currentCourt.value = response.court;

      // Also store timeslots if they are returned
      if (response.timeslots) {
        console.log('Timeslots received:', response.timeslots.length);
        courtTimeslots.value = response.timeslots;
      }

      return response.court;
    } catch (err: any) {
      console.error('Error getting court by ID:', err);
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
      console.log('Updating court with ID:', id);
      console.log('Court data to update:', courtData);

      // Make sure we have all required fields
      if (!courtData.name || !courtData.location || !courtData.district) {
        console.error('Missing required fields for court update');
        throw new Error('Missing required fields: name, location, and district are required');
      }

      const response = await courtService.updateCourt(id, courtData);
      console.log('Court update response:', response);

      if (!response || !response.court) {
        console.error('No court data returned from update API');
        throw new Error('Failed to update court: No court data returned');
      }

      // Update the court in the courts array
      const index = courts.value.findIndex(c => c.id === id);
      if (index !== -1) {
        console.log('Updating court in courts array at index:', index);
        courts.value[index] = response.court;
      } else {
        console.log('Court not found in courts array, adding it');
        courts.value.push(response.court);
      }

      // Update currentCourt if it's the same court
      if (currentCourt.value && currentCourt.value.id === id) {
        console.log('Updating currentCourt with new data');
        currentCourt.value = response.court;
      }

      return response.court;
    } catch (err: any) {
      console.error('Error updating court:', err);
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

      // Store the owner's courts in localStorage for security checks
      try {
        localStorage.setItem('owner_courts', JSON.stringify(response.courts));
      } catch (e) {
        console.error('Error storing owner courts in localStorage:', e);
      }

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

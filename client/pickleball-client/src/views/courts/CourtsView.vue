<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../services/api';
import type { Court } from '../../types';

const router = useRouter();
const courts = ref<Court[]>([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const selectedSkillLevel = ref('');

const skillLevels = [
  { label: 'All Levels', value: '' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' }
];

// Fetch courts from API
const fetchCourts = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // In a real app, this would be a call to your API
    // const response = await api.get('/api/courts');
    // courts.value = response.data;
    
    // For now, we'll use mock data
    setTimeout(() => {
      courts.value = [
        {
          id: 1,
          name: 'Downtown Pickleball Center',
          description: 'Modern indoor courts with professional lighting and equipment.',
          location: '123 Main St, Downtown',
          hourly_rate: 25,
          owner_id: 2,
          owner_name: 'Court Owner 1',
          skill_level: 'all',
          image_url: '',
          is_available: true,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Westside Pickleball Club',
          description: 'Outdoor courts with beautiful views and great atmosphere.',
          location: '456 West Ave, Westside',
          hourly_rate: 20,
          owner_id: 2,
          owner_name: 'Court Owner 1',
          skill_level: 'beginner',
          image_url: '',
          is_available: true,
          created_at: '2023-01-02T00:00:00Z'
        },
        {
          id: 3,
          name: 'Eastside Pickleball Arena',
          description: 'Competition-grade courts for serious players.',
          location: '789 East Blvd, Eastside',
          hourly_rate: 30,
          owner_id: 3,
          owner_name: 'Court Owner 2',
          skill_level: 'advanced',
          image_url: '',
          is_available: true,
          created_at: '2023-01-03T00:00:00Z'
        },
        {
          id: 4,
          name: 'Northside Community Courts',
          description: 'Family-friendly courts with coaching available.',
          location: '101 North Rd, Northside',
          hourly_rate: 15,
          owner_id: 3,
          owner_name: 'Court Owner 2',
          skill_level: 'intermediate',
          image_url: '',
          is_available: true,
          created_at: '2023-01-04T00:00:00Z'
        }
      ];
      loading.value = false;
    }, 500);
  } catch (err) {
    console.error('Error fetching courts:', err);
    error.value = 'Failed to load courts. Please try again.';
    loading.value = false;
  }
};

// Filter courts based on search query and skill level
const filteredCourts = computed(() => {
  return courts.value.filter(court => {
    const matchesSearch = 
      court.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      court.location.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (court.description && court.description.toLowerCase().includes(searchQuery.value.toLowerCase()));
    
    const matchesSkill = 
      !selectedSkillLevel.value || 
      court.skill_level === selectedSkillLevel.value || 
      court.skill_level === 'all';
    
    return matchesSearch && matchesSkill;
  });
});

// Navigate to court details
const viewCourtDetails = (courtId: number) => {
  router.push(`/courts/${courtId}`);
};

onMounted(() => {
  fetchCourts();
});
</script>

<template>
  <div class="courts-container">
    <h1>Find Pickleball Courts</h1>
    
    <!-- Search and Filter -->
    <div class="search-filter">
      <div class="search-box">
        <i class="pi pi-search"></i>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by name or location"
        />
      </div>
      
      <div class="filter-box">
        <label for="skill-level">Skill Level:</label>
        <select id="skill-level" v-model="selectedSkillLevel">
          <option v-for="level in skillLevels" :key="level.value" :value="level.value">
            {{ level.label }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>Loading courts...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle" style="font-size: 2rem"></i>
      <p>{{ error }}</p>
      <button @click="fetchCourts" class="btn-primary">Try Again</button>
    </div>
    
    <!-- No Results -->
    <div v-else-if="filteredCourts.length === 0" class="no-results">
      <i class="pi pi-info-circle" style="font-size: 2rem"></i>
      <p>No courts found matching your criteria.</p>
    </div>
    
    <!-- Courts Grid -->
    <div v-else class="courts-grid">
      <div 
        v-for="court in filteredCourts" 
        :key="court.id" 
        class="court-card"
        @click="viewCourtDetails(court.id)"
      >
        <div class="court-image">
          <div v-if="!court.image_url" class="image-placeholder">
            <i class="pi pi-image"></i>
          </div>
          <img v-else :src="court.image_url" :alt="court.name" />
        </div>
        
        <div class="court-info">
          <h3>{{ court.name }}</h3>
          <p class="court-location">
            <i class="pi pi-map-marker"></i> {{ court.location }}
          </p>
          <p class="court-description">{{ court.description }}</p>
          
          <div class="court-details">
            <span class="court-price">${{ court.hourly_rate }}/hour</span>
            <span 
              class="court-skill" 
              :class="{ 
                'beginner': court.skill_level === 'beginner',
                'intermediate': court.skill_level === 'intermediate',
                'advanced': court.skill_level === 'advanced',
                'all': court.skill_level === 'all'
              }"
            >
              {{ court.skill_level === 'all' ? 'All Levels' : court.skill_level }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.courts-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.courts-container h1 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

/* Search and Filter */
.search-filter {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--dark-gray);
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--medium-gray);
  border-radius: 4px;
  font-size: 1rem;
}

.filter-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-box select {
  padding: 0.75rem;
  border: 1px solid var(--medium-gray);
  border-radius: 4px;
  font-size: 1rem;
}

/* Loading and Error States */
.loading-state,
.error-state,
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--dark-gray);
}

.loading-state i,
.error-state i,
.no-results i {
  margin-bottom: 1rem;
}

.error-state button {
  margin-top: 1rem;
}

/* Courts Grid */
.courts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.court-card {
  background-color: var(--white);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.court-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.court-image {
  height: 180px;
  background-color: var(--medium-gray);
  position: relative;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--dark-gray);
  font-size: 2rem;
}

.court-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.court-info {
  padding: 1.5rem;
}

.court-info h3 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.court-location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--dark-gray);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.court-description {
  color: var(--text-color);
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.9rem;
}

.court-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.court-price {
  font-weight: bold;
  color: var(--primary-color);
}

.court-skill {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.court-skill.beginner {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.court-skill.intermediate {
  background-color: #fff8e1;
  color: #ff8f00;
}

.court-skill.advanced {
  background-color: #ffebee;
  color: #c62828;
}

.court-skill.all {
  background-color: #e3f2fd;
  color: #1565c0;
}

/* Responsive */
@media (max-width: 768px) {
  .search-filter {
    flex-direction: column;
  }
  
  .courts-grid {
    grid-template-columns: 1fr;
  }
}
</style>

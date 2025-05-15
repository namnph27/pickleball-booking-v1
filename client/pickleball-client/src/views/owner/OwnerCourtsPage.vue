<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useCourtStore } from '../../store/court';
import { useToast } from '../../composables/useToast';
import BaseLayout from '../../components/layout/BaseLayout.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseCard from '../../components/base/BaseCard.vue';
import BaseSpinner from '../../components/base/BaseSpinner.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseModal from '../../components/base/BaseModal.vue';
import BaseTable from '../../components/base/BaseTable.vue';

const { t } = useI18n();
const router = useRouter();
const courtStore = useCourtStore();
const toast = useToast();

// State
const viewMode = ref('grid'); // 'grid' or 'table'
const showDeleteModal = ref(false);
const courtToDelete = ref<number | null>(null);
const isDeleting = ref(false);
const searchQuery = ref('');
const openDropdownId = ref<number | null>(null);
const dropdownPositions = reactive<Record<number, { top: number; left: number; right: number }>>({});

// Computed properties
const courts = computed(() => courtStore.courts);
const loading = computed(() => courtStore.loading);

// Table columns
const columns = computed(() => [
  { field: 'name', header: t('courts.name'), sortable: true },
  { field: 'location', header: t('courts.location'), sortable: true },
  { field: 'hourly_rate', header: t('courts.hourlyRate'), sortable: true, align: 'right' as const },
  { field: 'skill_level', header: t('common.skillLevel'), sortable: true },
  { field: 'is_available', header: t('courts.availability'), sortable: true }
]);

// Filtered courts
const filteredCourts = computed(() => {
  if (!searchQuery.value) return courts.value;

  const query = searchQuery.value.toLowerCase();
  return courts.value.filter(court =>
    court.name.toLowerCase().includes(query) ||
    court.location.toLowerCase().includes(query) ||
    (court.description && court.description.toLowerCase().includes(query))
  );
});

// Format skill level
const formatSkillLevel = (level: string) => {
  return t(`common.${level}`);
};

// Format availability
const formatAvailability = (isAvailable: boolean) => {
  return isAvailable ? t('courts.available') : t('courts.unavailable');
};

// Get court image with fallback
const getCourtImage = (court: any) => {
  if (court.image_url) {
    // If image URL starts with /uploads, it's a server-side image
    if (court.image_url.startsWith('/uploads')) {
      // Use the API URL from environment variables
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${apiUrl}${court.image_url}`;
    }
    return court.image_url;
  }

  // Fallback to default image
  return '/images/courts/default-court.svg';
};

// Open delete modal
const openDeleteModal = (courtId: number) => {
  courtToDelete.value = courtId;
  showDeleteModal.value = true;
};

// Delete court
const deleteCourt = async () => {
  if (!courtToDelete.value) return;

  isDeleting.value = true;

  try {
    await courtStore.deleteCourt(courtToDelete.value);

    toast.success(t('courtOwner.courtDeleted'));
    showDeleteModal.value = false;
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.deleteError'));
  } finally {
    isDeleting.value = false;
    courtToDelete.value = null;
  }
};

// Edit court
const editCourt = (courtId: number) => {
  router.push(`/owner/courts/${courtId}/edit`);
};

// Manage timeslots
const manageTimeslots = (courtId: number) => {
  router.push(`/owner/courts/${courtId}/timeslots`);
};

// Toggle court availability
const toggleAvailability = async (courtId: number, isAvailable: boolean) => {
  try {
    const court = courts.value.find(c => c.id === courtId);
    if (!court) return;

    await courtStore.updateCourt(courtId, {
      ...court,
      is_available: !isAvailable
    });

    toast.success(
      isAvailable
        ? t('courtOwner.courtMarkedUnavailable')
        : t('courtOwner.courtMarkedAvailable')
    );
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.updateError'));
  }
};

// Handle row click in table view
const handleRowClick = ({ row }: { row: any }) => {
  editCourt(row.id);
};

// Toggle dropdown menu
const toggleDropdown = (courtId: number, event: Event) => {
  // Prevent the event from propagating to document click handler
  event.stopPropagation();

  // Calculate and store the position of the dropdown toggle button
  const toggleButton = event.currentTarget as HTMLElement;
  const rect = toggleButton.getBoundingClientRect();

  dropdownPositions[courtId] = {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    right: window.innerWidth - (rect.right + window.scrollX)
  };

  // Toggle dropdown: close if already open, open if closed
  if (openDropdownId.value === courtId) {
    openDropdownId.value = null;
  } else {
    openDropdownId.value = courtId;
  }
};

// Get dropdown position style
const getDropdownPosition = (courtId: number): Record<string, string> => {
  const position = dropdownPositions[courtId];
  if (!position) return {};

  // Check if dropdown would go off the right edge of the screen
  const rightAligned = position.right < 200; // 200px is the width of the dropdown

  const styles: Record<string, string> = {
    position: 'fixed',
    top: `${position.top}px`,
    zIndex: '1050'
  };

  if (rightAligned) {
    styles.right = `${position.right}px`;
  } else {
    styles.left = `${position.left}px`;
  }

  return styles;
};

// Close dropdown when clicking outside
const closeDropdowns = () => {
  openDropdownId.value = null;
};

// Add document click listener to close dropdowns
onMounted(() => {
  document.addEventListener('click', closeDropdowns);
});

// Remove event listener on unmount
onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns);
});

// Fetch courts on mount
onMounted(async () => {
  try {
    await courtStore.getCourtsByOwner();
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('courtOwner.fetchError'));
  }
});
</script>

<template>
  <BaseLayout :title="t('courtOwner.myCourts')">
    <!-- Header Actions -->
    <template #headerActions>
      <div class="view-toggle">
        <button
          class="toggle-button"
          :class="{ 'active': viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          <i class="pi pi-th-large"></i>
        </button>

        <button
          class="toggle-button"
          :class="{ 'active': viewMode === 'table' }"
          @click="viewMode = 'table'"
        >
          <i class="pi pi-list"></i>
        </button>
      </div>

      <BaseButton
        :label="t('courtOwner.addCourt')"
        variant="primary"
        icon="pi-plus"
        @click="router.push('/owner/courts/new')"
      />
    </template>

    <!-- Search and Filters -->
    <div class="courts-filters">
      <div class="search-container">
        <div class="search-input">
          <i class="pi pi-search search-icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('courts.searchPlaceholder')"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="courts-loading">
      <BaseSpinner />
    </div>

    <!-- No Courts -->
    <div v-else-if="courts.length === 0" class="no-courts">
      <i class="pi pi-building no-courts-icon"></i>
      <h3>{{ t('courtOwner.noCourts') }}</h3>
      <p>{{ t('courtOwner.addCourtDescription') }}</p>
      <BaseButton
        :label="t('courtOwner.addFirstCourt')"
        variant="primary"
        icon="pi-plus"
        @click="router.push('/owner/courts/new')"
      />
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="courts-grid">
      <BaseCard
        v-for="court in filteredCourts"
        :key="court.id"
        :image="getCourtImage(court)"
        :image-alt="court.name"
        class="court-card"
      >
        <template #header>
          <div class="court-header">
            <h3 class="court-name">{{ court.name }}</h3>
            <div class="court-availability">
              <span :class="['availability-badge', court.is_available ? 'available' : 'unavailable']">
                {{ court.is_available ? t('courts.available') : t('courts.unavailable') }}
              </span>
            </div>
          </div>
        </template>

        <div class="court-details">
          <div class="court-info">
            <div class="info-item">
              <i class="pi pi-map-marker"></i>
              <span>{{ court.location }}</span>
            </div>

            <!-- <div class="info-item">
              <i class="pi pi-dollar"></i>
              <span>${{ court.hourly_rate }}/{{ t('courts.hour') }}</span>
            </div> -->

            <div class="info-item">
              <i class="pi pi-users"></i>
              <span>{{ formatSkillLevel(court.skill_level) }}</span>
            </div>
          </div>

          <p v-if="court.description" class="court-description">
            {{ court.description.length > 100
              ? court.description.substring(0, 100) + '...'
              : court.description
            }}
          </p>
        </div>

        <template #footer>
          <div class="court-actions">
            <BaseButton
              :label="t('courtOwner.edit')"
              variant="outline"
              icon="pi-pencil"
              @click="editCourt(court.id)"
            />

            <BaseButton
              :label="t('courtOwner.timeslots')"
              variant="outline"
              icon="pi-clock"
              @click="manageTimeslots(court.id)"
            />

            <div class="dropdown">
              <button class="dropdown-toggle" @click="toggleDropdown(court.id, $event)" ref="dropdownToggle">
                <i class="pi pi-ellipsis-v"></i>
              </button>

              <Teleport to="body">
                <div
                  v-if="openDropdownId === court.id"
                  class="dropdown-menu dropdown-menu--open"
                  :style="getDropdownPosition(court.id)"
                >
                  <button
                    class="dropdown-item"
                    @click="toggleAvailability(court.id, court.is_available)"
                  >
                    <i :class="`pi ${court.is_available ? 'pi-eye-slash' : 'pi-eye'}`"></i>
                    {{ court.is_available ? t('courtOwner.markUnavailable') : t('courtOwner.markAvailable') }}
                  </button>

                  <button
                    class="dropdown-item dropdown-item--danger"
                    @click="openDeleteModal(court.id)"
                  >
                    <i class="pi pi-trash"></i>
                    {{ t('courtOwner.delete') }}
                  </button>
                </div>
              </Teleport>
            </div>
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- Table View -->
    <div v-else class="courts-table">
      <BaseTable
        :columns="columns"
        :data="filteredCourts"
        :loading="loading"
        striped
        hoverable
        @row-click="handleRowClick"
      >
        <!-- Skill Level Column -->
        <template #cell(skill_level)="{ value }">
          {{ formatSkillLevel(value) }}
        </template>

        <!-- Hourly Rate Column -->
        <template #cell(hourly_rate)="{ value }">
          ${{ value }}
        </template>

        <!-- Availability Column -->
        <template #cell(is_available)="{ value }">
          <span :class="['availability-badge', value ? 'available' : 'unavailable']">
            {{ formatAvailability(value) }}
          </span>
        </template>

        <!-- Actions Column -->
        <template #actions="{ row }">
          <div class="table-actions">
            <button
              class="action-button"
              @click.stop="editCourt(row.id)"
              title="Edit"
            >
              <i class="pi pi-pencil"></i>
            </button>

            <button
              class="action-button"
              @click.stop="manageTimeslots(row.id)"
              title="Manage Timeslots"
            >
              <i class="pi pi-clock"></i>
            </button>

            <button
              class="action-button"
              @click.stop="toggleAvailability(row.id, row.is_available)"
              title="Toggle Availability"
            >
              <i :class="`pi ${row.is_available ? 'pi-eye-slash' : 'pi-eye'}`"></i>
            </button>

            <button
              class="action-button action-button--danger"
              @click.stop="openDeleteModal(row.id)"
              title="Delete"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </template>
      </BaseTable>
    </div>

    <!-- Delete Court Modal -->
    <BaseModal
      v-model="showDeleteModal"
      :title="t('courtOwner.deleteCourt')"
      :ok-text="t('courtOwner.confirmDelete')"
      :cancel-text="t('common.cancel')"
      ok-variant="danger"
      :loading="isDeleting"
      @ok="deleteCourt"
    >
      <BaseAlert type="warning" :message="t('courtOwner.deleteWarning')" />

      <p class="delete-message">
        {{ t('courtOwner.deleteConfirmation') }}
      </p>
    </BaseModal>
  </BaseLayout>
</template>

<style scoped lang="scss">
.view-toggle {
  display: flex;
  margin-right: 1rem;

  .toggle-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--medium-gray);
    color: var(--dark-gray);
    cursor: pointer;

    &:first-child {
      border-radius: 4px 0 0 4px;
    }

    &:last-child {
      border-radius: 0 4px 4px 0;
    }

    &.active {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }
  }
}

.courts-filters {
  margin-bottom: 2rem;

  .search-container {
    max-width: 500px;

    .search-input {
      position: relative;

      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--dark-gray);
      }

      input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 1px solid var(--medium-gray);
        border-radius: 4px;
        font-size: 1rem;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }
    }
  }
}

.courts-loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.no-courts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  text-align: center;

  .no-courts-icon {
    font-size: 3rem;
    color: var(--dark-gray);
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--dark-gray);
    margin-bottom: 1.5rem;
    max-width: 500px;
  }
}

.courts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.court-card {
  height: 100%;

  .court-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .court-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .court-availability {
      .availability-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;

        &.available {
          background-color: rgba(76, 175, 80, 0.1);
          color: #2e7d32;
        }

        &.unavailable {
          background-color: rgba(244, 67, 54, 0.1);
          color: #c62828;
        }
      }
    }
  }

  .court-details {
    margin: 1rem 0;

    .court-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .info-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        i {
          color: var(--primary-color);
          width: 16px;
        }
      }
    }

    .court-description {
      font-size: 0.875rem;
      color: var(--dark-gray);
      margin: 0;
    }
  }

  .court-actions {
    display: flex;
    gap: 0.5rem;

    .dropdown {
      position: relative;

      .dropdown-toggle {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: 1px solid var(--medium-gray);
        border-radius: 4px;
        color: var(--dark-gray);
        cursor: pointer;

        &:hover {
          background-color: var(--light-gray);
        }
      }

      .dropdown-menu {
        width: 200px;
        background-color: var(--white);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        padding: 0.5rem 0;
        display: none;
        /* Ensure the dropdown is not cut off at the bottom of the screen */
        max-height: calc(100vh - 100px);
        overflow-y: auto;
        /* Add a subtle animation */
        animation: dropdown-fade-in 0.2s ease-out;

        &--open {
          display: block;
        }

        @keyframes dropdown-fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          text-align: left;
          font-size: 0.875rem;
          color: var(--text-color);
          cursor: pointer;

          &:hover {
            background-color: var(--light-gray);
          }

          &--danger {
            color: #f44336;

            &:hover {
              background-color: rgba(244, 67, 54, 0.1);
            }
          }
        }
      }
    }
  }
}

.courts-table {
  .availability-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;

    &.available {
      background-color: rgba(76, 175, 80, 0.1);
      color: #2e7d32;
    }

    &.unavailable {
      background-color: rgba(244, 67, 54, 0.1);
      color: #c62828;
    }
  }

  .table-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;

    .action-button {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: 1px solid var(--medium-gray);
      border-radius: 4px;
      color: var(--dark-gray);
      cursor: pointer;

      &:hover {
        background-color: var(--light-gray);
        color: var(--text-color);
      }

      &--danger:hover {
        background-color: rgba(244, 67, 54, 0.1);
        color: #f44336;
        border-color: #f44336;
      }
    }
  }
}

.delete-message {
  margin-top: 1rem;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .courts-grid {
    grid-template-columns: 1fr;
  }

  .court-card {
    .court-actions {
      flex-wrap: wrap;

      > * {
        flex: 1;
      }
    }
  }
}

/* Global styles for teleported dropdown menu */
:global(.dropdown-menu) {
  /* These styles will apply to the dropdown menu when teleported to body */
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
</style>

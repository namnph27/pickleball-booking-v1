<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useCourtStore } from '../store/court';
import BaseLayout from '../components/layout/BaseLayout.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseButton from '../components/base/BaseButton.vue';
import BaseInput from '../components/base/BaseInput.vue';
import BaseSelect from '../components/base/BaseSelect.vue';
import BaseSpinner from '../components/base/BaseSpinner.vue';
import BaseAlert from '../components/base/BaseAlert.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const courtStore = useCourtStore();

// Search and filter state
const selectedDistrict = ref(route.query.district?.toString() || '');
const selectedDate = ref(route.query.date?.toString() || '');
const selectedPriceRange = ref(route.query.price_range?.toString() || '');

// Pagination
const currentPage = ref(1);
const itemsPerPage = 8;

// Danh sách các quận của TP.HCM
const districtOptions = computed(() => [
  { value: '', label: 'Tất cả các quận' },
  { value: 'quan_1', label: 'Quận 1' },
  { value: 'quan_3', label: 'Quận 3' },
  { value: 'quan_4', label: 'Quận 4' },
  { value: 'quan_5', label: 'Quận 5' },
  { value: 'quan_6', label: 'Quận 6' },
  { value: 'quan_7', label: 'Quận 7' },
  { value: 'quan_8', label: 'Quận 8' },
  { value: 'quan_10', label: 'Quận 10' },
  { value: 'quan_11', label: 'Quận 11' },
  { value: 'quan_12', label: 'Quận 12' },
  { value: 'binh_thanh', label: 'Quận Bình Thạnh' },
  { value: 'phu_nhuan', label: 'Quận Phú Nhuận' },
  { value: 'go_vap', label: 'Quận Gò Vấp' },
  { value: 'tan_binh', label: 'Quận Tân Bình' },
  { value: 'tan_phu', label: 'Quận Tân Phú' },
  { value: 'binh_tan', label: 'Quận Bình Tân' },
  { value: 'thu_duc', label: 'Thành phố Thủ Đức' },
  { value: 'binh_chanh', label: 'Huyện Bình Chánh' },
  { value: 'nha_be', label: 'Huyện Nhà Bè' },
  { value: 'can_gio', label: 'Huyện Cần Giờ' },
  { value: 'cu_chi', label: 'Huyện Củ Chi' },
  { value: 'hoc_mon', label: 'Huyện Hóc Môn' }
]);

// Lấy ngày hiện tại theo định dạng YYYY-MM-DD
const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Danh sách các khoảng giá
const priceRangeOptions = computed(() => [
  { value: '', label: 'Tất cả các mức giá' },
  { value: '0-200000', label: '0 - 200.000 VNĐ' },
  { value: '200000-400000', label: '200.000 - 400.000 VNĐ' },
  { value: '400000-600000', label: '400.000 - 600.000 VNĐ' },
  { value: '600000-800000', label: '600.000 - 800.000 VNĐ' },
  { value: '800000-1000000', label: '800.000 - 1.000.000 VNĐ' },
  { value: '1000000+', label: 'Trên 1.000.000 VNĐ' }
]);

const filteredCourts = computed(() => courtStore.filteredCourts);

const paginatedCourts = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredCourts.value.slice(startIndex, endIndex);
});

const totalPages = computed(() => {
  return Math.ceil(filteredCourts.value.length / itemsPerPage);
});

// Methods
const searchCourts = async () => {
  // Phân tích khoảng giá nếu được chọn
  let minPrice, maxPrice;
  if (selectedPriceRange.value) {
    if (selectedPriceRange.value === '1000000+') {
      minPrice = 1000000;
    } else {
      const [min, max] = selectedPriceRange.value.split('-').map(Number);
      minPrice = min;
      maxPrice = max;
    }
  }

  const params = {
    district: selectedDistrict.value,
    date: selectedDate.value,
    price_range: selectedPriceRange.value,
    min_price: minPrice,
    max_price: maxPrice,
    location: selectedDistrict.value ? districtOptions.value.find(d => d.value === selectedDistrict.value)?.label : ''
  };

  // Update URL query params
  router.push({
    query: Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    )
  });

  // Reset pagination
  currentPage.value = 1;

  // Search courts
  await courtStore.searchCourts(params);
};

const resetFilters = () => {
  selectedDistrict.value = '';
  selectedDate.value = '';
  selectedPriceRange.value = '';

  // Clear URL query params
  router.push({ query: {} });

  // Reset pagination
  currentPage.value = 1;

  // Fetch all courts
  courtStore.fetchAvailableCourts();
};

const navigateToCourt = (courtId: number) => {
  router.push(`/courts/${courtId}`);
};

const changePage = (page: number) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Watch for route query changes
watch(() => route.query, (newQuery) => {
  selectedDistrict.value = newQuery.district?.toString() || '';
  selectedDate.value = newQuery.date?.toString() || '';
  selectedPriceRange.value = newQuery.price_range?.toString() || '';
}, { immediate: true });

// Animation effects
const animateOnScroll = () => {
  const elements = document.querySelectorAll('.animate-on-scroll');
  elements.forEach(element => {
    const position = element.getBoundingClientRect();
    // Check if element is in viewport
    if (position.top < window.innerHeight - 100) {
      element.classList.add('animate__animated', 'animate__fadeInUp');
    }
  });
};

// Format phone number to more readable format (e.g., 0912 345 678)
const formatPhoneNumber = (phone) => {
  if (!phone) return '';

  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    // For 10-digit numbers (most Vietnamese numbers)
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 11) {
    // For 11-digit numbers
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else {
    // For other lengths, just add spaces every 3 digits
    return cleaned.replace(/(\d{4})(\d{3})(\d+)/, '$1 $2 $3');
  }
};

// Fetch courts on mount
onMounted(async () => {
  if (Object.keys(route.query).length > 0) {
    await searchCourts();
  } else {
    await courtStore.fetchAvailableCourts();
  }

  // Add scroll event listener for animations
  window.addEventListener('scroll', animateOnScroll);
  // Initial check for elements in viewport
  setTimeout(animateOnScroll, 100);
});

// Remove event listener on component unmount
onBeforeUnmount(() => {
  window.removeEventListener('scroll', animateOnScroll);
});
</script>

<template>
  <BaseLayout :title="t('courts.findCourts')">
    <!-- Banner Section -->
    <div class="courts-banner">
      <div class="banner-overlay"></div>
      <div class="banner-content">
        <h1 class="banner-title animate__animated animate__fadeInDown">Tìm Sân Pickleball</h1>
        <p class="banner-subtitle animate__animated animate__fadeInUp">Khám phá các sân Pickleball tốt nhất tại TP.HCM</p>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="courts-filters">
      <div class="filters-container">
        <div class="filter-header">
          <h2 class="filter-title">Tìm kiếm sân phù hợp</h2>
          <p class="filter-subtitle">Lọc theo địa điểm, ngày và mức giá</p>
        </div>

        <div class="filter-groups">
          <div class="filter-group">
            <div class="filter-icon">
              <i class="pi pi-map-marker"></i>
            </div>
            <div class="filter-content">
              <label class="filter-label">Địa điểm</label>
              <BaseSelect
                v-model="selectedDistrict"
                :options="districtOptions"
                :placeholder="'Chọn quận/huyện'"
              />
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-icon">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="filter-content">
              <label class="filter-label">Ngày</label>
              <BaseInput
                v-model="selectedDate"
                type="date"
                :placeholder="'Chọn ngày'"
                :min="getCurrentDate()"
              />
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-icon">
              <i class="pi pi-dollar"></i>
            </div>
            <div class="filter-content">
              <label class="filter-label">Mức giá</label>
              <BaseSelect
                v-model="selectedPriceRange"
                :options="priceRangeOptions"
                :placeholder="'Chọn khoảng giá'"
              />
            </div>
          </div>
        </div>

        <div class="filter-actions">
          <BaseButton
            :label="'Tìm kiếm'"
            variant="primary"
            icon="pi-search"
            @click="searchCourts"
            class="search-button"
          />
          <BaseButton
            :label="'Đặt lại'"
            variant="outline"
            icon="pi-refresh"
            @click="resetFilters"
          />
        </div>
      </div>
    </div>

    <!-- Results Summary -->
    <div class="results-summary animate-on-scroll" v-if="!courtStore.loading && filteredCourts.length > 0">
      <h3 class="results-title">
        <span class="results-count">{{ filteredCourts.length }}</span> sân Pickleball được tìm thấy
      </h3>
      <p class="results-subtitle">
        <template v-if="selectedDistrict">
          <i class="pi pi-map-marker"></i>
          {{ districtOptions.find(d => d.value === selectedDistrict)?.label || 'Tất cả các quận' }}
        </template>
        <template v-if="selectedDate">
          <i class="pi pi-calendar"></i>
          {{ new Date(selectedDate).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) }}
        </template>
        <template v-if="selectedPriceRange">
          <i class="pi pi-dollar"></i>
          {{ priceRangeOptions.find(p => p.value === selectedPriceRange)?.label || 'Tất cả các mức giá' }}
        </template>
      </p>
    </div>

    <!-- Courts List -->
    <div class="courts-container">
      <div v-if="courtStore.loading" class="courts-loading">
        <BaseSpinner />
        <p>Đang tìm kiếm sân phù hợp...</p>
      </div>

      <div v-else-if="filteredCourts.length === 0" class="no-courts animate__animated animate__fadeIn">
        <div class="no-results-icon-container">
          <i class="pi pi-search-minus no-results-icon"></i>
          <div class="icon-circle"></div>
        </div>
        <h3>Không tìm thấy sân nào</h3>
        <p>Rất tiếc, chúng tôi không tìm thấy sân nào phù hợp với tiêu chí tìm kiếm của bạn. Vui lòng thử lại với các tiêu chí khác hoặc mở rộng phạm vi tìm kiếm.</p>
        <div class="no-results-filters">
          <div v-if="selectedDistrict" class="filter-tag">
            <i class="pi pi-map-marker"></i>
            {{ districtOptions.find(d => d.value === selectedDistrict)?.label }}
            <i class="pi pi-times" @click="selectedDistrict = ''; searchCourts()"></i>
          </div>
          <div v-if="selectedDate" class="filter-tag">
            <i class="pi pi-calendar"></i>
            {{ new Date(selectedDate).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            <i class="pi pi-times" @click="selectedDate = ''; searchCourts()"></i>
          </div>
          <div v-if="selectedPriceRange" class="filter-tag">
            <i class="pi pi-dollar"></i>
            {{ priceRangeOptions.find(p => p.value === selectedPriceRange)?.label }}
            <i class="pi pi-times" @click="selectedPriceRange = ''; searchCourts()"></i>
          </div>
        </div>
        <BaseButton
          :label="'Đặt lại tất cả bộ lọc'"
          variant="outline"
          icon="pi-refresh"
          @click="resetFilters"
          class="reset-button"
        />
      </div>

      <div v-else>
        <div class="courts-grid">
          <div
            v-for="(court, index) in paginatedCourts"
            :key="court.id"
            class="court-card-wrapper animate-on-scroll"
            :style="{ 'animation-delay': `${index * 0.1}s` }"
          >
            <BaseCard
              :image="court.image_url || '/images/default-court.jpg'"
              :image-alt="court.name"
              hoverable
              class="court-card"
              @click="navigateToCourt(court.id)"
            >
              <template #header>
                <div class="court-header">
                  <div class="court-header-content">
                    <h3 class="court-name">{{ court.name }}</h3>
                    <div class="court-location">
                      <i class="pi pi-map-marker location-icon"></i> {{ court.location }}
                    </div>
                  </div>
                  <div class="court-price">
                    <span class="price-value">{{ court.hourly_rate.toLocaleString() }} VNĐ</span>
                    <span class="price-unit">/giờ</span>
                  </div>
                </div>
              </template>

              <div class="court-content">
                <div v-if="court.description" class="court-description">
                  <i class="pi pi-info-circle description-icon"></i>
                  <p>
                    {{ court.description.length > 120
                      ? court.description.substring(0, 120) + '...'
                      : court.description
                    }}
                  </p>
                </div>

                <div class="court-contact-info">
                  <div class="contact-header">
                    <i class="pi pi-id-card contact-header-icon"></i>
                    <h4>Thông tin liên hệ</h4>
                  </div>

                  <div class="contact-details">
                    <div v-if="court.owner_name" class="contact-item">
                      <i class="pi pi-user contact-icon"></i>
                      <div>
                        <span class="contact-label">Chủ sân</span>
                        <span class="contact-value">{{ court.owner_name }}</span>
                      </div>
                    </div>

                    <div class="contact-item">
                      <i class="pi pi-phone contact-icon"></i>
                      <div>
                        <span class="contact-label">Điện thoại</span>
                        <a
                          v-if="court.owner_phone"
                          :href="`tel:${court.owner_phone}`"
                          class="contact-value phone-link"
                        >
                          {{ formatPhoneNumber(court.owner_phone) }}
                        </a>
                        <span v-else class="contact-value text-muted">Chưa cập nhật</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <template #footer>
                <div class="card-actions">
                  <BaseButton
                    :label="'Xem chi tiết'"
                    variant="outline"
                    icon="pi-info-circle"
                  />
                  <BaseButton
                    :label="'Đặt sân ngay'"
                    variant="primary"
                    icon="pi-calendar-plus"
                  />
                </div>
              </template>
            </BaseCard>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            class="pagination-button"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            <i class="pi pi-chevron-left"></i>
          </button>

          <template v-for="page in totalPages" :key="page">
            <button
              v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
              class="pagination-button"
              :class="{ 'active': page === currentPage }"
              @click="changePage(page)"
            >
              {{ page }}
            </button>

            <span
              v-else-if="page === currentPage - 2 || page === currentPage + 2"
              class="pagination-ellipsis"
            >
              ...
            </span>
          </template>

          <button
            class="pagination-button"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<style scoped lang="scss">
/* Banner Section */
.courts-banner {
  position: relative;
  height: 300px;
  background-image: url('/images/pickleball-banner.jpg');
  background-size: cover;
  background-position: center;
  margin-bottom: 3rem;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  .banner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, rgba(10, 35, 66, 0.8), rgba(30, 144, 255, 0.6));
  }

  .banner-content {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 2rem;
    color: white;
    z-index: 1;
  }

  .banner-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .banner-subtitle {
    font-size: 1.25rem;
    max-width: 600px;
    line-height: 1.5;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
}

/* Search and Filters */
.courts-filters {
  margin-bottom: 3rem;

  .filters-container {
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    transform: translateY(-50px);
    margin-bottom: -30px;
  }

  .filter-header {
    text-align: center;
    margin-bottom: 1rem;

    .filter-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }

    .filter-subtitle {
      font-size: 1rem;
      color: var(--dark-gray);
    }
  }

  .filter-groups {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .filter-group {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border-radius: 12px;
    background-color: var(--light-gray);
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(30, 144, 255, 0.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .filter-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background-color: var(--primary-color);
      color: white;
      border-radius: 50%;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .filter-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
    }
  }

  .filter-actions {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 2rem;

    .search-button {
      min-width: 180px;
      font-weight: 700;
      padding: 0.85rem 1.75rem;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      z-index: 1;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
        transition: all 0.6s ease;
        z-index: -1;
      }

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(10, 35, 66, 0.25);

        &::before {
          left: 100%;
        }
      }

      &:active {
        transform: translateY(-1px);
      }
    }

    :deep(.base-button) {
      min-width: 140px;
      border-radius: 8px;
      letter-spacing: 0.5px;
      font-size: 1rem;

      &.outline {
        position: relative;
        overflow: hidden;
        z-index: 1;

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 0;
          height: 100%;
          background-color: rgba(10, 35, 66, 0.05);
          transition: width 0.3s ease;
          z-index: -1;
        }

        &:hover::after {
          width: 100%;
        }
      }
    }
  }
}

/* Results Summary */
.results-summary {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .results-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-color);

    .results-count {
      color: var(--primary-color);
      font-weight: 700;
    }
  }

  .results-subtitle {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    color: var(--dark-gray);
    font-size: 0.875rem;

    i {
      margin-right: 0.5rem;
    }
  }
}

/* Courts Container */
.courts-container {
  min-height: 400px;
}

.courts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.court-card-wrapper {
  height: 100%;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-8px);

    &::after {
      opacity: 1;
    }
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 5%;
    width: 90%;
    height: 20px;
    background: radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
    border-radius: 50%;
  }
}

.court-card {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  background-color: #ffffff;

  &:hover {
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    transform: translateY(-5px);
  }

  .court-header {
    padding: 1.25rem;
    background-color: white;
    border-bottom: 1px solid rgba(10, 35, 66, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .court-header-content {
    flex: 1;
  }

  .court-name {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--primary-color);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .court-location {
    font-size: 0.875rem;
    color: var(--dark-gray);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;

    .location-icon {
      color: #ff6b6b;
    }
  }

  .court-price {
    background: linear-gradient(135deg, var(--primary-color) 0%, #1e90ff 100%);
    padding: 0.75rem 1rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 8px rgba(10, 35, 66, 0.1);
    position: relative;
    overflow: hidden;
    min-width: 120px;
    margin-left: 1rem;

    &::before {
      content: '';
      position: absolute;
      top: -10px;
      right: -10px;
      width: 40px;
      height: 40px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .price-value {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .price-unit {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .court-content {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .court-description {
    display: flex;
    gap: 1rem;
    background-color: rgba(245, 247, 250, 0.7);
    padding: 1rem;
    border-radius: 10px;
    position: relative;

    .description-icon {
      color: var(--primary-color);
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    p {
      font-size: 0.9rem;
      color: var(--dark-gray);
      line-height: 1.6;
      margin: 0;
    }
  }

  .court-contact-info {
    background-color: rgba(245, 247, 250, 0.5);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

    .contact-header {
      background-color: rgba(30, 144, 255, 0.1);
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .contact-header-icon {
        color: var(--primary-color);
        font-size: 1.1rem;
      }

      h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--primary-color);
      }
    }

    .contact-details {
      padding: 1rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.7);
        transform: translateY(-2px);
      }

      .contact-icon {
        color: var(--primary-color);
        font-size: 1rem;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(30, 144, 255, 0.1);
        border-radius: 50%;
        padding: 0.5rem;
        flex-shrink: 0;
      }

      div {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .contact-label {
        font-size: 0.8rem;
        color: var(--dark-gray);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .contact-value {
        font-weight: 600;
        color: var(--text-color);
        font-size: 0.95rem;
        word-break: break-word;
      }

      .phone-link {
        color: var(--primary-color);
        text-decoration: none;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;

        &:hover {
          color: #0056b3;
          text-decoration: underline;
        }

        &::after {
          content: '\e93b'; /* PrimeIcons phone icon */
          font-family: 'primeicons';
          font-size: 0.8rem;
          margin-left: 0.5rem;
          opacity: 0.7;
        }
      }

      .text-muted {
        color: var(--dark-gray);
        font-style: italic;
        font-weight: normal;
      }
    }
  }

  .card-actions {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background-color: rgba(10, 35, 66, 0.02);
    border-top: 1px solid rgba(10, 35, 66, 0.05);

    :deep(.base-button) {
      flex: 1;
      border-radius: 8px;
      transition: all 0.3s ease;

      &.primary {
        background: linear-gradient(135deg, var(--primary-color) 0%, #1e90ff 100%);
        box-shadow: 0 4px 8px rgba(10, 35, 66, 0.1);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(10, 35, 66, 0.15);
        }
      }

      &.outline {
        border: 1px solid rgba(30, 144, 255, 0.5);

        &:hover {
          background-color: rgba(30, 144, 255, 0.05);
        }
      }
    }
  }
}

/* Loading and No Results */
.courts-loading,
.no-courts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1.5rem;
  text-align: center;
  padding: 3rem;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.courts-loading {
  p {
    color: var(--dark-gray);
    font-size: 1.1rem;
    margin-top: 1rem;
  }
}

.no-courts {
  .no-results-icon-container {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;

    .no-results-icon {
      font-size: 3.5rem;
      color: #ff6b6b;
      z-index: 2;
    }

    .icon-circle {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 107, 107, 0.1);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
  }

  h3 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--text-color);
  }

  p {
    color: var(--dark-gray);
    margin-bottom: 1.5rem;
    max-width: 600px;
    line-height: 1.6;
    font-size: 1.05rem;
  }

  .no-results-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin-bottom: 1.5rem;

    .filter-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: rgba(10, 35, 66, 0.05);
      border-radius: 30px;
      font-size: 0.9rem;
      color: var(--text-color);

      i.pi-times {
        cursor: pointer;
        color: var(--dark-gray);
        transition: all 0.2s ease;

        &:hover {
          color: #ff6b6b;
        }
      }

      i.pi-map-marker {
        color: #ff6b6b;
      }

      i.pi-clock {
        color: #4caf50;
      }

      i.pi-dollar {
        color: #ff9800;
      }
    }
  }

  .reset-button {
    margin-top: 1rem;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(10, 35, 66, 0.05);
      transform: translateY(-2px);
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 3rem;
  margin-bottom: 2rem;

  .pagination-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 45px;
    height: 45px;
    border-radius: 8px;
    border: 1px solid var(--medium-gray);
    background-color: var(--white);
    color: var(--text-color);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background-color: rgba(10, 35, 66, 0.05);
    }

    &.active {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
      box-shadow: 0 4px 8px rgba(10, 35, 66, 0.2);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .pagination-ellipsis {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 45px;
    height: 45px;
    color: var(--dark-gray);
    font-weight: 600;
  }
}

/* Responsive Styles */
@media (max-width: 992px) {
  .courts-banner {
    height: 250px;

    .banner-title {
      font-size: 2.5rem;
    }

    .banner-subtitle {
      font-size: 1.1rem;
    }
  }

  .courts-filters {
    .filters-container {
      padding: 2rem;
    }
  }
}

@media (max-width: 768px) {
  .courts-banner {
    height: 200px;
    margin-bottom: 4rem;

    .banner-title {
      font-size: 2rem;
    }

    .banner-subtitle {
      font-size: 1rem;
    }
  }

  .courts-filters {
    .filters-container {
      padding: 1.5rem;
      transform: translateY(-70px);
    }

    .filter-header {
      .filter-title {
        font-size: 1.5rem;
      }
    }

    .filter-groups {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .filter-actions {
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;

      :deep(.base-button) {
        width: 100%;
      }
    }
  }

  .results-summary {
    flex-direction: column;

    .results-subtitle {
      flex-direction: column;
      gap: 0.5rem;
    }
  }

  .court-card {
    .court-header {
      flex-direction: column;

      .court-price {
        margin-left: 0;
        margin-top: 1rem;
        width: 100%;
      }
    }

    .court-contact-info {
      .contact-details {
        grid-template-columns: 1fr;
      }
    }

    .card-actions {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
}
</style>

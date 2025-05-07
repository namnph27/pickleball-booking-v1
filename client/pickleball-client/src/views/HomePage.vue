<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useCourtStore } from '../store/court';
import type { Court } from '../services/CourtService';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseSpinner from '../components/base/BaseSpinner.vue';

const { t } = useI18n();
const router = useRouter();
const courtStore = useCourtStore();

const featuredCourts = ref<Court[]>([]);
const loading = ref(false);
const activeTestimonial = ref(0);

// Mảng testimonials mẫu
const testimonials = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    role: 'Người chơi thường xuyên',
    image: '/images/testimonials/avatar1.jpg',
    content: 'Tôi rất hài lòng với dịch vụ đặt sân. Giao diện dễ sử dụng và tìm sân rất nhanh chóng!'
  },
  {
    id: 2,
    name: 'Trần Thị B',
    role: 'Người mới chơi',
    image: '/images/testimonials/avatar2.jpg',
    content: 'Là người mới chơi Pickleball, tôi dễ dàng tìm được sân phù hợp với trình độ của mình.'
  },
  {
    id: 3,
    name: 'Lê Văn C',
    role: 'Chủ sân Pickleball',
    image: '/images/testimonials/avatar3.jpg',
    content: 'Nền tảng giúp tôi quản lý sân dễ dàng và thu hút nhiều người chơi hơn.'
  }
];

// Thống kê mẫu
const statistics = [
  { value: '500+', label: 'Sân Pickleball', icon: 'pi-map-marker' },
  { value: '10,000+', label: 'Người chơi', icon: 'pi-users' },
  { value: '50,000+', label: 'Lượt đặt sân', icon: 'pi-calendar-plus' },
  { value: '4.8/5', label: 'Đánh giá', icon: 'pi-star' }
];

onMounted(async () => {
  loading.value = true;
  try {
    await courtStore.fetchAvailableCourts();
    featuredCourts.value = courtStore.courts.slice(0, 4);

    // Tự động chuyển testimonial
    setInterval(() => {
      activeTestimonial.value = (activeTestimonial.value + 1) % testimonials.length;
    }, 5000);
  } catch (error) {
    console.error('Error fetching courts:', error);
  } finally {
    loading.value = false;
  }
});



const navigateToCourt = (courtId: number) => {
  router.push(`/courts/${courtId}`);
};

const setActiveTestimonial = (index: number) => {
  activeTestimonial.value = index;
};
</script>

<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title animate__animated animate__fadeInDown">{{ t('home.title') }}</h1>
        <p class="hero-subtitle animate__animated animate__fadeInUp">{{ t('home.subtitle') }}</p>

        <div class="hero-actions animate__animated animate__fadeIn animate__delay-1s">
          <BaseButton
            :label="t('home.findCourts')"
            variant="primary"
            size="large"
            @click="router.push('/courts')"
          />
        </div>
      </div>
    </section>

    <!-- Statistics Section -->
    <section class="section section--stats">
      <div class="section-container">
        <h2 class="stats-title">{{ t('home.statsTitle') || 'Pickleball Việt Nam Trong Số Liệu' }}</h2>
        <p class="stats-subtitle">{{ t('home.statsSubtitle') || 'Cộng đồng Pickleball đang phát triển nhanh chóng tại Việt Nam' }}</p>

        <div class="stats-grid">
          <div v-for="(stat, index) in statistics" :key="index" class="stat-item">
            <div class="stat-icon">
              <i :class="`pi ${stat.icon}`"></i>
            </div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>


      </div>
    </section>

    <!-- How It Works Section -->
    <section class="section">
      <div class="section-container">
        <h2 class="section-title">{{ t('home.howItWorks') }}</h2>

        <div class="steps-container">
          <div class="step">
            <div class="step-icon">
              <i class="pi pi-user-plus"></i>
            </div>
            <div class="step-content">
              <h3 class="step-title">{{ t('home.createAccount') }}</h3>
              <p class="step-description">{{ t('home.createAccountDesc') }}</p>
            </div>
            <div class="step-number">1</div>
          </div>

          <div class="step-connector"></div>

          <div class="step">
            <div class="step-icon">
              <i class="pi pi-search"></i>
            </div>
            <div class="step-content">
              <h3 class="step-title">{{ t('home.findCourt') }}</h3>
              <p class="step-description">{{ t('home.findCourtDesc') }}</p>
            </div>
            <div class="step-number">2</div>
          </div>

          <div class="step-connector"></div>

          <div class="step">
            <div class="step-icon">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="step-content">
              <h3 class="step-title">{{ t('home.bookAndPlay') }}</h3>
              <p class="step-description">{{ t('home.bookAndPlayDesc') }}</p>
            </div>
            <div class="step-number">3</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Courts Section -->
    <section class="section section--gray">
      <div class="section-container">
        <h2 class="section-title">{{ t('home.featuredCourts') }}</h2>
        <p class="section-subtitle">{{ t('home.featuredCourtsDesc') }}</p>

        <div v-if="loading" class="courts-loading">
          <BaseSpinner />
        </div>

        <div v-else-if="featuredCourts.length === 0" class="no-courts">
          <p>{{ t('courts.noCourtsFound') }}</p>
          <BaseButton
            :label="t('common.refresh')"
            variant="outline"
            @click="courtStore.fetchAvailableCourts"
          />
        </div>

        <div v-else class="courts-grid">
          <div
            v-for="court in featuredCourts"
            :key="court.id"
            class="court-card-wrapper"
            @click="navigateToCourt(court.id)"
          >
            <BaseCard
              :image="court.image_url || '/images/default-court.jpg'"
              :image-alt="court.name"
              hoverable
              class="court-card"
            >
              <template #header>
                <div class="court-header">
                  <h3 class="court-name">{{ court.name }}</h3>
                  <div class="court-badge">{{ t(`common.${court.skill_level}`) }}</div>
                </div>
                <p class="court-location">
                  <i class="pi pi-map-marker"></i> {{ court.location }}
                </p>
              </template>

              <div class="court-details">
                <div class="court-features">
                  <div class="court-feature">
                    <i class="pi pi-clock"></i>
                    <span>{{ t('courts.openHours', { hours: '8:00 - 22:00' }) }}</span>
                  </div>
                  <div class="court-feature">
                    <i class="pi pi-users"></i>
                    <span>{{ t('courts.maxPlayers', { count: 4 }) }}</span>
                  </div>
                </div>

                <div class="court-price">
                  <span class="price-value">{{ court.hourly_rate }}đ</span>
                  <span class="price-unit">{{ t('courts.perHour') }}</span>
                </div>
              </div>

              <template #footer>
                <BaseButton
                  :label="t('courts.viewDetails')"
                  variant="primary"
                  full-width
                  @click="navigateToCourt(court.id)"
                />
              </template>
            </BaseCard>
          </div>
        </div>

        <div class="view-all-container">
          <BaseButton
            :label="t('common.viewAll')"
            variant="secondary"
            icon="pi-arrow-right"
            icon-position="right"
            @click="router.push('/courts')"
          />
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="section section--testimonials">
      <div class="section-container">
        <h2 class="section-title">{{ t('home.testimonials') }}</h2>

        <div class="testimonials-container">
          <div class="testimonials-carousel">
            <div
              v-for="(testimonial, index) in testimonials"
              :key="testimonial.id"
              class="testimonial-item"
              :class="{ 'active': index === activeTestimonial }"
            >
              <div class="testimonial-content">
                <i class="pi pi-quote-left quote-icon"></i>
                <p class="testimonial-text">{{ testimonial.content }}</p>
              </div>
              <div class="testimonial-author">
                <div class="testimonial-avatar">
                  <img :src="testimonial.image" :alt="testimonial.name" />
                </div>
                <div class="testimonial-info">
                  <h4 class="testimonial-name">{{ testimonial.name }}</h4>
                  <p class="testimonial-role">{{ testimonial.role }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="testimonial-dots">
            <button
              v-for="(testimonial, index) in testimonials"
              :key="testimonial.id"
              class="testimonial-dot"
              :class="{ 'active': index === activeTestimonial }"
              @click="setActiveTestimonial(index)"
            ></button>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Choose Us Section -->
    <section class="section section--features">
      <div class="section-container">
        <h2 class="section-title">{{ t('home.whyChoose') }}</h2>
        <p class="section-subtitle">{{ t('home.whyChooseDesc') }}</p>

        <div class="features-grid">
          <div class="feature">
            <div class="feature-icon">
              <i class="pi pi-search"></i>
            </div>
            <div class="feature-content">
              <h3 class="feature-title">{{ t('home.easySearch') }}</h3>
              <p class="feature-description">{{ t('home.easySearchDesc') }}</p>
            </div>
          </div>

          <div class="feature">
            <div class="feature-icon">
              <i class="pi pi-calendar-plus"></i>
            </div>
            <div class="feature-content">
              <h3 class="feature-title">{{ t('home.simpleBooking') }}</h3>
              <p class="feature-description">{{ t('home.simpleBookingDesc') }}</p>
            </div>
          </div>

          <div class="feature">
            <div class="feature-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="feature-content">
              <h3 class="feature-title">{{ t('home.skillMatching') }}</h3>
              <p class="feature-description">{{ t('home.skillMatchingDesc') }}</p>
            </div>
          </div>

          <div class="feature">
            <div class="feature-icon">
              <i class="pi pi-star"></i>
            </div>
            <div class="feature-content">
              <h3 class="feature-title">{{ t('home.rewardPoints') }}</h3>
              <p class="feature-description">{{ t('home.rewardPointsDesc') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section section--cta">
      <div class="section-container">
        <div class="cta-content">
          <h2 class="cta-title">{{ t('home.readyToPlay') }}</h2>
          <p class="cta-description">{{ t('home.readyToPlayDesc') }}</p>

          <div class="cta-actions">
            <BaseButton
              :label="t('common.register')"
              variant="primary"
              size="large"
              icon="pi-user-plus"
              class="cta-button cta-button--primary"
              @click="router.push('/register')"
            />
            <BaseButton
              :label="t('home.findCourts')"
              variant="outline"
              size="large"
              icon="pi-search"
              class="cta-button cta-button--secondary"
              @click="router.push('/courts')"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@import url('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css');

.home-page {
  width: 100%;
}

// Hero Section
.hero-section {
  position: relative;
  background-image: url('/images/hero/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  color: white;
  padding: 6rem 1rem;
  text-align: center;
  overflow: hidden;
  border-radius: 16px;
  margin: 1rem;

  @media (min-width: 576px) {
    padding: 6rem 1.5rem;
    border-radius: 20px;
  }

  @media (min-width: 768px) {
    padding: 7rem 2rem;
    margin: 1.5rem;
    border-radius: 24px;
  }

  @media (min-width: 992px) {
    padding: 8rem 2rem;
    border-radius: 28px;
  }

  @media (min-width: 1200px) {
    padding: 9rem 2rem;
    margin: 2rem;
    border-radius: 32px;
  }

  @media (min-width: 1400px) {
    padding: 10rem 2rem;
  }

  @media (min-width: 1600px) {
    padding: 11rem 2rem;
    background-position: center 30%;
  }

  @media (min-width: 1920px) {
    padding: 12rem 2rem;
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(10, 35, 66, 0.85), rgba(30, 144, 255, 0.75));
    z-index: 1;
  }

  .hero-content {
    position: relative;
    width: 100%;
    max-width: 540px;
    margin: 0 auto;
    z-index: 2;

    @media (min-width: 576px) {
      max-width: 540px;
    }

    @media (min-width: 768px) {
      max-width: 720px;
    }

    @media (min-width: 992px) {
      max-width: 840px;
    }

    @media (min-width: 1200px) {
      max-width: 900px;
    }

    @media (min-width: 1400px) {
      max-width: 1000px;
    }

    @media (min-width: 1600px) {
      max-width: 1100px;
    }
  }

  .hero-title {
    font-size: 2.25rem;
    font-weight: 800;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    animation-duration: 1.2s;
    position: relative;
    display: inline-block;

    &::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 4px;
      background-color: var(--accent-color);
      border-radius: 2px;
    }

    @media (min-width: 576px) {
      font-size: 2.5rem;
      margin-bottom: 1.25rem;

      &::after {
        width: 90px;
        bottom: -12px;
      }
    }

    @media (min-width: 768px) {
      font-size: 3rem;
      margin-bottom: 1.5rem;

      &::after {
        width: 100px;
        height: 5px;
        bottom: -15px;
      }
    }

    @media (min-width: 992px) {
      font-size: 3.5rem;

      &::after {
        width: 120px;
      }
    }

    @media (min-width: 1200px) {
      font-size: 3.75rem;

      &::after {
        width: 140px;
      }
    }

    @media (min-width: 1400px) {
      font-size: 4rem;
      margin-bottom: 2rem;

      &::after {
        width: 160px;
        height: 6px;
        bottom: -18px;
      }
    }

    @media (min-width: 1600px) {
      font-size: 4.5rem;

      &::after {
        width: 180px;
      }
    }
  }

  .hero-subtitle {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    margin-top: 2rem;
    opacity: 0.95;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.5;
    animation-duration: 1.2s;
    font-weight: 400;
    letter-spacing: 0.5px;

    @media (min-width: 576px) {
      font-size: 1.2rem;
      max-width: 500px;
      margin-top: 2.25rem;
    }

    @media (min-width: 768px) {
      font-size: 1.3rem;
      max-width: 600px;
      margin-bottom: 2.25rem;
      margin-top: 2.5rem;
      line-height: 1.6;
    }

    @media (min-width: 992px) {
      font-size: 1.4rem;
      max-width: 650px;
      margin-bottom: 2.5rem;
      margin-top: 2.75rem;
    }

    @media (min-width: 1200px) {
      font-size: 1.5rem;
      max-width: 700px;
      margin-top: 3rem;
    }

    @media (min-width: 1400px) {
      font-size: 1.75rem;
      max-width: 800px;
      margin-bottom: 3rem;
      margin-top: 3.5rem;
    }

    @media (min-width: 1600px) {
      font-size: 1.875rem;
      max-width: 900px;
      margin-top: 4rem;
    }
  }



  .hero-actions {
    margin-top: 3rem;
    animation-duration: 1.5s;
    position: relative;
    z-index: 10;

    @media (min-width: 576px) {
      margin-top: 3.25rem;
    }

    @media (min-width: 768px) {
      margin-top: 3.5rem;
    }

    @media (min-width: 992px) {
      margin-top: 4rem;
    }

    @media (min-width: 1200px) {
      margin-top: 4.5rem;
    }

    @media (min-width: 1400px) {
      margin-top: 5rem;
    }

    :deep(.base-button) {
      position: relative;
      overflow: hidden;
      transition: all 0.4s ease;
      transform: translateY(0);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        transform: translateX(-100%);
        transition: all 0.4s ease;
      }

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);

        &::before {
          transform: translateX(0);
        }
      }

      &:active {
        transform: translateY(-1px);
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
      }

      @media (min-width: 768px) {
        padding: 0.85rem 1.75rem;
        font-size: 1.1rem;
      }

      @media (min-width: 992px) {
        padding: 1rem 2rem;
        font-size: 1.15rem;
      }

      @media (min-width: 1200px) {
        padding: 1.1rem 2.25rem;
        font-size: 1.2rem;
      }

      @media (min-width: 1400px) {
        padding: 1.25rem 2.5rem;
        font-size: 1.25rem;
      }
    }
  }
}

// Statistics Section
.section--stats {
  padding: 3.5rem 1rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, #0A2342 100%);
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/images/pickleball-bg.jpg');
    background-size: cover;
    background-position: center;
    opacity: 0.08;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(76, 175, 80, 0.2) 0%, rgba(0, 0, 0, 0) 70%);
    z-index: 1;
  }

  .stats-title {
    font-size: 2.25rem;
    font-weight: 800;
    text-align: center;
    margin-bottom: 1rem;
    position: relative;
    z-index: 2;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

    @media (min-width: 576px) {
      font-size: 2.5rem;
    }

    @media (min-width: 768px) {
      font-size: 2.75rem;
    }

    @media (min-width: 992px) {
      font-size: 3rem;
    }

    @media (min-width: 1200px) {
      font-size: 3.25rem;
    }

    @media (min-width: 1400px) {
      font-size: 3.5rem;
    }
  }

  .stats-subtitle {
    font-size: 1.1rem;
    text-align: center;
    margin-bottom: 3rem;
    position: relative;
    z-index: 2;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    opacity: 0.9;

    @media (min-width: 576px) {
      font-size: 1.15rem;
    }

    @media (min-width: 768px) {
      font-size: 1.2rem;
      margin-bottom: 3.5rem;
    }

    @media (min-width: 992px) {
      font-size: 1.25rem;
      margin-bottom: 4rem;
    }

    @media (min-width: 1200px) {
      font-size: 1.3rem;
    }

    @media (min-width: 1400px) {
      font-size: 1.4rem;
      margin-bottom: 4.5rem;
    }
  }

  .stats-note {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2.5rem;
    font-size: 0.9rem;
    opacity: 0.7;
    position: relative;
    z-index: 2;

    i {
      margin-right: 0.5rem;
      font-size: 1rem;
    }

    @media (min-width: 768px) {
      margin-top: 3rem;
      font-size: 0.95rem;

      i {
        font-size: 1.1rem;
      }
    }

    @media (min-width: 992px) {
      margin-top: 3.5rem;
      font-size: 1rem;

      i {
        font-size: 1.2rem;
      }
    }

    @media (min-width: 1400px) {
      margin-top: 4rem;
      font-size: 1.1rem;

      i {
        font-size: 1.3rem;
      }
    }
  }

  @media (min-width: 576px) {
    padding: 3.5rem 1.5rem;
  }

  @media (min-width: 768px) {
    padding: 4rem 2rem;
  }

  @media (min-width: 992px) {
    padding: 4.5rem 2rem;
  }

  @media (min-width: 1200px) {
    padding: 5rem 2rem;
  }

  @media (min-width: 1400px) {
    padding: 5.5rem 2rem;
  }

  @media (min-width: 1600px) {
    padding: 6rem 2rem;
  }

  .stats-grid {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;
    text-align: center;
    position: relative;
    z-index: 2;

    @media (min-width: 576px) {
      flex-direction: row;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      gap: 1.75rem;
    }

    @media (min-width: 992px) {
      gap: 2rem;
    }

    @media (min-width: 1200px) {
      gap: 2.5rem;
    }

    @media (min-width: 1400px) {
      gap: 3rem;
    }

    @media (min-width: 1600px) {
      gap: 4rem;
    }
  }

  .stat-item {
    flex: 1;
    min-width: 200px;
    padding: 2rem 1.5rem;
    transition: all 0.5s ease;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 2;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 5px;
      background: linear-gradient(90deg, var(--accent-color), var(--primary-color));
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.5s ease;
      border-radius: 0 0 16px 16px;
    }

    @media (min-width: 576px) {
      min-width: 150px;
      padding: 2rem 1.5rem;
    }

    @media (min-width: 768px) {
      padding: 2.25rem 1.75rem;
    }

    @media (min-width: 992px) {
      min-width: 180px;
      padding: 2.5rem 2rem;
    }

    @media (min-width: 1200px) {
      min-width: 200px;
      padding: 2.75rem 2.25rem;
    }

    @media (min-width: 1400px) {
      padding: 3rem 2.5rem;
    }

    &:hover {
      transform: translateY(-15px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);

      &::before {
        opacity: 1;
      }

      &::after {
        transform: scaleX(1);
      }

      .stat-icon {
        transform: scale(1.15) rotate(5deg);
        box-shadow: 0 15px 30px rgba(76, 175, 80, 0.3);

        i {
          transform: scale(1.1);
        }
      }

      .stat-value {
        background: linear-gradient(135deg, #FFFFFF 0%, #4CAF50 100%);
        -webkit-background-clip: text;
        background-clip: text;
      }
    }
  }

  .stat-icon {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    opacity: 0.95;
    transition: all 0.5s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(33, 150, 243, 0.2) 100%);
    width: 90px;
    height: 90px;
    border-radius: 50%;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    &:hover::before {
      opacity: 1;
    }

    i {
      position: relative;
      z-index: 2;
      transition: transform 0.5s ease;
    }

    @media (min-width: 576px) {
      font-size: 2.25rem;
      width: 95px;
      height: 95px;
    }

    @media (min-width: 768px) {
      font-size: 2.5rem;
      margin-bottom: 1.75rem;
      width: 100px;
      height: 100px;
    }

    @media (min-width: 992px) {
      font-size: 2.75rem;
      width: 110px;
      height: 110px;
    }

    @media (min-width: 1200px) {
      font-size: 3rem;
      width: 120px;
      height: 120px;
      margin-bottom: 2rem;
    }

    @media (min-width: 1400px) {
      font-size: 3.25rem;
      margin-bottom: 2.25rem;
      width: 130px;
      height: 130px;
    }

    @media (min-width: 1600px) {
      font-size: 3.5rem;
      width: 140px;
      height: 140px;
      margin-bottom: 2.5rem;
    }
  }

  .stat-value {
    font-size: 2.25rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
    position: relative;
    display: inline-block;
    transition: all 0.5s ease;

    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 3px;
      background-color: var(--accent-color);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    &:hover::after {
      width: 60px;
    }

    @media (min-width: 576px) {
      font-size: 2.5rem;
    }

    @media (min-width: 768px) {
      font-size: 2.75rem;
      margin-bottom: 0.6rem;

      &::after {
        height: 4px;
        bottom: -10px;
      }
    }

    @media (min-width: 992px) {
      font-size: 3rem;
    }

    @media (min-width: 1200px) {
      font-size: 3.25rem;
    }

    @media (min-width: 1400px) {
      font-size: 3.5rem;
      margin-bottom: 0.75rem;
    }

    @media (min-width: 1600px) {
      font-size: 3.75rem;
    }
  }

  .stat-label {
    font-size: 1rem;
    opacity: 0.95;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    position: relative;
    z-index: 2;

    @media (min-width: 576px) {
      font-size: 1.05rem;
    }

    @media (min-width: 768px) {
      font-size: 1.1rem;
      letter-spacing: 0.75px;
    }

    @media (min-width: 992px) {
      font-size: 1.15rem;
    }

    @media (min-width: 1200px) {
      font-size: 1.2rem;
      letter-spacing: 1px;
    }

    @media (min-width: 1400px) {
      font-size: 1.25rem;
    }

    @media (min-width: 1600px) {
      font-size: 1.35rem;
    }
  }
}

// Section Styles
.section {
  padding: 5rem 1rem;
  border-radius: 16px;
  margin: 1rem;
  overflow: hidden;

  @media (min-width: 768px) {
    padding: 5rem 2rem;
    margin: 1.5rem;
    border-radius: 20px;
  }

  @media (min-width: 1200px) {
    padding: 6rem 2rem;
    margin: 2rem;
    border-radius: 24px;
  }

  &--gray {
    background-color: var(--light-gray);
  }

  &--testimonials {
    background-color: #f9f9f9;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('/images/pattern-bg.png');
      background-size: 300px;
      opacity: 0.05;
      z-index: 0;
    }
  }

  &--features {
    background-color: white;
  }

  &--cta {
    background: linear-gradient(135deg, var(--primary-color) 0%, #1E3A5F 100%);
    color: white;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      bottom: -50px;
      right: -50px;
      width: 200px;
      height: 200px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      z-index: 1;
    }

    &::before {
      content: '';
      position: absolute;
      top: -30px;
      left: -30px;
      width: 150px;
      height: 150px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      z-index: 1;
    }
  }

  .section-container {
    position: relative;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    z-index: 2;
    padding: 0 15px;

    @media (min-width: 576px) {
      max-width: 540px;
    }

    @media (min-width: 768px) {
      max-width: 720px;
    }

    @media (min-width: 992px) {
      max-width: 960px;
    }

    @media (min-width: 1200px) {
      max-width: 1140px;
    }

    @media (min-width: 1400px) {
      max-width: 1320px;
    }

    @media (min-width: 1600px) {
      max-width: 1480px;
    }

    @media (min-width: 1920px) {
      max-width: 1800px;
    }
  }

  .section-title {
    font-size: 2rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 1rem;
    position: relative;
    display: inline-block;
    left: 50%;
    transform: translateX(-50%);

    @media (min-width: 768px) {
      font-size: 2.25rem;
    }

    @media (min-width: 992px) {
      font-size: 2.5rem;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -15px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      background-color: var(--primary-color);
      border-radius: 2px;

      @media (min-width: 768px) {
        width: 70px;
      }

      @media (min-width: 992px) {
        width: 80px;
      }
    }

    @media (min-width: 1400px) {
      font-size: 2.75rem;
    }
  }

  .section-subtitle {
    text-align: center;
    color: var(--dark-gray);
    max-width: 100%;
    margin: 2.5rem auto 2.5rem;
    font-size: 1rem;
    line-height: 1.6;

    @media (min-width: 768px) {
      max-width: 600px;
      font-size: 1.05rem;
    }

    @media (min-width: 992px) {
      max-width: 700px;
      font-size: 1.1rem;
      margin: 2.5rem auto 3rem;
    }

    @media (min-width: 1400px) {
      max-width: 800px;
      font-size: 1.2rem;
      margin: 2.75rem auto 3.5rem;
    }
  }
}

// How It Works
.steps-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 3rem 0;
  position: relative;

  @media (min-width: 576px) {
    margin: 3.5rem 0;
  }

  @media (min-width: 768px) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    margin: 4rem 0;
  }

  @media (min-width: 992px) {
    margin: 4.5rem 0;
  }

  @media (min-width: 1200px) {
    margin: 5rem 0;

    &::after {
      content: '';
      position: absolute;
      top: 50px;
      left: 15%;
      width: 70%;
      height: 4px;
      background: linear-gradient(to right, rgba(76, 175, 80, 0.1), rgba(30, 144, 255, 0.2), rgba(76, 175, 80, 0.1));
      z-index: 1;
      border-radius: 2px;
    }
  }

  @media (min-width: 1400px) {
    margin: 6rem 0;
  }

  .step {
    flex: 1;
    width: 100%;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    padding: 1.5rem;
    margin-bottom: 3rem;
    transition: all 0.4s ease;
    background-color: white;
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    z-index: 2;

    @media (min-width: 576px) {
      padding: 1.75rem;
    }

    @media (min-width: 768px) {
      width: auto;
      min-width: 220px;
      margin-bottom: 0;
      padding: 2rem;
    }

    @media (min-width: 992px) {
      min-width: 250px;
      padding: 2.25rem;
    }

    @media (min-width: 1200px) {
      min-width: 280px;
      padding: 2.5rem;
    }

    @media (min-width: 1400px) {
      min-width: 300px;
      padding: 2.75rem;
    }

    @media (min-width: 1600px) {
      min-width: 320px;
      padding: 3rem;
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
      border-radius: 16px;
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    &:hover {
      transform: translateY(-15px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);

      &::before {
        opacity: 1;
      }

      .step-icon {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 15px 30px rgba(76, 175, 80, 0.3);
      }
    }

    &:last-child {
      margin-bottom: 0;
    }

    .step-icon {
      background: linear-gradient(135deg, var(--primary-color), #4CAF50);
      color: white;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.75rem;
      transition: all 0.4s ease;
      box-shadow: 0 10px 20px rgba(76, 175, 80, 0.2);
      z-index: 2;
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
        opacity: 0;
        transition: opacity 0.4s ease;
      }

      @media (min-width: 576px) {
        width: 100px;
        height: 100px;
        margin-bottom: 2rem;
      }

      @media (min-width: 768px) {
        width: 110px;
        height: 110px;
      }

      @media (min-width: 992px) {
        width: 120px;
        height: 120px;
        margin-bottom: 2.25rem;
      }

      @media (min-width: 1400px) {
        width: 140px;
        height: 140px;
        margin-bottom: 2.5rem;
      }

      @media (min-width: 1600px) {
        width: 160px;
        height: 160px;
      }

      &:hover::after {
        opacity: 1;
      }

      i {
        font-size: 2.25rem;
        position: relative;
        z-index: 2;

        @media (min-width: 576px) {
          font-size: 2.5rem;
        }

        @media (min-width: 768px) {
          font-size: 2.75rem;
        }

        @media (min-width: 992px) {
          font-size: 3rem;
        }

        @media (min-width: 1400px) {
          font-size: 3.5rem;
        }

        @media (min-width: 1600px) {
          font-size: 4rem;
        }
      }
    }

    .step-content {
      text-align: center;
      z-index: 2;
      width: 100%;

      @media (min-width: 1400px) {
        max-width: 90%;
      }
    }

    .step-title {
      font-size: 1.35rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: var(--primary-color);
      position: relative;
      display: inline-block;

      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 3px;
        background-color: var(--accent-color);
        border-radius: 2px;
      }

      @media (min-width: 576px) {
        font-size: 1.4rem;

        &::after {
          width: 50px;
        }
      }

      @media (min-width: 768px) {
        font-size: 1.5rem;
        margin-bottom: 1.25rem;

        &::after {
          width: 60px;
          height: 4px;
          bottom: -10px;
        }
      }

      @media (min-width: 992px) {
        font-size: 1.6rem;

        &::after {
          width: 70px;
        }
      }

      @media (min-width: 1200px) {
        font-size: 1.7rem;
      }

      @media (min-width: 1400px) {
        font-size: 1.85rem;
        margin-bottom: 1.5rem;

        &::after {
          width: 80px;
          bottom: -12px;
        }
      }

      @media (min-width: 1600px) {
        font-size: 2rem;
      }
    }

    .step-description {
      color: var(--dark-gray);
      line-height: 1.7;
      margin: 0;
      font-weight: 400;
      font-size: 0.95rem;

      @media (min-width: 576px) {
        font-size: 1rem;
      }

      @media (min-width: 768px) {
        font-size: 1.05rem;
        line-height: 1.8;
      }

      @media (min-width: 992px) {
        font-size: 1.1rem;
      }

      @media (min-width: 1200px) {
        font-size: 1.15rem;
      }

      @media (min-width: 1400px) {
        font-size: 1.2rem;
      }

      @media (min-width: 1600px) {
        font-size: 1.25rem;
      }
    }

    .step-number {
      position: absolute;
      top: -15px;
      right: -15px;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--secondary-color), #0A2342);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      z-index: 3;
      box-shadow: 0 5px 15px rgba(33, 150, 243, 0.4);
      border: 2px solid white;

      @media (min-width: 576px) {
        width: 45px;
        height: 45px;
        font-size: 1.2rem;
        top: -18px;
        right: -18px;
      }

      @media (min-width: 768px) {
        width: 50px;
        height: 50px;
        font-size: 1.3rem;
        top: -20px;
        right: -20px;
      }

      @media (min-width: 992px) {
        width: 55px;
        height: 55px;
        font-size: 1.4rem;
        top: -22px;
        right: -22px;
      }

      @media (min-width: 1400px) {
        width: 60px;
        height: 60px;
        font-size: 1.6rem;
        top: -25px;
        right: -25px;
      }

      @media (min-width: 1600px) {
        width: 70px;
        height: 70px;
        font-size: 1.8rem;
        top: -30px;
        right: -30px;
      }
    }
  }

  .step-connector {
    display: none;

    @media (min-width: 768px) {
      display: none;
    }

    @media (min-width: 992px) {
      display: none;
    }

    @media (min-width: 1200px) {
      display: block;
      flex: 0 0 5%;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: 50px;
        left: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(to right, rgba(76, 175, 80, 0.1), rgba(30, 144, 255, 0.2));
        border-radius: 2px;
      }
    }
  }
}

// Featured Courts
.courts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 2.5rem;

  @media (min-width: 576px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
  }

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2.25rem;
    margin-bottom: 2.75rem;
  }

  @media (min-width: 992px) {
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 2.5rem;
    margin-bottom: 3rem;
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 3rem;
    margin-bottom: 4rem;
  }

  @media (min-width: 1600px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 3.5rem;
  }

  @media (min-width: 1920px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 4rem;
  }
}

.court-card-wrapper {
  height: 100%;
  transition: transform 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-10px);
  }
}

.court-card {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: 1;
    pointer-events: none;
  }

  &:hover {
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    transform: translateY(-5px);

    &::before {
      opacity: 1;
    }

    :deep(.base-card__image-container img) {
      transform: scale(1.05);
    }
  }

  @media (min-width: 576px) {
    border-radius: 14px;
  }

  @media (min-width: 768px) {
    border-radius: 16px;
  }

  @media (min-width: 1200px) {
    :deep(.base-card__image-container) {
      height: 200px !important;
      overflow: hidden;

      img {
        transition: transform 0.5s ease;
      }
    }
  }

  @media (min-width: 1400px) {
    border-radius: 18px;

    :deep(.base-card__image-container) {
      height: 220px !important;
    }
  }

  @media (min-width: 1600px) {
    :deep(.base-card__image-container) {
      height: 240px !important;
    }
  }

  @media (min-width: 1920px) {
    :deep(.base-card__image-container) {
      height: 260px !important;
    }
  }

  .court-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .court-name {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-color);
    flex: 1;

    @media (min-width: 576px) {
      font-size: 1.25rem;
    }

    @media (min-width: 768px) {
      font-size: 1.3rem;
    }

    @media (min-width: 992px) {
      font-size: 1.35rem;
    }

    @media (min-width: 1200px) {
      font-size: 1.4rem;
    }

    @media (min-width: 1400px) {
      font-size: 1.5rem;
    }

    @media (min-width: 1600px) {
      font-size: 1.6rem;
    }
  }

  .court-badge {
    background: linear-gradient(135deg, var(--primary-color), #4CAF50);
    color: white;
    padding: 0.25rem 0.7rem;
    border-radius: 16px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    box-shadow: 0 3px 8px rgba(76, 175, 80, 0.2);
    letter-spacing: 0.5px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 12px rgba(76, 175, 80, 0.3);
    }

    @media (min-width: 576px) {
      padding: 0.25rem 0.75rem;
      font-size: 0.8rem;
    }

    @media (min-width: 768px) {
      padding: 0.3rem 0.8rem;
      font-size: 0.85rem;
      border-radius: 18px;
    }

    @media (min-width: 992px) {
      padding: 0.3rem 0.85rem;
    }

    @media (min-width: 1200px) {
      border-radius: 20px;
      padding: 0.35rem 0.9rem;
    }

    @media (min-width: 1400px) {
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      border-radius: 22px;
    }

    @media (min-width: 1600px) {
      font-size: 0.95rem;
      border-radius: 24px;
      padding: 0.45rem 1.1rem;
    }
  }

  .court-location {
    font-size: 0.85rem;
    color: var(--dark-gray);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.4rem;

    @media (min-width: 576px) {
      font-size: 0.9rem;
      margin-top: 0.45rem;
    }

    @media (min-width: 768px) {
      font-size: 0.95rem;
      margin-top: 0.5rem;
    }

    @media (min-width: 992px) {
      gap: 0.6rem;
    }

    @media (min-width: 1200px) {
      font-size: 1rem;
    }

    @media (min-width: 1400px) {
      font-size: 1.05rem;
      margin-top: 0.75rem;
      gap: 0.7rem;
    }
  }

  .court-details {
    margin: 1.25rem 0;

    @media (min-width: 576px) {
      margin: 1.35rem 0;
    }

    @media (min-width: 768px) {
      margin: 1.5rem 0;
    }

    @media (min-width: 992px) {
      margin: 1.6rem 0;
    }

    @media (min-width: 1200px) {
      margin: 1.75rem 0;
    }

    @media (min-width: 1400px) {
      margin: 2rem 0;
    }
  }

  .court-features {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1.25rem;

    @media (min-width: 576px) {
      gap: 0.65rem;
      margin-bottom: 1.35rem;
    }

    @media (min-width: 768px) {
      gap: 0.7rem;
      margin-bottom: 1.5rem;
    }

    @media (min-width: 992px) {
      gap: 0.75rem;
    }

    @media (min-width: 1200px) {
      margin-bottom: 1.75rem;
    }

    @media (min-width: 1400px) {
      gap: 1rem;
      margin-bottom: 2rem;
    }
  }

  .court-feature {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.85rem;
    color: var(--text-color);

    @media (min-width: 576px) {
      gap: 0.65rem;
      font-size: 0.9rem;
    }

    @media (min-width: 768px) {
      gap: 0.7rem;
      font-size: 0.95rem;
    }

    @media (min-width: 992px) {
      gap: 0.75rem;
    }

    @media (min-width: 1200px) {
      font-size: 1rem;
    }

    @media (min-width: 1400px) {
      font-size: 1.05rem;
      gap: 1rem;
    }

    i {
      color: var(--primary-color);
      font-size: 1rem;

      @media (min-width: 576px) {
        font-size: 1.05rem;
      }

      @media (min-width: 768px) {
        font-size: 1.1rem;
      }

      @media (min-width: 992px) {
        font-size: 1.15rem;
      }

      @media (min-width: 1200px) {
        font-size: 1.2rem;
      }

      @media (min-width: 1400px) {
        font-size: 1.25rem;
      }
    }
  }

  .court-price {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin-top: 0.75rem;

    @media (min-width: 576px) {
      gap: 0.45rem;
      margin-top: 0.85rem;
    }

    @media (min-width: 768px) {
      gap: 0.5rem;
      margin-top: 1rem;
    }

    @media (min-width: 992px) {
      margin-top: 1.1rem;
    }

    @media (min-width: 1200px) {
      margin-top: 1.25rem;
    }

    @media (min-width: 1400px) {
      margin-top: 1.5rem;
    }

    .price-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-color);

      @media (min-width: 576px) {
        font-size: 1.3rem;
      }

      @media (min-width: 768px) {
        font-size: 1.4rem;
      }

      @media (min-width: 992px) {
        font-size: 1.45rem;
      }

      @media (min-width: 1200px) {
        font-size: 1.5rem;
      }

      @media (min-width: 1400px) {
        font-size: 1.65rem;
      }

      @media (min-width: 1600px) {
        font-size: 1.8rem;
      }
    }

    .price-unit {
      font-size: 0.8rem;
      color: var(--dark-gray);

      @media (min-width: 576px) {
        font-size: 0.85rem;
      }

      @media (min-width: 768px) {
        font-size: 0.9rem;
      }

      @media (min-width: 992px) {
        font-size: 0.95rem;
      }

      @media (min-width: 1400px) {
        font-size: 1rem;
      }
    }
  }

  :deep(.base-card__footer) {
    padding-top: 1rem;

    @media (min-width: 576px) {
      padding-top: 1.1rem;
    }

    @media (min-width: 768px) {
      padding-top: 1.2rem;
    }

    @media (min-width: 992px) {
      padding-top: 1.3rem;
    }

    @media (min-width: 1200px) {
      padding-top: 1.4rem;
    }

    @media (min-width: 1400px) {
      padding-top: 1.5rem;
    }

    .base-button {
      @media (min-width: 576px) {
        padding: 0.7rem 1.1rem;
        font-size: 0.95rem;
      }

      @media (min-width: 768px) {
        padding: 0.75rem 1.2rem;
        font-size: 1rem;
      }

      @media (min-width: 992px) {
        padding: 0.8rem 1.3rem;
        font-size: 1.05rem;
      }

      @media (min-width: 1200px) {
        padding: 0.85rem 1.4rem;
      }

      @media (min-width: 1400px) {
        padding: 0.9rem 1.5rem;
        font-size: 1.1rem;
      }
    }
  }
}

.courts-loading,
.no-courts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 1.25rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);

  @media (min-width: 576px) {
    min-height: 220px;
    gap: 1.35rem;
    padding: 1.6rem;
  }

  @media (min-width: 768px) {
    min-height: 250px;
    gap: 1.5rem;
    padding: 1.75rem;
    border-radius: 10px;
  }

  @media (min-width: 992px) {
    min-height: 280px;
    gap: 1.6rem;
    padding: 1.9rem;
  }

  @media (min-width: 1200px) {
    min-height: 300px;
    gap: 1.75rem;
    padding: 2rem;
    border-radius: 12px;
  }

  @media (min-width: 1400px) {
    min-height: 350px;
    gap: 2rem;
    padding: 2.5rem;
  }

  @media (min-width: 1600px) {
    min-height: 400px;
    padding: 3rem;
  }
}

.view-all-container {
  text-align: center;
  margin-top: 2rem;

  @media (min-width: 576px) {
    margin-top: 2.25rem;
  }

  @media (min-width: 768px) {
    margin-top: 2.5rem;
  }

  @media (min-width: 992px) {
    margin-top: 2.75rem;
  }

  @media (min-width: 1200px) {
    margin-top: 3rem;
  }

  @media (min-width: 1400px) {
    margin-top: 3.5rem;
  }

  @media (min-width: 1600px) {
    margin-top: 4rem;
  }

  :deep(.base-button) {
    @media (min-width: 576px) {
      padding: 0.7rem 1.4rem;
      font-size: 0.95rem;
    }

    @media (min-width: 768px) {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }

    @media (min-width: 992px) {
      padding: 0.8rem 1.6rem;
      font-size: 1.05rem;
    }

    @media (min-width: 1200px) {
      padding: 0.9rem 1.8rem;
    }

    @media (min-width: 1400px) {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }
  }
}

// Testimonials
.testimonials-container {
  max-width: 900px;
  margin: 3rem auto 0;
  position: relative;

  @media (min-width: 1400px) {
    max-width: 1000px;
    margin: 4rem auto 0;
  }

  @media (min-width: 1600px) {
    max-width: 1100px;
    margin: 5rem auto 0;
  }
}

.testimonials-carousel {
  position: relative;
  height: 300px;
  overflow: hidden;

  @media (min-width: 1400px) {
    height: 320px;
  }

  @media (min-width: 1600px) {
    height: 340px;
  }
}

.testimonial-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  transform: translateX(50px);
  transition: all 0.5s ease;
  visibility: hidden;

  &.active {
    opacity: 1;
    transform: translateX(0);
    visibility: visible;
  }
}

.testimonial-content {
  background-color: white;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
  margin-bottom: 2.5rem;
  position: relative;
  transition: all 0.4s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  @media (min-width: 1400px) {
    padding: 3rem;
    border-radius: 20px;
    margin-bottom: 3rem;
  }

  @media (min-width: 1600px) {
    padding: 3.5rem;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 60px;
    width: 40px;
    height: 40px;
    background-color: white;
    transform: rotate(45deg);
    box-shadow: 10px 10px 15px rgba(0, 0, 0, 0.05);
    z-index: -1;
    border-right: 1px solid rgba(0, 0, 0, 0.05);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    @media (min-width: 1400px) {
      width: 45px;
      height: 45px;
      bottom: -22px;
    }
  }
}

.quote-icon {
  font-size: 2.5rem;
  color: var(--primary-color);
  opacity: 0.15;
  position: absolute;
  top: 20px;
  left: 25px;
  transition: all 0.3s ease;

  .testimonial-content:hover & {
    opacity: 0.25;
    transform: scale(1.1);
  }

  @media (min-width: 1400px) {
    font-size: 3rem;
    top: 25px;
    left: 30px;
  }

  @media (min-width: 1600px) {
    font-size: 3.5rem;
  }
}

.testimonial-text {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-color);
  margin: 0;
  position: relative;
  z-index: 1;

  @media (min-width: 1400px) {
    font-size: 1.25rem;
    line-height: 1.8;
    padding-left: 1rem;
  }

  @media (min-width: 1600px) {
    font-size: 1.35rem;
  }
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-left: 2rem;

  @media (min-width: 1400px) {
    padding-left: 3rem;
    gap: 1.5rem;
  }
}

.testimonial-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid white;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(33, 150, 243, 0.3));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 1;
  }

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);

    &::before {
      opacity: 1;
    }

    img {
      transform: scale(1.1);
    }
  }

  @media (min-width: 1400px) {
    width: 95px;
    height: 95px;
    border-width: 5px;
  }

  @media (min-width: 1600px) {
    width: 110px;
    height: 110px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
}

.testimonial-info {
  display: flex;
  flex-direction: column;
}

.testimonial-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: var(--text-color);

  @media (min-width: 1400px) {
    font-size: 1.4rem;
    margin: 0 0 0.4rem;
  }

  @media (min-width: 1600px) {
    font-size: 1.5rem;
  }
}

.testimonial-role {
  font-size: 0.9rem;
  color: var(--dark-gray);
  margin: 0;

  @media (min-width: 1400px) {
    font-size: 1rem;
  }

  @media (min-width: 1600px) {
    font-size: 1.1rem;
  }
}

.testimonial-dots {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;

  @media (min-width: 1400px) {
    gap: 1rem;
    margin-top: 3rem;
  }
}

.testimonial-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #e0e0e0;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  @media (min-width: 1400px) {
    width: 14px;
    height: 14px;
  }

  @media (min-width: 1600px) {
    width: 16px;
    height: 16px;
  }

  &.active {
    background-color: var(--primary-color);
    transform: scale(1.2);
  }

  &:hover {
    background-color: #bdbdbd;
  }
}

// Features Grid
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 3rem;
  margin-top: 4rem;

  @media (min-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (min-width: 1400px) {
    gap: 4rem;
    margin-top: 5rem;
  }

  @media (min-width: 1600px) {
    gap: 5rem;
  }
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  transition: all 0.4s ease;
  padding: 1.5rem;
  border-radius: 24px;
  background-color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: 1;
    pointer-events: none;
  }

  @media (min-width: 1400px) {
    gap: 2rem;
    padding: 2rem;
  }

  @media (min-width: 1600px) {
    padding: 2.5rem;
  }

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);

    &::before {
      opacity: 1;
    }

    .feature-icon {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 15px 30px rgba(76, 175, 80, 0.3);

      i {
        transform: scale(1.1);
      }
    }
  }

  .feature-icon {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05));
    color: var(--primary-color);
    min-width: 90px;
    height: 90px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s ease;
    box-shadow: 0 10px 20px rgba(76, 175, 80, 0.1);
    position: relative;
    overflow: hidden;
    z-index: 2;

    &::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    &:hover::after {
      opacity: 1;
    }

    @media (min-width: 1400px) {
      min-width: 110px;
      height: 110px;
      border-radius: 20px;
    }

    @media (min-width: 1600px) {
      min-width: 130px;
      height: 130px;
      border-radius: 24px;
    }

    i {
      font-size: 2.25rem;
      transition: transform 0.4s ease;
      position: relative;
      z-index: 2;

      @media (min-width: 1400px) {
        font-size: 2.75rem;
      }

      @media (min-width: 1600px) {
        font-size: 3.25rem;
      }
    }
  }

  .feature-content {
    flex: 1;
  }

  .feature-title {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0 0 1rem;
    color: var(--primary-color);
    position: relative;
    display: inline-block;

    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 40px;
      height: 3px;
      background-color: var(--accent-color);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .feature:hover &::after {
      width: 60px;
    }

    @media (min-width: 1400px) {
      font-size: 1.6rem;
      margin: 0 0 1.25rem;

      &::after {
        height: 4px;
        bottom: -10px;
      }
    }

    @media (min-width: 1600px) {
      font-size: 1.8rem;
    }
  }

  .feature-description {
    color: var(--dark-gray);
    line-height: 1.7;
    margin: 0;
    font-weight: 400;
    position: relative;
    z-index: 2;

    @media (min-width: 1400px) {
      font-size: 1.15rem;
      line-height: 1.8;
    }

    @media (min-width: 1600px) {
      font-size: 1.25rem;
    }
  }
}

// CTA Section
.cta-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 2;

  @media (min-width: 1400px) {
    max-width: 900px;
  }

  @media (min-width: 1600px) {
    max-width: 1000px;
  }

  .cta-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: white;

    @media (min-width: 1400px) {
      font-size: 3rem;
      margin-bottom: 2rem;
    }

    @media (min-width: 1600px) {
      font-size: 3.5rem;
    }
  }

  .cta-description {
    font-size: 1.25rem;
    margin-bottom: 3rem;
    opacity: 0.95;
    line-height: 1.6;
    color: white;

    @media (min-width: 1400px) {
      font-size: 1.4rem;
      margin-bottom: 3.5rem;
      line-height: 1.7;
    }

    @media (min-width: 1600px) {
      font-size: 1.5rem;
      margin-bottom: 4rem;
    }
  }

  .cta-actions {
    display: flex;
    justify-content: center;
    gap: 1.5rem;

    @media (min-width: 1400px) {
      gap: 2rem;
    }

    :deep(.base-button) {
      position: relative;
      overflow: hidden;
      transition: all 0.4s ease;
      transform: translateY(0);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.2);
        transform: translateX(-100%);
        transition: all 0.4s ease;
      }

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25);

        &::before {
          transform: translateX(0);
        }
      }

      &:active {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
      }

      @media (min-width: 768px) {
        padding: 1.1rem 2.2rem;
        font-size: 1.15rem;
      }

      @media (min-width: 992px) {
        padding: 1.2rem 2.4rem;
        font-size: 1.2rem;
      }

      @media (min-width: 1400px) {
        padding: 1.25rem 2.5rem;
        font-size: 1.25rem;
      }

      @media (min-width: 1600px) {
        padding: 1.5rem 3rem;
        font-size: 1.35rem;
      }
    }

    :deep(.cta-button--primary) {
      font-weight: 700;
      letter-spacing: 0.5px;
      border-radius: 16px;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
      background: linear-gradient(135deg, #FF9800, #FF5722);
      border: none;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

      &:hover {
        background: linear-gradient(135deg, #FF5722, #FF9800);
      }

      @media (min-width: 1600px) {
        border-radius: 20px;
      }
    }

    :deep(.cta-button--secondary) {
      font-weight: 700;
      letter-spacing: 0.5px;
      border-radius: 16px;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid white;
      color: white;
      backdrop-filter: blur(5px);

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      @media (min-width: 1600px) {
        border-radius: 20px;
      }
    }
  }
}

// Responsive Styles
@media (max-width: 1200px) {
  .section {
    padding: 4rem 2rem;
  }
}

@media (max-width: 992px) {
  .hero-section {
    padding: 6rem 2rem;

    .hero-title {
      font-size: 3rem;
    }
  }

  .steps-container {
    flex-direction: column;
    align-items: center;
    gap: 3rem;

    .step {
      max-width: 400px;
      width: 100%;
    }
  }

  .feature {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 5rem 1.5rem;

    .hero-title {
      font-size: 2.5rem;
    }

    .hero-subtitle {
      font-size: 1.2rem;
    }

    .search-container {
      flex-direction: column;
      gap: 0.5rem;

      .search-input {
        border-radius: 8px;
        padding: 0.875rem 1.25rem;
      }
    }
  }

  .section {
    padding: 3.5rem 1.5rem;

    .section-title {
      font-size: 2rem;
    }

    .section-subtitle {
      font-size: 1rem;
      margin: 2rem auto 2.5rem;
    }
  }

  .testimonial-content {
    padding: 1.5rem;
  }

  .testimonial-text {
    font-size: 1rem;
  }

  .testimonial-author {
    padding-left: 1rem;
  }

  .cta-content {
    .cta-title {
      font-size: 2rem;
    }

    .cta-description {
      font-size: 1.1rem;
    }

    .cta-actions {
      flex-direction: column;
      gap: 1rem;
    }
  }

  .stats-grid {
    flex-direction: column;
    gap: 1.5rem;
  }

  .stat-item {
    padding: 1rem;
  }
}

@media (max-width: 576px) {
  .hero-section {
    padding: 4rem 1rem;

    .hero-title {
      font-size: 2rem;
    }

    .hero-subtitle {
      font-size: 1.1rem;
    }
  }

  .section {
    padding: 3rem 1rem;

    .section-title {
      font-size: 1.75rem;
    }
  }

  .courts-grid {
    grid-template-columns: 1fr;
  }

  .testimonials-carousel {
    height: 350px;
  }

  .testimonial-author {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-left: 0;
  }

  .testimonial-content::after {
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
  }
}
</style>

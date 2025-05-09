<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseLayout from '../../components/layout/BaseLayout.vue';
import BaseButton from '../../components/base/BaseButton.vue';

const { t } = useI18n();

// Animation state
const isLoaded = ref(false);
const showStars = ref(false);

onMounted(() => {
  // Trigger animations after component is mounted
  setTimeout(() => {
    isLoaded.value = true;
  }, 300);

  setTimeout(() => {
    showStars.value = true;
  }, 1000);
});
</script>

<template>
  <BaseLayout :title="t('rewards.myRewards')">
    <div class="coming-soon-container" :class="{ 'loaded': isLoaded }">
      <!-- Decorative elements -->
      <div class="stars-container" :class="{ 'show': showStars }">
        <div class="star" v-for="i in 20" :key="i" :style="{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 3}s`
        }"></div>
      </div>

      <!-- Pickleball animation -->
      <div class="pickleball-container">
        <div class="pickleball">
          <div class="pickleball-inner"></div>
          <div class="pickleball-holes">
            <div class="hole" v-for="i in 12" :key="i" :style="{
              transform: `rotate(${i * 30}deg) translateY(-18px)`
            }"></div>
          </div>
        </div>
        <div class="shadow"></div>
      </div>

      <!-- Coming soon text -->
      <div class="coming-soon-content">
        <h1 class="coming-soon-title">Coming Soon!</h1>
        <p class="coming-soon-description">
          Hệ thống điểm thưởng đang được phát triển. Bạn sẽ sớm có thể tích lũy điểm
          và đổi những phần quà hấp dẫn khi đặt sân tại Pickleball Zone!
        </p>

        <div class="features-preview">
          <div class="feature">
            <i class="pi pi-star-fill"></i>
            <span>Tích điểm mỗi lần đặt sân</span>
          </div>
          <div class="feature">
            <i class="pi pi-gift"></i>
            <span>Đổi quà hấp dẫn</span>
          </div>
          <div class="feature">
            <i class="pi pi-chart-line"></i>
            <span>Theo dõi lịch sử điểm thưởng</span>
          </div>
        </div>

        <BaseButton
          label="Quay lại trang chủ"
          variant="primary"
          icon="pi-home"
          @click="$router.push('/')"
          class="back-button"
        />
      </div>
    </div>
  </BaseLayout>
</template>

<style scoped lang="scss">
.coming-soon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;

  &.loaded {
    opacity: 1;
    transform: translateY(0);
  }
}

// Stars animation
.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 1s ease;

  &.show {
    opacity: 1;
  }

  .star {
    position: absolute;
    width: 6px;
    height: 6px;
    background-color: #1E90FF;
    border-radius: 50%;
    animation: twinkle infinite;

    &:nth-child(odd) {
      background-color: #0A2342;
    }

    &:nth-child(3n) {
      width: 8px;
      height: 8px;
    }

    &:nth-child(5n) {
      width: 4px;
      height: 4px;
    }
  }
}

// Pickleball animation
.pickleball-container {
  position: relative;
  margin-bottom: 2rem;

  .pickleball {
    width: 100px;
    height: 100px;
    background-color: #fff;
    border-radius: 50%;
    position: relative;
    animation: bounce 2s infinite ease-in-out;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);

    .pickleball-inner {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border-radius: 50%;
      border: 2px dashed #0A2342;
      opacity: 0.5;
    }

    .pickleball-holes {
      position: absolute;
      width: 100%;
      height: 100%;
      animation: rotate 15s infinite linear;

      .hole {
        position: absolute;
        width: 8px;
        height: 8px;
        background-color: #f5f7fa;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        margin-left: -4px;
        margin-top: -4px;
      }
    }
  }

  .shadow {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 12px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    animation: shadow 2s infinite ease-in-out;
  }
}

// Content styling
.coming-soon-content {
  text-align: center;
  max-width: 600px;
  z-index: 10;

  .coming-soon-title {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    color: #0A2342;
    text-shadow: 2px 2px 0 rgba(30, 144, 255, 0.2);
    position: relative;
    display: inline-block;

    &::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, #1E90FF, #0A2342);
      border-radius: 2px;
    }
  }

  .coming-soon-description {
    font-size: 1.2rem;
    line-height: 1.6;
    margin-bottom: 2.5rem;
    color: #555;
  }
}

// Features preview
.features-preview {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;

  .feature {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;

    i {
      font-size: 2rem;
      color: #1E90FF;
      background-color: rgba(30, 144, 255, 0.1);
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba(30, 144, 255, 0.2);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 15px rgba(30, 144, 255, 0.3);
      }
    }

    span {
      font-weight: 500;
      color: #333;
    }
  }
}

.back-button {
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-3px);
  }
}

// Animations
@keyframes twinkle {
  0% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0.2;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes shadow {
  0%, 100% {
    transform: translateX(-50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateX(-50%) scale(0.8);
    opacity: 0.1;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Responsive styles
@media (max-width: 768px) {
  .coming-soon-container {
    padding: 1.5rem;
  }

  .coming-soon-title {
    font-size: 2.5rem;
  }

  .coming-soon-description {
    font-size: 1rem;
  }

  .features-preview {
    gap: 1.5rem;

    .feature {
      i {
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
      }
    }
  }

  .pickleball {
    width: 80px !important;
    height: 80px !important;
  }
}

@media (max-width: 480px) {
  .coming-soon-title {
    font-size: 2rem;
  }

  .features-preview {
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>

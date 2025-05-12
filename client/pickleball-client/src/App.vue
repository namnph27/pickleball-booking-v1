<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from './store/auth';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const route = useRoute();
const { t, locale } = useI18n();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isCourtOwner = computed(() => authStore.isCourtOwner);
const user = computed(() => authStore.user);
const isMobileMenuOpen = ref(false);
const isUserDropdownOpen = ref(false);
const isLanguageDropdownOpen = ref(false);

// Check if current route is admin route
const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin');
});

const logout = () => {
  // Không cho phép đăng xuất thông thường nếu đang ở trang rejected-account
  if (route.name === 'rejected-account') {
    return;
  }
  authStore.logout();
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  // Close dropdowns when mobile menu is toggled
  isUserDropdownOpen.value = false;
  isLanguageDropdownOpen.value = false;
};

const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value;
  // Close other dropdown when this one is opened
  if (isUserDropdownOpen.value) {
    isLanguageDropdownOpen.value = false;
  }
};

const toggleLanguageDropdown = () => {
  isLanguageDropdownOpen.value = !isLanguageDropdownOpen.value;
  // Close other dropdown when this one is opened
  if (isLanguageDropdownOpen.value) {
    isUserDropdownOpen.value = false;
  }
};

const changeLanguage = (lang: string) => {
  locale.value = lang;
  isLanguageDropdownOpen.value = false;
};

const availableLanguages = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'English' }
];
</script>

<template>
  <div class="app-container">
    <!-- Check if current route is admin route -->
    <template v-if="isAdminRoute">
      <!-- Admin pages use their own layout -->
      <router-view />
    </template>

    <template v-else>
      <!-- Regular user pages with header and footer -->
      <!-- Navigation Header -->
      <header class="navbar">
        <div class="navbar-brand">
          <!-- Logo cho người chơi và khách - có thể click để về trang chủ -->
          <router-link v-if="!isAuthenticated || !isCourtOwner" to="/" class="logo">
            <img src="/images/pz-logo.png" alt="PZ Logo" class="logo-image" />
            <span class="logo-text">Pickleball Zone</span>
          </router-link>

          <!-- Logo cho chủ sân - không thể click để về trang chủ -->
          <div v-else class="logo">
            <img src="/images/pz-logo.png" alt="PZ Logo" class="logo-image" />
            <span class="logo-text">Pickleball Zone</span>
          </div>

          <button class="mobile-menu-toggle" @click="toggleMobileMenu">
            <i :class="isMobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'"></i>
          </button>
        </div>

        <nav class="navbar-menu" :class="{ 'navbar-menu--open': isMobileMenuOpen }">
          <!-- Hiển thị các liên kết khác nhau dựa trên vai trò người dùng -->

          <!-- Liên kết cho khách (chưa đăng nhập) -->
          <template v-if="!isAuthenticated">
            <router-link to="/" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('common.home') }}</router-link>
            <router-link to="/courts" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('common.courts') }}</router-link>
            <router-link to="/login" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('common.login') }}</router-link>
            <router-link to="/register" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('common.register') }}</router-link>
          </template>

          <!-- Liên kết cho người chơi đã đăng nhập -->
          <template v-else-if="!isCourtOwner">
            <router-link to="/" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('common.home') }}</router-link>
            <router-link to="/courts" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('common.courts') }}</router-link>
            <router-link to="/join-court" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('joinCourt.joinCourt') }}</router-link>
            <router-link to="/bookings" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('booking.myBookings') }}</router-link>
            <router-link to="/join-requests" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('joinRequests.menuTitle') }}</router-link>
          </template>

          <!-- Liên kết cho chủ sân đã đăng nhập -->
          <template v-else>
            <router-link to="/owner/courts" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('courtOwner.myCourts') }}</router-link>
            <router-link to="/owner/analytics" class="navbar-item" @click="isMobileMenuOpen = false">{{ t('courtOwner.analytics') }}</router-link>
          </template>

          <!-- User Dropdown -->
          <div v-if="isAuthenticated" class="user-dropdown">
            <button class="dropdown-trigger" @click="toggleUserDropdown">
              {{ user?.name }}
              <i class="pi" :class="isUserDropdownOpen ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </button>
            <div class="dropdown-menu" :class="{ 'dropdown-menu--open': isUserDropdownOpen }">
              <router-link to="/profile" class="dropdown-item" @click="isUserDropdownOpen = false; isMobileMenuOpen = false">{{ t('common.profile') }}</router-link>
              <!-- Chỉ hiển thị liên kết Điểm thưởng cho người chơi, không hiển thị cho chủ sân -->
              <router-link v-if="!isCourtOwner" to="/rewards" class="dropdown-item" @click="isUserDropdownOpen = false; isMobileMenuOpen = false">{{ t('rewards.myRewards') }}</router-link>
              <div class="dropdown-divider"></div>
              <button @click="logout" class="dropdown-item" :disabled="$route.name === 'rejected-account'" :class="{ 'dropdown-item--disabled': $route.name === 'rejected-account' }">{{ t('common.logout') }}</button>
            </div>
          </div>

          <!-- Language Selector -->
          <div class="language-selector">
            <button class="language-toggle" @click="toggleLanguageDropdown">
              <i class="pi pi-globe"></i>
              <span>{{ locale }}</span>
              <i class="pi pi-chevron-down dropdown-icon" :class="{ 'dropdown-icon--open': isLanguageDropdownOpen }"></i>
            </button>
            <div class="language-dropdown" :class="{ 'language-dropdown--open': isLanguageDropdownOpen }">
              <button
                v-for="lang in availableLanguages"
                :key="lang.code"
                class="language-option"
                :class="{ 'language-option--active': locale === lang.code }"
                @click="changeLanguage(lang.code)"
              >
                {{ lang.name }}
              </button>
            </div>
          </div>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="main-content">
        <router-view />
      </main>

      <!-- Footer - Chỉ hiển thị khi không phải là chủ sân đăng nhập -->
      <footer v-if="!isAuthenticated || !isCourtOwner" class="footer">
        <div class="footer-container">
          <div class="footer-top">
            <div class="footer-logo">
              <!-- Logo trong footer chỉ hiển thị cho khách và người chơi, không hiển thị cho chủ sân -->
              <router-link to="/" class="logo">
                <img src="/images/pz-logo.png" alt="PZ Logo" class="logo-image" />
              </router-link>
              <div class="logo-text">Pickleball Zone</div>
              <p class="footer-description">{{ t('footer.description') }}</p>
            </div>

            <div class="footer-nav">
              <div class="footer-nav-column">
                <h4 class="footer-heading">{{ t('footer.quickLinks') }}</h4>
                <ul class="footer-nav-list">
                  <li><router-link to="/" class="footer-nav-link">{{ t('common.home') }}</router-link></li>
                  <li><router-link to="/courts" class="footer-nav-link">{{ t('common.courts') }}</router-link></li>
                  <li><router-link to="/about" class="footer-nav-link">{{ t('common.about') }}</router-link></li>
                  <li><router-link to="/contact" class="footer-nav-link">{{ t('common.contactUs') }}</router-link></li>
                </ul>
              </div>

              <div class="footer-nav-column">
                <h4 class="footer-heading">{{ t('footer.legal') }}</h4>
                <ul class="footer-nav-list">
                  <li><a href="#" class="footer-nav-link">{{ t('common.termsOfService') }}</a></li>
                  <li><a href="#" class="footer-nav-link">{{ t('common.privacyPolicy') }}</a></li>
                  <li><a href="#" class="footer-nav-link">{{ t('common.refundPolicy') }}</a></li>
                </ul>
              </div>

              <div class="footer-nav-column">
                <h4 class="footer-heading">{{ t('footer.contact') }}</h4>
                <ul class="footer-nav-list">
                  <li class="footer-contact-item">
                    <i class="pi pi-map-marker"></i>
                    <span>{{ t('footer.address') }}</span>
                  </li>
                  <li class="footer-contact-item">
                    <i class="pi pi-phone"></i>
                    <span>{{ t('footer.phone') }}</span>
                  </li>
                  <li class="footer-contact-item">
                    <i class="pi pi-envelope"></i>
                    <span>{{ t('footer.email') }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="footer-bottom">
            <p class="copyright">&copy; {{ new Date().getFullYear() }} Pickleball Zone. {{ t('footer.allRightsReserved') }}</p>
            <div class="social-links">
              <a href="#" class="social-link"><i class="pi pi-facebook"></i></a>
              <a href="#" class="social-link"><i class="pi pi-instagram"></i></a>
              <a href="#" class="social-link"><i class="pi pi-youtube"></i></a>
              <!-- Đã ẩn nút Admin -->
            </div>
          </div>
        </div>
      </footer>
    </template>
  </div>
</template>

<style lang="scss">
/* Global Styles */
:root {
  --primary-color: #0A2342;
  --secondary-color: #1E90FF;
  --accent-color: #FF9800;
  --text-color: #333;
  --light-gray: #f5f5f5;
  --medium-gray: #e0e0e0;
  --dark-gray: #757575;
  --white: #ffffff;
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  --border-radius: 8px;
  --transition-speed: 0.3s;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Noto Sans', 'Roboto', 'Open Sans', 'Montserrat', sans-serif;
  color: var(--text-color);
  line-height: 1.6;
  background-color: var(--light-gray);
}

a {
  text-decoration: none;
  color: var(--secondary-color);
}

/* Override any hover effects for logo */
.navbar-brand .logo {
  pointer-events: auto !important;
  cursor: pointer !important;
  transition: none !important;
  padding: 0 !important;

  &:hover, &:focus, &:active {
    transform: none !important;
    box-shadow: none !important;
    background: none !important;
    background-color: transparent !important;
    text-decoration: none !important;
    color: inherit !important;
    opacity: 1 !important;
  }
}

/* Override main.css hover effect for logo */
@media (hover: hover) {
  .navbar-brand .logo:hover {
    background-color: transparent !important;
  }
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Montserrat', 'Noto Sans', sans-serif;
  font-weight: 600;
  line-height: 1.3;
}

input, textarea, select, button {
  font-family: 'Noto Sans', 'Roboto', sans-serif;
  font-size: 1rem;
}

/* Layout */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 2rem;
  background-color: var(--white);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand {
  display: flex;
  align-items: center;

  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    pointer-events: auto;
    cursor: pointer;
    transition: none;

    &:hover {
      transform: none;
      box-shadow: none;
      background: none;
      color: inherit;
    }

    .logo-image {
      height: 40px;
      width: auto;
      object-fit: contain;
      transition: none;

      &:hover {
        transform: none;
      }

      @media (min-width: 768px) {
        height: 45px;
      }

      @media (min-width: 992px) {
        height: 50px;
      }

      @media (min-width: 1200px) {
        height: 55px;
      }
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: bold;
      color: #0A2342;
      font-family: 'Montserrat', 'Noto Sans', sans-serif;
      letter-spacing: 0.5px;
      transition: none;

      &:hover {
        transform: none;
        color: #0A2342;
      }

      @media (min-width: 768px) {
        font-size: 1.6rem;
      }

      @media (min-width: 992px) {
        font-size: 1.7rem;
      }

      @media (min-width: 1200px) {
        font-size: 1.8rem;
      }
    }
  }

  .mobile-menu-toggle {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-color);
    cursor: pointer;
    margin-left: 1rem;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(10, 35, 66, 0.1) 0%, transparent 70%);
      transform: scale(0);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    &:hover {
      color: var(--primary-color);
      transform: rotate(90deg);

      &::before {
        transform: scale(1.5);
        opacity: 1;
      }
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.navbar-item {
  color: var(--text-color);
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.5rem 0.75rem;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(120deg, transparent, rgba(10, 35, 66, 0.05), transparent);
    transform: translateX(-100%);
    transition: all 0.6s ease;
    z-index: -1;
  }

  &:hover {
    color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(10, 35, 66, 0.05);

    &::before {
      transform: translateX(100%);
    }
  }

  &.router-link-active {
    color: var(--primary-color);
    font-weight: 600;
    background-color: rgba(10, 35, 66, 0.03);

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
      transform: scaleX(1);
      transform-origin: left;
      transition: transform 0.3s ease;
    }
  }
}

/* User Dropdown */
.user-dropdown {
  position: relative;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-color);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(30, 144, 255, 0.1) 0%, transparent 70%);
    transform: scale(0);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  &:hover {
    color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(10, 35, 66, 0.08);

    &::before {
      transform: scale(2);
      opacity: 1;
    }

    i {
      transform: rotate(180deg);
    }
  }

  i {
    transition: transform 0.3s ease;
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 220px;
  background-color: var(--white);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(10, 35, 66, 0.12);
  padding: 0.5rem 0;
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  margin-top: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(10, 35, 66, 0.05);

  &--open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

@media (hover: hover) {
  .user-dropdown:hover .dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  color: var(--text-color);
  text-align: left;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9375rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
    background-color: rgba(0, 0, 0, 0.05);
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background-color: var(--primary-color);
    transform: scaleY(0);
    transition: transform 0.3s ease;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, rgba(10, 35, 66, 0.05), transparent);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: -1;
  }

  &:hover {
    background-color: rgba(10, 35, 66, 0.02);
    color: var(--primary-color);
    padding-left: 1.5rem;

    &::before {
      transform: scaleY(1);
    }

    &::after {
      transform: translateX(0);
    }
  }

  &:active {
    transform: scale(0.98);
  }
}

.dropdown-divider {
  height: 1px;
  background-color: var(--medium-gray);
  margin: 0.5rem 0;
}

/* Language Selector */
.language-selector {
  position: relative;
  margin-left: 1rem;
}

.language-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-color);
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      transparent,
      rgba(30, 144, 255, 0.1),
      transparent,
      transparent
    );
    animation: rotate 4s linear infinite;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    color: var(--primary-color);
    border-color: rgba(30, 144, 255, 0.3);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.1);
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }

    i.pi-globe {
      transform: rotate(20deg);
    }
  }

  i {
    font-size: 1rem;
    color: var(--secondary-color);
    transition: transform 0.3s ease;

    &.dropdown-icon {
      font-size: 0.8rem;
      margin-left: 0.25rem;
      transition: transform 0.3s ease;

      &--open {
        transform: rotate(180deg);
      }
    }
  }

  span {
    font-weight: 500;
    text-transform: uppercase;
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.language-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 170px;
  background-color: var(--white);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.15);
  padding: 0.5rem 0;
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px) scale(0.95);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  margin-top: 0.5rem;
  border: 1px solid rgba(30, 144, 255, 0.1);
  overflow: hidden;

  &--open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  }
}

@media (hover: hover) {
  .language-selector:hover .language-dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  }
}

.language-option {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  color: var(--text-color);
  text-align: left;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9375rem;
  transition: all 0.3s ease;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0.5rem;
    top: 50%;
    transform: translateY(-50%) scale(0);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--secondary-color);
    opacity: 0;
    transition: all 0.3s ease;
  }

  &:hover {
    background-color: rgba(30, 144, 255, 0.05);
    color: var(--secondary-color);
    padding-left: 1.75rem;

    &::before {
      transform: translateY(-50%) scale(1);
      opacity: 1;
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &--active {
    color: var(--primary-color);
    font-weight: 600;
    background-color: rgba(10, 35, 66, 0.03);

    &::before {
      content: '';
      position: absolute;
      left: 0.5rem;
      top: 50%;
      transform: translateY(-50%) scale(1);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--primary-color);
      opacity: 1;
    }
  }
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 2rem;
  width: 100%;
  margin: 0 auto;
}

/* Footer */
.footer {
  background-color: var(--primary-color);
  padding: 0;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
  color: white;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

.footer-top {
  display: flex;
  flex-wrap: wrap;
  padding: 3rem 2rem;
  gap: 3rem;
  background: linear-gradient(135deg, rgba(10, 35, 66, 0.95), rgba(10, 35, 66, 0.85));
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

.footer-logo {
  flex: 1;
  min-width: 250px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;

  .logo {
    display: flex;
    justify-content: center;
    margin-bottom: 0.75rem;

    .logo-image {
      height: 70px;
      width: auto;
      filter: brightness(1.2);
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.05);
      }
    }
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
    margin-bottom: 1rem;
    text-align: center;
  }
}

.footer-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.6;
  max-width: 300px;
}

.footer-nav {
  flex: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  position: relative;
  z-index: 1;
}

.footer-nav-column {
  flex: 1;
  min-width: 160px;
}

.footer-heading {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  color: white;
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
  }
}

.footer-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-nav-list li {
  margin-bottom: 0.75rem;
}

.footer-nav-link {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  transition: all 0.3s ease;
  display: inline-block;
  position: relative;
  padding: 0.25rem 0;

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent-color), rgba(255, 255, 255, 0.8));
    transition: width 0.3s ease;
    border-radius: 2px;
  }

  &:hover {
    color: white;
    transform: translateX(5px);
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);

    &::before {
      width: 100%;
    }
  }
}

.footer-contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  i {
    color: var(--accent-color);
    font-size: 1rem;
  }

  span {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.95rem;
  }
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background-color: rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.copyright {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin: 0;
}

.social-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }

  &:hover {
    transform: translateY(-5px) scale(1.1);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    color: white;

    &::before {
      opacity: 1;
    }

    i {
      transform: scale(1.2);
    }
  }

  &:active {
    transform: translateY(-2px) scale(1.05);
  }

  i {
    font-size: 1rem;
    transition: transform 0.3s ease;
    position: relative;
    z-index: 1;
  }
}

.admin-link {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-left: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
    z-index: -1;
  }

  &:hover {
    color: white;

    &::before {
      transform: scaleX(1);
    }
  }
}

/* Responsive */
@media (max-width: 992px) {
  .navbar {
    padding: 0.75rem 1.5rem;
  }

  .main-content {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 0.75rem 1rem;
  }

  .navbar-brand {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .mobile-menu-toggle {
      display: block;
    }

    .logo {
      .logo-text {
        font-size: 1.2rem;
      }

      .logo-image {
        height: 30px;
      }
    }
  }

  .navbar-menu {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    flex-direction: column;
    background-color: var(--white);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    gap: 1rem;
    align-items: flex-start;
    display: none;
    z-index: 99;

    &--open {
      display: flex;
    }
  }

  .navbar-item {
    width: 100%;
    padding: 0.5rem 0;

    &.router-link-active::after {
      display: none;
    }
  }

  .user-dropdown {
    width: 100%;

    .dropdown-trigger {
      width: 100%;
      justify-content: space-between;
    }

    .dropdown-menu {
      position: static;
      width: 100%;
      box-shadow: none;
      margin-top: 0.5rem;
      border: 1px solid var(--medium-gray);
    }
  }

  .language-selector {
    width: 100%;
    margin-left: 0;

    .language-toggle {
      width: 100%;
      justify-content: space-between;
    }

    .language-dropdown {
      position: static;
      width: 100%;
      box-shadow: none;
      margin-top: 0.5rem;
      border: 1px solid var(--medium-gray);
    }
  }

  .main-content {
    padding: 1rem;
  }

  .footer {
    border-radius: 16px 16px 0 0;
  }

  .footer-top {
    padding: 2rem 1rem;
    flex-direction: column;
    gap: 2rem;
  }

  .footer-logo {
    text-align: center;

    .logo {
      justify-content: center;
    }
  }

  .footer-description {
    max-width: 100%;
    margin: 0 auto;
  }

  .footer-nav {
    flex-direction: column;
    gap: 2rem;
  }

  .footer-heading {
    &::after {
      left: 50%;
      transform: translateX(-50%);
    }
  }

  .footer-nav-column {
    text-align: center;
  }

  .footer-contact-item {
    justify-content: center;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem 1rem;
  }

  .social-links {
    justify-content: center;
  }
}
</style>

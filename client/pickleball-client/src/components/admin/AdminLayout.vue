<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '../../store/admin';

const router = useRouter();
const adminStore = useAdminStore();
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);

const admin = computed(() => adminStore.admin);
const isSuperAdmin = computed(() => adminStore.isSuperAdmin);

// Toggle sidebar collapse state
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// Toggle mobile sidebar
const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
};

// Logout admin
const logout = () => {
  adminStore.logout();
};

// Check if current route matches the given path
const isActive = (path: string) => {
  return router.currentRoute.value.path.startsWith(path);
};

onMounted(() => {
  // Initialize admin store
  adminStore.init();

  // Check if admin is authenticated
  if (!adminStore.isAuthenticated) {
    router.push('/admin/login');
  }
});
</script>

<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ 'collapsed': isSidebarCollapsed, 'mobile-open': isMobileSidebarOpen }">
      <div class="sidebar-header">
        <div class="logo-container">
          <img src="/images/pz-logo.png" alt="Pickleball Zone Admin" class="logo" />
          <span v-if="!isSidebarCollapsed" class="logo-text">Admin Panel</span>
        </div>
        <button class="collapse-btn" @click="toggleSidebar">
          <i class="pi" :class="isSidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left'"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/admin/dashboard" class="nav-item" :class="{ 'active': isActive('/admin/dashboard') }">
          <i class="pi pi-home"></i>
          <span v-if="!isSidebarCollapsed">Dashboard</span>
        </router-link>

        <router-link to="/admin/users" class="nav-item" :class="{ 'active': isActive('/admin/users') }">
          <i class="pi pi-users"></i>
          <span v-if="!isSidebarCollapsed">Quản lý người dùng</span>
        </router-link>

        <router-link to="/admin/courts" class="nav-item" :class="{ 'active': isActive('/admin/courts') }">
          <i class="pi pi-map"></i>
          <span v-if="!isSidebarCollapsed">Quản lý sân</span>
        </router-link>

        <router-link to="/admin/bookings" class="nav-item" :class="{ 'active': isActive('/admin/bookings') }">
          <i class="pi pi-calendar"></i>
          <span v-if="!isSidebarCollapsed">Quản lý đặt sân</span>
        </router-link>

        <router-link to="/admin/promotions" class="nav-item" :class="{ 'active': isActive('/admin/promotions') }">
          <i class="pi pi-tag"></i>
          <span v-if="!isSidebarCollapsed">Quản lý khuyến mãi</span>
        </router-link>

        <router-link to="/admin/rewards" class="nav-item" :class="{ 'active': isActive('/admin/rewards') }">
          <i class="pi pi-star"></i>
          <span v-if="!isSidebarCollapsed">Quản lý điểm thưởng</span>
        </router-link>

        <router-link to="/admin/payments" class="nav-item" :class="{ 'active': isActive('/admin/payments') }">
          <i class="pi pi-wallet"></i>
          <span v-if="!isSidebarCollapsed">Báo cáo thanh toán</span>
        </router-link>

        <template v-if="isSuperAdmin">
          <div class="nav-divider" v-if="!isSidebarCollapsed">
            <span>Super Admin</span>
          </div>
          <router-link to="/admin/settings" class="nav-item" :class="{ 'active': isActive('/admin/settings') }">
            <i class="pi pi-cog"></i>
            <span v-if="!isSidebarCollapsed">Cài đặt hệ thống</span>
          </router-link>
        </template>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="admin-main">
      <!-- Header -->
      <header class="admin-header">
        <div class="header-left">
          <button class="mobile-menu-btn" @click="toggleMobileSidebar">
            <i class="pi pi-bars"></i>
          </button>
          <h1 class="page-title">{{ $route.meta.title || 'Admin Panel' }}</h1>
        </div>

        <div class="header-right">
          <div class="admin-profile">
            <span class="admin-name">{{ admin?.full_name }}</span>
            <span class="admin-role" v-if="isSuperAdmin">Super Admin</span>
            <span class="admin-role" v-else>Admin</span>
            <button class="logout-button" @click="logout">
              <i class="pi pi-sign-out"></i>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="admin-content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.admin-sidebar {
  width: 250px;
  background-color: #0A2342;
  color: white;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;

  &.collapsed {
    width: 70px;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .logo {
        width: 32px;
        height: 32px;
      }

      .logo-text {
        font-weight: 600;
        font-size: 1.1rem;
        white-space: nowrap;
      }
    }

    .collapse-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    padding: 1rem 0;

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: all 0.2s ease;

      i {
        font-size: 1.25rem;
        min-width: 1.25rem;
        text-align: center;
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
      }

      &.active {
        background-color: #1E90FF;
        color: white;
      }
    }

    .nav-divider {
      margin: 1rem 0;
      padding: 0 1rem;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;

    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #333;

      @media (max-width: 768px) {
        display: block;
      }
    }

    .page-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;

    .admin-profile {
      display: flex;
      align-items: center;
      gap: 1rem;
      position: relative;

      .admin-name {
        font-weight: 600;
        color: #333;

        @media (max-width: 768px) {
          display: none;
        }
      }

      .admin-role {
        font-size: 0.8rem;
        background-color: #0A2342;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 500;

        @media (max-width: 768px) {
          display: none;
        }
      }

      .logout-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background-color: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: #d32f2f;
        }

        i {
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          padding: 0.5rem;

          span {
            display: none;
          }
        }
      }
    }
  }
}

.admin-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .admin-sidebar {
    position: fixed;
    top: 0;
    left: -250px;
    height: 100%;
    z-index: 1000;
    transition: left 0.3s ease;

    &.mobile-open {
      left: 0;
    }
  }

  .admin-layout {
    &.sidebar-collapsed {
      .admin-sidebar {
        left: -70px;

        &.mobile-open {
          left: 0;
        }
      }
    }
  }
}
</style>

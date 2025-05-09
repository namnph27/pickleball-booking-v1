<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout.vue';
import { useAdminStore } from '../../store/admin';

const router = useRouter();
const adminStore = useAdminStore();
const loading = ref(true);
const error = ref('');
const stats = ref({
  users: 0,
  courts: 0,
  bookings: 0,
  revenue: 0
});

// Fetch dashboard stats
const fetchDashboardStats = async () => {
  try {
    loading.value = true;
    error.value = '';

    console.log('Fetching dashboard stats...');
    console.log('Admin authenticated:', adminStore.isAuthenticated);
    console.log('Admin token exists:', !!localStorage.getItem('admin_token'));

    // Ensure admin token is set in headers
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    } else {
      console.error('No admin token found, redirecting to login');
      router.push('/admin/login');
      return;
    }

    // Giả lập dữ liệu thống kê (vì server không chạy)
    console.log('Using mock dashboard stats data');

    // Tạo dữ liệu giả lập
    const mockStats = {
      users: 120,
      courts: 25,
      bookings: 450,
      revenue: 45000000
    };

    // Cập nhật state
    stats.value = mockStats;

    console.log('Dashboard stats loaded:', stats.value);
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    error.value = 'Không thể tải dữ liệu thống kê';

    // If unauthorized, redirect to login
    if (err.response && err.response.status === 401) {
      console.log('Unauthorized access to dashboard, redirecting to login');
      adminStore.logout();
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // Check if admin is authenticated
  if (!adminStore.isAuthenticated) {
    console.log('Admin not authenticated, redirecting to login');
    router.push('/admin/login');
    return;
  }

  fetchDashboardStats();
});
</script>

<template>
  <AdminLayout>
    <div class="admin-dashboard">
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p>Đang tải dữ liệu...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem"></i>
        <p>{{ error }}</p>
        <button @click="fetchDashboardStats" class="btn-primary">Thử lại</button>
      </div>

      <div v-else class="admin-dashboard-content">
        <div class="welcome-section">
          <div class="welcome-message">
            <h2>Chào mừng, {{ adminStore.admin?.full_name || 'Admin' }}!</h2>
            <p>Đây là trang quản trị hệ thống Pickleball Zone. Bạn có thể quản lý người dùng, sân, đặt sân và nhiều hơn nữa.</p>
          </div>
          <div class="date-time">
            <div class="current-date">{{ new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</div>
            <div class="current-time">{{ new Date().toLocaleTimeString('vi-VN') }}</div>
          </div>
        </div>

        <div class="admin-stats">
          <div class="stat-card">
            <div class="stat-icon users-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-info">
              <h3>Người dùng</h3>
              <div class="stat-value">{{ stats.users }}</div>
              <p>Tổng số người dùng đã đăng ký</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon courts-icon">
              <i class="pi pi-map"></i>
            </div>
            <div class="stat-info">
              <h3>Sân</h3>
              <div class="stat-value">{{ stats.courts }}</div>
              <p>Tổng số sân có sẵn</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bookings-icon">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="stat-info">
              <h3>Đặt sân</h3>
              <div class="stat-value">{{ stats.bookings }}</div>
              <p>Tổng số lượt đặt sân</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon revenue-icon">
              <i class="pi pi-wallet"></i>
            </div>
            <div class="stat-info">
              <h3>Doanh thu</h3>
              <div class="stat-value">{{ stats.revenue.toLocaleString() }} VND</div>
              <p>Tổng doanh thu</p>
            </div>
          </div>
        </div>

        <div class="admin-actions">
          <h2>Thao tác nhanh</h2>
          <div class="action-buttons">
            <router-link to="/admin/users" class="action-button">
              <i class="pi pi-users"></i>
              <span>Quản lý người dùng</span>
            </router-link>

            <router-link to="/admin/courts" class="action-button">
              <i class="pi pi-map"></i>
              <span>Quản lý sân</span>
            </router-link>

            <router-link to="/admin/court-owners" class="action-button">
              <i class="pi pi-building"></i>
              <span>Quản lý chủ sân</span>
            </router-link>

            <router-link to="/admin/bookings" class="action-button">
              <i class="pi pi-calendar"></i>
              <span>Quản lý đặt sân</span>
            </router-link>

            <router-link to="/admin/promotions" class="action-button">
              <i class="pi pi-tag"></i>
              <span>Quản lý khuyến mãi</span>
            </router-link>

            <router-link to="/admin/rewards" class="action-button">
              <i class="pi pi-star"></i>
              <span>Quản lý điểm thưởng</span>
            </router-link>

            <router-link to="/admin/payments" class="action-button">
              <i class="pi pi-wallet"></i>
              <span>Báo cáo thanh toán</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-dashboard {
  padding: 0;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--dark-gray);

  i {
    margin-bottom: 1rem;
    color: #0A2342;
  }
}

.error-state button {
  margin-top: 1rem;
}

.admin-dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;

  .welcome-message {
    h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #0A2342;
    }

    p {
      color: var(--dark-gray);
      max-width: 600px;
    }
  }

  .date-time {
    text-align: right;

    .current-date {
      font-weight: 500;
      color: #0A2342;
      margin-bottom: 0.25rem;
    }

    .current-time {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1E90FF;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;

    .date-time {
      text-align: left;
    }
  }
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: var(--white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  align-items: center;
  gap: 1.25rem;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 1.75rem;
      color: white;
    }

    &.users-icon {
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
    }

    &.courts-icon {
      background: linear-gradient(135deg, #2196F3, #0D47A1);
    }

    &.bookings-icon {
      background: linear-gradient(135deg, #FF9800, #E65100);
    }

    &.revenue-icon {
      background: linear-gradient(135deg, #9C27B0, #4A148C);
    }
  }

  .stat-info {
    flex: 1;

    h3 {
      font-size: 1.1rem;
      color: var(--dark-gray);
      margin-top: 0;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 600;
      color: #0A2342;
      margin-bottom: 0.25rem;
    }

    p {
      color: var(--dark-gray);
      margin: 0;
      font-size: 0.9rem;
    }
  }
}

.admin-actions {
  margin-top: 1rem;

  h2 {
    color: var(--text-color);
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    position: relative;
    padding-bottom: 0.5rem;

    &:after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 50px;
      height: 3px;
      background-color: #0A2342;
      border-radius: 3px;
    }
  }
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  text-decoration: none;
  color: var(--text-color);
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);

    i {
      color: #1E90FF;
    }
  }

  i {
    font-size: 2.5rem;
    color: #0A2342;
    margin-bottom: 1rem;
    transition: color 0.3s;
  }

  span {
    font-weight: 500;
    font-size: 1rem;
  }
}

.btn-primary {
  background-color: #0A2342;
  color: var(--white);
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #1E90FF;
  }
}

@media (max-width: 768px) {
  .admin-stats {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .action-buttons {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .stat-card .stat-value {
    font-size: 2rem;
  }

  .action-button i {
    font-size: 2rem;
  }
}
</style>

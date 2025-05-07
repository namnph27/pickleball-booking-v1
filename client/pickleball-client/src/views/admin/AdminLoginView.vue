<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '../../store/admin';
import { useI18n } from 'vue-i18n';
import { useToast } from '../../composables/useToast';
import axios from 'axios';

const router = useRouter();
const adminStore = useAdminStore();
const { t } = useI18n();
const toast = useToast();

const credentials = reactive({
  username: '',
  password: ''
});

const errorMessage = ref('');

const login = async () => {
  if (!credentials.username || !credentials.password) {
    errorMessage.value = 'Vui lòng nhập tên đăng nhập và mật khẩu';
    return;
  }

  errorMessage.value = '';
  console.log('Bắt đầu đăng nhập với thông tin:', { username: credentials.username });

  try {
    // Gọi API đăng nhập thực tế
    await adminStore.login(credentials);

    // Hiển thị thông báo thành công
    toast.success('Đăng nhập thành công');

    // Kiểm tra token và thông tin admin
    console.log('Token đã được lưu:', !!localStorage.getItem('admin_token'));
    console.log('Admin đã được lưu:', !!localStorage.getItem('admin'));
    console.log('Admin store authenticated:', adminStore.isAuthenticated);

    // Chuyển hướng đến trang dashboard
    console.log('Đang chuyển hướng đến /admin/dashboard');
    await router.push('/admin/dashboard');
    console.log('Đã chuyển hướng thành công');
  } catch (error: any) {
    console.error('Login error:', error);
    errorMessage.value = typeof error === 'string' ? error : (error.message || 'Đăng nhập thất bại');
    toast.error(errorMessage.value);
  }
};
</script>

<template>
  <div class="admin-login-container">
    <div class="admin-login-card">
      <div class="admin-login-header">
        <img src="/images/pz-logo.png" alt="Pickleball Zone" class="admin-logo" />
        <h1>Quản trị viên</h1>
        <p>Đăng nhập vào hệ thống quản trị</p>
      </div>

      <form @submit.prevent="login" class="admin-login-form">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label for="username">Tên đăng nhập</label>
          <div class="input-with-icon">
            <i class="pi pi-user"></i>
            <input
              type="text"
              id="username"
              v-model="credentials.username"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Mật khẩu</label>
          <div class="input-with-icon">
            <i class="pi pi-lock"></i>
            <input
              type="password"
              id="password"
              v-model="credentials.password"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn-primary"
            :disabled="adminStore.loading"
          >
            <i class="pi pi-sign-in" v-if="!adminStore.loading"></i>
            <i class="pi pi-spin pi-spinner" v-else></i>
            {{ adminStore.loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
          </button>
        </div>
      </form>

      <div class="admin-login-footer">
        <p>Khu vực này chỉ dành cho quản trị viên được ủy quyền.</p>
        <router-link to="/" class="back-link">
          <i class="pi pi-arrow-left"></i> Quay lại trang chính
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
}

.admin-login-card {
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 450px;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  }
}

.admin-login-header {
  text-align: center;
  margin-bottom: 2.5rem;

  .admin-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 1rem;
  }

  h1 {
    color: #0A2342;
    margin-bottom: 0.5rem;
    font-size: 1.8rem;
    font-weight: 600;
  }

  p {
    color: var(--dark-gray);
    font-size: 1rem;
  }
}

.admin-login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 500;
    color: var(--text-color);
    font-size: 0.95rem;
  }

  .input-with-icon {
    position: relative;

    i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #0A2342;
      opacity: 0.7;
    }

    input {
      padding: 0.9rem 1rem 0.9rem 2.5rem;
      border: 1px solid var(--medium-gray);
      border-radius: 8px;
      font-size: 1rem;
      width: 100%;
      transition: border-color 0.3s, box-shadow 0.3s;

      &:focus {
        outline: none;
        border-color: #0A2342;
        box-shadow: 0 0 0 3px rgba(10, 35, 66, 0.1);
      }
    }
  }
}

.form-actions {
  margin-top: 1.5rem;

  button {
    width: 100%;
    padding: 0.9rem;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    i {
      font-size: 1.1rem;
    }
  }
}

.admin-login-footer {
  margin-top: 2.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--dark-gray);

  p {
    margin-bottom: 1rem;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #0A2342;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: #1E90FF;
  }
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.9rem;
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;

  &::before {
    content: "⚠️";
    margin-right: 0.5rem;
  }
}

.btn-primary {
  background-color: #0A2342;
  color: var(--white);
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover:not(:disabled) {
    background-color: #1E90FF;
  }

  &:disabled {
    background-color: #8da0b8;
    cursor: not-allowed;
  }
}

@media (max-width: 576px) {
  .admin-login-card {
    padding: 1.5rem;
    margin: 1rem;
  }

  .admin-login-header {
    .admin-logo {
      width: 60px;
      height: 60px;
    }

    h1 {
      font-size: 1.5rem;
    }
  }
}
</style>

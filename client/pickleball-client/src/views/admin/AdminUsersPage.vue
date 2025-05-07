<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AdminLayout from '../../components/admin/AdminLayout.vue';
import axios from 'axios';
import { useToast } from '../../composables/useToast';

const toast = useToast();
const users = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const roleFilter = ref('all');
const currentPage = ref(1);
const totalPages = ref(1);
const itemsPerPage = 10;

// Fetch users
const fetchUsers = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage,
      search: searchQuery.value || undefined,
      role: roleFilter.value !== 'all' ? roleFilter.value : undefined
    };

    const response = await axios.get('/api/admin/users', { params });
    users.value = response.data.users;
    totalPages.value = Math.ceil(response.data.total / itemsPerPage);
  } catch (err: any) {
    console.error('Error fetching users:', err);
    error.value = 'Không thể tải danh sách người dùng';
  } finally {
    loading.value = false;
  }
};

// Handle search
const handleSearch = () => {
  currentPage.value = 1;
  fetchUsers();
};

// Handle role filter change
const handleRoleFilterChange = () => {
  currentPage.value = 1;
  fetchUsers();
};

// Handle pagination
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchUsers();
};

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Toggle user status (active/inactive)
const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
  try {
    await axios.patch(`/api/admin/users/${userId}/status`, {
      active: !currentStatus
    });

    // Update user in the list
    const userIndex = users.value.findIndex((u: any) => u.id === userId);
    if (userIndex !== -1) {
      users.value[userIndex].active = !currentStatus;
    }

    toast.success(`Trạng thái người dùng đã được cập nhật`);
  } catch (err: any) {
    console.error('Error toggling user status:', err);
    toast.error('Không thể cập nhật trạng thái người dùng');
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <AdminLayout>
    <div class="admin-users-page">
      <div class="page-header">
        <h1>Quản lý người dùng</h1>
        <div class="header-actions">
          <div class="search-container">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm kiếm người dùng..."
              @keyup.enter="handleSearch"
            />
            <button class="search-button" @click="handleSearch">
              <i class="pi pi-search"></i>
            </button>
          </div>

          <div class="filter-container">
            <select v-model="roleFilter" @change="handleRoleFilterChange">
              <option value="all">Tất cả vai trò</option>
              <option value="customer">Người chơi</option>
              <option value="court_owner">Chủ sân</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p>Đang tải dữ liệu...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem"></i>
        <p>{{ error }}</p>
        <button @click="fetchUsers" class="btn-primary">Thử lại</button>
      </div>

      <div v-else-if="users.length === 0" class="empty-state">
        <i class="pi pi-users" style="font-size: 2rem"></i>
        <p>Không tìm thấy người dùng nào</p>
      </div>

      <div v-else class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Ngày đăng ký</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone || 'N/A' }}</td>
              <td>
                <span class="role-badge" :class="user.role">
                  {{ user.role === 'customer' ? 'Người chơi' : 'Chủ sân' }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <span class="status-badge" :class="{ active: user.active, inactive: !user.active }">
                  {{ user.active ? 'Hoạt động' : 'Không hoạt động' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="action-button view-button" title="Xem chi tiết">
                  <i class="pi pi-eye"></i>
                </button>
                <button class="action-button edit-button" title="Chỉnh sửa">
                  <i class="pi pi-pencil"></i>
                </button>
                <button
                  class="action-button status-button"
                  :class="{ 'deactivate': user.active, 'activate': !user.active }"
                  @click="toggleUserStatus(user.id, user.active)"
                  :title="user.active ? 'Vô hiệu hóa' : 'Kích hoạt'"
                >
                  <i class="pi" :class="user.active ? 'pi-ban' : 'pi-check'"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" v-if="totalPages > 1">
          <button
            class="pagination-button"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <i class="pi pi-chevron-left"></i>
          </button>

          <span class="pagination-info">
            Trang {{ currentPage }} / {{ totalPages }}
          </span>

          <button
            class="pagination-button"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-users-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  h1 {
    margin: 0;
    font-size: 1.8rem;
    color: #0A2342;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .search-container {
    position: relative;

    input {
      padding: 0.6rem 1rem;
      padding-right: 2.5rem;
      border: 1px solid var(--medium-gray);
      border-radius: 8px;
      font-size: 0.9rem;
      min-width: 250px;

      &:focus {
        outline: none;
        border-color: #0A2342;
        box-shadow: 0 0 0 3px rgba(10, 35, 66, 0.1);
      }
    }

    .search-button {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #0A2342;
      cursor: pointer;

      &:hover {
        color: #1E90FF;
      }
    }
  }

  .filter-container {
    select {
      padding: 0.6rem 1rem;
      border: 1px solid var(--medium-gray);
      border-radius: 8px;
      font-size: 0.9rem;
      background-color: white;
      min-width: 150px;

      &:focus {
        outline: none;
        border-color: #0A2342;
        box-shadow: 0 0 0 3px rgba(10, 35, 66, 0.1);
      }
    }
  }
}

.loading-state,
.error-state,
.empty-state {
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

.users-table-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }

  th {
    background-color: #f9f9f9;
    font-weight: 600;
    color: #0A2342;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background-color: #f5f7fa;
  }
}

.role-badge {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;

  &.customer {
    background-color: #e3f2fd;
    color: #1565c0;
  }

  &.court_owner {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
}

.status-badge {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;

  &.active {
    background-color: #e8f5e9;
    color: #2e7d32;
  }

  &.inactive {
    background-color: #ffebee;
    color: #c62828;
  }
}

.actions-cell {
  white-space: nowrap;

  .action-button {
    background: none;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #0A2342;
    margin-right: 0.3rem;

    &:hover {
      background-color: #f0f0f0;
    }

    &.view-button:hover {
      color: #1E90FF;
    }

    &.edit-button:hover {
      color: #fb8c00;
    }

    &.status-button {
      &.deactivate:hover {
        color: #c62828;
      }

      &.activate:hover {
        color: #2e7d32;
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  gap: 1rem;

  .pagination-button {
    background: none;
    border: 1px solid var(--medium-gray);
    width: 36px;
    height: 36px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: #f0f0f0;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .pagination-info {
    font-size: 0.9rem;
    color: var(--dark-gray);
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
  .page-header {
    flex-direction: column;
    align-items: flex-start;

    .header-actions {
      width: 100%;
    }

    .search-container input {
      width: 100%;
      min-width: auto;
    }
  }

  .users-table {
    display: block;
    overflow-x: auto;
  }
}
</style>

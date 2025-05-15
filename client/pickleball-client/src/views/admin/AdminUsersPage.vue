<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
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

    // Lấy admin token từ localStorage
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      console.error('No admin token found');
      error.value = 'Bạn cần đăng nhập lại';
      return;
    }

    // Thêm token vào header
    const headers = {
      'Authorization': `Bearer ${adminToken}`
    };

    console.log('Fetching users with admin token');
    const response = await axios.get('/api/admin/users', {
      params,
      headers
    });

    console.log('Users fetched successfully:', response.data);
    users.value = response.data.users || [];
    totalPages.value = Math.ceil((response.data.total || users.value.length) / itemsPerPage);
  } catch (err: any) {
    console.error('Error fetching users:', err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);

      // Nếu lỗi 401, chuyển hướng đến trang đăng nhập admin
      if (err.response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
        return;
      }
    }
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

// Modal states
const showAddUserModal = ref(false);
const showEditUserModal = ref(false);
const showDeleteConfirmModal = ref(false);

// New user form data
const newUser = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'customer',
  id_card: '',
  tax_code: ''
});

// Editing user data
const editingUser = reactive({
  id: 0,
  name: '',
  email: '',
  phone: '',
  role: '',
  id_card: '',
  tax_code: ''
});

// User to delete
const userToDelete = ref(null);

// Toggle user status (active/inactive)
const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
  try {
    // Lấy admin token từ localStorage
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      console.error('No admin token found');
      toast.error('Bạn cần đăng nhập lại');
      return;
    }

    // Thêm token vào header
    const headers = {
      'Authorization': `Bearer ${adminToken}`
    };

    await axios.put(`/api/admin/users/${userId}/status`, {
      is_active: !currentStatus
    }, { headers });

    // Update user in the list
    const userIndex = users.value.findIndex((u: any) => u.id === userId);
    if (userIndex !== -1) {
      users.value[userIndex].is_active = !currentStatus;
    }

    toast.success(`Trạng thái người dùng đã được cập nhật`);
  } catch (err: any) {
    console.error('Error toggling user status:', err);
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin');
      window.location.href = '/admin/login';
      return;
    }
    toast.error('Không thể cập nhật trạng thái người dùng');
  }
};

// Create new user
const createUser = async () => {
  try {
    loading.value = true;
    console.log('Creating new user with data:', newUser);

    // Validate required fields
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      loading.value = false;
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast.error('Email không hợp lệ');
      loading.value = false;
      return;
    }

    // Validate password length
    if (newUser.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      loading.value = false;
      return;
    }

    // Validate court owner fields if role is court_owner
    if (newUser.role === 'court_owner' && (!newUser.id_card || !newUser.tax_code)) {
      toast.error('Vui lòng điền đầy đủ thông tin CCCD và mã số thuế cho chủ sân');
      loading.value = false;
      return;
    }

    // Lấy admin token từ localStorage
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      console.error('No admin token found');
      toast.error('Bạn cần đăng nhập lại');
      loading.value = false;
      return;
    }

    // Thêm token vào header
    const headers = {
      'Authorization': `Bearer ${adminToken}`
    };

    const userData = { ...newUser };

    // Only include court owner fields if role is court_owner
    if (userData.role !== 'court_owner') {
      delete userData.id_card;
      delete userData.tax_code;
    }

    console.log('Sending create request with data:', userData);
    const response = await axios.post('/api/admin/users', userData, { headers });
    console.log('Create response:', response.data);

    // Add new user to the list
    users.value.unshift(response.data.user);

    // Reset form and close modal
    Object.assign(newUser, {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'customer',
      id_card: '',
      tax_code: ''
    });

    showAddUserModal.value = false;
    toast.success('Người dùng đã được tạo thành công');
  } catch (err: any) {
    console.error('Error creating user:', err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);

      if (err.response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
        return;
      }
    }
    toast.error(err.response?.data?.message || 'Không thể tạo người dùng');
  } finally {
    loading.value = false;
  }
};

// Edit user
const editUser = (user: any) => {
  // Copy user data to editing form
  Object.assign(editingUser, {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    id_card: user.id_card || '',
    tax_code: user.tax_code || ''
  });

  showEditUserModal.value = true;
};

// Update user
const updateUser = async () => {
  try {
    loading.value = true;
    console.log('Updating user with ID:', editingUser.id);
    console.log('User data to update:', editingUser);

    // Validate required fields
    if (!editingUser.name || !editingUser.email) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      loading.value = false;
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingUser.email)) {
      toast.error('Email không hợp lệ');
      loading.value = false;
      return;
    }

    // Validate court owner fields if role is court_owner
    if (editingUser.role === 'court_owner' && (!editingUser.id_card || !editingUser.tax_code)) {
      toast.error('Vui lòng điền đầy đủ thông tin CCCD và mã số thuế cho chủ sân');
      loading.value = false;
      return;
    }

    // Lấy admin token từ localStorage
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      console.error('No admin token found');
      toast.error('Bạn cần đăng nhập lại');
      loading.value = false;
      return;
    }

    // Thêm token vào header
    const headers = {
      'Authorization': `Bearer ${adminToken}`
    };

    const userData = {
      name: editingUser.name,
      email: editingUser.email,
      phone: editingUser.phone,
      role: editingUser.role
    };

    // Only include court owner fields if role is court_owner
    if (editingUser.role === 'court_owner') {
      userData.id_card = editingUser.id_card;
      userData.tax_code = editingUser.tax_code;
    }

    console.log('Sending update request with data:', userData);
    const response = await axios.put(`/api/admin/users/${editingUser.id}`, userData, { headers });
    console.log('Update response:', response.data);

    // Update user in the list
    const userIndex = users.value.findIndex((u: any) => u.id === editingUser.id);
    if (userIndex !== -1) {
      users.value[userIndex] = { ...users.value[userIndex], ...response.data.user };
    }

    showEditUserModal.value = false;
    toast.success('Thông tin người dùng đã được cập nhật');
  } catch (err: any) {
    console.error('Error updating user:', err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);

      if (err.response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
        return;
      }
    }
    toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin người dùng');
  } finally {
    loading.value = false;
  }
};

// Confirm delete user
const confirmDeleteUser = (user: any) => {
  userToDelete.value = user;
  showDeleteConfirmModal.value = true;
};

// Delete user
const deleteUser = async () => {
  if (!userToDelete.value) return;

  try {
    loading.value = true;
    console.log('Deleting user with ID:', userToDelete.value.id);

    // Lấy admin token từ localStorage
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      console.error('No admin token found');
      toast.error('Bạn cần đăng nhập lại');
      loading.value = false;
      return;
    }

    // Thêm token vào header
    const headers = {
      'Authorization': `Bearer ${adminToken}`
    };

    console.log('Sending delete request for user ID:', userToDelete.value.id);
    const response = await axios.delete(`/api/admin/users/${userToDelete.value.id}`, { headers });
    console.log('Delete response:', response.data);

    // Remove user from the list
    users.value = users.value.filter((u: any) => u.id !== userToDelete.value.id);

    showDeleteConfirmModal.value = false;
    toast.success('Người dùng đã được xóa thành công');
  } catch (err: any) {
    console.error('Error deleting user:', err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);

      if (err.response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
        return;
      }
    }
    toast.error(err.response?.data?.message || 'Không thể xóa người dùng');
  } finally {
    loading.value = false;
    userToDelete.value = null;
  }
};

// Handle role change in add form
const handleRoleChange = () => {
  if (newUser.role !== 'court_owner') {
    newUser.id_card = '';
    newUser.tax_code = '';
  }
};

// Handle role change in edit form
const handleEditRoleChange = () => {
  if (editingUser.role !== 'court_owner') {
    editingUser.id_card = '';
    editingUser.tax_code = '';
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
          <button class="add-user-btn" @click="showAddUserModal = true">
            <i class="pi pi-plus"></i> Thêm người dùng mới
          </button>

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
                <span class="status-badge" :class="{ active: user.is_active, inactive: !user.is_active }">
                  {{ user.is_active ? 'Hoạt động' : 'Không hoạt động' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="action-button view-button" title="Xem chi tiết">
                  <i class="pi pi-eye"></i>
                </button>
                <button class="action-button edit-button" title="Chỉnh sửa" @click="editUser(user)">
                  <i class="pi pi-pencil"></i>
                </button>
                <button
                  class="action-button status-button"
                  :class="{ 'deactivate': user.is_active, 'activate': !user.is_active }"
                  @click="toggleUserStatus(user.id, user.is_active)"
                  :title="user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'"
                >
                  <i class="pi" :class="user.is_active ? 'pi-ban' : 'pi-check'"></i>
                </button>
                <button class="action-button delete-button" title="Xóa" @click="confirmDeleteUser(user)">
                  <i class="pi pi-trash"></i>
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

      <!-- Add User Modal -->
      <div v-if="showAddUserModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Thêm người dùng mới</h2>
            <button class="close-button" @click="showAddUserModal = false">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <form @submit.prevent="createUser">
            <div class="form-group">
              <label for="name">Họ tên <span class="required">*</span></label>
              <input id="name" v-model="newUser.name" type="text" required />
            </div>

            <div class="form-group">
              <label for="email">Email <span class="required">*</span></label>
              <input id="email" v-model="newUser.email" type="email" required />
            </div>

            <div class="form-group">
              <label for="password">Mật khẩu <span class="required">*</span></label>
              <input id="password" v-model="newUser.password" type="password" required minlength="6" />
              <small class="form-hint">Mật khẩu phải có ít nhất 6 ký tự</small>
            </div>

            <div class="form-group">
              <label for="phone">Số điện thoại</label>
              <input id="phone" v-model="newUser.phone" type="text" />
            </div>

            <div class="form-group">
              <label for="role">Vai trò <span class="required">*</span></label>
              <select id="role" v-model="newUser.role" required @change="handleRoleChange">
                <option value="customer">Người chơi</option>
                <option value="court_owner">Chủ sân</option>
              </select>
            </div>

            <div v-if="newUser.role === 'court_owner'" class="form-group">
              <label for="id_card">Số CCCD <span class="required">*</span></label>
              <input id="id_card" v-model="newUser.id_card" type="text" required />
            </div>

            <div v-if="newUser.role === 'court_owner'" class="form-group">
              <label for="tax_code">Mã số thuế <span class="required">*</span></label>
              <input id="tax_code" v-model="newUser.tax_code" type="text" required />
            </div>

            <div class="modal-actions">
              <button type="button" class="cancel-btn" @click="showAddUserModal = false">
                Hủy bỏ
              </button>
              <button type="submit" class="submit-btn" :disabled="loading">
                {{ loading ? 'Đang lưu...' : 'Lưu' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div v-if="showEditUserModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Chỉnh sửa người dùng</h2>
            <button class="close-button" @click="showEditUserModal = false">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <form @submit.prevent="updateUser">
            <div class="form-group">
              <label for="edit-name">Họ tên <span class="required">*</span></label>
              <input id="edit-name" v-model="editingUser.name" type="text" required />
            </div>

            <div class="form-group">
              <label for="edit-email">Email <span class="required">*</span></label>
              <input id="edit-email" v-model="editingUser.email" type="email" required />
            </div>

            <div class="form-group">
              <label for="edit-phone">Số điện thoại</label>
              <input id="edit-phone" v-model="editingUser.phone" type="text" />
            </div>

            <div class="form-group">
              <label for="edit-role">Vai trò <span class="required">*</span></label>
              <select id="edit-role" v-model="editingUser.role" required @change="handleEditRoleChange">
                <option value="customer">Người chơi</option>
                <option value="court_owner">Chủ sân</option>
              </select>
            </div>

            <div v-if="editingUser.role === 'court_owner'" class="form-group">
              <label for="edit-id-card">Số CCCD <span class="required">*</span></label>
              <input id="edit-id-card" v-model="editingUser.id_card" type="text" required />
            </div>

            <div v-if="editingUser.role === 'court_owner'" class="form-group">
              <label for="edit-tax-code">Mã số thuế <span class="required">*</span></label>
              <input id="edit-tax-code" v-model="editingUser.tax_code" type="text" required />
            </div>

            <div class="modal-actions">
              <button type="button" class="cancel-btn" @click="showEditUserModal = false">
                Hủy bỏ
              </button>
              <button type="submit" class="submit-btn" :disabled="loading">
                {{ loading ? 'Đang lưu...' : 'Lưu' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirmModal" class="modal-overlay">
        <div class="modal-content confirmation-modal">
          <div class="modal-header">
            <h2>Xác nhận xóa</h2>
            <button class="close-button" @click="showDeleteConfirmModal = false">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="confirmation-content">
            <i class="pi pi-exclamation-triangle warning-icon"></i>
            <p>Bạn có chắc chắn muốn xóa người dùng <strong>{{ userToDelete?.name }}</strong>?</p>
            <p class="warning-text">Hành động này không thể hoàn tác.</p>
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="showDeleteConfirmModal = false">
              Hủy bỏ
            </button>
            <button type="button" class="delete-btn" @click="deleteUser" :disabled="loading">
              {{ loading ? 'Đang xóa...' : 'Xóa' }}
            </button>
          </div>
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

  .add-user-btn {
    background-color: #2e7d32;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &:hover {
      background-color: #1b5e20;
    }

    i {
      font-size: 0.9rem;
    }
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

    &.delete-button:hover {
      color: #c62828;
      background-color: #ffebee;
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

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f0f0f0;

    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #0A2342;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.2rem;
      color: #666;
      cursor: pointer;

      &:hover {
        color: #c62828;
      }
    }
  }

  form {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.2rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #0A2342;

      .required {
        color: #c62828;
      }
    }

    input, select {
      width: 100%;
      padding: 0.8rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: #0A2342;
        box-shadow: 0 0 0 3px rgba(10, 35, 66, 0.1);
      }
    }

    .form-hint {
      display: block;
      margin-top: 0.3rem;
      font-size: 0.8rem;
      color: #666;
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;

    button {
      padding: 0.8rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
    }

    .cancel-btn {
      background-color: #f5f5f5;
      color: #333;
      border: 1px solid #ddd;

      &:hover {
        background-color: #e0e0e0;
      }
    }

    .submit-btn {
      background-color: #0A2342;
      color: white;
      border: none;

      &:hover {
        background-color: #1E90FF;
      }
    }

    .delete-btn {
      background-color: #c62828;
      color: white;
      border: none;

      &:hover {
        background-color: #b71c1c;
      }
    }
  }
}

.confirmation-modal {
  max-width: 400px;

  .confirmation-content {
    padding: 1.5rem;
    text-align: center;

    .warning-icon {
      font-size: 3rem;
      color: #ff9800;
      margin-bottom: 1rem;
    }

    p {
      margin: 0.5rem 0;
      font-size: 1.1rem;
      color: #333;
    }

    .warning-text {
      color: #c62828;
      font-size: 0.9rem;
      margin-top: 1rem;
    }
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

  .modal-content {
    width: 95%;
    max-height: 80vh;
  }
}
</style>

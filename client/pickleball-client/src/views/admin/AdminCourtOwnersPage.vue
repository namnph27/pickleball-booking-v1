<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/composables/useToast';
import AdminLayout from '@/components/admin/AdminLayout.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import axios from 'axios';

const { t } = useI18n();
const toast = useToast();

// State
const courtOwners = ref([]);
const loading = ref(false);
const selectedOwner = ref(null);
const approvalDialog = ref(false);
const rejectionDialog = ref(false);
const successDialog = ref(false);
const successTitle = ref('');
const successMessage = ref('');
const adminNotes = ref('');
const searchQuery = ref('');
const activeTab = ref(0);
const statusOptions = ref([
  { label: t('admin.pending'), value: 'pending' },
  { label: t('admin.approved'), value: 'approved' },
  { label: t('admin.rejected'), value: 'rejected' }
]);

// Computed
const filteredCourtOwners = computed(() => {
  if (!searchQuery.value) return courtOwners.value;

  const query = searchQuery.value.toLowerCase();
  return courtOwners.value.filter(owner =>
    owner.name.toLowerCase().includes(query) ||
    owner.email.toLowerCase().includes(query) ||
    owner.phone.toLowerCase().includes(query) ||
    owner.id_card.toLowerCase().includes(query) ||
    owner.tax_code.toLowerCase().includes(query)
  );
});

// Methods
const fetchCourtOwners = async (status = 'pending') => {
  try {
    loading.value = true;
    console.log(`Fetching court owners with status: ${status}`);

    // Kiểm tra lại token trước khi gọi API
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      console.log('Setting admin token in axios headers before API call');
      // Đặt token cho mỗi request cụ thể thay vì dùng defaults
      const headers = {
        'Authorization': `Bearer ${adminToken}`
      };

      try {
        const response = await axios.get(`/api/admin/court-owners/status/${status}`, { headers });
        console.log('API response:', response.data);
        courtOwners.value = response.data.court_owners || [];
        return; // Thoát sớm nếu API thành công
      } catch (apiError) {
        console.error('API error:', apiError);
        if (apiError.response) {
          console.error('Response status:', apiError.response.status);
          console.error('Response data:', apiError.response.data);
        }
        // Tiếp tục xuống phần dưới để sử dụng mock data
      }
    } else {
      console.error('No admin token found');
      toast.error('Bạn cần đăng nhập lại');
    }

    // Tạo dữ liệu mẫu để hiển thị UI trong trường hợp API không hoạt động
    const mockData = [
      {
        id: 1,
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '0901234567',
        role: 'court_owner',
        id_card: '123456789012',
        tax_code: '1234567890',
        approval_status: status,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Trần Thị B',
        email: 'tranthib@example.com',
        phone: '0909876543',
        role: 'court_owner',
        id_card: '098765432109',
        tax_code: '0987654321',
        approval_status: status,
        created_at: new Date().toISOString()
      }
    ];

    console.log('Using mock data instead');
    courtOwners.value = mockData;
    toast.warning('Đang sử dụng dữ liệu mẫu do không thể kết nối đến server');
  } catch (error) {
    console.error('Error fetching court owners:', error);
    toast.error(t('admin.errorFetchingCourtOwners'));
    // Sử dụng dữ liệu mẫu trong trường hợp lỗi
    courtOwners.value = [];
  } finally {
    loading.value = false;
  }
};

const openApprovalDialog = (owner) => {
  selectedOwner.value = owner;
  adminNotes.value = owner.admin_notes || '';
  approvalDialog.value = true;
};

const openRejectionDialog = (owner) => {
  selectedOwner.value = owner;
  adminNotes.value = owner.admin_notes || '';
  rejectionDialog.value = true;
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return 'pi-clock';
    case 'approved':
      return 'pi-check-circle';
    case 'rejected':
      return 'pi-times-circle';
    default:
      return 'pi-question-circle';
  }
};

const showSuccessDialog = (title, message) => {
  successTitle.value = title;
  successMessage.value = message;
  successDialog.value = true;
};

const approveCourtOwner = async () => {
  try {
    loading.value = true;

    // Kiểm tra lại token trước khi gọi API
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      console.error('No admin token found');
      toast.error('Bạn cần đăng nhập lại');
      return;
    }

    // Đặt token cho request cụ thể
    const headers = {
      'Authorization': `Bearer ${adminToken}`
    };

    await axios.put(`/api/admin/court-owners/${selectedOwner.value.id}/approve`, {
      notes: adminNotes.value
    }, { headers });

    approvalDialog.value = false;

    // Show success dialog instead of toast
    showSuccessDialog(
      t('admin.courtOwnerApproved'),
      `${selectedOwner.value.name} (${selectedOwner.value.email}) ${t('admin.courtOwnerApproved').toLowerCase()}.`
    );

    await fetchCourtOwners('pending');
  } catch (error) {
    console.error('Error approving court owner:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    toast.error(t('admin.errorApprovingCourtOwner'));
  } finally {
    loading.value = false;
  }
};

const rejectCourtOwner = async () => {
  try {
    // Validate rejection reason
    if (!adminNotes.value || adminNotes.value.trim() === '') {
      toast.error(t('admin.rejectionReasonRequired'));
      return;
    }

    loading.value = true;

    // Kiểm tra lại token trước khi gọi API
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      console.error('No admin token found');
      toast.error('Bạn cần đăng nhập lại');
      return;
    }

    // Đặt token cho request cụ thể
    const headers = {
      'Authorization': `Bearer ${adminToken}`
    };

    await axios.put(`/api/admin/court-owners/${selectedOwner.value.id}/reject`, {
      notes: adminNotes.value
    }, { headers });

    rejectionDialog.value = false;

    // Show success dialog instead of toast
    showSuccessDialog(
      t('admin.courtOwnerRejected'),
      `${selectedOwner.value.name} (${selectedOwner.value.email}) ${t('admin.courtOwnerRejected').toLowerCase()}.`
    );

    await fetchCourtOwners('pending');
  } catch (error) {
    console.error('Error rejecting court owner:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    toast.error(t('admin.errorRejectingCourtOwner'));
  } finally {
    loading.value = false;
  }
};

const handleTabChange = (e) => {
  activeTab.value = e.index;
  const status = statusOptions.value[e.index].value;
  fetchCourtOwners(status);
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

// Lifecycle hooks
onMounted(() => {
  // Kiểm tra xem admin token có tồn tại không
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) {
    console.log('Admin token exists, setting in axios headers');
    // Không đặt token trong axios.defaults để tránh xung đột
    // Thay vào đó, sẽ đặt token trong từng request cụ thể
  } else {
    console.error('No admin token found');
    toast.error('Bạn cần đăng nhập lại');
    return;
  }

  fetchCourtOwners('pending');
});
</script>

<template>
  <AdminLayout>
    <template #header>
      <div class="admin-header">
        <h1 class="admin-page-title">{{ t('admin.courtOwnerManagement') }}</h1>
        <p class="admin-page-subtitle">{{ t('admin.courtOwnerManagement') + ' - ' + statusOptions[activeTab].label }}</p>
      </div>
    </template>

    <div class="court-owners-container">
      <div class="filters-section">
        <div class="search-container">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              :placeholder="t('common.search') + '...'"
              class="search-input"
            />
          </span>
        </div>
        <div class="filter-info">
          <span v-if="filteredCourtOwners.length > 0">
            {{ filteredCourtOwners.length }} {{ filteredCourtOwners.length === 1 ? 'chủ sân' : 'chủ sân' }}
          </span>
          <span v-else>{{ t('common.noResults') }}</span>
        </div>
      </div>

      <div class="tab-container">
        <TabView @tab-change="handleTabChange" class="custom-tabview">
          <TabPanel v-for="(option, index) in statusOptions" :key="index" :header="option.label">
            <div class="table-container">
              <DataTable
                :value="filteredCourtOwners"
                :loading="loading"
                :paginator="true"
                :rows="10"
                :rowsPerPageOptions="[5, 10, 20, 50]"
                responsiveLayout="scroll"
                class="court-owners-table"
                stripedRows
                :emptyMessage="t('common.noResults')"
                v-tooltip.top="t('common.refresh')"
              >
                <Column field="id" header="ID" sortable style="width: 5%"></Column>
                <Column field="name" :header="t('common.name')" sortable style="width: 15%"></Column>
                <Column field="email" :header="t('common.email')" sortable style="width: 15%"></Column>
                <Column field="phone" :header="t('common.phone')" sortable style="width: 10%"></Column>
                <Column field="id_card" :header="t('auth.idCard')" style="width: 10%"></Column>
                <Column field="tax_code" :header="t('auth.taxCode')" style="width: 10%"></Column>
                <Column field="created_at" :header="t('common.registeredAt')" sortable style="width: 15%">
                  <template #body="{ data }">
                    <span class="date-cell">{{ formatDate(data.created_at) }}</span>
                  </template>
                </Column>
                <Column :header="t('common.status')" style="width: 10%">
                  <template #body="{ data }">
                    <span class="status-badge" :class="'status-' + data.approval_status">
                      {{ t('admin.' + data.approval_status) }}
                    </span>
                  </template>
                </Column>
                <Column :header="t('common.actions')" style="width: 10%">
                  <template #body="{ data }">
                    <div class="action-buttons">
                      <Button
                        v-if="activeTab === 0"
                        icon="pi pi-check"
                        class="p-button-success p-button-rounded"
                        @click="openApprovalDialog(data)"
                        v-tooltip.top="t('admin.approve')"
                      />
                      <Button
                        v-if="activeTab === 0"
                        icon="pi pi-times"
                        class="p-button-danger p-button-rounded"
                        @click="openRejectionDialog(data)"
                        v-tooltip.top="t('admin.reject')"
                      />
                      <Button
                        v-if="activeTab !== 0"
                        icon="pi pi-eye"
                        class="p-button-info p-button-rounded"
                        @click="openApprovalDialog(data)"
                        v-tooltip.top="t('common.view')"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>

    <!-- Approval Dialog -->
    <Dialog
      v-model:visible="approvalDialog"
      :header="activeTab === 0 ? t('admin.approveCourtOwner') : t('admin.viewCourtOwner')"
      :style="{ width: '550px' }"
      :modal="true"
      :closable="!loading"
      :closeOnEscape="!loading"
      class="court-owner-dialog"
    >
      <div class="owner-details-container" v-if="selectedOwner">
        <div class="status-header" :class="'status-' + (selectedOwner.approval_status || 'pending')">
          <i class="pi" :class="getStatusIcon(selectedOwner.approval_status)"></i>
          <span>{{ t('admin.' + (selectedOwner.approval_status || 'pending')) }}</span>
        </div>

        <div class="owner-details">
          <div class="detail-section">
            <h3 class="section-title">{{ t('common.personalInfo') }}</h3>
            <div class="detail-row">
              <span class="detail-label">{{ t('common.name') }}:</span>
              <span class="detail-value">{{ selectedOwner.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('common.email') }}:</span>
              <span class="detail-value">{{ selectedOwner.email }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('common.phone') }}:</span>
              <span class="detail-value">{{ selectedOwner.phone }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">{{ t('profile.businessInfo') }}</h3>
            <div class="detail-row">
              <span class="detail-label">{{ t('auth.idCard') }}:</span>
              <span class="detail-value">{{ selectedOwner.id_card }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('auth.taxCode') }}:</span>
              <span class="detail-value">{{ selectedOwner.tax_code }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('common.registeredAt') }}:</span>
              <span class="detail-value">{{ formatDate(selectedOwner.created_at) }}</span>
            </div>
          </div>

          <div class="admin-notes-container">
            <label for="admin-notes">
              {{ activeTab === 0 ? t('admin.adminNotes') : t('admin.adminNotes') + ' (' + t('common.readonly') + ')' }}
            </label>
            <Textarea
              id="admin-notes"
              v-model="adminNotes"
              :placeholder="t('admin.enterNotes')"
              rows="4"
              class="w-full"
              :disabled="activeTab !== 0"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button
            v-if="activeTab === 0"
            :label="t('common.cancel')"
            icon="pi pi-times"
            class="p-button-text"
            @click="approvalDialog = false"
            :disabled="loading"
          />
          <Button
            v-if="activeTab === 0"
            :label="t('admin.approve')"
            icon="pi pi-check"
            class="p-button-success"
            @click="approveCourtOwner"
            :loading="loading"
            :disabled="loading"
          />
          <Button
            v-if="activeTab !== 0"
            :label="t('common.close')"
            icon="pi pi-times"
            class="p-button-text"
            @click="approvalDialog = false"
          />
        </div>
      </template>
    </Dialog>

    <!-- Rejection Dialog -->
    <Dialog
      v-model:visible="rejectionDialog"
      :header="t('admin.rejectCourtOwner')"
      :style="{ width: '550px' }"
      :modal="true"
      :closable="!loading"
      :closeOnEscape="!loading"
      class="court-owner-dialog rejection-dialog"
    >
      <div class="owner-details-container" v-if="selectedOwner">
        <div class="status-header status-warning">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ t('admin.rejectCourtOwner') }}</span>
        </div>

        <div class="owner-details">
          <div class="detail-section">
            <h3 class="section-title">{{ t('common.personalInfo') }}</h3>
            <div class="detail-row">
              <span class="detail-label">{{ t('common.name') }}:</span>
              <span class="detail-value">{{ selectedOwner.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('common.email') }}:</span>
              <span class="detail-value">{{ selectedOwner.email }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('common.phone') }}:</span>
              <span class="detail-value">{{ selectedOwner.phone }}</span>
            </div>
          </div>

          <div class="rejection-warning">
            <i class="pi pi-info-circle"></i>
            <span>{{ t('auth.rejectedAccountDeletionWarning') }}</span>
          </div>

          <div class="admin-notes-container">
            <label for="rejection-notes">{{ t('admin.rejectionReason') }} <span class="required">*</span></label>
            <Textarea
              id="rejection-notes"
              v-model="adminNotes"
              :placeholder="t('admin.enterRejectionReason')"
              rows="4"
              class="w-full"
              required
            />
            <small class="rejection-note-hint">{{ t('auth.rejectedAccountDeletionNotice') }}</small>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button
            :label="t('common.cancel')"
            icon="pi pi-times"
            class="p-button-text"
            @click="rejectionDialog = false"
            :disabled="loading"
          />
          <Button
            :label="t('admin.reject')"
            icon="pi pi-times"
            class="p-button-danger"
            @click="rejectCourtOwner"
            :loading="loading"
            :disabled="loading || !adminNotes"
          />
        </div>
      </template>
    </Dialog>

    <!-- Success Dialog -->
    <Dialog
      v-model:visible="successDialog"
      :header="successTitle"
      :style="{ width: '400px' }"
      :modal="true"
      class="success-dialog"
    >
      <div class="success-content">
        <i class="pi pi-check-circle"></i>
        <p>{{ successMessage }}</p>
      </div>

      <template #footer>
        <Button
          :label="t('common.close')"
          icon="pi pi-times"
          class="p-button-text"
          @click="successDialog = false"
        />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-header {
  margin-bottom: 1.5rem;

  .admin-page-title {
    font-size: 1.8rem;
    font-weight: 600;
    color: #0A2342;
    margin-bottom: 0.5rem;
  }

  .admin-page-subtitle {
    font-size: 1rem;
    color: #666;
    margin: 0;
  }
}

.court-owners-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;

  .search-container {
    width: 100%;
    max-width: 350px;

    .search-input {
      width: 100%;
      border-radius: 8px;
      padding: 0.75rem 0.75rem 0.75rem 2.5rem;
      font-size: 1rem;
      border: 1px solid #e0e0e0;
      transition: all 0.3s ease;

      &:focus {
        border-color: #2196F3;
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
      }
    }

    .pi-search {
      left: 0.75rem;
      color: #666;
    }
  }

  .filter-info {
    font-size: 0.9rem;
    color: #666;
    padding: 0.5rem 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
  }
}

.tab-container {
  .custom-tabview {
    :deep(.p-tabview-nav) {
      border-bottom: 2px solid #f0f0f0;

      li {
        margin-right: 0.5rem;

        .p-tabview-nav-link {
          padding: 1rem 1.5rem;
          border-radius: 8px 8px 0 0;
          font-weight: 500;
          transition: all 0.3s ease;

          &:not(.p-disabled):focus {
            box-shadow: none;
          }
        }

        &.p-highlight .p-tabview-nav-link {
          background-color: #f0f7ff;
          color: #2196F3;
          border-color: #2196F3;
        }
      }
    }

    :deep(.p-tabview-panels) {
      padding: 1.5rem 0 0 0;
    }
  }

  .table-container {
    .court-owners-table {
      :deep(.p-datatable-header) {
        background-color: #f9f9f9;
        border-radius: 8px 8px 0 0;
      }

      :deep(.p-datatable-thead) {
        tr th {
          background-color: #f5f5f5;
          padding: 1rem;
          font-weight: 600;
          color: #333;
        }
      }

      :deep(.p-datatable-tbody) {
        tr td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f0f0f0;

          &:first-child {
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
          }

          &:last-child {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
          }
        }

        tr:hover {
          background-color: #f9f9f9;
        }
      }

      :deep(.p-paginator) {
        padding: 1rem;
        border-radius: 0 0 8px 8px;
      }
    }
  }
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;

  :deep(.p-button) {
    width: 2.5rem;
    height: 2.5rem;

    &.p-button-rounded {
      border-radius: 50%;
    }

    &.p-button-success {
      background-color: #4CAF50;
      border-color: #4CAF50;

      &:hover {
        background-color: #388E3C;
        border-color: #388E3C;
      }
    }

    &.p-button-danger {
      background-color: #F44336;
      border-color: #F44336;

      &:hover {
        background-color: #D32F2F;
        border-color: #D32F2F;
      }
    }

    &.p-button-info {
      background-color: #2196F3;
      border-color: #2196F3;

      &:hover {
        background-color: #1976D2;
        border-color: #1976D2;
      }
    }
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 500;

  &.status-pending {
    background-color: #FFF8E1;
    color: #FFA000;
    border: 1px solid #FFECB3;
  }

  &.status-approved {
    background-color: #E8F5E9;
    color: #388E3C;
    border: 1px solid #C8E6C9;
  }

  &.status-rejected {
    background-color: #FFEBEE;
    color: #D32F2F;
    border: 1px solid #FFCDD2;
  }
}

.date-cell {
  font-size: 0.9rem;
  color: #666;
}

.court-owner-dialog {
  :deep(.p-dialog-header) {
    padding: 1.5rem;
    background-color: #f9f9f9;
    border-bottom: 1px solid #f0f0f0;

    .p-dialog-title {
      font-weight: 600;
      font-size: 1.2rem;
      color: #333;
    }
  }

  :deep(.p-dialog-content) {
    padding: 0;
  }

  :deep(.p-dialog-footer) {
    padding: 1rem 1.5rem;
    background-color: #f9f9f9;
    border-top: 1px solid #f0f0f0;

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
  }

  &.rejection-dialog {
    :deep(.p-dialog-header) {
      background-color: #FFEBEE;

      .p-dialog-title {
        color: #D32F2F;
      }
    }
  }
}

.owner-details-container {
  .status-header {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    font-weight: 500;
    font-size: 1rem;

    i {
      margin-right: 0.5rem;
      font-size: 1.2rem;
    }

    &.status-pending {
      background-color: #FFF8E1;
      color: #FFA000;
    }

    &.status-approved {
      background-color: #E8F5E9;
      color: #388E3C;
    }

    &.status-rejected {
      background-color: #FFEBEE;
      color: #D32F2F;
    }

    &.status-warning {
      background-color: #FFF3E0;
      color: #E64A19;
    }
  }
}

.owner-details {
  padding: 1.5rem;

  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    margin-top: 0;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f0f0f0;
  }

  .detail-section {
    margin-bottom: 1.5rem;
  }

  .detail-row {
    display: flex;
    margin-bottom: 0.75rem;

    .detail-label {
      font-weight: 600;
      width: 140px;
      color: #666;
    }

    .detail-value {
      flex: 1;
      color: #333;
    }
  }

  .rejection-warning {
    display: flex;
    align-items: flex-start;
    padding: 1rem;
    background-color: #FFF3E0;
    border-radius: 8px;
    margin-bottom: 1.5rem;

    i {
      color: #E64A19;
      font-size: 1.2rem;
      margin-right: 0.75rem;
      margin-top: 0.1rem;
    }

    span {
      flex: 1;
      font-size: 0.9rem;
      line-height: 1.5;
      color: #333;
    }
  }

  .admin-notes-container {
    margin-top: 1.5rem;

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;

      .required {
        color: #F44336;
        margin-left: 0.25rem;
      }
    }

    :deep(.p-inputtextarea) {
      width: 100%;
      border-radius: 8px;
      padding: 0.75rem;
      font-size: 1rem;
      border: 1px solid #e0e0e0;
      transition: all 0.3s ease;

      &:focus {
        border-color: #2196F3;
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
      }

      &:disabled {
        background-color: #f9f9f9;
        color: #666;
      }
    }

    .rejection-note-hint {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: #666;
      line-height: 1.5;
    }
  }
}

.success-dialog {
  :deep(.p-dialog-header) {
    background-color: #E8F5E9;

    .p-dialog-title {
      color: #388E3C;
    }
  }

  .success-content {
    padding: 2rem;
    text-align: center;

    i {
      font-size: 3rem;
      color: #4CAF50;
      margin-bottom: 1rem;
    }

    p {
      font-size: 1.1rem;
      color: #333;
      margin: 0;
    }
  }
}
</style>

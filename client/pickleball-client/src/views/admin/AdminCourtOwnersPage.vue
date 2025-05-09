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

    toast.success(t('admin.courtOwnerApproved'));

    approvalDialog.value = false;
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

    toast.success(t('admin.courtOwnerRejected'));

    rejectionDialog.value = false;
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
      <h1 class="admin-page-title">{{ t('admin.courtOwnerManagement') }}</h1>
    </template>

    <div class="court-owners-container">
      <div class="filters">
        <div class="search-container">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              :placeholder="t('common.search')"
              class="search-input"
            />
          </span>
        </div>
      </div>

      <TabView @tab-change="handleTabChange">
        <TabPanel v-for="(option, index) in statusOptions" :key="index" :header="option.label">
          <DataTable
            :value="filteredCourtOwners"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            responsiveLayout="scroll"
            class="court-owners-table"
            stripedRows
          >
            <Column field="id" header="ID" sortable style="width: 5%"></Column>
            <Column field="name" :header="t('common.name')" sortable style="width: 15%"></Column>
            <Column field="email" :header="t('common.email')" sortable style="width: 15%"></Column>
            <Column field="phone" :header="t('common.phone')" sortable style="width: 10%"></Column>
            <Column field="id_card" :header="t('auth.idCard')" style="width: 10%"></Column>
            <Column field="tax_code" :header="t('auth.taxCode')" style="width: 10%"></Column>
            <Column field="created_at" :header="t('common.registeredAt')" sortable style="width: 15%">
              <template #body="{ data }">
                {{ formatDate(data.created_at) }}
              </template>
            </Column>
            <Column :header="t('common.actions')" style="width: 20%">
              <template #body="{ data }">
                <div class="action-buttons">
                  <Button
                    v-if="activeTab === 0"
                    icon="pi pi-check"
                    class="p-button-success p-button-sm"
                    @click="openApprovalDialog(data)"
                    :title="t('admin.approve')"
                  />
                  <Button
                    v-if="activeTab === 0"
                    icon="pi pi-times"
                    class="p-button-danger p-button-sm"
                    @click="openRejectionDialog(data)"
                    :title="t('admin.reject')"
                  />
                  <Button
                    v-if="activeTab !== 0"
                    icon="pi pi-eye"
                    class="p-button-info p-button-sm"
                    @click="openApprovalDialog(data)"
                    :title="t('common.view')"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabView>
    </div>

    <!-- Approval Dialog -->
    <Dialog
      v-model:visible="approvalDialog"
      :header="activeTab === 0 ? t('admin.approveCourtOwner') : t('admin.viewCourtOwner')"
      :style="{ width: '500px' }"
      :modal="true"
    >
      <div class="owner-details" v-if="selectedOwner">
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

        <div class="admin-notes-container">
          <label for="admin-notes">{{ t('admin.adminNotes') }}</label>
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

      <template #footer>
        <Button
          v-if="activeTab === 0"
          :label="t('common.cancel')"
          icon="pi pi-times"
          class="p-button-text"
          @click="approvalDialog = false"
        />
        <Button
          v-if="activeTab === 0"
          :label="t('admin.approve')"
          icon="pi pi-check"
          class="p-button-success"
          @click="approveCourtOwner"
          :loading="loading"
        />
        <Button
          v-if="activeTab !== 0"
          :label="t('common.close')"
          icon="pi pi-times"
          class="p-button-text"
          @click="approvalDialog = false"
        />
      </template>
    </Dialog>

    <!-- Rejection Dialog -->
    <Dialog
      v-model:visible="rejectionDialog"
      :header="t('admin.rejectCourtOwner')"
      :style="{ width: '500px' }"
      :modal="true"
    >
      <div class="owner-details" v-if="selectedOwner">
        <div class="detail-row">
          <span class="detail-label">{{ t('common.name') }}:</span>
          <span class="detail-value">{{ selectedOwner.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ t('common.email') }}:</span>
          <span class="detail-value">{{ selectedOwner.email }}</span>
        </div>

        <div class="admin-notes-container">
          <label for="rejection-notes">{{ t('admin.rejectionReason') }}</label>
          <Textarea
            id="rejection-notes"
            v-model="adminNotes"
            :placeholder="t('admin.enterRejectionReason')"
            rows="4"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button
          :label="t('common.cancel')"
          icon="pi pi-times"
          class="p-button-text"
          @click="rejectionDialog = false"
        />
        <Button
          :label="t('admin.reject')"
          icon="pi pi-times"
          class="p-button-danger"
          @click="rejectCourtOwner"
          :loading="loading"
        />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<style scoped lang="scss">
.court-owners-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.filters {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;

  .search-container {
    width: 100%;
    max-width: 300px;

    .search-input {
      width: 100%;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.owner-details {
  margin-bottom: 1.5rem;

  .detail-row {
    display: flex;
    margin-bottom: 0.75rem;

    .detail-label {
      font-weight: 600;
      width: 120px;
    }

    .detail-value {
      flex: 1;
    }
  }

  .admin-notes-container {
    margin-top: 1.5rem;

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
  }
}
</style>

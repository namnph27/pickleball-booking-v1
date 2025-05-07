<template>
  <div class="payment-report-view">
    <h1>{{ $t('admin.paymentReports') }}</h1>
    
    <div class="report-filters p-card p-4 mb-4">
      <div class="p-grid">
        <div class="p-col-12 p-md-3">
          <div class="p-field">
            <label for="start-date">{{ $t('common.startDate') }}</label>
            <Calendar 
              id="start-date" 
              v-model="filters.start_date" 
              :showIcon="true" 
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
        </div>
        <div class="p-col-12 p-md-3">
          <div class="p-field">
            <label for="end-date">{{ $t('common.endDate') }}</label>
            <Calendar 
              id="end-date" 
              v-model="filters.end_date" 
              :showIcon="true" 
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
        </div>
        <div class="p-col-12 p-md-3">
          <div class="p-field">
            <label for="payment-method">{{ $t('payment.method') }}</label>
            <Dropdown 
              id="payment-method" 
              v-model="filters.payment_method" 
              :options="paymentMethods" 
              optionLabel="label" 
              optionValue="value"
              :placeholder="$t('common.all')"
              class="w-full"
            />
          </div>
        </div>
        <div class="p-col-12 p-md-3">
          <div class="p-field">
            <label for="payment-gateway">{{ $t('payment.gateway') }}</label>
            <Dropdown 
              id="payment-gateway" 
              v-model="filters.payment_gateway" 
              :options="paymentGateways" 
              optionLabel="label" 
              optionValue="value"
              :placeholder="$t('common.all')"
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <div class="filter-actions mt-3">
        <Button 
          :label="$t('common.filter')" 
          icon="pi pi-filter" 
          @click="applyFilters"
        />
        <Button 
          :label="$t('common.reset')" 
          icon="pi pi-refresh" 
          class="p-button-outlined ml-2" 
          @click="resetFilters"
        />
      </div>
    </div>
    
    <div class="report-summary p-grid">
      <div class="p-col-12 p-md-4">
        <div class="summary-card p-card p-4">
          <div class="summary-title">{{ $t('payment.totalRevenue') }}</div>
          <div class="summary-value">{{ formatCurrency(report.total_revenue) }}</div>
        </div>
      </div>
      <div class="p-col-12 p-md-4">
        <div class="summary-card p-card p-4">
          <div class="summary-title">{{ $t('payment.totalTransactions') }}</div>
          <div class="summary-value">{{ report.payments.length }}</div>
        </div>
      </div>
      <div class="p-col-12 p-md-4">
        <div class="summary-card p-card p-4">
          <div class="summary-title">{{ $t('payment.averageTransaction') }}</div>
          <div class="summary-value">
            {{ report.payments.length > 0 
              ? formatCurrency(report.total_revenue / report.payments.length) 
              : formatCurrency(0) 
            }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="report-charts p-grid mt-4">
      <div class="p-col-12 p-md-6">
        <div class="p-card p-4">
          <h3>{{ $t('payment.revenueByMethod') }}</h3>
          <Chart type="pie" :data="revenueByMethodChartData" :options="chartOptions" />
        </div>
      </div>
      <div class="p-col-12 p-md-6">
        <div class="p-card p-4">
          <h3>{{ $t('payment.revenueByGateway') }}</h3>
          <Chart type="pie" :data="revenueByGatewayChartData" :options="chartOptions" />
        </div>
      </div>
      <div class="p-col-12 mt-4">
        <div class="p-card p-4">
          <h3>{{ $t('payment.revenueByDate') }}</h3>
          <Chart type="bar" :data="revenueByDateChartData" :options="barChartOptions" />
        </div>
      </div>
    </div>
    
    <div class="report-table mt-4">
      <h3>{{ $t('payment.transactions') }}</h3>
      <DataTable 
        :value="report.payments" 
        :paginator="true" 
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        responsiveLayout="stack"
        breakpoint="960px"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="id" :header="$t('payment.id')" sortable>
          <template #body="{ data }">
            #{{ data.id }}
          </template>
        </Column>
        
        <Column field="user_name" :header="$t('user.name')" sortable />
        
        <Column field="court_name" :header="$t('booking.court')" sortable />
        
        <Column field="start_time" :header="$t('booking.dateTime')" sortable>
          <template #body="{ data }">
            {{ formatDate(data.start_time) }}<br>
            {{ formatTime(data.start_time) }} - {{ formatTime(data.end_time) }}
          </template>
        </Column>
        
        <Column field="amount" :header="$t('payment.amount')" sortable>
          <template #body="{ data }">
            {{ formatCurrency(data.amount) }}
          </template>
        </Column>
        
        <Column field="payment_method" :header="$t('payment.method')" sortable>
          <template #body="{ data }">
            {{ formatPaymentMethod(data.payment_method, data.payment_gateway) }}
          </template>
        </Column>
        
        <Column field="status" :header="$t('payment.status')" sortable>
          <template #body="{ data }">
            <Tag 
              :value="formatStatus(data.status)" 
              :severity="getStatusSeverity(data.status)" 
            />
          </template>
        </Column>
        
        <Column field="created_at" :header="$t('payment.date')" sortable>
          <template #body="{ data }">
            {{ formatDateTime(data.created_at) }}
          </template>
        </Column>
        
        <Column :header="$t('common.actions')">
          <template #body="{ data }">
            <Button 
              icon="pi pi-eye" 
              class="p-button-rounded p-button-text p-button-sm" 
              :tooltip="$t('common.view')"
              @click="viewPayment(data)"
            />
            <Button 
              v-if="data.status === 'completed' && !data.refund_status"
              icon="pi pi-file-pdf" 
              class="p-button-rounded p-button-text p-button-sm" 
              :tooltip="$t('payment.receipt')"
              @click="viewReceipt(data.id)"
            />
            <Button 
              v-if="data.status === 'completed' && !data.refund_status"
              icon="pi pi-replay" 
              class="p-button-rounded p-button-text p-button-warning p-button-sm" 
              :tooltip="$t('payment.refund')"
              @click="openRefundDialog(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
    
    <!-- Payment Details Dialog -->
    <Dialog 
      v-model:visible="paymentDetailsVisible" 
      :header="$t('payment.details')"
      :style="{ width: '500px' }"
      :modal="true"
    >
      <div v-if="selectedPayment" class="payment-details">
        <div class="detail-row">
          <div class="detail-label">{{ $t('payment.id') }}:</div>
          <div class="detail-value">#{{ selectedPayment.id }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ $t('user.name') }}:</div>
          <div class="detail-value">{{ selectedPayment.user_name }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ $t('booking.court') }}:</div>
          <div class="detail-value">{{ selectedPayment.court_name }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ $t('booking.date') }}:</div>
          <div class="detail-value">{{ formatDate(selectedPayment.start_time) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ $t('booking.time') }}:</div>
          <div class="detail-value">{{ formatTime(selectedPayment.start_time) }} - {{ formatTime(selectedPayment.end_time) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ $t('payment.amount') }}:</div>
          <div class="detail-value">{{ formatCurrency(selectedPayment.amount) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ $t('payment.method') }}:</div>
          <div class="detail-value">{{ formatPaymentMethod(selectedPayment.payment_method, selectedPayment.payment_gateway) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ $t('payment.transactionId') }}:</div>
          <div class="detail-value">{{ selectedPayment.transaction_id || '-' }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ $t('payment.status') }}:</div>
          <div class="detail-value">
            <Tag 
              :value="formatStatus(selectedPayment.status)" 
              :severity="getStatusSeverity(selectedPayment.status)" 
            />
          </div>
        </div>
        <div v-if="selectedPayment.refund_status" class="detail-row">
          <div class="detail-label">{{ $t('payment.refundStatus') }}:</div>
          <div class="detail-value">
            <Tag 
              :value="formatRefundStatus(selectedPayment.refund_status)" 
              :severity="getRefundStatusSeverity(selectedPayment.refund_status)" 
            />
          </div>
        </div>
        <div v-if="selectedPayment.refund_amount" class="detail-row">
          <div class="detail-label">{{ $t('payment.refundAmount') }}:</div>
          <div class="detail-value">{{ formatCurrency(selectedPayment.refund_amount) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">{{ $t('payment.date') }}:</div>
          <div class="detail-value">{{ formatDateTime(selectedPayment.created_at) }}</div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          :label="$t('common.close')" 
          icon="pi pi-times" 
          @click="paymentDetailsVisible = false" 
          class="p-button-text"
        />
        <Button 
          v-if="selectedPayment?.status === 'completed' && !selectedPayment?.refund_status"
          :label="$t('payment.receipt')" 
          icon="pi pi-file-pdf" 
          @click="viewReceipt(selectedPayment.id)" 
        />
        <Button 
          v-if="selectedPayment?.status === 'completed' && !selectedPayment?.refund_status"
          :label="$t('payment.refund')" 
          icon="pi pi-replay" 
          class="p-button-warning"
          @click="openRefundDialog(selectedPayment)"
        />
      </template>
    </Dialog>
    
    <!-- Refund Dialog -->
    <Dialog 
      v-model:visible="refundDialogVisible" 
      :header="$t('payment.refundPayment')"
      :style="{ width: '450px' }"
      :modal="true"
    >
      <div class="refund-form">
        <div class="field">
          <label for="refund-amount">{{ $t('payment.refundAmount') }}</label>
          <InputNumber 
            id="refund-amount" 
            v-model="refundAmount" 
            :min="0" 
            :max="selectedPayment?.amount || 0"
            mode="currency" 
            currency="VND" 
            locale="vi-VN"
            class="w-full"
          />
          <small>{{ $t('payment.maxRefundAmount') }}: {{ formatCurrency(selectedPayment?.amount) }}</small>
        </div>
        
        <div class="field mt-3">
          <label for="refund-reason">{{ $t('payment.refundReason') }}</label>
          <Textarea 
            id="refund-reason" 
            v-model="refundReason" 
            :placeholder="$t('payment.refundReasonPlaceholder')"
            rows="3"
            class="w-full"
          />
        </div>
        
        <div class="refund-warning mt-3">
          <i class="pi pi-exclamation-triangle"></i>
          {{ $t('payment.refundWarning') }}
        </div>
      </div>
      
      <template #footer>
        <Button 
          :label="$t('common.cancel')" 
          icon="pi pi-times" 
          @click="refundDialogVisible = false" 
          class="p-button-text"
        />
        <Button 
          :label="$t('payment.processRefund')" 
          icon="pi pi-check" 
          class="p-button-warning"
          :loading="refundLoading"
          :disabled="!isRefundValid"
          @click="processRefund"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Chart from 'primevue/chart';
import { useAdminPaymentService, Payment, PaymentReport } from '@/services/PaymentService';
import { formatDate, formatTime, formatDateTime, formatCurrency } from '@/utils/formatters';

const { t } = useI18n();
const toast = useToast();
const adminPaymentService = useAdminPaymentService();

// State
const loading = ref(false);
const filters = ref({
  start_date: null as Date | null,
  end_date: null as Date | null,
  payment_method: null as string | null,
  payment_gateway: null as string | null
});

const report = ref<PaymentReport>({
  payments: [],
  total_revenue: 0,
  revenue_by_method: [],
  revenue_by_gateway: [],
  revenue_by_date: []
});

const selectedPayment = ref<Payment | null>(null);
const paymentDetailsVisible = ref(false);
const refundDialogVisible = ref(false);
const refundAmount = ref<number | null>(null);
const refundReason = ref('');
const refundLoading = ref(false);

// Payment methods and gateways
const paymentMethods = [
  { label: t('common.all'), value: null },
  { label: t('payment.methods.online'), value: 'online_payment' },
  { label: t('payment.methods.rewardPoints'), value: 'reward_points' },
  { label: t('payment.methods.creditCard'), value: 'credit_card' },
  { label: 'PayPal', value: 'paypal' }
];

const paymentGateways = [
  { label: t('common.all'), value: null },
  { label: 'MoMo', value: 'momo' },
  { label: 'VNPay', value: 'vnpay' },
  { label: t('payment.methods.bankTransfer'), value: 'bank_transfer' }
];

// Chart data
const revenueByMethodChartData = computed(() => {
  const labels = report.value.revenue_by_method.map(item => 
    formatPaymentMethod(item.payment_method)
  );
  
  const data = report.value.revenue_by_method.map(item => 
    item.total_revenue
  );
  
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#42A5F5',
          '#66BB6A',
          '#FFA726',
          '#26C6DA',
          '#7E57C2'
        ]
      }
    ]
  };
});

const revenueByGatewayChartData = computed(() => {
  const labels = report.value.revenue_by_gateway.map(item => 
    formatPaymentMethod('online_payment', item.payment_gateway)
  );
  
  const data = report.value.revenue_by_gateway.map(item => 
    item.total_revenue
  );
  
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#EC407A',
          '#AB47BC',
          '#5C6BC0',
          '#29B6F6',
          '#26A69A'
        ]
      }
    ]
  };
});

const revenueByDateChartData = computed(() => {
  const labels = report.value.revenue_by_date.map(item => 
    formatDate(item.date)
  );
  
  const data = report.value.revenue_by_date.map(item => 
    item.total_revenue
  );
  
  return {
    labels,
    datasets: [
      {
        label: t('payment.revenue'),
        data,
        backgroundColor: '#42A5F5'
      }
    ]
  };
});

const chartOptions = {
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
};

const barChartOptions = {
  plugins: {
    legend: {
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

// Computed
const isRefundValid = computed(() => {
  return (
    refundAmount.value !== null &&
    refundAmount.value > 0 &&
    refundAmount.value <= (selectedPayment.value?.amount || 0) &&
    refundReason.value.trim() !== ''
  );
});

// Methods
const formatPaymentMethod = (method?: string, gateway?: string) => {
  if (method === 'online_payment' && gateway) {
    const gatewayNames: Record<string, string> = {
      momo: 'MoMo',
      vnpay: 'VNPay',
      bank_transfer: t('payment.methods.bankTransfer')
    };
    
    return gatewayNames[gateway] || gateway;
  }
  
  const methodNames: Record<string, string> = {
    online_payment: t('payment.methods.online'),
    reward_points: t('payment.methods.rewardPoints'),
    credit_card: t('payment.methods.creditCard'),
    paypal: 'PayPal'
  };
  
  return method ? methodNames[method] || method : '-';
};

const formatStatus = (status?: string) => {
  const statusNames: Record<string, string> = {
    pending: t('payment.statuses.pending'),
    completed: t('payment.statuses.completed'),
    failed: t('payment.statuses.failed'),
    cancelled: t('payment.statuses.cancelled')
  };
  
  return status ? statusNames[status] || status : '-';
};

const getStatusSeverity = (status?: string) => {
  const severities: Record<string, string> = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    cancelled: 'info'
  };
  
  return status ? severities[status] || 'info' : 'info';
};

const formatRefundStatus = (status?: string) => {
  const statusNames: Record<string, string> = {
    requested: t('payment.refundStatuses.requested'),
    refunded: t('payment.refundStatuses.refunded'),
    rejected: t('payment.refundStatuses.rejected')
  };
  
  return status ? statusNames[status] || status : '-';
};

const getRefundStatusSeverity = (status?: string) => {
  const severities: Record<string, string> = {
    requested: 'warning',
    refunded: 'success',
    rejected: 'danger'
  };
  
  return status ? severities[status] || 'info' : 'info';
};

const viewPayment = (payment: Payment) => {
  selectedPayment.value = payment;
  paymentDetailsVisible.value = true;
};

const viewReceipt = async (paymentId: number) => {
  try {
    const { receipt_url } = await adminPaymentService.getPaymentReceipt(paymentId);
    
    // Open receipt in new window
    window.open(receipt_url, '_blank');
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('payment.error'),
      detail: error.message || t('payment.receiptError'),
      life: 3000
    });
  }
};

const openRefundDialog = (payment: Payment) => {
  selectedPayment.value = payment;
  refundAmount.value = payment.amount;
  refundReason.value = '';
  refundDialogVisible.value = true;
};

const processRefund = async () => {
  if (!selectedPayment.value || !refundAmount.value || !refundReason.value) return;
  
  try {
    refundLoading.value = true;
    
    await adminPaymentService.processRefund(selectedPayment.value.id, {
      amount: refundAmount.value,
      reason: refundReason.value
    });
    
    toast.add({
      severity: 'success',
      summary: t('payment.refundProcessed'),
      detail: t('payment.refundProcessedMessage'),
      life: 3000
    });
    
    // Close dialog
    refundDialogVisible.value = false;
    
    // Refresh reports
    loadReports();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('payment.error'),
      detail: error.message || t('payment.refundError'),
      life: 3000
    });
  } finally {
    refundLoading.value = false;
  }
};

const applyFilters = () => {
  loadReports();
};

const resetFilters = () => {
  filters.value = {
    start_date: null,
    end_date: null,
    payment_method: null,
    payment_gateway: null
  };
  
  loadReports();
};

const loadReports = async () => {
  try {
    loading.value = true;
    
    // Convert dates to ISO strings
    const filterParams = {
      start_date: filters.value.start_date ? filters.value.start_date.toISOString() : undefined,
      end_date: filters.value.end_date ? filters.value.end_date.toISOString() : undefined,
      payment_method: filters.value.payment_method || undefined,
      payment_gateway: filters.value.payment_gateway || undefined
    };
    
    const reportData = await adminPaymentService.getPaymentReports(filterParams);
    report.value = reportData;
  } catch (error) {
    console.error('Error loading reports:', error);
    toast.add({
      severity: 'error',
      summary: t('payment.error'),
      detail: t('payment.loadError'),
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  loadReports();
});
</script>

<style scoped>
.payment-report-view {
  padding: 20px;
}

.report-filters {
  margin-bottom: 20px;
}

.summary-card {
  text-align: center;
  height: 100%;
}

.summary-title {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 10px;
}

.summary-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2196f3;
}

.payment-details {
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
}

.detail-label {
  font-weight: bold;
  width: 40%;
}

.detail-value {
  width: 60%;
}

.refund-form {
  margin-bottom: 20px;
}

.refund-warning {
  padding: 10px;
  background-color: #fff3e0;
  border-radius: 4px;
  color: #e65100;
  display: flex;
  align-items: center;
}

.refund-warning i {
  margin-right: 8px;
  font-size: 18px;
}
</style>

<template>
  <div class="payment-history">
    <h2>{{ $t('payment.history') }}</h2>
    
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
    </div>
    
    <div v-else-if="payments.length === 0" class="empty-state">
      <i class="pi pi-info-circle"></i>
      <p>{{ $t('payment.noPayments') }}</p>
    </div>
    
    <div v-else class="payments-list">
      <DataTable 
        :value="payments" 
        :paginator="true" 
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
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
              icon="pi pi-times" 
              class="p-button-rounded p-button-text p-button-danger p-button-sm" 
              :tooltip="$t('payment.cancel')"
              @click="openCancellationDialog(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
    
    <!-- Payment Details Dialog -->
    <Dialog 
      v-model:visible="paymentDetailsVisible" 
      :header="$t('payment.details')"
      :style="{ width: '450px' }"
      :modal="true"
    >
      <div v-if="selectedPayment" class="payment-details">
        <div class="detail-row">
          <div class="detail-label">{{ $t('payment.id') }}:</div>
          <div class="detail-value">#{{ selectedPayment.id }}</div>
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
      </template>
    </Dialog>
    
    <!-- Cancellation Dialog -->
    <Dialog 
      v-model:visible="cancellationDialogVisible" 
      :header="$t('payment.cancelPayment')"
      :style="{ width: '450px' }"
      :modal="true"
    >
      <div class="cancellation-form">
        <div class="field">
          <label for="cancellation-reason">{{ $t('payment.cancellationReason') }}</label>
          <Textarea 
            id="cancellation-reason" 
            v-model="cancellationReason" 
            :placeholder="$t('payment.cancellationReasonPlaceholder')"
            rows="3"
            class="w-full"
          />
        </div>
        
        <div class="cancellation-warning">
          <i class="pi pi-exclamation-triangle"></i>
          {{ $t('payment.cancellationWarning') }}
        </div>
      </div>
      
      <template #footer>
        <Button 
          :label="$t('common.cancel')" 
          icon="pi pi-times" 
          @click="cancellationDialogVisible = false" 
          class="p-button-text"
        />
        <Button 
          :label="$t('payment.confirmCancellation')" 
          icon="pi pi-check" 
          class="p-button-danger"
          :loading="cancellationLoading"
          :disabled="!cancellationReason"
          @click="requestCancellation"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import ProgressSpinner from 'primevue/progressspinner';
import { usePaymentService, Payment } from '@/services/PaymentService';
import { formatDate, formatTime, formatDateTime, formatCurrency } from '@/utils/formatters';

const { t } = useI18n();
const toast = useToast();
const paymentService = usePaymentService();

// State
const loading = ref(true);
const payments = ref<Payment[]>([]);
const selectedPayment = ref<Payment | null>(null);
const paymentDetailsVisible = ref(false);
const cancellationDialogVisible = ref(false);
const cancellationReason = ref('');
const cancellationLoading = ref(false);

// Methods
const formatPaymentMethod = (method?: string, gateway?: string) => {
  if (method === 'online_payment' && gateway) {
    const gatewayNames: Record<string, string> = {
      momo: 'MoMo',
      vnpay: 'VNPay',
      bank_transfer: t('payment.bankTransfer')
    };
    
    return gatewayNames[gateway] || gateway;
  }
  
  const methodNames: Record<string, string> = {
    reward_points: t('payment.rewardPoints'),
    credit_card: t('payment.creditCard'),
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
    const { receipt_url } = await paymentService.getPaymentReceipt(paymentId);
    
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

const openCancellationDialog = (payment: Payment) => {
  selectedPayment.value = payment;
  cancellationReason.value = '';
  cancellationDialogVisible.value = true;
};

const requestCancellation = async () => {
  if (!selectedPayment.value || !cancellationReason.value) return;
  
  try {
    cancellationLoading.value = true;
    
    await paymentService.requestPaymentCancellation(selectedPayment.value.id, {
      reason: cancellationReason.value
    });
    
    toast.add({
      severity: 'success',
      summary: t('payment.cancellationRequested'),
      detail: t('payment.cancellationRequestedMessage'),
      life: 3000
    });
    
    // Update payment in list
    const index = payments.value.findIndex(p => p.id === selectedPayment.value?.id);
    if (index !== -1) {
      payments.value[index] = {
        ...payments.value[index],
        refund_status: 'requested'
      };
    }
    
    // Close dialog
    cancellationDialogVisible.value = false;
    
    // Refresh payments
    loadPayments();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('payment.error'),
      detail: error.message || t('payment.cancellationError'),
      life: 3000
    });
  } finally {
    cancellationLoading.value = false;
  }
};

const loadPayments = async () => {
  try {
    loading.value = true;
    const { payments: paymentsList } = await paymentService.getUserPayments();
    payments.value = paymentsList;
  } catch (error) {
    console.error('Error loading payments:', error);
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
  loadPayments();
});
</script>

<style scoped>
.payment-history {
  padding: 20px;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #666;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 10px;
  color: #ccc;
}

.payments-list {
  margin-top: 20px;
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

.cancellation-form {
  margin-bottom: 20px;
}

.cancellation-warning {
  margin-top: 15px;
  padding: 10px;
  background-color: #fff3e0;
  border-radius: 4px;
  color: #e65100;
  display: flex;
  align-items: center;
}

.cancellation-warning i {
  margin-right: 8px;
  font-size: 18px;
}
</style>

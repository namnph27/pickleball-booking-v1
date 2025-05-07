<template>
  <div class="reward-history-list">
    <div class="list-header">
      <h3>{{ $t('reward.pointsHistory') }}</h3>
      <Button 
        icon="pi pi-refresh" 
        class="p-button-text p-button-rounded" 
        @click="loadHistory"
        :loading="loading"
      />
    </div>
    
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
    </div>
    
    <div v-else-if="history.length === 0" class="empty-state">
      <i class="pi pi-info-circle"></i>
      <p>{{ $t('reward.noHistory') }}</p>
    </div>
    
    <div v-else class="history-items">
      <DataTable 
        :value="history" 
        :paginator="true" 
        :rows="5"
        :rowsPerPageOptions="[5, 10, 20]"
        responsiveLayout="stack"
        breakpoint="960px"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="created_at" :header="$t('common.date')" sortable>
          <template #body="{ data }">
            {{ formatDateTime(data.created_at) }}
          </template>
        </Column>
        
        <Column field="description" :header="$t('common.description')" />
        
        <Column field="points" :header="$t('reward.points')" sortable>
          <template #body="{ data }">
            <span :class="['points', data.points > 0 ? 'positive' : 'negative']">
              {{ data.points > 0 ? '+' : '' }}{{ data.points }}
            </span>
          </template>
        </Column>
        
        <Column field="type" :header="$t('common.type')" sortable>
          <template #body="{ data }">
            <Tag 
              :value="formatType(data.type)" 
              :severity="getTypeSeverity(data.type)" 
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { useRewardService, RewardHistory } from '@/services/RewardService';
import { formatDateTime } from '@/utils/formatters';

const toast = useToast();
const rewardService = useRewardService();

const history = ref<RewardHistory[]>([]);
const loading = ref(false);

const formatType = (type: string) => {
  const types: Record<string, string> = {
    earning: 'Earned',
    redemption: 'Redeemed'
  };
  
  return types[type] || type;
};

const getTypeSeverity = (type: string) => {
  const severities: Record<string, string> = {
    earning: 'success',
    redemption: 'info'
  };
  
  return severities[type] || 'info';
};

const loadHistory = async () => {
  try {
    loading.value = true;
    const { history: historyData } = await rewardService.getRewardHistory();
    history.value = historyData;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to load reward history',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.reward-history-list {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.list-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #666;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #ccc;
}

.points {
  font-weight: bold;
}

.points.positive {
  color: #4caf50;
}

.points.negative {
  color: #f44336;
}
</style>

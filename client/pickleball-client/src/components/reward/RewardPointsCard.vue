<template>
  <div class="reward-points-card">
    <div class="card-header">
      <h3>{{ $t('reward.yourPoints') }}</h3>
      <Button 
        icon="pi pi-refresh" 
        class="p-button-text p-button-rounded" 
        @click="refreshPoints"
        :loading="loading"
      />
    </div>
    
    <div class="points-container">
      <div class="points-value">{{ points }}</div>
      <div class="points-label">{{ $t('reward.points') }}</div>
    </div>
    
    <div class="card-actions">
      <Button 
        :label="$t('reward.viewHistory')" 
        icon="pi pi-history" 
        class="p-button-outlined p-button-sm" 
        @click="$emit('view-history')"
      />
      <Button 
        :label="$t('reward.redeemPoints')" 
        icon="pi pi-gift" 
        class="p-button-sm" 
        @click="$emit('redeem-points')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import { useRewardService } from '@/services/RewardService';

const props = defineProps<{
  initialPoints?: number;
}>();

const emit = defineEmits<{
  (e: 'view-history'): void;
  (e: 'redeem-points'): void;
  (e: 'points-updated', points: number): void;
}>();

const toast = useToast();
const rewardService = useRewardService();

const points = ref(props.initialPoints || 0);
const loading = ref(false);

const refreshPoints = async () => {
  try {
    loading.value = true;
    const { reward_points } = await rewardService.getUserRewardPoints();
    points.value = reward_points;
    emit('points-updated', reward_points);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to refresh points',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (!props.initialPoints) {
    refreshPoints();
  }
});
</script>

<style scoped>
.reward-points-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  text-align: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.points-container {
  margin: 20px 0;
}

.points-value {
  font-size: 3rem;
  font-weight: bold;
  color: #2196f3;
}

.points-label {
  font-size: 1rem;
  color: #666;
  margin-top: 5px;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
</style>

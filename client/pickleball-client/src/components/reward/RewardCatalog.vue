<template>
  <div class="reward-catalog">
    <div class="catalog-header">
      <h3>{{ $t('reward.catalog') }}</h3>
      <Button 
        icon="pi pi-refresh" 
        class="p-button-text p-button-rounded" 
        @click="loadRewards"
        :loading="loading"
      />
    </div>
    
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
    </div>
    
    <div v-else-if="rewards.length === 0" class="empty-state">
      <i class="pi pi-info-circle"></i>
      <p>{{ $t('reward.noRewards') }}</p>
    </div>
    
    <div v-else class="rewards-grid">
      <div 
        v-for="reward in rewards" 
        :key="reward.id"
        class="reward-card"
      >
        <div class="reward-image">
          <img :src="reward.image_url || '/images/rewards/default-reward.png'" :alt="reward.name">
        </div>
        <div class="reward-details">
          <h4>{{ reward.name }}</h4>
          <p>{{ reward.description }}</p>
          <div class="reward-points">
            <i class="pi pi-star-fill"></i>
            <span>{{ reward.points_required }} {{ $t('reward.points') }}</span>
          </div>
        </div>
        <div class="reward-actions">
          <Button 
            :label="$t('reward.redeem')" 
            icon="pi pi-gift" 
            :disabled="userPoints < reward.points_required"
            @click="redeemReward(reward)"
          />
        </div>
        <div 
          v-if="userPoints < reward.points_required" 
          class="reward-locked"
        >
          <div class="locked-overlay">
            <i class="pi pi-lock"></i>
            <span>{{ $t('reward.needMorePoints', { points: reward.points_required - userPoints }) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Redemption Confirmation Dialog -->
    <Dialog 
      v-model:visible="confirmDialogVisible" 
      :header="$t('reward.confirmRedemption')"
      :style="{ width: '450px' }"
      :modal="true"
    >
      <div v-if="selectedReward" class="confirmation-content">
        <p>{{ $t('reward.confirmRedeemMessage', { name: selectedReward.name, points: selectedReward.points_required }) }}</p>
        
        <div class="reward-details">
          <div class="reward-image">
            <img :src="selectedReward.image_url || '/images/rewards/default-reward.png'" :alt="selectedReward.name">
          </div>
          <div class="reward-info">
            <h4>{{ selectedReward.name }}</h4>
            <p>{{ selectedReward.description }}</p>
            <div class="reward-points">
              <i class="pi pi-star-fill"></i>
              <span>{{ selectedReward.points_required }} {{ $t('reward.points') }}</span>
            </div>
          </div>
        </div>
        
        <div class="points-after">
          <div class="points-label">{{ $t('reward.currentPoints') }}:</div>
          <div class="points-value">{{ userPoints }}</div>
        </div>
        <div class="points-after">
          <div class="points-label">{{ $t('reward.pointsAfterRedemption') }}:</div>
          <div class="points-value">{{ userPoints - (selectedReward?.points_required || 0) }}</div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          :label="$t('common.cancel')" 
          icon="pi pi-times" 
          @click="confirmDialogVisible = false" 
          class="p-button-text"
        />
        <Button 
          :label="$t('reward.confirmRedeem')" 
          icon="pi pi-check" 
          @click="confirmRedeem" 
          :loading="redeeming"
        />
      </template>
    </Dialog>
    
    <!-- Success Dialog -->
    <Dialog 
      v-model:visible="successDialogVisible" 
      :header="$t('reward.redemptionSuccessful')"
      :style="{ width: '450px' }"
      :modal="true"
    >
      <div class="success-content">
        <i class="pi pi-check-circle"></i>
        <p>{{ $t('reward.redemptionSuccessMessage') }}</p>
        
        <div v-if="redemptionResult" class="redemption-details">
          <div class="detail-row">
            <div class="detail-label">{{ $t('reward.reward') }}:</div>
            <div class="detail-value">{{ redemptionResult.reward.name }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">{{ $t('reward.pointsUsed') }}:</div>
            <div class="detail-value">{{ redemptionResult.reward.points_required }}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">{{ $t('reward.remainingPoints') }}:</div>
            <div class="detail-value">{{ redemptionResult.remaining_points }}</div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          :label="$t('common.close')" 
          icon="pi pi-times" 
          @click="closeSuccessDialog" 
          class="p-button-text"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';
import { useRewardService, Reward } from '@/services/RewardService';

const props = defineProps<{
  userPoints: number;
}>();

const emit = defineEmits<{
  (e: 'points-updated', points: number): void;
}>();

const toast = useToast();
const rewardService = useRewardService();

const rewards = ref<Reward[]>([]);
const loading = ref(false);
const selectedReward = ref<Reward | null>(null);
const confirmDialogVisible = ref(false);
const successDialogVisible = ref(false);
const redeeming = ref(false);
const redemptionResult = ref<any>(null);

const loadRewards = async () => {
  try {
    loading.value = true;
    const { rewards: rewardsData } = await rewardService.getAvailableRewards();
    rewards.value = rewardsData;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to load rewards',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const redeemReward = (reward: Reward) => {
  if (props.userPoints < reward.points_required) {
    toast.add({
      severity: 'warn',
      summary: 'Insufficient Points',
      detail: `You need ${reward.points_required - props.userPoints} more points to redeem this reward.`,
      life: 3000
    });
    return;
  }
  
  selectedReward.value = reward;
  confirmDialogVisible.value = true;
};

const confirmRedeem = async () => {
  if (!selectedReward.value) return;
  
  try {
    redeeming.value = true;
    
    const result = await rewardService.redeemReward(selectedReward.value.id);
    
    redemptionResult.value = result;
    confirmDialogVisible.value = false;
    successDialogVisible.value = true;
    
    // Emit event to update points
    emit('points-updated', result.remaining_points);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Redemption Failed',
      detail: error.message || 'Failed to redeem reward',
      life: 3000
    });
    confirmDialogVisible.value = false;
  } finally {
    redeeming.value = false;
  }
};

const closeSuccessDialog = () => {
  successDialogVisible.value = false;
  loadRewards(); // Refresh rewards list
};

onMounted(() => {
  loadRewards();
});
</script>

<style scoped>
.reward-catalog {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.catalog-header h3 {
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

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.reward-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.reward-image {
  height: 150px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.reward-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.reward-details {
  padding: 15px;
}

.reward-details h4 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
}

.reward-details p {
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  color: #666;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.reward-points {
  display: flex;
  align-items: center;
  color: #ff9800;
  font-weight: bold;
}

.reward-points i {
  margin-right: 5px;
}

.reward-actions {
  padding: 0 15px 15px 15px;
}

.reward-locked {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.locked-overlay {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  max-width: 80%;
}

.locked-overlay i {
  font-size: 2rem;
  color: #f44336;
  margin-bottom: 10px;
  display: block;
}

.confirmation-content {
  margin-bottom: 20px;
}

.confirmation-content .reward-details {
  display: flex;
  margin: 20px 0;
  padding: 0;
}

.confirmation-content .reward-image {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  margin-right: 15px;
}

.confirmation-content .reward-info {
  flex-grow: 1;
}

.confirmation-content .reward-info h4 {
  margin: 0 0 5px 0;
}

.confirmation-content .reward-info p {
  margin: 0 0 10px 0;
  height: auto;
}

.points-after {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.points-label {
  font-weight: bold;
}

.points-value {
  font-weight: bold;
  color: #2196f3;
}

.success-content {
  text-align: center;
  padding: 20px 0;
}

.success-content i {
  font-size: 3rem;
  color: #4caf50;
  margin-bottom: 15px;
}

.redemption-details {
  margin-top: 20px;
  text-align: left;
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
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
</style>

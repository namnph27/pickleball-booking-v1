<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRewardStore } from '../../store/reward';
import { useToast } from '../../composables/useToast';
import BaseLayout from '../../components/layout/BaseLayout.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseCard from '../../components/base/BaseCard.vue';
import BaseSpinner from '../../components/base/BaseSpinner.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseModal from '../../components/base/BaseModal.vue';

const { t } = useI18n();
const rewardStore = useRewardStore();
const toast = useToast();

// State
const activeTab = ref('points');
const selectedItem = ref<any>(null);
const showRedeemModal = ref(false);
const isRedeeming = ref(false);
const redeemError = ref('');

// Computed properties
const points = computed(() => rewardStore.points);
const history = computed(() => rewardStore.history);
const rewardItems = computed(() => rewardStore.rewardItems);
const redemptions = computed(() => rewardStore.redemptions);
const loading = computed(() => rewardStore.loading);

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get history type class
const getHistoryTypeClass = (type: string) => {
  switch (type) {
    case 'earned':
      return 'type-earned';
    case 'redeemed':
      return 'type-redeemed';
    case 'expired':
      return 'type-expired';
    default:
      return '';
  }
};

// Get redemption status class
const getRedemptionStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'status-completed';
    case 'processing':
      return 'status-processing';
    case 'cancelled':
      return 'status-cancelled';
    default:
      return '';
  }
};

// Open redeem modal
const openRedeemModal = (item: any) => {
  selectedItem.value = item;
  showRedeemModal.value = true;
  redeemError.value = '';
};

// Redeem points
const redeemPoints = async () => {
  if (!selectedItem.value) return;
  
  // Check if user has enough points
  if (!points.value || points.value.available_points < selectedItem.value.points_cost) {
    redeemError.value = t('rewards.notEnoughPoints');
    return;
  }
  
  isRedeeming.value = true;
  
  try {
    await rewardStore.redeemPoints(selectedItem.value.id);
    
    toast.success(t('rewards.redeemSuccess'));
    showRedeemModal.value = false;
    
    // Refresh points and redemptions
    await Promise.all([
      rewardStore.getUserPoints(),
      rewardStore.getUserRedemptions()
    ]);
  } catch (error) {
    redeemError.value = typeof error === 'string' ? error : t('rewards.redeemError');
  } finally {
    isRedeeming.value = false;
  }
};

// Cancel redemption
const cancelRedemption = async (redemptionId: number) => {
  try {
    await rewardStore.cancelRedemption(redemptionId);
    
    toast.success(t('rewards.cancellationSuccess'));
    
    // Refresh points and redemptions
    await Promise.all([
      rewardStore.getUserPoints(),
      rewardStore.getUserRedemptions()
    ]);
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('rewards.cancellationError'));
  }
};

// Fetch rewards data on mount
onMounted(async () => {
  try {
    await Promise.all([
      rewardStore.getUserPoints(),
      rewardStore.getRewardHistory(),
      rewardStore.getRewardItems(),
      rewardStore.getUserRedemptions()
    ]);
  } catch (error) {
    toast.error(typeof error === 'string' ? error : t('rewards.fetchError'));
  }
});
</script>

<template>
  <BaseLayout :title="t('rewards.myRewards')">
    <!-- Points Summary -->
    <div class="points-summary">
      <BaseCard>
        <div class="points-container">
          <div class="points-header">
            <h2 class="points-title">{{ t('rewards.rewardPoints') }}</h2>
            <p class="points-subtitle">{{ t('rewards.earnPointsDesc') }}</p>
          </div>
          
          <div v-if="loading && !points" class="points-loading">
            <BaseSpinner size="small" />
          </div>
          
          <div v-else-if="points" class="points-stats">
            <div class="points-stat">
              <div class="stat-value">{{ points.available_points }}</div>
              <div class="stat-label">{{ t('rewards.availablePoints') }}</div>
            </div>
            
            <div class="points-stat">
              <div class="stat-value">{{ points.total_points }}</div>
              <div class="stat-label">{{ t('rewards.totalEarned') }}</div>
            </div>
            
            <div class="points-stat">
              <div class="stat-value">{{ points.redeemed_points }}</div>
              <div class="stat-label">{{ t('rewards.redeemed') }}</div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
    
    <!-- Tabs -->
    <div class="rewards-tabs">
      <button 
        class="tab-button" 
        :class="{ 'active': activeTab === 'points' }"
        @click="activeTab = 'points'"
      >
        {{ t('rewards.pointsHistory') }}
      </button>
      
      <button 
        class="tab-button" 
        :class="{ 'active': activeTab === 'rewards' }"
        @click="activeTab = 'rewards'"
      >
        {{ t('rewards.redeemRewards') }}
      </button>
      
      <button 
        class="tab-button" 
        :class="{ 'active': activeTab === 'redemptions' }"
        @click="activeTab = 'redemptions'"
      >
        {{ t('rewards.myRedemptions') }}
      </button>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading && activeTab !== 'points'" class="rewards-loading">
      <BaseSpinner />
    </div>
    
    <!-- Points History Tab -->
    <div v-else-if="activeTab === 'points'" class="rewards-content">
      <div v-if="history.length === 0" class="no-data">
        <i class="pi pi-history no-data-icon"></i>
        <h3>{{ t('rewards.noPointsHistory') }}</h3>
        <p>{{ t('rewards.startEarningPoints') }}</p>
        <BaseButton 
          :label="t('rewards.findCourts')" 
          variant="primary"
          @click="$router.push('/courts')"
        />
      </div>
      
      <div v-else class="history-list">
        <div 
          v-for="item in history" 
          :key="item.id"
          class="history-item"
        >
          <div class="history-icon">
            <i :class="`pi ${item.type === 'earned' ? 'pi-plus-circle' : item.type === 'redeemed' ? 'pi-minus-circle' : 'pi-clock'}`"></i>
          </div>
          
          <div class="history-details">
            <div class="history-description">{{ item.description }}</div>
            <div class="history-meta">
              <span class="history-date">{{ formatDate(item.created_at) }}</span>
              <span class="history-source">{{ t(`rewards.source.${item.source}`) }}</span>
            </div>
          </div>
          
          <div class="history-points">
            <span :class="['points-value', getHistoryTypeClass(item.type)]">
              {{ item.type === 'earned' ? '+' : '-' }}{{ item.points }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Redeem Rewards Tab -->
    <div v-else-if="activeTab === 'rewards'" class="rewards-content">
      <div v-if="rewardItems.length === 0" class="no-data">
        <i class="pi pi-gift no-data-icon"></i>
        <h3>{{ t('rewards.noRewardsAvailable') }}</h3>
        <p>{{ t('rewards.checkBackLater') }}</p>
      </div>
      
      <div v-else class="rewards-grid">
        <BaseCard 
          v-for="item in rewardItems" 
          :key="item.id"
          class="reward-card"
          hoverable
        >
          <div class="reward-image">
            <img :src="item.image_url || '/images/reward-placeholder.jpg'" :alt="item.name" />
          </div>
          
          <div class="reward-details">
            <h3 class="reward-name">{{ item.name }}</h3>
            <p class="reward-description">{{ item.description }}</p>
          </div>
          
          <div class="reward-points">
            <span class="points-cost">{{ item.points_cost }}</span>
            <span class="points-label">{{ t('rewards.points') }}</span>
          </div>
          
          <template #footer>
            <BaseButton 
              :label="t('rewards.redeem')" 
              variant="primary" 
              full-width
              :disabled="!points || points.available_points < item.points_cost"
              @click="openRedeemModal(item)"
            />
          </template>
        </BaseCard>
      </div>
    </div>
    
    <!-- My Redemptions Tab -->
    <div v-else-if="activeTab === 'redemptions'" class="rewards-content">
      <div v-if="redemptions.length === 0" class="no-data">
        <i class="pi pi-shopping-bag no-data-icon"></i>
        <h3>{{ t('rewards.noRedemptions') }}</h3>
        <p>{{ t('rewards.redeemRewardsFirst') }}</p>
        <BaseButton 
          :label="t('rewards.browseRewards')" 
          variant="primary"
          @click="activeTab = 'rewards'"
        />
      </div>
      
      <div v-else class="redemptions-list">
        <BaseCard 
          v-for="redemption in redemptions" 
          :key="redemption.id"
          class="redemption-card"
        >
          <div class="redemption-header">
            <div class="redemption-item">
              <h3 class="item-name">{{ redemption.reward_item?.name }}</h3>
              <p class="item-description">{{ redemption.reward_item?.description }}</p>
            </div>
            
            <div class="redemption-status">
              <span :class="['status-badge', getRedemptionStatusClass(redemption.status)]">
                {{ t(`rewards.status.${redemption.status}`) }}
              </span>
            </div>
          </div>
          
          <div class="redemption-details">
            <div class="details-item">
              <span class="details-label">{{ t('rewards.redeemedOn') }}:</span>
              <span class="details-value">{{ formatDate(redemption.created_at) }}</span>
            </div>
            
            <div class="details-item">
              <span class="details-label">{{ t('rewards.pointsUsed') }}:</span>
              <span class="details-value">{{ redemption.points_used }}</span>
            </div>
          </div>
          
          <template #footer>
            <div class="redemption-actions">
              <BaseButton 
                v-if="redemption.status === 'processing'"
                :label="t('rewards.cancelRedemption')" 
                variant="danger"
                @click="cancelRedemption(redemption.id)"
              />
            </div>
          </template>
        </BaseCard>
      </div>
    </div>
    
    <!-- Redeem Modal -->
    <BaseModal
      v-model="showRedeemModal"
      :title="t('rewards.confirmRedemption')"
      :ok-text="t('rewards.confirmRedeem')"
      :cancel-text="t('common.cancel')"
      :loading="isRedeeming"
      @ok="redeemPoints"
    >
      <div v-if="redeemError" class="modal-error">
        <BaseAlert type="error" :message="redeemError" />
      </div>
      
      <div v-if="selectedItem" class="redeem-confirmation">
        <div class="selected-reward">
          <h3 class="reward-name">{{ selectedItem.name }}</h3>
          <p class="reward-description">{{ selectedItem.description }}</p>
        </div>
        
        <div class="points-summary">
          <div class="summary-row">
            <span class="summary-label">{{ t('rewards.availablePoints') }}:</span>
            <span class="summary-value">{{ points?.available_points || 0 }}</span>
          </div>
          
          <div class="summary-row">
            <span class="summary-label">{{ t('rewards.pointsCost') }}:</span>
            <span class="summary-value">{{ selectedItem.points_cost }}</span>
          </div>
          
          <div class="summary-row total">
            <span class="summary-label">{{ t('rewards.remainingPoints') }}:</span>
            <span class="summary-value">{{ (points?.available_points || 0) - selectedItem.points_cost }}</span>
          </div>
        </div>
        
        <div class="redemption-terms">
          <h4>{{ t('rewards.redemptionTerms') }}</h4>
          <ul>
            <li>{{ t('rewards.term1') }}</li>
            <li>{{ t('rewards.term2') }}</li>
            <li>{{ t('rewards.term3') }}</li>
          </ul>
        </div>
      </div>
    </BaseModal>
  </BaseLayout>
</template>

<style scoped lang="scss">
.points-summary {
  margin-bottom: 2rem;
}

.points-container {
  .points-header {
    margin-bottom: 1.5rem;
    
    .points-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }
    
    .points-subtitle {
      color: var(--dark-gray);
      margin: 0;
    }
  }
  
  .points-loading {
    display: flex;
    justify-content: center;
    padding: 1.5rem 0;
  }
  
  .points-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    
    .points-stat {
      background-color: var(--light-gray);
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      
      &:first-child {
        background-color: rgba(76, 175, 80, 0.1);
        
        .stat-value {
          color: var(--primary-color);
        }
      }
      
      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      
      .stat-label {
        font-size: 0.875rem;
        color: var(--dark-gray);
      }
    }
  }
}

.rewards-tabs {
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--medium-gray);
  
  .tab-button {
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    color: var(--dark-gray);
    cursor: pointer;
    position: relative;
    
    &.active {
      color: var(--primary-color);
      
      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: var(--primary-color);
      }
    }
  }
}

.rewards-loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  text-align: center;
  
  .no-data-icon {
    font-size: 3rem;
    color: var(--dark-gray);
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: var(--dark-gray);
    margin-bottom: 1.5rem;
    max-width: 500px;
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  .history-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    background-color: var(--white);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    
    .history-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--light-gray);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
      
      i {
        font-size: 1.25rem;
        color: var(--dark-gray);
      }
    }
    
    .history-details {
      flex: 1;
      
      .history-description {
        font-weight: 500;
        margin-bottom: 0.25rem;
      }
      
      .history-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: var(--dark-gray);
        
        .history-source {
          padding: 0.125rem 0.5rem;
          background-color: var(--light-gray);
          border-radius: 4px;
        }
      }
    }
    
    .history-points {
      .points-value {
        font-weight: 600;
        
        &.type-earned {
          color: var(--primary-color);
        }
        
        &.type-redeemed {
          color: #f44336;
        }
        
        &.type-expired {
          color: var(--dark-gray);
        }
      }
    }
  }
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.reward-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .reward-image {
    height: 160px;
    overflow: hidden;
    border-radius: 8px;
    margin-bottom: 1rem;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .reward-details {
    flex: 1;
    
    .reward-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }
    
    .reward-description {
      font-size: 0.875rem;
      color: var(--dark-gray);
      margin: 0 0 1rem 0;
    }
  }
  
  .reward-points {
    display: flex;
    align-items: baseline;
    margin-bottom: 1rem;
    
    .points-cost {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-right: 0.5rem;
    }
    
    .points-label {
      font-size: 0.875rem;
      color: var(--dark-gray);
    }
  }
}

.redemptions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.redemption-card {
  .redemption-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    
    .redemption-item {
      .item-name {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
      }
      
      .item-description {
        font-size: 0.875rem;
        color: var(--dark-gray);
        margin: 0;
      }
    }
    
    .redemption-status {
      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        
        &.status-completed {
          background-color: rgba(76, 175, 80, 0.1);
          color: #2e7d32;
        }
        
        &.status-processing {
          background-color: rgba(255, 152, 0, 0.1);
          color: #ef6c00;
        }
        
        &.status-cancelled {
          background-color: rgba(244, 67, 54, 0.1);
          color: #c62828;
        }
      }
    }
  }
  
  .redemption-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    
    .details-item {
      display: flex;
      justify-content: space-between;
      
      .details-label {
        font-weight: 500;
      }
      
      .details-value {
        color: var(--dark-gray);
      }
    }
  }
}

.modal-error {
  margin-bottom: 1.5rem;
}

.redeem-confirmation {
  .selected-reward {
    margin-bottom: 1.5rem;
    
    .reward-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }
    
    .reward-description {
      color: var(--dark-gray);
      margin: 0;
    }
  }
  
  .points-summary {
    background-color: var(--light-gray);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      &.total {
        padding-top: 0.5rem;
        margin-top: 0.5rem;
        border-top: 1px solid var(--medium-gray);
        font-weight: 600;
      }
    }
  }
  
  .redemption-terms {
    h4 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.75rem 0;
    }
    
    ul {
      padding-left: 1.5rem;
      margin: 0;
      
      li {
        margin-bottom: 0.5rem;
        color: var(--dark-gray);
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .points-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .rewards-tabs {
    flex-wrap: wrap;
    
    .tab-button {
      flex: 1;
      padding: 0.75rem;
      text-align: center;
    }
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    
    .history-icon {
      margin-bottom: 0.75rem;
    }
    
    .history-details {
      width: 100%;
      margin-bottom: 0.75rem;
    }
  }
  
  .redemptions-list {
    grid-template-columns: 1fr;
  }
}
</style>

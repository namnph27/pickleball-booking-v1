<template>
  <div class="reward-dashboard">
    <div class="container">
      <h1>{{ $t('reward.dashboard') }}</h1>
      
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
      </div>
      
      <div v-else class="dashboard-content">
        <div class="dashboard-header">
          <RewardPointsCard 
            :initial-points="rewardSummary.current_points" 
            @view-history="activeTab = 'history'"
            @redeem-points="activeTab = 'catalog'"
            @points-updated="updatePoints"
          />
        </div>
        
        <div class="dashboard-tabs">
          <TabView v-model:activeIndex="activeTabIndex">
            <TabPanel :header="$t('reward.summary')">
              <div class="summary-container">
                <div class="summary-stats">
                  <div class="stat-card">
                    <div class="stat-title">{{ $t('reward.totalEarned') }}</div>
                    <div class="stat-value">{{ rewardSummary.total_points_earned }}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-title">{{ $t('reward.totalRedeemed') }}</div>
                    <div class="stat-value">{{ rewardSummary.total_points_redeemed }}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-title">{{ $t('reward.currentPoints') }}</div>
                    <div class="stat-value">{{ rewardSummary.current_points }}</div>
                  </div>
                </div>
                
                <div class="recent-history">
                  <h3>{{ $t('reward.recentActivity') }}</h3>
                  <div v-if="rewardSummary.recent_history.length === 0" class="empty-state">
                    <i class="pi pi-info-circle"></i>
                    <p>{{ $t('reward.noRecentActivity') }}</p>
                  </div>
                  <div v-else class="history-items">
                    <div 
                      v-for="item in rewardSummary.recent_history" 
                      :key="item.id"
                      class="history-item"
                    >
                      <div class="history-icon">
                        <i :class="item.points > 0 ? 'pi pi-plus-circle' : 'pi pi-minus-circle'"></i>
                      </div>
                      <div class="history-details">
                        <div class="history-description">{{ item.description }}</div>
                        <div class="history-date">{{ formatDateTime(item.created_at) }}</div>
                      </div>
                      <div class="history-points" :class="item.points > 0 ? 'positive' : 'negative'">
                        {{ item.points > 0 ? '+' : '' }}{{ item.points }}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="next-rewards">
                  <h3>{{ $t('reward.nextRewards') }}</h3>
                  <div v-if="rewardSummary.next_rewards.length === 0" class="empty-state">
                    <i class="pi pi-info-circle"></i>
                    <p>{{ $t('reward.noNextRewards') }}</p>
                  </div>
                  <div v-else class="next-rewards-grid">
                    <div 
                      v-for="reward in rewardSummary.next_rewards" 
                      :key="reward.id"
                      class="next-reward-card"
                    >
                      <div class="reward-image">
                        <img :src="reward.image_url || '/images/rewards/default-reward.png'" :alt="reward.name">
                      </div>
                      <div class="reward-details">
                        <h4>{{ reward.name }}</h4>
                        <div class="points-progress">
                          <div class="progress-label">
                            <span>{{ rewardSummary.current_points }} / {{ reward.points_required }}</span>
                          </div>
                          <ProgressBar 
                            :value="(rewardSummary.current_points / reward.points_required) * 100" 
                            :showValue="false" 
                          />
                        </div>
                        <div class="points-needed">
                          {{ $t('reward.pointsNeeded', { points: reward.points_required - rewardSummary.current_points }) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
            
            <TabPanel :header="$t('reward.history')">
              <RewardHistoryList />
            </TabPanel>
            
            <TabPanel :header="$t('reward.catalog')">
              <RewardCatalog :user-points="rewardSummary.current_points" @points-updated="updatePoints" />
            </TabPanel>
          </TabView>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import ProgressSpinner from 'primevue/progressspinner';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import ProgressBar from 'primevue/progressbar';
import RewardPointsCard from '@/components/reward/RewardPointsCard.vue';
import RewardHistoryList from '@/components/reward/RewardHistoryList.vue';
import RewardCatalog from '@/components/reward/RewardCatalog.vue';
import { useRewardService } from '@/services/RewardService';
import { formatDateTime } from '@/utils/formatters';

const toast = useToast();
const rewardService = useRewardService();

const loading = ref(true);
const activeTab = ref('summary');
const rewardSummary = ref({
  current_points: 0,
  total_points_earned: 0,
  total_points_redeemed: 0,
  recent_history: [],
  redeemable_rewards: [],
  next_rewards: []
});

const activeTabIndex = computed({
  get: () => {
    const tabs = ['summary', 'history', 'catalog'];
    return tabs.indexOf(activeTab.value);
  },
  set: (index) => {
    const tabs = ['summary', 'history', 'catalog'];
    activeTab.value = tabs[index];
  }
});

const loadRewardSummary = async () => {
  try {
    loading.value = true;
    const summary = await rewardService.getUserRewardSummary();
    rewardSummary.value = summary;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to load reward summary',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const updatePoints = (points: number) => {
  rewardSummary.value.current_points = points;
};

watch(activeTab, (newTab) => {
  if (newTab === 'summary') {
    loadRewardSummary();
  }
});

onMounted(() => {
  loadRewardSummary();
});
</script>

<style scoped>
.reward-dashboard {
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.dashboard-header {
  margin-bottom: 30px;
  max-width: 400px;
}

.dashboard-tabs {
  margin-bottom: 30px;
}

.summary-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.summary-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  flex: 1;
  min-width: 200px;
  text-align: center;
}

.stat-title {
  font-size: 1rem;
  color: #666;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2196f3;
}

.recent-history, .next-rewards {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.recent-history h3, .next-rewards h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2rem;
  color: #333;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  color: #666;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #ccc;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.history-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
}

.history-icon i {
  color: #2196f3;
}

.history-details {
  flex-grow: 1;
}

.history-description {
  font-weight: bold;
  margin-bottom: 5px;
}

.history-date {
  font-size: 0.8rem;
  color: #999;
}

.history-points {
  font-weight: bold;
  font-size: 1.2rem;
}

.history-points.positive {
  color: #4caf50;
}

.history-points.negative {
  color: #f44336;
}

.next-rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.next-reward-card {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.reward-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e3f2fd;
}

.reward-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.reward-details {
  padding: 10px;
  flex-grow: 1;
}

.reward-details h4 {
  margin: 0 0 10px 0;
  font-size: 1rem;
}

.points-progress {
  margin-bottom: 5px;
}

.progress-label {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 5px;
  font-size: 0.8rem;
  color: #666;
}

.points-needed {
  font-size: 0.9rem;
  color: #f44336;
  margin-top: 5px;
}
</style>

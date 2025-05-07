import { defineStore } from 'pinia';
import { ref } from 'vue';
import { 
  useRewardService, 
  type RewardPoints, 
  type RewardHistory, 
  type RewardItem, 
  type Redemption 
} from '../services/RewardService';

export const useRewardStore = defineStore('reward', () => {
  const rewardService = useRewardService();
  
  const points = ref<RewardPoints | null>(null);
  const history = ref<RewardHistory[]>([]);
  const rewardItems = ref<RewardItem[]>([]);
  const currentItem = ref<RewardItem | null>(null);
  const redemptions = ref<Redemption[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Get user reward points
  async function getUserPoints() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await rewardService.getUserPoints();
      points.value = response.points;
      return response.points;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch reward points';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }
  
  // Get reward history
  async function getRewardHistory() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await rewardService.getRewardHistory();
      history.value = response.history;
      return response.history;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch reward history';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }
  
  // Get reward items
  async function getRewardItems() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await rewardService.getRewardItems();
      rewardItems.value = response.items;
      return response.items;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch reward items';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }
  
  // Get reward item by ID
  async function getRewardItemById(id: number) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await rewardService.getRewardItemById(id);
      currentItem.value = response.item;
      return response.item;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch reward item details';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }
  
  // Redeem points for a reward
  async function redeemPoints(itemId: number) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await rewardService.redeemPoints(itemId);
      
      // Update points after redemption
      if (points.value) {
        points.value.available_points -= response.redemption.points_used;
        points.value.redeemed_points += response.redemption.points_used;
      }
      
      // Add to redemptions
      redemptions.value.unshift(response.redemption);
      
      return response.redemption;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to redeem points';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }
  
  // Get user redemptions
  async function getUserRedemptions() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await rewardService.getUserRedemptions();
      redemptions.value = response.redemptions;
      return response.redemptions;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch redemptions';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }
  
  // Cancel a redemption
  async function cancelRedemption(id: number) {
    loading.value = true;
    error.value = null;
    
    try {
      await rewardService.cancelRedemption(id);
      
      // Find the redemption
      const redemption = redemptions.value.find(r => r.id === id);
      
      // Update points after cancellation
      if (points.value && redemption) {
        points.value.available_points += redemption.points_used;
        points.value.redeemed_points -= redemption.points_used;
      }
      
      // Update redemption status
      const index = redemptions.value.findIndex(r => r.id === id);
      if (index !== -1) {
        redemptions.value[index].status = 'cancelled';
      }
      
      return true;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to cancel redemption';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }
  
  // Reset state
  function reset() {
    points.value = null;
    history.value = [];
    rewardItems.value = [];
    currentItem.value = null;
    redemptions.value = [];
    error.value = null;
  }
  
  return {
    points,
    history,
    rewardItems,
    currentItem,
    redemptions,
    loading,
    error,
    getUserPoints,
    getRewardHistory,
    getRewardItems,
    getRewardItemById,
    redeemPoints,
    getUserRedemptions,
    cancelRedemption,
    reset
  };
});

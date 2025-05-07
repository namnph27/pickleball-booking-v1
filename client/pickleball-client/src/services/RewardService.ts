import { useApi } from '../composables/useApi';

export interface RewardPoints {
  total_points: number;
  available_points: number;
  redeemed_points: number;
  expired_points: number;
}

export interface RewardHistory {
  id: number;
  user_id: number;
  points: number;
  type: 'earned' | 'redeemed' | 'expired';
  source: 'booking' | 'referral' | 'promotion' | 'other';
  description: string;
  created_at: string;
}

export interface RewardItem {
  id: number;
  name: string;
  description: string;
  points_cost: number;
  is_active: boolean;
  image_url?: string;
}

export interface Redemption {
  id: number;
  user_id: number;
  reward_item_id: number;
  points_used: number;
  status: 'processing' | 'completed' | 'cancelled';
  created_at: string;
  reward_item?: RewardItem;
}

export function useRewardService() {
  const { get, post } = useApi();

  // Get user reward points
  const getUserPoints = () => {
    return get<{ points: RewardPoints }>('/api/rewards/points');
  };

  // Get user reward history
  const getRewardHistory = () => {
    return get<{ history: RewardHistory[] }>('/api/rewards/history');
  };

  // Get available reward items
  const getRewardItems = () => {
    return get<{ items: RewardItem[] }>('/api/rewards/items');
  };

  // Get reward item details
  const getRewardItemById = (id: number) => {
    return get<{ item: RewardItem }>(`/api/rewards/items/${id}`);
  };

  // Redeem points for a reward
  const redeemPoints = (itemId: number) => {
    return post<{ redemption: Redemption }>('/api/rewards/redeem', { reward_item_id: itemId });
  };

  // Get user redemptions
  const getUserRedemptions = () => {
    return get<{ redemptions: Redemption[] }>('/api/rewards/redemptions');
  };

  // Get redemption details
  const getRedemptionById = (id: number) => {
    return get<{ redemption: Redemption }>(`/api/rewards/redemptions/${id}`);
  };

  // Cancel a redemption
  const cancelRedemption = (id: number) => {
    return post<{ message: string }>(`/api/rewards/redemptions/${id}/cancel`);
  };

  return {
    getUserPoints,
    getRewardHistory,
    getRewardItems,
    getRewardItemById,
    redeemPoints,
    getUserRedemptions,
    getRedemptionById,
    cancelRedemption
  };
}

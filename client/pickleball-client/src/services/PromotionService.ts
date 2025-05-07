import { useApi } from '../composables/useApi';

export interface Promotion {
  id: number;
  code: string;
  description: string;
  discount_percent: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export function usePromotionService() {
  const { get, post } = useApi();

  // Get active promotions
  const getActivePromotions = () => {
    return get<{ promotions: Promotion[] }>('/api/promotions/active');
  };

  // Verify promotion code
  const verifyPromotionCode = (code: string) => {
    return get<{ 
      valid: boolean;
      promotion?: Promotion;
      message?: string;
    }>(`/api/promotions/verify/${code}`);
  };

  // Apply promotion to booking
  const applyPromotion = (bookingId: number, code: string) => {
    return post<{
      success: boolean;
      discount_amount: number;
      new_total: number;
      message: string;
    }>(`/api/bookings/${bookingId}/apply-promotion`, { promotion_code: code });
  };

  return {
    getActivePromotions,
    verifyPromotionCode,
    applyPromotion
  };
}

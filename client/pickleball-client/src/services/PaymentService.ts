import { useApiService } from './ApiService';

export interface Payment {
  id: number;
  booking_id: number;
  user_id: number;
  amount: number;
  payment_method: string;
  payment_gateway?: string;
  transaction_id?: string;
  status: string;
  invoice_number?: string;
  invoice_url?: string;
  refund_status?: string;
  refund_amount?: number;
  refund_date?: string;
  created_at: string;
  updated_at: string;
  // Additional fields from joins
  court_name?: string;
  start_time?: string;
  end_time?: string;
}

export interface PaymentGateway {
  name: string;
  displayName: string;
  config: any;
}

export interface PaymentRequest {
  booking_id: number;
  payment_method: string;
  payment_gateway?: string;
  return_url?: string;
  cancel_url?: string;
}

export interface PaymentResponse {
  payment: Payment;
  redirect_url?: string;
}

export interface PaymentReceipt {
  receipt_url: string;
}

export interface PaymentCancellationRequest {
  reason: string;
}

export function usePaymentService() {
  const { get, post, put } = useApiService();

  // Process payment
  const processPayment = (paymentData: PaymentRequest) => {
    return post<PaymentResponse>('/api/payments', paymentData);
  };

  // Get payment by ID
  const getPaymentById = (id: number) => {
    return get<{ payment: Payment }>(`/api/payments/${id}`);
  };

  // Get all payments for current user
  const getUserPayments = () => {
    return get<{ payments: Payment[] }>('/api/payments/my-payments');
  };

  // Get payment receipt
  const getPaymentReceipt = (id: number) => {
    return get<PaymentReceipt>(`/api/payments/${id}/receipt`);
  };

  // Get active payment gateways
  const getActivePaymentGateways = () => {
    return get<{ gateways: PaymentGateway[] }>('/api/payments/gateways');
  };

  // Request payment cancellation
  const requestPaymentCancellation = (id: number, data: PaymentCancellationRequest) => {
    return post<{ message: string; payment_id: number }>(`/api/payments/${id}/cancel`, data);
  };

  return {
    processPayment,
    getPaymentById,
    getUserPayments,
    getPaymentReceipt,
    getActivePaymentGateways,
    requestPaymentCancellation
  };
}

// Admin payment service
export interface PaymentFilter {
  start_date?: string;
  end_date?: string;
  payment_method?: string;
  payment_gateway?: string;
  status?: string;
}

export interface PaymentReport {
  payments: Payment[];
  total_revenue: number;
  revenue_by_method: {
    payment_method: string;
    total_revenue: number;
    count: number;
  }[];
  revenue_by_gateway: {
    payment_gateway: string;
    total_revenue: number;
    count: number;
  }[];
  revenue_by_date: {
    date: string;
    total_revenue: number;
    count: number;
  }[];
}

export interface PaymentStatistics {
  total_revenue: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  revenue_by_method: {
    payment_method: string;
    total_revenue: number;
    count: number;
  }[];
  revenue_by_gateway: {
    payment_gateway: string;
    total_revenue: number;
    count: number;
  }[];
  revenue_by_date: {
    date: string;
    total_revenue: number;
    count: number;
  }[];
}

export interface PaymentConfig {
  id: number;
  gateway_name: string;
  is_active: boolean;
  config_data: any;
  created_at: string;
  updated_at: string;
}

export interface RefundRequest {
  amount: number;
  reason: string;
}

export function useAdminPaymentService() {
  const { get, post, put } = useApiService();

  // Get all payments with filters
  const getAllPayments = (filters?: PaymentFilter) => {
    return get<{ payments: Payment[] }>('/api/admin/payments', filters);
  };

  // Get payment by ID
  const getPaymentById = (id: number) => {
    return get<{ payment: Payment; logs: any[]; booking_details: any }>(`/api/admin/payments/${id}`);
  };

  // Get payment reports
  const getPaymentReports = (filters?: PaymentFilter) => {
    return get<PaymentReport>('/api/admin/payments/reports', filters);
  };

  // Get payment statistics
  const getPaymentStatistics = () => {
    return get<PaymentStatistics>('/api/admin/payments/statistics');
  };

  // Get payment configs
  const getPaymentConfigs = () => {
    return get<{ configs: PaymentConfig[] }>('/api/admin/payments/configs');
  };

  // Update payment config
  const updatePaymentConfig = (id: number, data: { is_active?: boolean; config_data?: any }) => {
    return put<{ message: string; config: PaymentConfig }>(`/api/admin/payments/configs/${id}`, data);
  };

  // Process refund
  const processRefund = (id: number, data: RefundRequest) => {
    return post<{ message: string; payment: Payment; refund_result: any }>(`/api/admin/payments/${id}/refund`, data);
  };

  return {
    getAllPayments,
    getPaymentById,
    getPaymentReports,
    getPaymentStatistics,
    getPaymentConfigs,
    updatePaymentConfig,
    processRefund
  };
}

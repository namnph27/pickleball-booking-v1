import { useApiService } from './ApiService';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string | null;
  related_id: number | null;
  related_type: string | null;
  is_system: boolean;
  is_read: boolean;
  created_at: string;
}

export function useNotificationService() {
  const { get, post, put, remove } = useApiService();

  // Get user notifications
  const getUserNotifications = (limit = 50, offset = 0) => {
    return get<{ notifications: Notification[] }>('/api/notifications', { limit, offset });
  };

  // Get unread count
  const getUnreadCount = () => {
    return get<{ unread_count: number }>('/api/notifications/unread-count');
  };

  // Mark notification as read
  const markAsRead = (id: number) => {
    return put<{ message: string; notification: Notification }>(`/api/notifications/${id}/read`);
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    return put<{ message: string }>('/api/notifications/read-all');
  };

  // Delete notification
  const deleteNotification = (id: number) => {
    return remove<{ message: string }>(`/api/notifications/${id}`);
  };

  return {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}

// Admin notification service
export function useAdminNotificationService() {
  const { post } = useApiService();

  // Send notification to user
  const sendNotification = (data: {
    user_id: number;
    title: string;
    message: string;
    type?: string;
    related_id?: number;
    related_type?: string;
  }) => {
    return post<{ message: string; notification: Notification }>('/api/notifications/send', data);
  };

  // Send system notification to all users
  const sendSystemNotification = (data: {
    title: string;
    message: string;
    type?: string;
    related_id?: number;
    related_type?: string;
  }) => {
    return post<{ message: string; count: number }>('/api/notifications/send-system', data);
  };

  return {
    sendNotification,
    sendSystemNotification
  };
}

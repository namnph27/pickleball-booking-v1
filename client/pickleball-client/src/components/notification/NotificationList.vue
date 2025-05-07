<template>
  <div class="notification-list">
    <div class="list-header">
      <h3>{{ $t('notification.notifications') }}</h3>
      <div class="header-actions">
        <Button 
          :label="$t('notification.markAllRead')" 
          icon="pi pi-check" 
          class="p-button-text p-button-sm" 
          @click="markAllAsRead"
          :disabled="loading || notifications.length === 0 || !hasUnread"
        />
        <Button 
          icon="pi pi-refresh" 
          class="p-button-text p-button-rounded" 
          @click="loadNotifications"
          :loading="loading"
        />
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
    </div>
    
    <div v-else-if="notifications.length === 0" class="empty-state">
      <i class="pi pi-bell-slash"></i>
      <p>{{ $t('notification.noNotifications') }}</p>
    </div>
    
    <div v-else class="notification-items">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        :class="['notification-item', { 'unread': !notification.is_read }]"
      >
        <div class="notification-icon">
          <i :class="getNotificationIcon(notification.type)"></i>
        </div>
        <div class="notification-content" @click="viewNotification(notification)">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
          <div class="notification-time">{{ formatRelativeTime(notification.created_at) }}</div>
        </div>
        <div class="notification-actions">
          <Button 
            v-if="!notification.is_read"
            icon="pi pi-check" 
            class="p-button-text p-button-rounded p-button-sm" 
            :tooltip="$t('notification.markRead')"
            @click="markAsRead(notification.id)"
          />
          <Button 
            icon="pi pi-trash" 
            class="p-button-text p-button-rounded p-button-danger p-button-sm" 
            :tooltip="$t('common.delete')"
            @click="deleteNotification(notification.id)"
          />
        </div>
      </div>
      
      <div v-if="hasMore" class="load-more">
        <Button 
          :label="$t('common.loadMore')" 
          icon="pi pi-chevron-down" 
          class="p-button-text" 
          @click="loadMore"
          :loading="loadingMore"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { useNotificationService, Notification } from '@/services/NotificationService';

const props = defineProps<{
  limit?: number;
}>();

const emit = defineEmits<{
  (e: 'notification-read', id: number): void;
  (e: 'notification-deleted', id: number): void;
  (e: 'unread-count-updated', count: number): void;
  (e: 'notification-clicked', notification: Notification): void;
}>();

const toast = useToast();
const notificationService = useNotificationService();

const notifications = ref<Notification[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const offset = ref(0);
const hasMore = ref(true);
const limit = computed(() => props.limit || 10);

const hasUnread = computed(() => {
  return notifications.value.some(notification => !notification.is_read);
});

const getNotificationIcon = (type: string | null) => {
  const icons: Record<string, string> = {
    reward_points: 'pi pi-star',
    reward_redemption: 'pi pi-gift',
    promotion: 'pi pi-tag',
    booking_confirmation: 'pi pi-calendar-check',
    payment_confirmation: 'pi pi-credit-card',
    booking_completed: 'pi pi-check-circle'
  };
  
  return type && icons[type] ? icons[type] : 'pi pi-bell';
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const loadNotifications = async () => {
  try {
    loading.value = true;
    offset.value = 0;
    
    const { notifications: notificationsData } = await notificationService.getUserNotifications(
      limit.value,
      offset.value
    );
    
    notifications.value = notificationsData;
    offset.value += notificationsData.length;
    hasMore.value = notificationsData.length === limit.value;
    
    // Update unread count
    const unreadCount = notificationsData.filter(n => !n.is_read).length;
    emit('unread-count-updated', unreadCount);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to load notifications',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const loadMore = async () => {
  try {
    loadingMore.value = true;
    
    const { notifications: moreNotifications } = await notificationService.getUserNotifications(
      limit.value,
      offset.value
    );
    
    if (moreNotifications.length > 0) {
      notifications.value = [...notifications.value, ...moreNotifications];
      offset.value += moreNotifications.length;
      hasMore.value = moreNotifications.length === limit.value;
    } else {
      hasMore.value = false;
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to load more notifications',
      life: 3000
    });
  } finally {
    loadingMore.value = false;
  }
};

const markAsRead = async (id: number) => {
  try {
    await notificationService.markAsRead(id);
    
    // Update local state
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value[index].is_read = true;
      notifications.value = [...notifications.value];
    }
    
    // Update unread count
    const unreadCount = notifications.value.filter(n => !n.is_read).length;
    emit('unread-count-updated', unreadCount);
    emit('notification-read', id);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to mark notification as read',
      life: 3000
    });
  }
};

const markAllAsRead = async () => {
  try {
    await notificationService.markAllAsRead();
    
    // Update local state
    notifications.value = notifications.value.map(n => ({ ...n, is_read: true }));
    
    // Update unread count
    emit('unread-count-updated', 0);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'All notifications marked as read',
      life: 3000
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to mark all notifications as read',
      life: 3000
    });
  }
};

const deleteNotification = async (id: number) => {
  try {
    await notificationService.deleteNotification(id);
    
    // Update local state
    notifications.value = notifications.value.filter(n => n.id !== id);
    
    // Update unread count if needed
    const deletedNotification = notifications.value.find(n => n.id === id);
    if (deletedNotification && !deletedNotification.is_read) {
      const unreadCount = notifications.value.filter(n => !n.is_read).length;
      emit('unread-count-updated', unreadCount);
    }
    
    emit('notification-deleted', id);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to delete notification',
      life: 3000
    });
  }
};

const viewNotification = (notification: Notification) => {
  // Mark as read if not already
  if (!notification.is_read) {
    markAsRead(notification.id);
  }
  
  // Emit event for parent component to handle
  emit('notification-clicked', notification);
};

onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.notification-list {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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

.notification-items {
  max-height: 500px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f9f9f9;
}

.notification-item.unread {
  background-color: #e3f2fd;
}

.notification-item.unread:hover {
  background-color: #bbdefb;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
}

.notification-item.unread .notification-icon {
  background-color: #2196f3;
  color: white;
}

.notification-content {
  flex-grow: 1;
  cursor: pointer;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.notification-message {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.notification-time {
  font-size: 0.8rem;
  color: #999;
}

.notification-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.load-more {
  text-align: center;
  padding: 10px 0;
}
</style>

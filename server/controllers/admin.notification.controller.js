const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const NotificationService = require('../services/notification.service');
const AdminLog = require('../models/admin.log.model');

// Get all notifications with filters
const getAllNotifications = async (req, res) => {
  try {
    const {
      user_id,
      type,
      is_read,
      is_system,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;
    
    const notifications = await Notification.getByFilters({
      user_id: user_id ? parseInt(user_id) : undefined,
      type,
      is_read: is_read === 'true' ? true : (is_read === 'false' ? false : undefined),
      is_system: is_system === 'true' ? true : (is_system === 'false' ? false : undefined),
      start_date,
      end_date,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// Send notification to user
const sendNotification = async (req, res) => {
  try {
    const {
      user_id,
      title,
      message,
      type,
      related_id,
      related_type
    } = req.body;
    
    // Validate required fields
    if (!user_id || !title || !message) {
      return res.status(400).json({ message: 'User ID, title, and message are required' });
    }
    
    // Check if user exists
    const user = await User.findById(user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Send notification
    const notification = await NotificationService.sendNotification({
      user_id,
      title,
      message,
      type,
      related_id,
      related_type
    });
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'send_notification',
      entity_type: 'notification',
      entity_id: notification.id,
      details: { user_id, title }
    });
    
    res.status(201).json({
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Server error while sending notification' });
  }
};

// Send notification to multiple users
const sendMultipleNotifications = async (req, res) => {
  try {
    const {
      user_ids,
      title,
      message,
      type,
      related_id,
      related_type
    } = req.body;
    
    // Validate required fields
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0 || !title || !message) {
      return res.status(400).json({ message: 'User IDs array, title, and message are required' });
    }
    
    // Send notifications
    const notifications = [];
    
    for (const user_id of user_ids) {
      try {
        // Check if user exists
        const user = await User.findById(user_id);
        
        if (!user) {
          continue; // Skip if user not found
        }
        
        const notification = await NotificationService.sendNotification({
          user_id,
          title,
          message,
          type,
          related_id,
          related_type
        });
        
        notifications.push(notification);
      } catch (error) {
        console.error(`Error sending notification to user ${user_id}:`, error);
      }
    }
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'send_multiple_notifications',
      entity_type: 'notification',
      entity_id: null,
      details: { user_count: notifications.length, title }
    });
    
    res.status(201).json({
      message: `Notifications sent successfully to ${notifications.length} users`,
      count: notifications.length
    });
  } catch (error) {
    console.error('Send multiple notifications error:', error);
    res.status(500).json({ message: 'Server error while sending notifications' });
  }
};

// Send notification to all users
const sendSystemNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      related_id,
      related_type
    } = req.body;
    
    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    // Send system notification
    const notifications = await NotificationService.sendSystemNotification(
      title,
      message,
      type,
      related_id,
      related_type
    );
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'send_system_notification',
      entity_type: 'notification',
      entity_id: null,
      details: { title, user_count: notifications.length }
    });
    
    res.status(201).json({
      message: `System notification sent successfully to ${notifications.length} users`,
      count: notifications.length
    });
  } catch (error) {
    console.error('Send system notification error:', error);
    res.status(500).json({ message: 'Server error while sending system notification' });
  }
};

// Send notification to users by role
const sendNotificationByRole = async (req, res) => {
  try {
    const {
      role,
      title,
      message,
      type,
      related_id,
      related_type
    } = req.body;
    
    // Validate required fields
    if (!role || !title || !message) {
      return res.status(400).json({ message: 'Role, title, and message are required' });
    }
    
    // Check if role is valid
    const validRoles = ['customer', 'court_owner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Get users by role
    const users = await User.getByRole(role);
    
    // Send notifications
    const notifications = [];
    
    for (const user of users) {
      try {
        const notification = await NotificationService.sendNotification({
          user_id: user.id,
          title,
          message,
          type,
          related_id,
          related_type
        });
        
        notifications.push(notification);
      } catch (error) {
        console.error(`Error sending notification to user ${user.id}:`, error);
      }
    }
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'send_notification_by_role',
      entity_type: 'notification',
      entity_id: null,
      details: { role, title, user_count: notifications.length }
    });
    
    res.status(201).json({
      message: `Notifications sent successfully to ${notifications.length} ${role} users`,
      count: notifications.length
    });
  } catch (error) {
    console.error('Send notification by role error:', error);
    res.status(500).json({ message: 'Server error while sending notifications' });
  }
};

// Get notification statistics
const getNotificationStatistics = async (req, res) => {
  try {
    // Get total notifications
    const totalNotifications = await Notification.getCount();
    
    // Get read notifications
    const readNotifications = await Notification.getCountByIsRead(true);
    
    // Get unread notifications
    const unreadNotifications = await Notification.getCountByIsRead(false);
    
    // Get system notifications
    const systemNotifications = await Notification.getCountByIsSystem(true);
    
    // Get notifications by type
    const notificationsByType = await Notification.getCountByType();
    
    // Get recent notifications
    const recentNotifications = await Notification.getRecent(10);
    
    res.status(200).json({
      total_notifications: totalNotifications,
      read_notifications: readNotifications,
      unread_notifications: unreadNotifications,
      system_notifications: systemNotifications,
      notifications_by_type: notificationsByType,
      recent_notifications: recentNotifications
    });
  } catch (error) {
    console.error('Get notification statistics error:', error);
    res.status(500).json({ message: 'Server error while fetching notification statistics' });
  }
};

module.exports = {
  getAllNotifications,
  sendNotification,
  sendMultipleNotifications,
  sendSystemNotification,
  sendNotificationByRole,
  getNotificationStatistics
};

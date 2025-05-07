const Notification = require('../models/notification.model');
const NotificationService = require('../services/notification.service');

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const notifications = await Notification.getByUserId(
      req.user.id,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.status(200).json({
      notifications
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// Get unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    
    res.status(200).json({
      unread_count: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if notification exists and belongs to user
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to access this notification' });
    }
    
    // Mark as read
    const updatedNotification = await Notification.markAsRead(id);
    
    res.status(200).json({
      message: 'Notification marked as read',
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error while marking notification as read' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);
    
    res.status(200).json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Server error while marking all notifications as read' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if notification exists and belongs to user
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this notification' });
    }
    
    // Delete notification
    await Notification.delete(id);
    
    res.status(200).json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error while deleting notification' });
  }
};

// Send notification (admin only)
const sendNotification = async (req, res) => {
  try {
    const { user_id, title, message, type, related_id, related_type } = req.body;
    
    // Validate required fields
    if (!user_id || !title || !message) {
      return res.status(400).json({ message: 'User ID, title, and message are required' });
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
    
    res.status(201).json({
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Server error while sending notification' });
  }
};

// Send system notification (admin only)
const sendSystemNotification = async (req, res) => {
  try {
    const { title, message, type, related_id, related_type } = req.body;
    
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
    
    res.status(201).json({
      message: 'System notification sent successfully',
      count: notifications.length
    });
  } catch (error) {
    console.error('Send system notification error:', error);
    res.status(500).json({ message: 'Server error while sending system notification' });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  sendSystemNotification
};

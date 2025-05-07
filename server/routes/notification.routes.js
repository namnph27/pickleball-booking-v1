const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// User notification routes (protected)
router.get('/', verifyToken, notificationController.getUserNotifications);
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);
router.put('/:id/read', verifyToken, notificationController.markAsRead);
router.put('/read-all', verifyToken, notificationController.markAllAsRead);
router.delete('/:id', verifyToken, notificationController.deleteNotification);

// Admin notification routes (protected)
router.post('/send', verifyAdminToken, notificationController.sendNotification);
router.post('/send-system', verifyAdminToken, notificationController.sendSystemNotification);

module.exports = router;

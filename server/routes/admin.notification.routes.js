const express = require('express');
const router = express.Router();
const adminNotificationController = require('../controllers/admin.notification.controller');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Admin notification routes (protected)
router.get('/', verifyAdminToken, adminNotificationController.getAllNotifications);
router.get('/statistics', verifyAdminToken, adminNotificationController.getNotificationStatistics);
router.post('/send', verifyAdminToken, adminNotificationController.sendNotification);
router.post('/send-multiple', verifyAdminToken, adminNotificationController.sendMultipleNotifications);
router.post('/send-system', verifyAdminToken, adminNotificationController.sendSystemNotification);
router.post('/send-by-role', verifyAdminToken, adminNotificationController.sendNotificationByRole);

module.exports = router;

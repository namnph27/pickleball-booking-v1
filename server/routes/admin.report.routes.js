const express = require('express');
const router = express.Router();
const adminReportController = require('../controllers/admin.report.controller');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Admin report routes (protected)
router.get('/revenue', verifyAdminToken, adminReportController.getRevenueReport);
router.get('/users', verifyAdminToken, adminReportController.getUserReport);
router.get('/bookings', verifyAdminToken, adminReportController.getBookingReport);
router.get('/promotions', verifyAdminToken, adminReportController.getPromotionReport);
router.get('/rewards', verifyAdminToken, adminReportController.getRewardReport);
router.get('/admin-activity', verifyAdminToken, adminReportController.getAdminActivityReport);
router.get('/export', verifyAdminToken, adminReportController.exportDataToCsv);

module.exports = router;

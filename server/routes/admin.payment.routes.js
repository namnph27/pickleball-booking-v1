const express = require('express');
const router = express.Router();
const adminPaymentController = require('../controllers/admin.payment.controller');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Admin payment routes (protected)
router.get('/', verifyAdminToken, adminPaymentController.getAllPayments);
router.get('/reports', verifyAdminToken, adminPaymentController.getPaymentReports);
router.get('/statistics', verifyAdminToken, adminPaymentController.getPaymentStatistics);
router.get('/configs', verifyAdminToken, adminPaymentController.getPaymentConfigs);
router.put('/configs/:id', verifyAdminToken, adminPaymentController.updatePaymentConfig);
router.get('/:id', verifyAdminToken, adminPaymentController.getPaymentById);
router.post('/:id/refund', verifyAdminToken, adminPaymentController.processRefund);

module.exports = router;

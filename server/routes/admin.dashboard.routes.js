const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/admin.dashboard.controller');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Admin dashboard routes (protected)
router.get('/stats', verifyAdminToken, adminDashboardController.getDashboardStats);

module.exports = router;

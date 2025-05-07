const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/admin.auth.controller');
const { verifyAdminToken, isSuperAdmin } = require('../middleware/admin.auth.middleware');

// Admin login
router.post('/login', adminAuthController.login);

// Get current admin profile (protected route)
router.get('/profile', verifyAdminToken, adminAuthController.getProfile);

// Change admin password (protected route)
router.post('/change-password', verifyAdminToken, adminAuthController.changePassword);

// Create new admin (super admin only)
router.post('/create', verifyAdminToken, isSuperAdmin, adminAuthController.createAdmin);

module.exports = router;

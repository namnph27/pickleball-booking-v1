const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-2fa', authController.verify2FALogin);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Profile management routes (protected)
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);
router.delete('/delete-account', verifyToken, authController.deleteAccount);
router.delete('/delete-rejected-account', verifyToken, authController.deleteRejectedAccount);

// 2FA management routes (protected)
router.post('/2fa/setup', verifyToken, authController.setup2FA);
router.post('/2fa/verify', verifyToken, authController.verify2FA);
router.post('/2fa/disable', verifyToken, authController.disable2FA);

module.exports = router;

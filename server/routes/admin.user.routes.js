const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/admin.user.controller');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Admin user routes (protected)
router.get('/', verifyAdminToken, adminUserController.getAllUsers);
router.get('/statistics', verifyAdminToken, adminUserController.getUserStatistics);
router.get('/inactive', verifyAdminToken, adminUserController.getInactiveUsers);
router.get('/top-by-points', verifyAdminToken, adminUserController.getTopUsersByPoints);
router.post('/', verifyAdminToken, adminUserController.createUser);
router.get('/:id', verifyAdminToken, adminUserController.getUserById);
router.put('/:id', verifyAdminToken, adminUserController.updateUser);
router.delete('/:id', verifyAdminToken, adminUserController.deleteUser);
router.put('/:id/status', verifyAdminToken, adminUserController.updateUserStatus);
router.put('/:id/verify', verifyAdminToken, adminUserController.verifyCourtOwner);
router.put('/:id/notes', verifyAdminToken, adminUserController.addUserNotes);

module.exports = router;

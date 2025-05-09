const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Lấy danh sách chủ sân đang chờ phê duyệt
router.get('/pending', verifyAdminToken, adminController.getPendingCourtOwners);

// Lấy danh sách chủ sân theo trạng thái
router.get('/status/:status', verifyAdminToken, adminController.getCourtOwnersByStatus);

// Phê duyệt chủ sân
router.put('/:id/approve', verifyAdminToken, adminController.approveCourtOwner);

// Từ chối chủ sân
router.put('/:id/reject', verifyAdminToken, adminController.rejectCourtOwner);

module.exports = router;

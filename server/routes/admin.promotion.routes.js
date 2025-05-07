const express = require('express');
const router = express.Router();
const adminPromotionController = require('../controllers/admin.promotion.controller');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Admin promotion routes (protected)
router.get('/', verifyAdminToken, adminPromotionController.getAllPromotions);
router.get('/usage-report', verifyAdminToken, adminPromotionController.getPromotionUsageReport);
router.get('/:id', verifyAdminToken, adminPromotionController.getPromotionById);
router.get('/:id/statistics', verifyAdminToken, adminPromotionController.getPromotionStatistics);
router.post('/', verifyAdminToken, adminPromotionController.createPromotion);
router.put('/:id', verifyAdminToken, adminPromotionController.updatePromotion);
router.delete('/:id', verifyAdminToken, adminPromotionController.deletePromotion);

// Special promotion creation routes
router.post('/welcome', verifyAdminToken, adminPromotionController.createWelcomePromotion);
router.post('/birthday', verifyAdminToken, adminPromotionController.createBirthdayPromotion);
router.post('/seasonal', verifyAdminToken, adminPromotionController.createSeasonalPromotion);

module.exports = router;

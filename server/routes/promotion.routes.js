const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Public promotion routes
router.get('/active', promotionController.getActivePromotions);

// User promotion routes (protected)
router.get('/verify/:code', verifyToken, promotionController.verifyPromotionCode);
router.post('/apply', verifyToken, promotionController.applyPromotion);

// Admin promotion routes (protected)
router.get('/', verifyAdminToken, promotionController.getAllPromotions);
router.post('/', verifyAdminToken, promotionController.createPromotion);
router.put('/:id', verifyAdminToken, promotionController.updatePromotion);
router.delete('/:id', verifyAdminToken, promotionController.deletePromotion);
router.get('/:id/statistics', verifyAdminToken, promotionController.getPromotionStatistics);

// Special promotion creation routes (admin only)
router.post('/welcome', verifyAdminToken, promotionController.createWelcomePromotion);
router.post('/birthday', verifyAdminToken, promotionController.createBirthdayPromotion);
router.post('/seasonal', verifyAdminToken, promotionController.createSeasonalPromotion);

module.exports = router;

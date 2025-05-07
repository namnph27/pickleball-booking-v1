const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/reward.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// User reward routes (protected)
router.get('/points', verifyToken, rewardController.getUserRewardPoints);
router.get('/history', verifyToken, rewardController.getRewardHistory);
router.get('/available', verifyToken, rewardController.getAvailableRewards);
router.get('/summary', verifyToken, rewardController.getUserRewardSummary);
router.post('/redeem', verifyToken, rewardController.redeemReward);

// Admin reward routes (protected)
router.get('/', verifyAdminToken, rewardController.getAllRewards);
router.post('/', verifyAdminToken, rewardController.createReward);
router.put('/:id', verifyAdminToken, rewardController.updateReward);
router.delete('/:id', verifyAdminToken, rewardController.deleteReward);

// Admin reward rules routes (protected)
router.get('/rules', verifyAdminToken, rewardController.getRewardRules);
router.post('/rules', verifyAdminToken, rewardController.createRewardRule);
router.put('/rules/:id', verifyAdminToken, rewardController.updateRewardRule);
router.delete('/rules/:id', verifyAdminToken, rewardController.deleteRewardRule);

// Admin manual points award route (protected)
router.post('/award', verifyAdminToken, rewardController.awardPointsManually);

module.exports = router;

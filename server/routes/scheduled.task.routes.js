const express = require('express');
const router = express.Router();
const scheduledTaskController = require('../controllers/scheduled.task.controller');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Admin only routes (protected)
router.post('/daily', verifyAdminToken, scheduledTaskController.runDailyTasks);
router.post('/weekly', verifyAdminToken, scheduledTaskController.runWeeklyTasks);
router.post('/monthly', verifyAdminToken, scheduledTaskController.runMonthlyTasks);
router.post('/task/:taskName', verifyAdminToken, scheduledTaskController.runSpecificTask);

module.exports = router;

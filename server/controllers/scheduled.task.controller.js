const ScheduledTaskService = require('../services/scheduled.task.service');

// Run daily tasks
const runDailyTasks = async (req, res) => {
  try {
    await ScheduledTaskService.processDailyTasks();
    res.status(200).json({ message: 'Daily tasks processed successfully' });
  } catch (error) {
    console.error('Run daily tasks error:', error);
    res.status(500).json({ message: 'Server error while processing daily tasks' });
  }
};

// Run weekly tasks
const runWeeklyTasks = async (req, res) => {
  try {
    await ScheduledTaskService.processWeeklyTasks();
    res.status(200).json({ message: 'Weekly tasks processed successfully' });
  } catch (error) {
    console.error('Run weekly tasks error:', error);
    res.status(500).json({ message: 'Server error while processing weekly tasks' });
  }
};

// Run monthly tasks
const runMonthlyTasks = async (req, res) => {
  try {
    await ScheduledTaskService.processMonthlyTasks();
    res.status(200).json({ message: 'Monthly tasks processed successfully' });
  } catch (error) {
    console.error('Run monthly tasks error:', error);
    res.status(500).json({ message: 'Server error while processing monthly tasks' });
  }
};

// Run specific task
const runSpecificTask = async (req, res) => {
  try {
    const { taskName } = req.params;
    
    switch (taskName) {
      case 'birthday-rewards':
        await ScheduledTaskService.processBirthdayRewards();
        break;
      case 'promotion-expiry':
        await ScheduledTaskService.processPromotionExpiryNotifications();
        break;
      case 'points-expiry':
        await ScheduledTaskService.processPointsExpiryNotifications();
        break;
      case 'loyalty-promotions':
        await PromotionService.processLoyaltyPromotions();
        break;
      case 'weekly-summaries':
        await ScheduledTaskService.processWeeklyRewardSummaries();
        break;
      case 'monthly-loyalty':
        await ScheduledTaskService.processMonthlyLoyaltyPoints();
        break;
      case 'monthly-summaries':
        await ScheduledTaskService.processMonthlyRewardSummaries();
        break;
      default:
        return res.status(400).json({ message: 'Invalid task name' });
    }
    
    res.status(200).json({ message: `Task '${taskName}' processed successfully` });
  } catch (error) {
    console.error(`Run specific task '${req.params.taskName}' error:`, error);
    res.status(500).json({ message: `Server error while processing task '${req.params.taskName}'` });
  }
};

module.exports = {
  runDailyTasks,
  runWeeklyTasks,
  runMonthlyTasks,
  runSpecificTask
};

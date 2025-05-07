const ScheduledTaskService = require('../services/scheduled.task.service');

// Get the task type from command line arguments
const taskType = process.argv[2];

if (!taskType) {
  console.error('Please specify a task type: daily, weekly, or monthly');
  process.exit(1);
}

async function runTasks() {
  try {
    switch (taskType.toLowerCase()) {
      case 'daily':
        await ScheduledTaskService.processDailyTasks();
        break;
      case 'weekly':
        await ScheduledTaskService.processWeeklyTasks();
        break;
      case 'monthly':
        await ScheduledTaskService.processMonthlyTasks();
        break;
      default:
        console.error('Invalid task type. Please specify: daily, weekly, or monthly');
        process.exit(1);
    }
    
    console.log(`${taskType} tasks completed successfully!`);
    process.exit(0);
  } catch (error) {
    console.error(`Error running ${taskType} tasks:`, error);
    process.exit(1);
  }
}

runTasks();

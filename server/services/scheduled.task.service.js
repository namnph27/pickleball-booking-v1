const User = require('../models/user.model');
const Promotion = require('../models/promotion.model');
const Reward = require('../models/reward.model');
const RewardHistory = require('../models/reward.history.model');
const NotificationService = require('./notification.service');
const PromotionService = require('./promotion.service');
const RewardService = require('./reward.service');

/**
 * Scheduled Task Service
 * Handles scheduled tasks for rewards, promotions, and notifications
 */
class ScheduledTaskService {
  /**
   * Process daily tasks
   * @returns {Promise<void>}
   */
  async processDailyTasks() {
    try {
      console.log('Running daily scheduled tasks...');
      
      // Process birthday rewards
      await this.processBirthdayRewards();
      
      // Process promotion expiry notifications
      await this.processPromotionExpiryNotifications();
      
      // Process points expiry notifications
      await this.processPointsExpiryNotifications();
      
      console.log('Daily scheduled tasks completed.');
    } catch (error) {
      console.error('Error processing daily tasks:', error);
    }
  }
  
  /**
   * Process weekly tasks
   * @returns {Promise<void>}
   */
  async processWeeklyTasks() {
    try {
      console.log('Running weekly scheduled tasks...');
      
      // Process loyalty promotions
      await PromotionService.processLoyaltyPromotions();
      
      // Process weekly reward summaries
      await this.processWeeklyRewardSummaries();
      
      console.log('Weekly scheduled tasks completed.');
    } catch (error) {
      console.error('Error processing weekly tasks:', error);
    }
  }
  
  /**
   * Process monthly tasks
   * @returns {Promise<void>}
   */
  async processMonthlyTasks() {
    try {
      console.log('Running monthly scheduled tasks...');
      
      // Process monthly loyalty points
      await this.processMonthlyLoyaltyPoints();
      
      // Process monthly reward summaries
      await this.processMonthlyRewardSummaries();
      
      console.log('Monthly scheduled tasks completed.');
    } catch (error) {
      console.error('Error processing monthly tasks:', error);
    }
  }
  
  /**
   * Process birthday rewards
   * @returns {Promise<void>}
   */
  async processBirthdayRewards() {
    try {
      // Get current date
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();
      
      // Get all users with birthdays today
      // Note: This assumes there's a birth_date column in the users table
      const users = await User.getUsersByBirthday(currentMonth, currentDay);
      
      for (const user of users) {
        // Award birthday points
        await RewardService.awardPointsForBirthday(user.id);
        
        // Create birthday promotion
        await PromotionService.createBirthdayPromotion(user.id, user.name);
      }
    } catch (error) {
      console.error('Error processing birthday rewards:', error);
    }
  }
  
  /**
   * Process promotion expiry notifications
   * @returns {Promise<void>}
   */
  async processPromotionExpiryNotifications() {
    try {
      // Get current date
      const now = new Date();
      
      // Get date 3 days from now
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      // Get all promotions expiring in 3 days
      const expiringPromotions = await Promotion.getExpiringPromotions(
        now.toISOString(),
        threeDaysFromNow.toISOString()
      );
      
      for (const promotion of expiringPromotions) {
        // Skip non-user-specific promotions
        if (!promotion.user_specific) {
          continue;
        }
        
        // Calculate days left
        const endDate = new Date(promotion.end_date);
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        // Send expiry notification
        await NotificationService.sendPromotionExpiryNotification(
          promotion.specific_user_id,
          promotion,
          daysLeft
        );
      }
    } catch (error) {
      console.error('Error processing promotion expiry notifications:', error);
    }
  }
  
  /**
   * Process points expiry notifications
   * @returns {Promise<void>}
   */
  async processPointsExpiryNotifications() {
    try {
      // Note: This assumes there's a points_expiry system
      // If points don't expire, this method can be removed
      
      // Get current date
      const now = new Date();
      
      // Get date 30 days from now
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      // Get all users with expiring points
      const usersWithExpiringPoints = await User.getUsersWithExpiringPoints(
        now.toISOString(),
        thirtyDaysFromNow.toISOString()
      );
      
      for (const user of usersWithExpiringPoints) {
        // Send points expiry notification
        await NotificationService.sendPointsExpiryNotification(
          user.id,
          user.expiring_points,
          new Date(user.expiry_date).toLocaleDateString()
        );
      }
    } catch (error) {
      console.error('Error processing points expiry notifications:', error);
    }
  }
  
  /**
   * Process weekly reward summaries
   * @returns {Promise<void>}
   */
  async processWeeklyRewardSummaries() {
    try {
      // Get current date
      const now = new Date();
      
      // Get date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Get all users
      const users = await User.getAll();
      
      for (const user of users) {
        // Get points earned in the last 7 days
        const history = await RewardHistory.getByUserIdAndDateRange(
          user.id,
          sevenDaysAgo.toISOString(),
          now.toISOString()
        );
        
        // Calculate total points earned
        const pointsEarned = history
          .filter(entry => entry.type === 'earning')
          .reduce((total, entry) => total + entry.points, 0);
        
        // Skip users who haven't earned any points
        if (pointsEarned === 0) {
          continue;
        }
        
        // Send weekly summary notification
        await NotificationService.sendRewardSummaryNotification(
          user.id,
          pointsEarned,
          user.reward_points,
          'this week'
        );
      }
    } catch (error) {
      console.error('Error processing weekly reward summaries:', error);
    }
  }
  
  /**
   * Process monthly loyalty points
   * @returns {Promise<void>}
   */
  async processMonthlyLoyaltyPoints() {
    try {
      // Get current date
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Get first day of previous month
      const firstDayPrevMonth = new Date(currentYear, currentMonth - 2, 1);
      
      // Get last day of previous month
      const lastDayPrevMonth = new Date(currentYear, currentMonth - 1, 0);
      
      // Get all users
      const users = await User.getAll();
      
      for (const user of users) {
        // Get booking count for previous month
        const bookingCount = await Booking.getCountByUserIdAndDateRange(
          user.id,
          firstDayPrevMonth.toISOString(),
          lastDayPrevMonth.toISOString()
        );
        
        // Award monthly loyalty points based on booking count
        if (bookingCount >= 3) {
          await RewardService.awardPointsForMonthlyLoyalty(
            user.id,
            currentMonth - 1,
            currentYear
          );
        }
      }
    } catch (error) {
      console.error('Error processing monthly loyalty points:', error);
    }
  }
  
  /**
   * Process monthly reward summaries
   * @returns {Promise<void>}
   */
  async processMonthlyRewardSummaries() {
    try {
      // Get current date
      const now = new Date();
      
      // Get first day of current month
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get first day of previous month
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      // Get all users
      const users = await User.getAll();
      
      for (const user of users) {
        // Get points earned in the previous month
        const history = await RewardHistory.getByUserIdAndDateRange(
          user.id,
          firstDayPrevMonth.toISOString(),
          firstDayCurrentMonth.toISOString()
        );
        
        // Calculate total points earned
        const pointsEarned = history
          .filter(entry => entry.type === 'earning')
          .reduce((total, entry) => total + entry.points, 0);
        
        // Skip users who haven't earned any points
        if (pointsEarned === 0) {
          continue;
        }
        
        // Send monthly summary notification
        await NotificationService.sendRewardSummaryNotification(
          user.id,
          pointsEarned,
          user.reward_points,
          'last month'
        );
        
        // Check for milestone achievements
        const milestones = [1000, 5000, 10000, 25000, 50000];
        
        for (const milestone of milestones) {
          if (user.reward_points >= milestone && user.reward_points - pointsEarned < milestone) {
            // User has reached a milestone this month
            await NotificationService.sendRewardMilestoneNotification(
              user.id,
              user.reward_points,
              milestone
            );
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error processing monthly reward summaries:', error);
    }
  }
}

module.exports = new ScheduledTaskService();

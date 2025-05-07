const User = require('../models/user.model');
const RewardRule = require('../models/reward.rule.model');
const RewardHistory = require('../models/reward.history.model');
const Reward = require('../models/reward.model');
const Booking = require('../models/booking.model');
const NotificationService = require('./notification.service');

/**
 * Reward Service
 * Central service to handle all reward-related operations
 */
class RewardService {
  /**
   * Award points for an action
   * @param {Object} data - Action data
   * @param {string} data.action_type - Type of action (booking_completed, first_booking, etc.)
   * @param {number} data.user_id - User ID
   * @param {number} data.amount - Amount (for percentage-based calculations)
   * @param {number} data.source_id - Source ID (booking ID, payment ID, etc.)
   * @param {string} data.source_type - Source type (booking, payment, etc.)
   * @param {string} data.description - Custom description (optional)
   * @returns {Promise<Object>} Reward history entry
   */
  async awardPoints(data) {
    try {
      const {
        action_type,
        user_id,
        amount = 0,
        source_id,
        source_type,
        description
      } = data;

      // Calculate points based on the action type and amount
      const points = await RewardRule.calculatePoints(action_type, amount, user_id);

      if (points <= 0) {
        return null;
      }

      // Update user's reward points
      await User.updateRewardPoints(user_id, points);

      // Create reward history entry
      const historyEntry = await RewardHistory.create({
        user_id,
        points,
        description: description || `Earned ${points} points for ${action_type}`,
        type: 'earning',
        source_id,
        source_type
      });

      // Send notification to user
      await NotificationService.sendRewardPointsNotification(user_id, points, action_type);

      return historyEntry;
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Award points for booking completion
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @param {number} amount - Booking amount
   * @returns {Promise<Object>} Reward history entry
   */
  async awardPointsForBookingCompletion(bookingId, userId, amount) {
    return this.awardPoints({
      action_type: 'booking_completed',
      user_id: userId,
      amount,
      source_id: bookingId,
      source_type: 'booking',
      description: `Earned points for completing booking #${bookingId}`
    });
  }

  /**
   * Award points for first booking
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Reward history entry
   */
  async awardPointsForFirstBooking(bookingId, userId) {
    // Check if this is the user's first booking
    const history = await RewardHistory.getByUserIdAndType(userId, 'earning');
    const firstBookingEntry = history.find(entry =>
      entry.source_type === 'booking' && entry.description.includes('first booking')
    );

    if (firstBookingEntry) {
      return null; // User already received points for first booking
    }

    return this.awardPoints({
      action_type: 'first_booking',
      user_id: userId,
      source_id: bookingId,
      source_type: 'booking',
      description: 'Earned points for your first booking'
    });
  }

  /**
   * Award points for referral
   * @param {number} referrerId - Referrer user ID
   * @param {number} referredId - Referred user ID
   * @returns {Promise<Object>} Reward history entry
   */
  async awardPointsForReferral(referrerId, referredId) {
    return this.awardPoints({
      action_type: 'referral',
      user_id: referrerId,
      source_id: referredId,
      source_type: 'user',
      description: `Earned points for referring a friend (User #${referredId})`
    });
  }

  /**
   * Award points for birthday
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Reward history entry
   */
  async awardPointsForBirthday(userId) {
    return this.awardPoints({
      action_type: 'birthday',
      user_id: userId,
      description: 'Earned bonus points on your birthday'
    });
  }

  /**
   * Award points for monthly loyalty
   * @param {number} userId - User ID
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {Promise<Object>} Reward history entry
   */
  async awardPointsForMonthlyLoyalty(userId, month, year) {
    return this.awardPoints({
      action_type: 'monthly_loyalty',
      user_id: userId,
      description: `Earned loyalty points for bookings in ${month}/${year}`
    });
  }

  /**
   * Redeem reward
   * @param {number} userId - User ID
   * @param {number} rewardId - Reward ID
   * @returns {Promise<Object>} Redemption result
   */
  async redeemReward(userId, rewardId) {
    try {
      // Get reward
      const reward = await Reward.findById(rewardId);

      if (!reward) {
        throw new Error('Reward not found');
      }

      if (!reward.is_active) {
        throw new Error('Reward is not active');
      }

      // Check if user has enough points
      const userPoints = await User.getRewardPoints(userId);

      if (userPoints < reward.points_required) {
        throw new Error('Insufficient reward points');
      }

      // Deduct points from user
      await User.updateRewardPoints(userId, -reward.points_required);

      // Create redemption record
      const redemption = await RewardHistory.create({
        user_id: userId,
        points: -reward.points_required,
        description: `Redeemed: ${reward.name}`,
        type: 'redemption',
        source_id: reward.id,
        source_type: 'reward'
      });

      // Send notification to user
      await NotificationService.sendRewardRedemptionNotification(userId, reward);

      return {
        redemption,
        reward,
        remaining_points: userPoints - reward.points_required
      };
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  /**
   * Award points for consecutive bookings
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Reward history entry
   */
  async awardPointsForConsecutiveBookings(userId) {
    try {
      // Get user's booking history for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const bookings = await Booking.getByUserIdAndDateRange(
        userId,
        thirtyDaysAgo.toISOString(),
        new Date().toISOString()
      );

      // Count completed bookings
      const completedBookings = bookings.filter(booking => booking.status === 'completed');

      if (completedBookings.length < 3) {
        return null; // Not enough consecutive bookings
      }

      // Check if user already received points for consecutive bookings this month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const history = await RewardHistory.getByUserIdAndType(userId, 'earning');
      const consecutiveBookingEntry = history.find(entry =>
        entry.description.includes(`consecutive bookings`) &&
        entry.created_at.getMonth() + 1 === currentMonth &&
        entry.created_at.getFullYear() === currentYear
      );

      if (consecutiveBookingEntry) {
        return null; // User already received points for consecutive bookings this month
      }

      return this.awardPoints({
        action_type: 'consecutive_bookings',
        user_id: userId,
        description: `Earned points for ${completedBookings.length} consecutive bookings this month`
      });
    } catch (error) {
      console.error('Error awarding points for consecutive bookings:', error);
      return null;
    }
  }

  /**
   * Award points for booking during off-peak hours
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @param {string} startTime - Booking start time
   * @returns {Promise<Object>} Reward history entry
   */
  async awardPointsForOffPeakBooking(bookingId, userId, startTime) {
    try {
      const bookingDate = new Date(startTime);
      const hour = bookingDate.getHours();

      // Define off-peak hours (e.g., before 9 AM or after 8 PM)
      const isOffPeak = hour < 9 || hour >= 20;

      if (!isOffPeak) {
        return null;
      }

      return this.awardPoints({
        action_type: 'off_peak_booking',
        user_id: userId,
        source_id: bookingId,
        source_type: 'booking',
        description: `Earned points for booking during off-peak hours`
      });
    } catch (error) {
      console.error('Error awarding points for off-peak booking:', error);
      return null;
    }
  }

  /**
   * Award points for booking multiple courts
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @param {number} courtCount - Number of courts booked
   * @returns {Promise<Object>} Reward history entry
   */
  async awardPointsForMultipleCourtBooking(bookingId, userId, courtCount) {
    try {
      if (courtCount <= 1) {
        return null;
      }

      return this.awardPoints({
        action_type: 'multiple_court_booking',
        user_id: userId,
        source_id: bookingId,
        source_type: 'booking',
        description: `Earned points for booking ${courtCount} courts at once`
      });
    } catch (error) {
      console.error('Error awarding points for multiple court booking:', error);
      return null;
    }
  }

  /**
   * Process all applicable rewards for a new booking
   * @param {Object} booking - Booking object
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of reward history entries
   */
  async processBookingRewards(booking, userId) {
    try {
      const rewards = [];

      // Award points for booking completion
      const completionReward = await this.awardPointsForBookingCompletion(
        booking.id,
        userId,
        booking.total_price
      );

      if (completionReward) {
        rewards.push(completionReward);
      }

      // Award points for first booking
      const firstBookingReward = await this.awardPointsForFirstBooking(
        booking.id,
        userId
      );

      if (firstBookingReward) {
        rewards.push(firstBookingReward);
      }

      // Award points for off-peak booking
      const offPeakReward = await this.awardPointsForOffPeakBooking(
        booking.id,
        userId,
        booking.start_time
      );

      if (offPeakReward) {
        rewards.push(offPeakReward);
      }

      // Check for consecutive bookings
      const consecutiveReward = await this.awardPointsForConsecutiveBookings(userId);

      if (consecutiveReward) {
        rewards.push(consecutiveReward);
      }

      return rewards;
    } catch (error) {
      console.error('Error processing booking rewards:', error);
      return [];
    }
  }

  /**
   * Get user reward summary
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Reward summary
   */
  async getUserRewardSummary(userId) {
    try {
      // Get user's current points
      const currentPoints = await User.getRewardPoints(userId);

      // Get total points earned
      const totalPointsEarned = await RewardHistory.getTotalPointsEarned(userId);

      // Get total points redeemed
      const totalPointsRedeemed = await RewardHistory.getTotalPointsRedeemed(userId);

      // Get recent history
      const recentHistory = await RewardHistory.getByUserId(userId);

      // Get available rewards
      const availableRewards = await Reward.getActive();

      // Filter rewards that the user can redeem
      const redeemableRewards = availableRewards.filter(reward =>
        reward.points_required <= currentPoints
      );

      // Calculate points to next reward
      let pointsToNextReward = null;
      let nextReward = null;

      const nextRewards = availableRewards
        .filter(reward => reward.points_required > currentPoints)
        .sort((a, b) => a.points_required - b.points_required);

      if (nextRewards.length > 0) {
        nextReward = nextRewards[0];
        pointsToNextReward = nextReward.points_required - currentPoints;
      }

      return {
        current_points: currentPoints,
        total_points_earned: totalPointsEarned,
        total_points_redeemed: totalPointsRedeemed,
        recent_history: recentHistory.slice(0, 5),
        redeemable_rewards: redeemableRewards,
        next_rewards: nextRewards.slice(0, 3),
        points_to_next_reward: pointsToNextReward,
        next_reward: nextReward
      };
    } catch (error) {
      console.error('Error getting user reward summary:', error);
      throw error;
    }
  }
}

module.exports = new RewardService();

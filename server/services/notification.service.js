const Notification = require('../models/notification.model');
const socketService = require('./socket.service');

/**
 * Notification Service
 * Central service to handle all notification-related operations
 */
class NotificationService {
  /**
   * Send a notification to a user
   * @param {Object} notificationData - Notification data
   * @param {number} notificationData.user_id - User ID
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {string} notificationData.type - Notification type
   * @param {number} notificationData.related_id - Related entity ID
   * @param {string} notificationData.related_type - Related entity type
   * @returns {Promise<Object>} Created notification
   */
  async sendNotification(notificationData) {
    try {
      // Create notification in database
      const notification = await Notification.create(notificationData);

      // Send real-time notification via Socket.io
      socketService.sendNotificationToUser(notificationData.user_id, notification);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send a system notification to all users
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @param {number} related_id - Related entity ID
   * @param {string} related_type - Related entity type
   * @returns {Promise<Array>} Created notifications
   */
  async sendSystemNotification(title, message, type = null, related_id = null, related_type = null) {
    try {
      return await Notification.createSystemNotification(title, message, type, related_id, related_type);
    } catch (error) {
      console.error('Error sending system notification:', error);
      throw error;
    }
  }

  /**
   * Send a reward points notification
   * @param {number} userId - User ID
   * @param {number} points - Points earned
   * @param {string} actionType - Action type
   * @returns {Promise<Object>} Created notification
   */
  async sendRewardPointsNotification(userId, points, actionType) {
    try {
      let title = 'You earned reward points!';
      let message = `Congratulations! You earned ${points} reward points.`;

      // Customize message based on action type
      switch (actionType) {
        case 'booking_completed':
          title = 'Booking Reward Points';
          message = `You earned ${points} reward points for completing your booking.`;
          break;
        case 'first_booking':
          title = 'First Booking Bonus';
          message = `Welcome! You earned ${points} bonus points for your first booking.`;
          break;
        case 'referral':
          title = 'Referral Bonus';
          message = `Thank you for referring a friend! You earned ${points} reward points.`;
          break;
        case 'birthday':
          title = 'Birthday Bonus';
          message = `Happy Birthday! You received ${points} bonus points as a birthday gift.`;
          break;
        case 'monthly_loyalty':
          title = 'Monthly Loyalty Bonus';
          message = `Thank you for your loyalty! You earned ${points} bonus points this month.`;
          break;
        case 'consecutive_bookings':
          title = 'Consecutive Bookings Bonus';
          message = `Great job! You earned ${points} bonus points for your consecutive bookings.`;
          break;
        case 'off_peak_booking':
          title = 'Off-Peak Booking Bonus';
          message = `You earned ${points} bonus points for booking during off-peak hours.`;
          break;
        case 'multiple_court_booking':
          title = 'Multiple Courts Bonus';
          message = `You earned ${points} bonus points for booking multiple courts at once.`;
          break;
      }

      return await this.sendNotification({
        user_id: userId,
        title,
        message,
        type: 'reward_points',
        related_id: null,
        related_type: 'reward'
      });
    } catch (error) {
      console.error('Error sending reward points notification:', error);
      // Don't throw error to prevent disrupting the main flow
      return null;
    }
  }

  /**
   * Send a reward redemption notification
   * @param {number} userId - User ID
   * @param {Object} reward - Reward object
   * @returns {Promise<Object>} Created notification
   */
  async sendRewardRedemptionNotification(userId, reward) {
    try {
      return await this.sendNotification({
        user_id: userId,
        title: 'Reward Redeemed',
        message: `You have successfully redeemed "${reward.name}" for ${reward.points_required} points.`,
        type: 'reward_redemption',
        related_id: reward.id,
        related_type: 'reward'
      });
    } catch (error) {
      console.error('Error sending reward redemption notification:', error);
      return null;
    }
  }

  /**
   * Send a promotion notification
   * @param {number} userId - User ID
   * @param {Object} promotion - Promotion object
   * @returns {Promise<Object>} Created notification
   */
  async sendPromotionNotification(userId, promotion) {
    try {
      return await this.sendNotification({
        user_id: userId,
        title: 'New Promotion Available',
        message: `Use code "${promotion.code}" to get ${promotion.discount_percent}% off your next booking!`,
        type: 'promotion',
        related_id: promotion.id,
        related_type: 'promotion'
      });
    } catch (error) {
      console.error('Error sending promotion notification:', error);
      return null;
    }
  }

  /**
   * Send a booking confirmation notification
   * @param {number} userId - User ID
   * @param {Object} booking - Booking object
   * @returns {Promise<Object>} Created notification
   */
  async sendBookingConfirmationNotification(userId, booking) {
    try {
      return await this.sendNotification({
        user_id: userId,
        title: 'Booking Confirmed',
        message: `Your booking for ${booking.court_name} on ${new Date(booking.start_time).toLocaleDateString()} has been confirmed.`,
        type: 'booking_confirmation',
        related_id: booking.id,
        related_type: 'booking'
      });
    } catch (error) {
      console.error('Error sending booking confirmation notification:', error);
      return null;
    }
  }

  /**
   * Send a payment confirmation notification
   * @param {number} userId - User ID
   * @param {Object} payment - Payment object
   * @param {Object} booking - Booking object
   * @returns {Promise<Object>} Created notification
   */
  async sendPaymentConfirmationNotification(userId, payment, booking) {
    try {
      return await this.sendNotification({
        user_id: userId,
        title: 'Payment Confirmed',
        message: `Your payment of ${payment.amount} for booking #${booking.id} has been confirmed.`,
        type: 'payment_confirmation',
        related_id: payment.id,
        related_type: 'payment'
      });
    } catch (error) {
      console.error('Error sending payment confirmation notification:', error);
      return null;
    }
  }

  /**
   * Send a reward points milestone notification
   * @param {number} userId - User ID
   * @param {number} totalPoints - Total points
   * @param {number} milestone - Milestone reached
   * @returns {Promise<Object>} Created notification
   */
  async sendRewardMilestoneNotification(userId, totalPoints, milestone) {
    try {
      return await this.sendNotification({
        user_id: userId,
        title: 'Reward Points Milestone',
        message: `Congratulations! You've reached ${milestone} reward points. Keep going to unlock more rewards!`,
        type: 'reward_milestone',
        related_id: null,
        related_type: 'reward'
      });
    } catch (error) {
      console.error('Error sending reward milestone notification:', error);
      return null;
    }
  }

  /**
   * Send a promotion expiry reminder notification
   * @param {number} userId - User ID
   * @param {Object} promotion - Promotion object
   * @param {number} daysLeft - Days left until expiry
   * @returns {Promise<Object>} Created notification
   */
  async sendPromotionExpiryNotification(userId, promotion, daysLeft) {
    try {
      return await this.sendNotification({
        user_id: userId,
        title: 'Promotion Expiring Soon',
        message: `Your promotion code "${promotion.code}" will expire in ${daysLeft} days. Don't miss out!`,
        type: 'promotion_expiry',
        related_id: promotion.id,
        related_type: 'promotion'
      });
    } catch (error) {
      console.error('Error sending promotion expiry notification:', error);
      return null;
    }
  }

  /**
   * Send a reward points summary notification
   * @param {number} userId - User ID
   * @param {number} pointsEarned - Points earned in period
   * @param {number} totalPoints - Total points
   * @param {string} period - Period (e.g., 'this month', 'this week')
   * @returns {Promise<Object>} Created notification
   */
  async sendRewardSummaryNotification(userId, pointsEarned, totalPoints, period) {
    try {
      return await this.sendNotification({
        user_id: userId,
        title: 'Reward Points Summary',
        message: `You earned ${pointsEarned} points ${period}. Your total balance is now ${totalPoints} points.`,
        type: 'reward_summary',
        related_id: null,
        related_type: 'reward'
      });
    } catch (error) {
      console.error('Error sending reward summary notification:', error);
      return null;
    }
  }

  /**
   * Send a reward points expiry notification
   * @param {number} userId - User ID
   * @param {number} expiringPoints - Points expiring
   * @param {string} expiryDate - Expiry date
   * @returns {Promise<Object>} Created notification
   */
  async sendPointsExpiryNotification(userId, expiringPoints, expiryDate) {
    try {
      return await this.sendNotification({
        user_id: userId,
        title: 'Reward Points Expiring',
        message: `You have ${expiringPoints} points expiring on ${expiryDate}. Redeem them before they expire!`,
        type: 'points_expiry',
        related_id: null,
        related_type: 'reward'
      });
    } catch (error) {
      console.error('Error sending points expiry notification:', error);
      return null;
    }
  }

  /**
   * Send a new reward available notification
   * @param {number} userId - User ID
   * @param {Object} reward - Reward object
   * @returns {Promise<Object>} Created notification
   */
  async sendNewRewardNotification(userId, reward) {
    try {
      return await this.sendNotification({
        user_id: userId,
        title: 'New Reward Available',
        message: `A new reward "${reward.name}" is now available for ${reward.points_required} points!`,
        type: 'new_reward',
        related_id: reward.id,
        related_type: 'reward'
      });
    } catch (error) {
      console.error('Error sending new reward notification:', error);
      return null;
    }
  }

  /**
   * Send a join request notification
   * @param {number} userId - User ID (booking owner)
   * @param {Object} joinRequest - Join request object
   * @param {Object} requester - User who sent the request
   * @returns {Promise<Object>} Created notification
   */
  async sendJoinRequestNotification(userId, joinRequest, requester) {
    try {
      const notification = await this.sendNotification({
        user_id: userId,
        title: 'Yêu cầu tham gia sân',
        message: `${requester.name} muốn tham gia sân của bạn với ${joinRequest.players_count} người chơi.`,
        type: 'join_request',
        related_id: joinRequest.id,
        related_type: 'booking_join_request'
      });

      // Send real-time notification via Socket.io
      socketService.sendJoinRequestNotification(userId, {
        ...joinRequest,
        requester_name: requester.name
      });

      return notification;
    } catch (error) {
      console.error('Error sending join request notification:', error);
      return null;
    }
  }

  /**
   * Send a join request response notification
   * @param {number} userId - User ID (requester)
   * @param {Object} joinRequest - Join request object
   * @param {string} status - Response status ('approved' or 'rejected')
   * @param {Object} booking - Booking object
   * @returns {Promise<Object>} Created notification
   */
  async sendJoinRequestResponseNotification(userId, joinRequest, status, booking) {
    try {
      const title = status === 'approved'
        ? 'Yêu cầu tham gia được chấp nhận'
        : 'Yêu cầu tham gia bị từ chối';

      const message = status === 'approved'
        ? `Yêu cầu tham gia sân ${booking.court_name} của bạn đã được chấp nhận.`
        : `Yêu cầu tham gia sân ${booking.court_name} của bạn đã bị từ chối.`;

      const notification = await this.sendNotification({
        user_id: userId,
        title,
        message,
        type: 'join_request_response',
        related_id: joinRequest.id,
        related_type: 'booking_join_request'
      });

      // Send real-time notification via Socket.io
      socketService.sendJoinRequestResponseNotification(userId, {
        join_request_id: joinRequest.id,
        status,
        booking_id: booking.id,
        court_name: booking.court_name
      });

      return notification;
    } catch (error) {
      console.error('Error sending join request response notification:', error);
      return null;
    }
  }
}

module.exports = new NotificationService();

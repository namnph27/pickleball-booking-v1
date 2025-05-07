const Promotion = require('../models/promotion.model');
const PromotionUsage = require('../models/promotion.usage.model');
const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const NotificationService = require('./notification.service');

/**
 * Promotion Service
 * Central service to handle all promotion-related operations
 */
class PromotionService {
  /**
   * Generate a random promotion code
   * @param {number} length - Code length
   * @returns {string} Generated code
   */
  generatePromotionCode(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return code;
  }

  /**
   * Create a new promotion
   * @param {Object} promotionData - Promotion data
   * @returns {Promise<Object>} Created promotion
   */
  async createPromotion(promotionData) {
    try {
      // Generate code if not provided
      if (!promotionData.code) {
        promotionData.code = this.generatePromotionCode();
      }

      // Create promotion
      const promotion = await Promotion.create(promotionData);

      // If user-specific, send notification to the user
      if (promotion.user_specific && promotion.specific_user_id) {
        await NotificationService.sendPromotionNotification(
          promotion.specific_user_id,
          promotion
        );
      }

      return promotion;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  }

  /**
   * Verify promotion code
   * @param {string} code - Promotion code
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyPromotionCode(code, userId) {
    try {
      // Find promotion by code
      const promotion = await Promotion.findByCode(code);

      if (!promotion) {
        return { valid: false, message: 'Invalid promotion code' };
      }

      // Check if promotion is active
      if (!promotion.is_active) {
        return { valid: false, message: 'Promotion is not active' };
      }

      // Check if promotion is within date range
      const now = new Date();
      const startDate = new Date(promotion.start_date);
      const endDate = new Date(promotion.end_date);

      if (now < startDate) {
        return { valid: false, message: 'Promotion has not started yet' };
      }

      if (now > endDate) {
        return { valid: false, message: 'Promotion has expired' };
      }

      // Check if promotion is user-specific
      if (promotion.user_specific && promotion.specific_user_id !== userId) {
        return { valid: false, message: 'This promotion code is not valid for your account' };
      }

      // Check if promotion has reached usage limit
      if (promotion.usage_limit !== null) {
        const usageCount = await PromotionUsage.getUsageCount(promotion.id);

        if (usageCount >= promotion.usage_limit) {
          return { valid: false, message: 'Promotion usage limit has been reached' };
        }
      }

      // Check if user has already used this promotion
      const hasUsed = await PromotionUsage.hasUserUsedPromotion(userId, promotion.id);

      if (hasUsed) {
        return { valid: false, message: 'You have already used this promotion' };
      }

      return {
        valid: true,
        promotion: {
          id: promotion.id,
          code: promotion.code,
          description: promotion.description,
          discount_percent: promotion.discount_percent,
          end_date: promotion.end_date
        }
      };
    } catch (error) {
      console.error('Error verifying promotion code:', error);
      throw error;
    }
  }

  /**
   * Apply promotion to booking
   * @param {Object} data - Application data
   * @param {string} data.code - Promotion code
   * @param {number} data.userId - User ID
   * @param {number} data.bookingId - Booking ID
   * @param {number} data.totalPrice - Total price before discount
   * @returns {Promise<Object>} Application result
   */
  async applyPromotion(data) {
    try {
      const { code, userId, bookingId, totalPrice } = data;

      // Verify promotion code
      const verificationResult = await this.verifyPromotionCode(code, userId);

      if (!verificationResult.valid) {
        return {
          success: false,
          message: verificationResult.message
        };
      }

      const promotion = verificationResult.promotion;

      // Calculate discount amount
      const discountAmount = (totalPrice * promotion.discount_percent) / 100;
      const discountedPrice = totalPrice - discountAmount;

      // Create usage record
      await PromotionUsage.create({
        promotion_id: promotion.id,
        user_id: userId,
        booking_id: bookingId,
        discount_amount: discountAmount
      });

      // Update promotion usage count
      await Promotion.update(promotion.id, {
        usage_count: promotion.usage_count + 1
      });

      return {
        success: true,
        promotion,
        discount_amount: discountAmount,
        discounted_price: discountedPrice
      };
    } catch (error) {
      console.error('Error applying promotion:', error);
      throw error;
    }
  }

  /**
   * Create a birthday promotion for a user
   * @param {number} userId - User ID
   * @param {string} userName - User name
   * @returns {Promise<Object>} Created promotion
   */
  async createBirthdayPromotion(userId, userName) {
    try {
      // Create promotion valid for 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const promotionData = {
        code: `BDAY${userId}${this.generatePromotionCode(4)}`,
        description: `Happy Birthday, ${userName}! Enjoy a special discount on your next booking.`,
        discount_percent: 20,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        user_specific: true,
        specific_user_id: userId,
        usage_limit: 1
      };

      const promotion = await this.createPromotion(promotionData);

      // Send notification to user
      await NotificationService.sendNotification({
        user_id: userId,
        title: 'Birthday Gift',
        message: `Happy Birthday! We've sent you a special 20% discount code: ${promotion.code}. Valid for 7 days.`,
        type: 'promotion',
        related_id: promotion.id,
        related_type: 'promotion'
      });

      return promotion;
    } catch (error) {
      console.error('Error creating birthday promotion:', error);
      throw error;
    }
  }

  /**
   * Create a welcome promotion for a new user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Created promotion
   */
  async createWelcomePromotion(userId) {
    try {
      // Create promotion valid for 30 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const promotionData = {
        code: `WELCOME${userId}${this.generatePromotionCode(4)}`,
        description: 'Welcome to Pickleball Booking! Enjoy a discount on your first booking.',
        discount_percent: 15,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        user_specific: true,
        specific_user_id: userId,
        usage_limit: 1
      };

      const promotion = await this.createPromotion(promotionData);

      // Send notification to user
      await NotificationService.sendNotification({
        user_id: userId,
        title: 'Welcome Gift',
        message: `Welcome to Pickleball Booking! Use code ${promotion.code} to get 15% off your first booking.`,
        type: 'promotion',
        related_id: promotion.id,
        related_type: 'promotion'
      });

      return promotion;
    } catch (error) {
      console.error('Error creating welcome promotion:', error);
      throw error;
    }
  }

  /**
   * Create a seasonal promotion
   * @param {string} season - Season name
   * @param {number} discountPercent - Discount percentage
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Created promotion
   */
  async createSeasonalPromotion(season, discountPercent, startDate, endDate) {
    try {
      const promotionData = {
        code: `${season.toUpperCase()}${this.generatePromotionCode(6)}`,
        description: `${season.charAt(0).toUpperCase() + season.slice(1)} Special: Enjoy a discount on all bookings!`,
        discount_percent: discountPercent,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        user_specific: false,
        usage_limit: null
      };

      const promotion = await this.createPromotion(promotionData);

      // Send system notification to all users
      await NotificationService.sendSystemNotification(
        `${season.charAt(0).toUpperCase() + season.slice(1)} Special Offer`,
        `Use code ${promotion.code} to get ${discountPercent}% off your bookings until ${endDate.toLocaleDateString()}.`,
        'promotion',
        promotion.id,
        'promotion'
      );

      return promotion;
    } catch (error) {
      console.error('Error creating seasonal promotion:', error);
      throw error;
    }
  }

  /**
   * Create a referral promotion
   * @param {number} referrerId - Referrer user ID
   * @param {number} referredId - Referred user ID
   * @returns {Promise<Object>} Created promotion
   */
  async createReferralPromotion(referrerId, referredId) {
    try {
      // Create promotion valid for 60 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 60);

      // Get referrer name
      const referrer = await User.findById(referrerId);

      const promotionData = {
        code: `REF${referrerId}${this.generatePromotionCode(4)}`,
        description: `Referral discount from ${referrer.name}. Enjoy a special discount on your next booking!`,
        discount_percent: 10,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        user_specific: true,
        specific_user_id: referredId,
        usage_limit: 1
      };

      const promotion = await this.createPromotion(promotionData);

      // Send notification to referred user
      await NotificationService.sendNotification({
        user_id: referredId,
        title: 'Referral Discount',
        message: `You've been referred by ${referrer.name}! Use code ${promotion.code} to get 10% off your next booking.`,
        type: 'promotion',
        related_id: promotion.id,
        related_type: 'promotion'
      });

      return promotion;
    } catch (error) {
      console.error('Error creating referral promotion:', error);
      throw error;
    }
  }

  /**
   * Create a loyalty promotion for frequent users
   * @param {number} userId - User ID
   * @param {number} bookingCount - Number of completed bookings
   * @returns {Promise<Object>} Created promotion
   */
  async createLoyaltyPromotion(userId, bookingCount) {
    try {
      // Determine discount percentage based on booking count
      let discountPercent = 5;

      if (bookingCount >= 20) {
        discountPercent = 20;
      } else if (bookingCount >= 10) {
        discountPercent = 15;
      } else if (bookingCount >= 5) {
        discountPercent = 10;
      }

      // Create promotion valid for 30 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const promotionData = {
        code: `LOYAL${userId}${this.generatePromotionCode(4)}`,
        description: `Thank you for your loyalty! Enjoy a ${discountPercent}% discount on your next booking.`,
        discount_percent: discountPercent,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        user_specific: true,
        specific_user_id: userId,
        usage_limit: 1
      };

      const promotion = await this.createPromotion(promotionData);

      // Send notification to user
      await NotificationService.sendNotification({
        user_id: userId,
        title: 'Loyalty Reward',
        message: `Thank you for being a loyal customer! Use code ${promotion.code} to get ${discountPercent}% off your next booking.`,
        type: 'promotion',
        related_id: promotion.id,
        related_type: 'promotion'
      });

      return promotion;
    } catch (error) {
      console.error('Error creating loyalty promotion:', error);
      throw error;
    }
  }

  /**
   * Create an off-peak hours promotion
   * @param {string} name - Promotion name
   * @param {number} discountPercent - Discount percentage
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Created promotion
   */
  async createOffPeakPromotion(name, discountPercent, startDate, endDate) {
    try {
      const promotionData = {
        code: `OFFPEAK${this.generatePromotionCode(6)}`,
        description: `${name}: Book during off-peak hours (before 9 AM or after 8 PM) and save ${discountPercent}%!`,
        discount_percent: discountPercent,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        user_specific: false,
        usage_limit: null
      };

      const promotion = await this.createPromotion(promotionData);

      // Send system notification to all users
      await NotificationService.sendSystemNotification(
        `Off-Peak Special: ${name}`,
        `Book during off-peak hours and save! Use code ${promotion.code} to get ${discountPercent}% off.`,
        'promotion',
        promotion.id,
        'promotion'
      );

      return promotion;
    } catch (error) {
      console.error('Error creating off-peak promotion:', error);
      throw error;
    }
  }

  /**
   * Check and create loyalty promotions for eligible users
   * @returns {Promise<Array>} Created promotions
   */
  async processLoyaltyPromotions() {
    try {
      // Get all users
      const users = await User.getAll();
      const createdPromotions = [];

      // Get current date
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Process each user
      for (const user of users) {
        // Skip users who already have an active loyalty promotion
        const activePromotions = await Promotion.getActiveByUserId(user.id);
        const hasLoyaltyPromotion = activePromotions.some(p =>
          p.code.startsWith('LOYAL') && new Date(p.end_date) > now
        );

        if (hasLoyaltyPromotion) {
          continue;
        }

        // Get user's booking count in the last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const bookingCount = await Booking.getCountByUserIdAndDateRange(
          user.id,
          ninetyDaysAgo.toISOString(),
          now.toISOString()
        );

        // Create loyalty promotion if user has at least 5 bookings
        if (bookingCount >= 5) {
          const promotion = await this.createLoyaltyPromotion(user.id, bookingCount);
          createdPromotions.push(promotion);
        }
      }

      return createdPromotions;
    } catch (error) {
      console.error('Error processing loyalty promotions:', error);
      throw error;
    }
  }

  /**
   * Get promotion statistics
   * @param {number} promotionId - Promotion ID
   * @returns {Promise<Object>} Promotion statistics
   */
  async getPromotionStatistics(promotionId) {
    try {
      // Get promotion
      const promotion = await Promotion.findById(promotionId);

      if (!promotion) {
        throw new Error('Promotion not found');
      }

      // Get usage statistics
      const usageStats = await PromotionUsage.getUsageStatistics(promotionId);

      // Get recent usages
      const recentUsages = await PromotionUsage.getByPromotionId(promotionId);

      // Calculate conversion rate (usages / views)
      const conversionRate = promotion.view_count > 0
        ? (usageStats.usage_count / promotion.view_count) * 100
        : 0;

      return {
        promotion,
        usage_count: parseInt(usageStats.usage_count || 0),
        total_discount: parseFloat(usageStats.total_discount || 0),
        unique_users: parseInt(usageStats.unique_users || 0),
        conversion_rate: conversionRate.toFixed(2) + '%',
        recent_usages: recentUsages.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting promotion statistics:', error);
      throw error;
    }
  }

  /**
   * Track promotion view
   * @param {string} code - Promotion code
   * @returns {Promise<boolean>} Success status
   */
  async trackPromotionView(code) {
    try {
      const promotion = await Promotion.findByCode(code);

      if (!promotion) {
        return false;
      }

      // Update view count
      await Promotion.update(promotion.id, {
        view_count: (promotion.view_count || 0) + 1
      });

      return true;
    } catch (error) {
      console.error('Error tracking promotion view:', error);
      return false;
    }
  }
}

module.exports = new PromotionService();

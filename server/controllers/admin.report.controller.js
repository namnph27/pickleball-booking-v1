const User = require('../models/user.model');
const Court = require('../models/court.model');
const Booking = require('../models/booking.model');
const Payment = require('../models/payment.model');
const Promotion = require('../models/promotion.model');
const PromotionUsage = require('../models/promotion.usage.model');
const RewardHistory = require('../models/reward.history.model');
const AdminLog = require('../models/admin.log.model');

// Get revenue report
const getRevenueReport = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      group_by = 'day' 
    } = req.query;
    
    // Validate required fields
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // Validate group_by
    const validGroupBy = ['day', 'week', 'month', 'year'];
    if (!validGroupBy.includes(group_by)) {
      return res.status(400).json({ message: 'Invalid group_by parameter' });
    }
    
    // Get revenue by date
    const revenueByDate = await Payment.getRevenueByDateGrouped({
      start_date,
      end_date,
      group_by
    });
    
    // Get revenue by payment method
    const revenueByMethod = await Payment.getRevenueByPaymentMethod({
      start_date,
      end_date
    });
    
    // Get revenue by payment gateway
    const revenueByGateway = await Payment.getRevenueByPaymentGateway({
      start_date,
      end_date
    });
    
    // Get total revenue
    const totalRevenue = revenueByDate.reduce((sum, item) => sum + parseFloat(item.total_revenue), 0);
    
    // Get completed payments count
    const completedPayments = await Payment.getCountByStatus('completed', {
      start_date,
      end_date
    });
    
    // Get pending payments count
    const pendingPayments = await Payment.getCountByStatus('pending', {
      start_date,
      end_date
    });
    
    // Get failed payments count
    const failedPayments = await Payment.getCountByStatus('failed', {
      start_date,
      end_date
    });
    
    res.status(200).json({
      total_revenue: totalRevenue,
      completed_payments: completedPayments,
      pending_payments: pendingPayments,
      failed_payments: failedPayments,
      revenue_by_date: revenueByDate,
      revenue_by_method: revenueByMethod,
      revenue_by_gateway: revenueByGateway
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({ message: 'Server error while generating revenue report' });
  }
};

// Get user report
const getUserReport = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      group_by = 'day' 
    } = req.query;
    
    // Validate required fields
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // Validate group_by
    const validGroupBy = ['day', 'week', 'month', 'year'];
    if (!validGroupBy.includes(group_by)) {
      return res.status(400).json({ message: 'Invalid group_by parameter' });
    }
    
    // Get user registrations by date
    const registrationsByDate = await User.getRegistrationsByDateGrouped({
      start_date,
      end_date,
      group_by
    });
    
    // Get users by role
    const usersByRole = await User.getCountByRole();
    
    // Get active users
    const activeUsers = await User.getCountByIsActive(true);
    
    // Get inactive users
    const inactiveUsers = await User.getCountByIsActive(false);
    
    // Get verified court owners
    const verifiedCourtOwners = await User.getCountByRoleAndVerification('court_owner', true);
    
    // Get unverified court owners
    const unverifiedCourtOwners = await User.getCountByRoleAndVerification('court_owner', false);
    
    // Get top users by bookings
    const topUsersByBookings = await User.getTopByBookings(10);
    
    // Get top users by spending
    const topUsersBySpending = await User.getTopBySpending(10);
    
    res.status(200).json({
      total_users: usersByRole.reduce((sum, item) => sum + parseInt(item.count), 0),
      users_by_role: usersByRole,
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      verified_court_owners: verifiedCourtOwners,
      unverified_court_owners: unverifiedCourtOwners,
      registrations_by_date: registrationsByDate,
      top_users_by_bookings: topUsersByBookings,
      top_users_by_spending: topUsersBySpending
    });
  } catch (error) {
    console.error('Get user report error:', error);
    res.status(500).json({ message: 'Server error while generating user report' });
  }
};

// Get booking report
const getBookingReport = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      group_by = 'day' 
    } = req.query;
    
    // Validate required fields
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // Validate group_by
    const validGroupBy = ['day', 'week', 'month', 'year'];
    if (!validGroupBy.includes(group_by)) {
      return res.status(400).json({ message: 'Invalid group_by parameter' });
    }
    
    // Get bookings by date
    const bookingsByDate = await Booking.getCountByDateRangeGrouped({
      start_date,
      end_date,
      group_by
    });
    
    // Get bookings by status
    const bookingsByStatus = await Booking.getCountByStatus({
      start_date,
      end_date
    });
    
    // Get bookings by court
    const bookingsByCourt = await Booking.getCountByCourt({
      start_date,
      end_date
    });
    
    // Get top courts by bookings
    const topCourtsByBookings = await Court.getTopByBookings(10);
    
    // Get average booking duration
    const averageBookingDuration = await Booking.getAverageBookingDuration({
      start_date,
      end_date
    });
    
    // Get peak booking hours
    const peakBookingHours = await Booking.getPeakBookingHours({
      start_date,
      end_date
    });
    
    res.status(200).json({
      total_bookings: bookingsByStatus.reduce((sum, item) => sum + parseInt(item.count), 0),
      bookings_by_status: bookingsByStatus,
      bookings_by_date: bookingsByDate,
      bookings_by_court: bookingsByCourt,
      top_courts_by_bookings: topCourtsByBookings,
      average_booking_duration: averageBookingDuration,
      peak_booking_hours: peakBookingHours
    });
  } catch (error) {
    console.error('Get booking report error:', error);
    res.status(500).json({ message: 'Server error while generating booking report' });
  }
};

// Get promotion report
const getPromotionReport = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date 
    } = req.query;
    
    // Validate required fields
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // Get all promotions
    const promotions = await Promotion.getAll();
    
    // Get usage statistics for each promotion
    const promotionStats = await Promise.all(
      promotions.map(async (promotion) => {
        const statistics = await PromotionService.getPromotionStatistics(promotion.id);
        return {
          id: promotion.id,
          code: promotion.code,
          description: promotion.description,
          discount_percent: promotion.discount_percent,
          start_date: promotion.start_date,
          end_date: promotion.end_date,
          is_active: promotion.is_active,
          usage_count: statistics.usage_count,
          total_discount: statistics.total_discount,
          unique_users: statistics.unique_users,
          conversion_rate: statistics.conversion_rate
        };
      })
    );
    
    // Get promotion usages by date
    const usagesByDate = await PromotionUsage.getCountByDateRange({
      start_date,
      end_date
    });
    
    // Get total discount amount
    const totalDiscount = promotionStats.reduce((sum, item) => sum + parseFloat(item.total_discount || 0), 0);
    
    // Get most used promotions
    const mostUsedPromotions = [...promotionStats].sort((a, b) => b.usage_count - a.usage_count).slice(0, 10);
    
    // Get highest discount promotions
    const highestDiscountPromotions = [...promotionStats].sort((a, b) => b.total_discount - a.total_discount).slice(0, 10);
    
    res.status(200).json({
      total_promotions: promotions.length,
      active_promotions: promotions.filter(p => p.is_active).length,
      total_usages: promotionStats.reduce((sum, item) => sum + parseInt(item.usage_count || 0), 0),
      total_discount: totalDiscount,
      usages_by_date: usagesByDate,
      most_used_promotions: mostUsedPromotions,
      highest_discount_promotions: highestDiscountPromotions
    });
  } catch (error) {
    console.error('Get promotion report error:', error);
    res.status(500).json({ message: 'Server error while generating promotion report' });
  }
};

// Get reward report
const getRewardReport = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date 
    } = req.query;
    
    // Validate required fields
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // Get reward points earned by date
    const pointsEarnedByDate = await RewardHistory.getPointsByDateRange({
      start_date,
      end_date,
      type: 'earning'
    });
    
    // Get reward points redeemed by date
    const pointsRedeemedByDate = await RewardHistory.getPointsByDateRange({
      start_date,
      end_date,
      type: 'redemption'
    });
    
    // Get reward points by action type
    const pointsByActionType = await RewardHistory.getPointsByActionType({
      start_date,
      end_date
    });
    
    // Get top users by reward points
    const topUsersByPoints = await User.getTopUsersByPoints(10);
    
    // Get total points earned
    const totalPointsEarned = pointsEarnedByDate.reduce((sum, item) => sum + parseInt(item.points), 0);
    
    // Get total points redeemed
    const totalPointsRedeemed = pointsRedeemedByDate.reduce((sum, item) => sum + parseInt(item.points), 0);
    
    res.status(200).json({
      total_points_earned: totalPointsEarned,
      total_points_redeemed: totalPointsRedeemed,
      points_earned_by_date: pointsEarnedByDate,
      points_redeemed_by_date: pointsRedeemedByDate,
      points_by_action_type: pointsByActionType,
      top_users_by_points: topUsersByPoints
    });
  } catch (error) {
    console.error('Get reward report error:', error);
    res.status(500).json({ message: 'Server error while generating reward report' });
  }
};

// Get admin activity report
const getAdminActivityReport = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      admin_id 
    } = req.query;
    
    // Validate required fields
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // Get admin logs
    const logs = await AdminLog.getByFilters({
      admin_id: admin_id ? parseInt(admin_id) : undefined,
      start_date,
      end_date
    });
    
    // Get admin activity by date
    const activityByDate = await AdminLog.getCountByDateRange({
      start_date,
      end_date,
      admin_id: admin_id ? parseInt(admin_id) : undefined
    });
    
    // Get admin activity by action type
    const activityByActionType = await AdminLog.getCountByActionType({
      start_date,
      end_date,
      admin_id: admin_id ? parseInt(admin_id) : undefined
    });
    
    // Get admin activity by entity type
    const activityByEntityType = await AdminLog.getCountByEntityType({
      start_date,
      end_date,
      admin_id: admin_id ? parseInt(admin_id) : undefined
    });
    
    // Get most active admins
    const mostActiveAdmins = await AdminLog.getMostActiveAdmins({
      start_date,
      end_date
    });
    
    res.status(200).json({
      total_activities: logs.length,
      activity_by_date: activityByDate,
      activity_by_action_type: activityByActionType,
      activity_by_entity_type: activityByEntityType,
      most_active_admins: mostActiveAdmins
    });
  } catch (error) {
    console.error('Get admin activity report error:', error);
    res.status(500).json({ message: 'Server error while generating admin activity report' });
  }
};

// Export data to CSV
const exportDataToCsv = async (req, res) => {
  try {
    const { 
      report_type, 
      start_date, 
      end_date 
    } = req.query;
    
    // Validate required fields
    if (!report_type || !start_date || !end_date) {
      return res.status(400).json({ message: 'Report type, start date, and end date are required' });
    }
    
    // Validate report type
    const validReportTypes = ['revenue', 'users', 'bookings', 'promotions', 'rewards', 'admin_activity'];
    if (!validReportTypes.includes(report_type)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }
    
    let data = [];
    let fields = [];
    
    // Get data based on report type
    switch (report_type) {
      case 'revenue':
        // Get payments
        data = await Payment.getByFilters({
          start_date,
          end_date
        });
        
        fields = [
          'id',
          'booking_id',
          'user_id',
          'amount',
          'payment_method',
          'payment_gateway',
          'status',
          'transaction_id',
          'created_at'
        ];
        break;
        
      case 'users':
        // Get users
        data = await User.getAll();
        
        fields = [
          'id',
          'name',
          'email',
          'phone',
          'role',
          'reward_points',
          'is_active',
          'is_verified',
          'created_at'
        ];
        break;
        
      case 'bookings':
        // Get bookings
        data = await Booking.getByFilters({
          start_date,
          end_date
        });
        
        fields = [
          'id',
          'court_id',
          'court_name',
          'user_id',
          'user_name',
          'start_time',
          'end_time',
          'total_price',
          'status',
          'created_at'
        ];
        break;
        
      case 'promotions':
        // Get promotions
        data = await Promotion.getAll();
        
        fields = [
          'id',
          'code',
          'description',
          'discount_percent',
          'start_date',
          'end_date',
          'is_active',
          'user_specific',
          'specific_user_id',
          'usage_limit',
          'usage_count',
          'created_at'
        ];
        break;
        
      case 'rewards':
        // Get reward history
        data = await RewardHistory.getByDateRange(start_date, end_date);
        
        fields = [
          'id',
          'user_id',
          'points',
          'description',
          'type',
          'source_id',
          'source_type',
          'created_at'
        ];
        break;
        
      case 'admin_activity':
        // Get admin logs
        data = await AdminLog.getByFilters({
          start_date,
          end_date
        });
        
        fields = [
          'id',
          'admin_id',
          'admin_username',
          'action_type',
          'entity_type',
          'entity_id',
          'created_at'
        ];
        break;
    }
    
    // Convert data to CSV
    const csv = await convertToCsv(data, fields);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${report_type}_report_${start_date}_to_${end_date}.csv`);
    
    // Send CSV data
    res.send(csv);
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'export_data',
      entity_type: 'report',
      entity_id: null,
      details: { report_type, start_date, end_date }
    });
  } catch (error) {
    console.error('Export data to CSV error:', error);
    res.status(500).json({ message: 'Server error while exporting data to CSV' });
  }
};

// Helper function to convert data to CSV
const convertToCsv = async (data, fields) => {
  // Create header row
  const header = fields.join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return fields.map(field => {
      const value = item[field];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes
        return `"${value.replace(/"/g, '""')}"`;
      } else if (value instanceof Date) {
        return `"${value.toISOString()}"`;
      } else if (typeof value === 'object') {
        // Convert object to JSON string
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } else {
        return value;
      }
    }).join(',');
  });
  
  // Combine header and rows
  return [header, ...rows].join('\n');
};

module.exports = {
  getRevenueReport,
  getUserReport,
  getBookingReport,
  getPromotionReport,
  getRewardReport,
  getAdminActivityReport,
  exportDataToCsv
};

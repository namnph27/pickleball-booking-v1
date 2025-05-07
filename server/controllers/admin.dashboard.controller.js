const User = require('../models/user.model');
const Court = require('../models/court.model');
const Booking = require('../models/booking.model');
const Payment = require('../models/payment.model');
const Promotion = require('../models/promotion.model');
const RewardHistory = require('../models/reward.history.model');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get user counts
    const allUsers = await User.getAll();
    const customerCount = allUsers.filter(user => user.role === 'customer').length;
    const courtOwnerCount = allUsers.filter(user => user.role === 'court_owner').length;
    
    // Get court counts
    const allCourts = await Court.getAll();
    const activeCourts = allCourts.filter(court => court.is_available).length;
    const inactiveCourts = allCourts.length - activeCourts;
    
    // Get booking counts
    const pendingBookings = await Booking.getByStatus('pending');
    const confirmedBookings = await Booking.getByStatus('confirmed');
    const completedBookings = await Booking.getByStatus('completed');
    const cancelledBookings = await Booking.getByStatus('cancelled');
    
    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayPayments = await Payment.getByDateRange(today.toISOString(), todayEnd.toISOString());
    const todayRevenue = todayPayments
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    
    // Get this week's revenue
    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekPayments = await Payment.getByDateRange(startOfWeek.toISOString(), todayEnd.toISOString());
    const weekRevenue = weekPayments
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    
    // Get this month's revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1); // Start of month
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthPayments = await Payment.getByDateRange(startOfMonth.toISOString(), todayEnd.toISOString());
    const monthRevenue = monthPayments
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    
    // Get active promotions
    const activePromotions = await Promotion.getActive();
    
    // Get recent bookings (last 10)
    const recentBookings = await Booking.getRecent(10);
    
    // Get revenue by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenueByDate = await Payment.getRevenueByDate({
      start_date: thirtyDaysAgo.toISOString(),
      end_date: todayEnd.toISOString()
    });
    
    // Get bookings by date (last 30 days)
    const bookingsByDate = await Booking.getCountByDateRange(
      thirtyDaysAgo.toISOString(),
      todayEnd.toISOString()
    );
    
    // Get top courts by bookings
    const topCourts = await Court.getTopByBookings(5);
    
    // Get recent user registrations (last 10)
    const recentUsers = await User.getRecent(10);
    
    res.status(200).json({
      users: {
        total: allUsers.length,
        customers: customerCount,
        court_owners: courtOwnerCount
      },
      courts: {
        total: allCourts.length,
        active: activeCourts,
        inactive: inactiveCourts
      },
      bookings: {
        pending: pendingBookings.length,
        confirmed: confirmedBookings.length,
        completed: completedBookings.length,
        cancelled: cancelledBookings.length,
        total: pendingBookings.length + confirmedBookings.length + completedBookings.length + cancelledBookings.length
      },
      revenue: {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue
      },
      charts: {
        revenue_by_date: revenueByDate,
        bookings_by_date: bookingsByDate
      },
      active_promotions: activePromotions,
      recent_bookings: recentBookings,
      top_courts: topCourts,
      recent_users: recentUsers
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard statistics' });
  }
};

module.exports = {
  getDashboardStats
};

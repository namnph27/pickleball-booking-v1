const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const User = require('../models/user.model');
const Payment = require('../models/payment.model');
const NotificationService = require('../services/notification.service');
const AdminLog = require('../models/admin.log.model');

// Get all bookings with filters
const getAllBookings = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      court_id,
      user_id,
      status,
      limit = 50,
      offset = 0
    } = req.query;
    
    const bookings = await Booking.getByFilters({
      start_date,
      end_date,
      court_id: court_id ? parseInt(court_id) : undefined,
      user_id: user_id ? parseInt(user_id) : undefined,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get booking
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Get court
    const court = await Court.findById(booking.court_id);
    
    // Get user
    const user = await User.findById(booking.user_id);
    
    // Get payment
    const payment = await Payment.getByBookingId(id);
    
    res.status(200).json({
      booking,
      court,
      user,
      payment
    });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching booking' });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if booking exists
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if status is valid
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Update booking status
    const updatedBooking = await Booking.update(id, {
      ...booking,
      status
    });
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'update_booking_status',
      entity_type: 'booking',
      entity_id: id,
      details: { 
        booking_id: id, 
        old_status: booking.status, 
        new_status: status 
      }
    });
    
    // Get court
    const court = await Court.findById(booking.court_id);
    
    // Send notification to user
    await NotificationService.sendNotification({
      user_id: booking.user_id,
      title: 'Booking Status Updated',
      message: `Your booking for ${court.name} has been updated to ${status}.`,
      type: 'booking_status',
      related_id: id,
      related_type: 'booking'
    });
    
    res.status(200).json({
      message: 'Booking status updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error while updating booking status' });
  }
};

// Add admin notes to booking
const addBookingNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    
    // Check if booking exists
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Update booking notes
    const updatedBooking = await Booking.updateNotes(id, admin_notes);
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'update_booking_notes',
      entity_type: 'booking',
      entity_id: id,
      details: { booking_id: id }
    });
    
    res.status(200).json({
      message: 'Booking notes updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Add booking notes error:', error);
    res.status(500).json({ message: 'Server error while updating booking notes' });
  }
};

// Get booking statistics
const getBookingStatistics = async (req, res) => {
  try {
    // Get bookings by status
    const pendingBookings = await Booking.getByStatus('pending');
    const confirmedBookings = await Booking.getByStatus('confirmed');
    const completedBookings = await Booking.getByStatus('completed');
    const cancelledBookings = await Booking.getByStatus('cancelled');
    
    // Get bookings by date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date();
    
    const bookingsByDate = await Booking.getCountByDateRange(
      thirtyDaysAgo.toISOString(),
      today.toISOString()
    );
    
    // Get top courts by bookings
    const topCourts = await Court.getTopByBookings(5);
    
    res.status(200).json({
      total_bookings: pendingBookings.length + confirmedBookings.length + completedBookings.length + cancelledBookings.length,
      bookings_by_status: {
        pending: pendingBookings.length,
        confirmed: confirmedBookings.length,
        completed: completedBookings.length,
        cancelled: cancelledBookings.length
      },
      bookings_by_date: bookingsByDate,
      top_courts: topCourts
    });
  } catch (error) {
    console.error('Get booking statistics error:', error);
    res.status(500).json({ message: 'Server error while fetching booking statistics' });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  addBookingNotes,
  getBookingStatistics
};

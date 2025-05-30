const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const User = require('../models/user.model');
const Payment = require('../models/payment.model');
const Promotion = require('../models/promotion.model');
const BookingLock = require('../models/booking.lock.model');
const BookingPlayer = require('../models/booking.player.model');
const RewardService = require('../services/reward.service');
const PromotionService = require('../services/promotion.service');
const NotificationService = require('../services/notification.service');

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const {
      court_id,
      start_time,
      end_time,
      promotion_code,
      skill_level,
      current_players = 1,
      needed_players = 4,
      allow_join = false
    } = req.body;

    // Validate required fields
    if (!court_id || !start_time || !end_time) {
      return res.status(400).json({ message: 'Court ID, start time, and end time are required' });
    }

    // Check if court exists
    const court = await Court.findById(court_id);

    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Check if court is available
    if (!court.is_available) {
      return res.status(400).json({ message: 'Court is not available for booking' });
    }

    // Try to acquire a lock for this timeslot
    const lock = await BookingLock.acquireLock({
      court_id,
      start_time,
      end_time,
      user_id: req.user.id,
      lock_duration_seconds: 30 // Lock for 30 seconds
    });

    if (!lock) {
      return res.status(409).json({
        message: 'This timeslot is currently being booked by another user. Please try again in a moment.'
      });
    }

    try {
      // Calculate duration in hours
      const startDateTime = new Date(start_time);
      const endDateTime = new Date(end_time);
      const durationHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

      // Calculate total price
      let totalPrice = court.hourly_rate * durationHours;
      let discountAmount = 0;
      let appliedPromotion = null;

      // Apply promotion if provided
      if (promotion_code) {
        // Verify promotion code
        const verificationResult = await PromotionService.verifyPromotionCode(promotion_code, req.user.id);

        if (!verificationResult.valid) {
          return res.status(400).json({
            message: verificationResult.message
          });
        }

        // Calculate discount
        discountAmount = (totalPrice * verificationResult.promotion.discount_percent) / 100;
        totalPrice -= discountAmount;
        appliedPromotion = verificationResult.promotion;
      }

      // Create booking with locking mechanism to prevent race conditions
      const newBooking = await Booking.createWithLock({
        court_id,
        user_id: req.user.id,
        start_time,
        end_time,
        total_price: totalPrice,
        status: 'pending',
        skill_level,
        current_players,
        needed_players,
        allow_join
      });

      // If this is a booking with allow_join, add the booker as a player
      if (allow_join) {
        try {
          await BookingPlayer.create({
            booking_id: newBooking.id,
            user_id: req.user.id,
            is_booker: true,
            players_count: current_players
          });
        } catch (playerError) {
          console.error('Error adding booker as player:', playerError);
          // Continue execution even if adding player fails
        }
      }

      // Release the lock after successful booking
      try {
        await BookingLock.releaseLock({
          court_id,
          start_time,
          end_time,
          user_id: req.user.id
        });
      } catch (lockError) {
        console.error('Error releasing lock:', lockError);
        // Continue execution even if releasing lock fails
      }

      // Record promotion usage if applied
      if (appliedPromotion) {
        try {
          await PromotionService.applyPromotion({
            code: appliedPromotion.code,
            userId: req.user.id,
            bookingId: newBooking.id,
            totalPrice: totalPrice + discountAmount // Original price before discount
          });
        } catch (promotionError) {
          console.error('Error applying promotion:', promotionError);
          // Continue execution even if applying promotion fails
        }
      }

      // Skip reward processing for now to avoid potential errors
      // We'll add it back after fixing the database schema
      /*
      try {
        // Process all applicable rewards for this booking
        await RewardService.processBookingRewards(newBooking, req.user.id);
      } catch (rewardError) {
        console.error('Error processing rewards:', rewardError);
        // Continue execution even if reward processing fails
      }

      try {
        // Check for off-peak booking rewards
        await RewardService.awardPointsForOffPeakBooking(newBooking.id, req.user.id, start_time);
      } catch (offPeakError) {
        console.error('Error processing off-peak rewards:', offPeakError);
        // Continue execution even if off-peak reward processing fails
      }
      */

      // Skip notification for now to avoid potential errors
      // We'll add it back after fixing the database schema
      /*
      try {
        // Send booking confirmation notification
        await NotificationService.sendBookingConfirmationNotification(req.user.id, {
          ...newBooking,
          court_name: court.name
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Continue execution even if notification sending fails
      }
      */

      res.status(201).json({
        message: 'Booking created successfully',
        booking: newBooking,
        discount_amount: discountAmount,
        applied_promotion: appliedPromotion ? {
          code: appliedPromotion.code,
          discount_percent: appliedPromotion.discount_percent
        } : null
      });
    } catch (error) {
      // Release the lock if there was an error
      try {
        await BookingLock.releaseLock({
          court_id,
          start_time,
          end_time,
          user_id: req.user.id
        });
      } catch (lockError) {
        console.error('Error releasing lock after booking error:', lockError);
        // Continue to throw the original error
      }

      throw error;
    }
  } catch (error) {
    console.error('Create booking error:', error);

    if (error.message === 'The selected time slot is not available') {
      return res.status(400).json({ message: error.message });
    }

    if (error.message === 'Court not found or not available') {
      return res.status(404).json({ message: error.message });
    }

    // Provide more detailed error message for debugging
    console.error('Detailed booking error:', error);

    // Check for specific error messages and provide user-friendly responses
    if (error.message.includes('database') || error.message.includes('table')) {
      return res.status(500).json({
        message: 'Database configuration issue. Please contact support.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    if (error.message.includes('connection')) {
      return res.status(500).json({
        message: 'Database connection issue. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({
      message: 'Server error while creating booking. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all bookings for current user
const getUserBookings = async (req, res) => {
  try {
    console.log('getUserBookings: Request received for user ID:', req.user.id);

    // Verify user authentication
    if (!req.user || !req.user.id) {
      console.error('getUserBookings: No authenticated user found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const bookings = await Booking.getByUserId(req.user.id);
    console.log(`getUserBookings: Found ${bookings.length} bookings for user ID ${req.user.id}`);

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Get user bookings error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    if (booking.user_id !== req.user.id) {
      // Check if user is the court owner
      const court = await Court.findById(booking.court_id);

      if (!court || court.owner_id !== req.user.id) {
        return res.status(403).json({ message: 'You are not authorized to view this booking' });
      }
    }

    // Get court details
    const court = await Court.findById(booking.court_id);

    // Get payment details if any
    const payments = await Payment.getByBookingId(booking.id);

    res.status(200).json({
      booking,
      court,
      payments
    });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching booking' });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to cancel this booking
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed booking' });
    }

    // Check if booking start time is in the future
    const now = new Date();
    const startTime = new Date(booking.start_time);

    if (startTime <= now) {
      return res.status(400).json({ message: 'Cannot cancel a booking that has already started' });
    }

    // Cancel booking
    const updatedBooking = await Booking.update(id, {
      status: 'cancelled'
    });

    // Refund payment if any
    const payments = await Payment.getByBookingId(id);

    if (payments.length > 0) {
      // Process refund logic here
      // For now, just mark the payment as refunded
      await Payment.update(payments[0].id, {
        status: 'refunded'
      });
    }

    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error while cancelling booking' });
  }
};

// Get bookings for a court (court owner only)
const getCourtBookings = async (req, res) => {
  try {
    const { courtId } = req.params;

    // Check if court exists
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Check if user is the owner of the court
    if (court.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to view bookings for this court' });
    }

    // Get bookings
    const bookings = await Booking.getByCourtId(courtId);

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Get court bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching court bookings' });
  }
};

// Update booking status (court owner only)
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Check if booking exists
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the owner of the court
    const court = await Court.findById(booking.court_id);

    if (!court || court.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this booking' });
    }

    // Update booking status
    const updatedBooking = await Booking.update(id, { status });

    // If booking is completed, award reward points to the user
    if (status === 'completed') {
      // Process all applicable rewards for this booking
      const rewardEntries = await RewardService.processBookingRewards(updatedBooking, booking.user_id);

      // Check for consecutive bookings
      await RewardService.awardPointsForConsecutiveBookings(booking.user_id);

      // Send notification
      await NotificationService.sendNotification({
        user_id: booking.user_id,
        title: 'Booking Completed',
        message: `Your booking at ${court.name} has been marked as completed. You've earned reward points!`,
        type: 'booking_completed',
        related_id: booking.id,
        related_type: 'booking'
      });
    }

    res.status(200).json({
      message: 'Booking status updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error while updating booking status' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getCourtBookings,
  updateBookingStatus
};

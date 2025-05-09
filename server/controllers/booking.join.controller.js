/**
 * Booking Join Controller
 * Handles API endpoints for the "Join Existing Court" feature
 */
const Booking = require('../models/booking.model');
const BookingJoinRequest = require('../models/booking.join.request.model');
const BookingPlayer = require('../models/booking.player.model');
const NotificationService = require('../services/notification.service');

/**
 * Get joinable courts with filters
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getJoinableCourts = async (req, res) => {
  try {
    const {
      date,
      skill_level,
      location,
      min_price,
      max_price,
      players_needed,
      limit,
      offset
    } = req.query;

    // Parse numeric values
    const parsedMinPrice = min_price ? parseFloat(min_price) : undefined;
    const parsedMaxPrice = max_price ? parseFloat(max_price) : undefined;
    const parsedPlayersNeeded = players_needed ? parseInt(players_needed) : undefined;
    const parsedLimit = limit ? parseInt(limit) : 50;
    const parsedOffset = offset ? parseInt(offset) : 0;

    // Get joinable courts
    const joinableCourts = await Booking.findJoinable({
      date,
      skill_level,
      location,
      min_price: parsedMinPrice,
      max_price: parsedMaxPrice,
      players_needed: parsedPlayersNeeded,
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.status(200).json({ joinable_courts: joinableCourts });
  } catch (error) {
    console.error('Get joinable courts error:', error);
    res.status(500).json({ message: 'Server error while fetching joinable courts' });
  }
};

/**
 * Get joinable court details
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getJoinableCourtDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get booking details
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is joinable
    if (!booking.allow_join) {
      return res.status(400).json({ message: 'This booking is not available for joining' });
    }

    // Get players
    const players = await BookingPlayer.getByBookingId(id);

    res.status(200).json({
      booking,
      players,
      spots_available: booking.needed_players - booking.current_players
    });
  } catch (error) {
    console.error('Get joinable court details error:', error);
    res.status(500).json({ message: 'Server error while fetching joinable court details' });
  }
};

/**
 * Send join request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const sendJoinRequest = async (req, res) => {
  try {
    const { booking_id, players_count, message } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!booking_id || !players_count) {
      return res.status(400).json({ message: 'Booking ID and players count are required' });
    }

    // Check if booking exists and is joinable
    const booking = await Booking.findById(booking_id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.allow_join) {
      return res.status(400).json({ message: 'This booking is not available for joining' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed bookings can be joined' });
    }

    if (booking.current_players >= booking.needed_players) {
      return res.status(400).json({ message: 'This booking already has the maximum number of players' });
    }

    // Check if user is the booker
    if (booking.user_id === user_id) {
      return res.status(400).json({ message: 'You cannot join your own booking' });
    }

    // Check if user already has a pending request
    const existingRequest = await BookingJoinRequest.exists(booking_id, user_id);

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this booking' });
    }

    // Check if user is already a player
    const isPlayer = await BookingPlayer.exists(booking_id, user_id);

    if (isPlayer) {
      return res.status(400).json({ message: 'You are already a player in this booking' });
    }

    // Check if requested players count is valid
    const availableSpots = booking.needed_players - booking.current_players;

    if (players_count > availableSpots) {
      return res.status(400).json({
        message: `Only ${availableSpots} spots available. Please reduce the number of players.`
      });
    }

    // Create join request
    const joinRequest = await BookingJoinRequest.create({
      booking_id,
      user_id,
      players_count,
      message
    });

    // Send notification to booker
    await NotificationService.sendJoinRequestNotification(
      booking.user_id,
      joinRequest,
      req.user
    );

    res.status(201).json({
      message: 'Join request sent successfully',
      join_request: joinRequest
    });
  } catch (error) {
    console.error('Send join request error:', error);
    res.status(500).json({ message: 'Server error while sending join request' });
  }
};

/**
 * Get join requests for a booking
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getJoinRequests = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.id;

    // Check if booking exists
    const booking = await Booking.findById(booking_id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the booker
    if (booking.user_id !== user_id) {
      return res.status(403).json({ message: 'You are not authorized to view join requests for this booking' });
    }

    // Get join requests
    const joinRequests = await BookingJoinRequest.getByBookingId(booking_id);

    res.status(200).json({ join_requests: joinRequests });
  } catch (error) {
    console.error('Get join requests error:', error);
    res.status(500).json({ message: 'Server error while fetching join requests' });
  }
};

/**
 * Get user's join requests
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserJoinRequests = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get join requests
    const joinRequests = await BookingJoinRequest.getByUserId(user_id);

    res.status(200).json({ join_requests: joinRequests });
  } catch (error) {
    console.error('Get user join requests error:', error);
    res.status(500).json({ message: 'Server error while fetching user join requests' });
  }
};

/**
 * Respond to join request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const respondToJoinRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;

    // Validate status
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ message: 'Status must be either "approved" or "rejected"' });
    }

    // Get join request
    const joinRequest = await BookingJoinRequest.findById(id);

    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    // Get booking
    const booking = await Booking.findById(joinRequest.booking_id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the booker
    if (booking.user_id !== user_id) {
      return res.status(403).json({ message: 'You are not authorized to respond to this join request' });
    }

    // Check if request is already processed
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ message: `This request has already been ${joinRequest.status}` });
    }

    // Update request status
    const updatedRequest = await BookingJoinRequest.updateStatus(id, status);

    // If approved, add player to booking
    if (status === 'approved') {
      // Check if there's enough space
      const availableSpots = booking.needed_players - booking.current_players;

      if (joinRequest.players_count > availableSpots) {
        await BookingJoinRequest.updateStatus(id, 'rejected');
        return res.status(400).json({
          message: `Not enough spots available. Only ${availableSpots} spots left.`
        });
      }

      // Add player to booking
      await BookingPlayer.create({
        booking_id: joinRequest.booking_id,
        user_id: joinRequest.user_id,
        is_booker: false,
        players_count: joinRequest.players_count
      });

      // Update booking current players count
      await Booking.updatePlayerCounts(
        joinRequest.booking_id,
        booking.current_players + joinRequest.players_count,
        booking.needed_players
      );
    }

    // Send notification to requester
    await NotificationService.sendJoinRequestResponseNotification(
      joinRequest.user_id,
      joinRequest,
      status,
      booking
    );

    res.status(200).json({
      message: `Join request ${status} successfully`,
      join_request: updatedRequest
    });
  } catch (error) {
    console.error('Respond to join request error:', error);
    res.status(500).json({ message: 'Server error while responding to join request' });
  }
};

module.exports = {
  getJoinableCourts,
  getJoinableCourtDetails,
  sendJoinRequest,
  getJoinRequests,
  getUserJoinRequests,
  respondToJoinRequest
};

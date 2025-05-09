/**
 * Booking Join Request Model
 * Handles database operations for booking join requests
 */
const db = require('../config/db.config');

const BookingJoinRequest = {
  /**
   * Create a new join request
   * @param {Object} requestData - Join request data
   * @param {number} requestData.booking_id - Booking ID
   * @param {number} requestData.user_id - User ID
   * @param {number} requestData.players_count - Number of players joining
   * @param {string} requestData.message - Optional message
   * @returns {Promise<Object>} - Created join request
   */
  async create(requestData) {
    const {
      booking_id,
      user_id,
      players_count = 1,
      message = null
    } = requestData;

    const query = `
      INSERT INTO booking_join_requests (
        booking_id,
        user_id,
        players_count,
        message,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
      RETURNING *
    `;

    const values = [
      booking_id,
      user_id,
      players_count,
      message
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get join request by ID
   * @param {number} id - Join request ID
   * @returns {Promise<Object>} - Join request
   */
  async findById(id) {
    const query = `
      SELECT jr.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM booking_join_requests jr
      JOIN users u ON jr.user_id = u.id
      WHERE jr.id = $1
    `;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get join requests for a booking
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Array>} - Join requests
   */
  async getByBookingId(bookingId) {
    const query = `
      SELECT jr.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM booking_join_requests jr
      JOIN users u ON jr.user_id = u.id
      WHERE jr.booking_id = $1
      ORDER BY jr.created_at DESC
    `;

    try {
      const result = await db.query(query, [bookingId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get join requests by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Join requests
   */
  async getByUserId(userId) {
    const query = `
      SELECT jr.*, b.start_time, b.end_time, b.skill_level, 
             c.name as court_name, c.location as court_location,
             u.name as booker_name
      FROM booking_join_requests jr
      JOIN bookings b ON jr.booking_id = b.id
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      WHERE jr.user_id = $1
      ORDER BY jr.created_at DESC
    `;

    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update join request status
   * @param {number} id - Join request ID
   * @param {string} status - New status ('approved' or 'rejected')
   * @returns {Promise<Object>} - Updated join request
   */
  async updateStatus(id, status) {
    const query = `
      UPDATE booking_join_requests
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await db.query(query, [status, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if user has already requested to join a booking
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if request exists
   */
  async exists(bookingId, userId) {
    const query = `
      SELECT id FROM booking_join_requests
      WHERE booking_id = $1 AND user_id = $2
    `;

    try {
      const result = await db.query(query, [bookingId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = BookingJoinRequest;

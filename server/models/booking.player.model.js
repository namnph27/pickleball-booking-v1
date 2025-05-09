/**
 * Booking Player Model
 * Handles database operations for booking players
 */
const db = require('../config/db.config');

const BookingPlayer = {
  /**
   * Add a player to a booking
   * @param {Object} playerData - Player data
   * @param {number} playerData.booking_id - Booking ID
   * @param {number} playerData.user_id - User ID
   * @param {boolean} playerData.is_booker - Whether this player is the original booker
   * @param {number} playerData.players_count - Number of players this user is bringing
   * @returns {Promise<Object>} - Created booking player
   */
  async create(playerData) {
    const {
      booking_id,
      user_id,
      is_booker = false,
      players_count = 1
    } = playerData;

    const query = `
      INSERT INTO booking_players (
        booking_id,
        user_id,
        is_booker,
        players_count,
        created_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const values = [
      booking_id,
      user_id,
      is_booker,
      players_count
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all players for a booking
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Array>} - Booking players
   */
  async getByBookingId(bookingId) {
    const query = `
      SELECT bp.*, u.name, u.email, u.phone
      FROM booking_players bp
      JOIN users u ON bp.user_id = u.id
      WHERE bp.booking_id = $1
      ORDER BY bp.is_booker DESC, bp.created_at ASC
    `;

    try {
      const result = await db.query(query, [bookingId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get bookings where a user is a player
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Bookings
   */
  async getBookingsByUserId(userId) {
    const query = `
      SELECT b.*, c.name as court_name, c.location as court_location,
             u.name as booker_name, bp.is_booker, bp.players_count
      FROM booking_players bp
      JOIN bookings b ON bp.booking_id = b.id
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      WHERE bp.user_id = $1
      ORDER BY b.start_time DESC
    `;

    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if a user is already a player in a booking
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if player exists
   */
  async exists(bookingId, userId) {
    const query = `
      SELECT id FROM booking_players
      WHERE booking_id = $1 AND user_id = $2
    `;

    try {
      const result = await db.query(query, [bookingId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get total player count for a booking
   * @param {number} bookingId - Booking ID
   * @returns {Promise<number>} - Total player count
   */
  async getTotalPlayerCount(bookingId) {
    const query = `
      SELECT SUM(players_count) as total_players
      FROM booking_players
      WHERE booking_id = $1
    `;

    try {
      const result = await db.query(query, [bookingId]);
      return parseInt(result.rows[0]?.total_players || 0);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove a player from a booking
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if player was removed
   */
  async remove(bookingId, userId) {
    const query = `
      DELETE FROM booking_players
      WHERE booking_id = $1 AND user_id = $2 AND is_booker = FALSE
      RETURNING id
    `;

    try {
      const result = await db.query(query, [bookingId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = BookingPlayer;

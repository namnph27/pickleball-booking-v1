const db = require('../config/db.config');

const Booking = {
  /**
   * Create a new booking with transaction support
   * @param {Object} bookingData - Booking data
   * @param {number} bookingData.court_id - Court ID
   * @param {number} bookingData.user_id - User ID
   * @param {string} bookingData.start_time - Start time (ISO string)
   * @param {string} bookingData.end_time - End time (ISO string)
   * @param {number} bookingData.total_price - Total price
   * @param {string} bookingData.status - Status (default: 'pending')
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Object>} - Booking object
   */
  async create(bookingData, client = null) {
    const {
      court_id,
      user_id,
      start_time,
      end_time,
      total_price,
      status = 'pending',
      skill_level = null,
      current_players = 1,
      needed_players = 3,
      allow_join = false
    } = bookingData;

    const query = `
      INSERT INTO bookings (
        court_id,
        user_id,
        start_time,
        end_time,
        total_price,
        status,
        skill_level,
        current_players,
        needed_players,
        allow_join,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      court_id,
      user_id,
      start_time,
      end_time,
      total_price,
      status,
      skill_level,
      current_players,
      needed_players,
      allow_join
    ];

    try {
      // If client is provided, use it (for transactions)
      const result = client
        ? await client.query(query, values)
        : await db.query(query, values);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find booking by ID
  async findById(id) {
    const query = `
      SELECT b.*, c.name as court_name, u.name as user_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = $1
    `;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Update booking
  async update(id, bookingData) {
    const {
      start_time,
      end_time,
      total_price,
      status,
      skill_level,
      current_players,
      needed_players,
      allow_join
    } = bookingData;

    // Build dynamic update query based on provided fields
    let query = 'UPDATE bookings SET updated_at = NOW()';
    const values = [];
    let valueIndex = 1;

    if (start_time !== undefined) {
      query += `, start_time = $${valueIndex}`;
      values.push(start_time);
      valueIndex++;
    }

    if (end_time !== undefined) {
      query += `, end_time = $${valueIndex}`;
      values.push(end_time);
      valueIndex++;
    }

    if (total_price !== undefined) {
      query += `, total_price = $${valueIndex}`;
      values.push(total_price);
      valueIndex++;
    }

    if (status !== undefined) {
      query += `, status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }

    if (skill_level !== undefined) {
      query += `, skill_level = $${valueIndex}`;
      values.push(skill_level);
      valueIndex++;
    }

    if (current_players !== undefined) {
      query += `, current_players = $${valueIndex}`;
      values.push(current_players);
      valueIndex++;
    }

    if (needed_players !== undefined) {
      query += `, needed_players = $${valueIndex}`;
      values.push(needed_players);
      valueIndex++;
    }

    if (allow_join !== undefined) {
      query += `, allow_join = $${valueIndex}`;
      values.push(allow_join);
      valueIndex++;
    }

    query += ` WHERE id = $${valueIndex} RETURNING *`;
    values.push(id);

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Delete booking
  async delete(id) {
    const query = 'DELETE FROM bookings WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get all bookings
  async getAll() {
    const query = `
      SELECT b.*, c.name as court_name, u.name as user_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
    `;

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get bookings by user ID
  async getByUserId(userId) {
    const query = `
      SELECT b.*, c.name as court_name, c.location, c.image_url
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE b.user_id = $1
      ORDER BY b.start_time DESC
    `;

    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get bookings by court ID
  async getByCourtId(courtId) {
    const query = `
      SELECT b.*, u.name as user_name, u.email as user_email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.court_id = $1
      ORDER BY b.start_time DESC
    `;

    try {
      const result = await db.query(query, [courtId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if court is available for booking with transaction support
   * @param {number} courtId - Court ID
   * @param {string} startTime - Start time (ISO string)
   * @param {string} endTime - End time (ISO string)
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} - True if available, false otherwise
   */
  async checkAvailability(courtId, startTime, endTime, client = null) {
    const query = `
      SELECT COUNT(*) as count
      FROM bookings
      WHERE
        court_id = $1 AND
        status != 'cancelled' AND
        ((start_time <= $2 AND end_time > $2) OR
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3))
    `;

    try {
      // If client is provided, use it (for transactions)
      const result = client
        ? await client.query(query, [courtId, startTime, endTime])
        : await db.query(query, [courtId, startTime, endTime]);

      return parseInt(result.rows[0].count) === 0;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a booking with locking mechanism to prevent race conditions
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>} - Booking object
   */
  async createWithLock(bookingData) {
    const {
      court_id,
      user_id,
      start_time,
      end_time,
      total_price,
      status = 'pending',
      skill_level = null,
      current_players = 1,
      needed_players = 3,
      allow_join = false
    } = bookingData;

    // Start a transaction
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Check if court exists and is available
      const courtQuery = `
        SELECT * FROM courts
        WHERE id = $1 AND is_available = true
      `;

      const courtResult = await client.query(courtQuery, [court_id]);

      if (courtResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Court not found or not available');
      }

      // Check if the time slot is available with FOR UPDATE SKIP LOCKED
      // This ensures we have an exclusive lock on the rows we're checking
      const availabilityQuery = `
        SELECT id FROM bookings
        WHERE
          court_id = $1 AND
          status != 'cancelled' AND
          ((start_time <= $2 AND end_time > $2) OR
           (start_time < $3 AND end_time >= $3) OR
           (start_time >= $2 AND end_time <= $3))
        FOR UPDATE SKIP LOCKED
      `;

      const availabilityResult = await client.query(availabilityQuery, [court_id, start_time, end_time]);

      if (availabilityResult.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new Error('The selected time slot is not available');
      }

      // Create the booking
      const newBooking = await this.create({
        court_id,
        user_id,
        start_time,
        end_time,
        total_price,
        status,
        skill_level,
        current_players,
        needed_players,
        allow_join
      }, client);

      await client.query('COMMIT');
      return newBooking;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get bookings by user ID and date range
   * @param {number} userId - User ID
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} - Array of booking objects
   */
  async getByUserIdAndDateRange(userId, startDate, endDate) {
    const query = `
      SELECT b.*, c.name as court_name, c.location, c.image_url
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE
        b.user_id = $1 AND
        b.start_time >= $2 AND
        b.start_time <= $3
      ORDER BY b.start_time DESC
    `;

    try {
      const result = await db.query(query, [userId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get count of bookings by user ID for a specific period
   * @param {number} userId - User ID
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<number>} - Count of bookings
   */
  async getCountByUserIdAndDateRange(userId, startDate, endDate) {
    const query = `
      SELECT COUNT(*) as count
      FROM bookings
      WHERE
        user_id = $1 AND
        start_time >= $2 AND
        start_time <= $3 AND
        status = 'completed'
    `;

    try {
      const result = await db.query(query, [userId, startDate, endDate]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get bookings by status
   * @param {string} status - Booking status
   * @returns {Promise<Array>} - Array of booking objects
   */
  async getByStatus(status) {
    const query = `
      SELECT b.*, c.name as court_name, u.name as user_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      WHERE b.status = $1
      ORDER BY b.created_at DESC
    `;

    try {
      const result = await db.query(query, [status]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get recent bookings
   * @param {number} limit - Limit
   * @returns {Promise<Array>} - Array of booking objects
   */
  async getRecent(limit = 10) {
    const query = `
      SELECT b.*, c.name as court_name, u.name as user_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
      LIMIT $1
    `;

    try {
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get count of bookings by date range
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} - Array of counts by date
   */
  async getCountByDateRange(startDate, endDate) {
    const query = `
      SELECT
        DATE(start_time) as date,
        COUNT(*) as count
      FROM bookings
      WHERE
        start_time >= $1 AND
        start_time <= $2
      GROUP BY DATE(start_time)
      ORDER BY date
    `;

    try {
      const result = await db.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get bookings with filters
   * @param {Object} filters - Filters
   * @param {string} filters.start_date - Start date (ISO string)
   * @param {string} filters.end_date - End date (ISO string)
   * @param {number} filters.court_id - Court ID
   * @param {number} filters.user_id - User ID
   * @param {string} filters.status - Booking status
   * @param {number} filters.limit - Limit
   * @param {number} filters.offset - Offset
   * @returns {Promise<Array>} - Array of booking objects
   */
  async getByFilters(filters) {
    const {
      start_date,
      end_date,
      court_id,
      user_id,
      status,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT b.*, c.name as court_name, u.name as user_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let valueIndex = 1;

    if (start_date) {
      query += ` AND b.start_time >= $${valueIndex}`;
      values.push(start_date);
      valueIndex++;
    }

    if (end_date) {
      query += ` AND b.start_time <= $${valueIndex}`;
      values.push(end_date);
      valueIndex++;
    }

    if (court_id) {
      query += ` AND b.court_id = $${valueIndex}`;
      values.push(court_id);
      valueIndex++;
    }

    if (user_id) {
      query += ` AND b.user_id = $${valueIndex}`;
      values.push(user_id);
      valueIndex++;
    }

    if (status) {
      query += ` AND b.status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limit, offset);

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update booking notes
   * @param {number} id - Booking ID
   * @param {string} adminNotes - Admin notes
   * @returns {Promise<Object>} - Updated booking
   */
  async updateNotes(id, adminNotes) {
    const query = `
      UPDATE bookings
      SET admin_notes = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await db.query(query, [adminNotes, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find joinable courts with filters
   * @param {Object} filters - Filters
   * @param {string} filters.date - Date (YYYY-MM-DD)
   * @param {string} filters.skill_level - Skill level
   * @param {string} filters.location - Location
   * @param {number} filters.min_price - Minimum price
   * @param {number} filters.max_price - Maximum price
   * @param {number} filters.players_needed - Number of players needed
   * @param {number} filters.limit - Limit
   * @param {number} filters.offset - Offset
   * @returns {Promise<Array>} - Array of joinable bookings
   */
  async findJoinable(filters) {
    const {
      date,
      skill_level,
      location,
      min_price,
      max_price,
      players_needed,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT b.*, c.name as court_name, c.location, c.image_url, c.hourly_rate,
             u.name as user_name, u.phone as user_phone,
             (b.needed_players - b.current_players) as spots_available
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      WHERE b.allow_join = true
        AND b.status = 'confirmed'
        AND b.start_time > NOW()
        AND b.current_players < b.needed_players
    `;

    const values = [];
    let valueIndex = 1;

    // Filter by date
    if (date) {
      query += ` AND DATE(b.start_time) = $${valueIndex}`;
      values.push(date);
      valueIndex++;
    }

    // Filter by skill level
    if (skill_level) {
      query += ` AND (b.skill_level = $${valueIndex} OR b.skill_level IS NULL)`;
      values.push(skill_level);
      valueIndex++;
    }

    // Filter by location
    if (location) {
      query += ` AND c.location ILIKE $${valueIndex}`;
      values.push(`%${location}%`);
      valueIndex++;
    }

    // Filter by price range
    if (min_price !== undefined) {
      query += ` AND c.hourly_rate >= $${valueIndex}`;
      values.push(min_price);
      valueIndex++;
    }

    if (max_price !== undefined) {
      query += ` AND c.hourly_rate <= $${valueIndex}`;
      values.push(max_price);
      valueIndex++;
    }

    // Filter by players needed
    if (players_needed !== undefined) {
      query += ` AND (b.needed_players - b.current_players) >= $${valueIndex}`;
      values.push(players_needed);
      valueIndex++;
    }

    // Order by start time
    query += ` ORDER BY b.start_time ASC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limit, offset);

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update allow_join status
   * @param {number} id - Booking ID
   * @param {boolean} allowJoin - Allow join status
   * @returns {Promise<Object>} - Updated booking
   */
  async updateAllowJoin(id, allowJoin) {
    const query = `
      UPDATE bookings
      SET allow_join = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await db.query(query, [allowJoin, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update player counts
   * @param {number} id - Booking ID
   * @param {number} currentPlayers - Current players count
   * @param {number} neededPlayers - Needed players count
   * @returns {Promise<Object>} - Updated booking
   */
  async updatePlayerCounts(id, currentPlayers, neededPlayers) {
    const query = `
      UPDATE bookings
      SET current_players = $1, needed_players = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await db.query(query, [currentPlayers, neededPlayers, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Booking;

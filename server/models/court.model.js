const db = require('../config/db.config');

const Court = {
  // Create a new court
  async create(courtData) {
    const {
      name,
      description,
      location,
      district,
      district_name,
      hourly_rate,
      owner_id,
      skill_level = 'allLevels',
      image_url,
      is_available = true
    } = courtData;

    // Get the count of courts for this owner to generate court number
    const countQuery = 'SELECT COUNT(*) FROM courts WHERE owner_id = $1';
    const countResult = await db.query(countQuery, [owner_id]);
    const courtCount = parseInt(countResult.rows[0].count) + 1;

    // Generate court name with number if not provided
    const courtName = name || `Sân ${courtCount}`;

    const query = `
      INSERT INTO courts (
        name,
        description,
        location,
        district,
        district_name,
        hourly_rate,
        owner_id,
        skill_level,
        image_url,
        is_available,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      courtName,
      description,
      location,
      district,
      district_name,
      hourly_rate,
      owner_id,
      skill_level,
      image_url,
      is_available
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find court by ID
  async findById(id) {
    console.log('Finding court by ID in model:', id);
    const query = `
      SELECT c.*, u.name as owner_name, u.phone as owner_phone
      FROM courts c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = $1
    `;

    try {
      const result = await db.query(query, [id]);
      console.log('Query result:', result.rows);

      if (result.rows.length === 0) {
        console.log('No court found with ID:', id);
        return null;
      }

      console.log('Court found:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding court by ID:', error);
      throw error;
    }
  },

  // Update court
  async update(id, courtData) {
    console.log('Updating court in model with ID:', id);
    console.log('Court data for update:', courtData);

    const {
      name,
      description,
      location,
      district,
      district_name,
      hourly_rate,
      skill_level,
      image_url,
      is_available
    } = courtData;

    // Validate required fields
    if (!name || !location || !district) {
      console.error('Missing required fields for court update in model');
      throw new Error('Name, location, and district are required');
    }

    const query = `
      UPDATE courts
      SET
        name = $1,
        description = $2,
        location = $3,
        district = $4,
        district_name = $5,
        hourly_rate = $6,
        skill_level = $7,
        image_url = $8,
        is_available = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;

    const values = [
      name,
      description,
      location,
      district,
      district_name,
      hourly_rate,
      skill_level,
      image_url,
      is_available,
      id
    ];

    try {
      console.log('Executing update query with values:', values);
      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        console.error('No court found with ID:', id);
        throw new Error('Court not found');
      }

      console.log('Court updated successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating court in model:', error);
      throw error;
    }
  },

  // Delete court
  async delete(id) {
    const query = 'DELETE FROM courts WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get all courts
  async getAll() {
    const query = `
      SELECT c.*, u.name as owner_name, u.phone as owner_phone
      FROM courts c
      JOIN users u ON c.owner_id = u.id
    `;

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get courts by owner ID
  async getByOwnerId(ownerId) {
    const query = 'SELECT * FROM courts WHERE owner_id = $1';

    try {
      const result = await db.query(query, [ownerId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get available courts
  async getAvailable() {
    const query = `
      SELECT c.*, u.name as owner_name, u.phone as owner_phone
      FROM courts c
      JOIN users u ON c.owner_id = u.id
      WHERE c.is_available = true
    `;

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Search courts by name, location, or skill level
  async search(searchTerm) {
    const query = `
      SELECT c.*, u.name as owner_name, u.phone as owner_phone
      FROM courts c
      JOIN users u ON c.owner_id = u.id
      WHERE
        c.name ILIKE $1 OR
        c.location ILIKE $1 OR
        c.skill_level ILIKE $1
    `;

    try {
      const result = await db.query(query, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search courts with advanced filters
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {string} params.date - Date to check availability (YYYY-MM-DD)
   * @param {string} params.district - District/location
   * @param {string} params.location - Location (alternative to district)
   * @param {number} params.min_price - Minimum price
   * @param {number} params.max_price - Maximum price
   * @returns {Promise<Array>} - Array of court objects
   */
  async searchWithFilters(params) {
    const {
      query,
      date,
      district,
      location,
      min_price,
      max_price
    } = params;

    // Start building the base query
    let baseQuery = `
      SELECT c.*, u.name as owner_name, u.phone as owner_phone
      FROM courts c
      JOIN users u ON c.owner_id = u.id
      WHERE c.is_available = true
    `;

    const values = [];
    let valueIndex = 1;

    // Add search query filter if provided
    if (query) {
      baseQuery += ` AND (
        c.name ILIKE $${valueIndex} OR
        c.location ILIKE $${valueIndex} OR
        c.description ILIKE $${valueIndex}
      )`;
      values.push(`%${query}%`);
      valueIndex++;
    }

    // Add district/location filter if provided
    if (district || location) {
      const locationValue = district || location;

      // Handle location search more intelligently
      // Split location into words and search for each word
      const locationWords = locationValue.split(/\s+/).filter(word => word.length > 1);

      if (locationWords.length > 0) {
        const locationConditions = locationWords.map((_, idx) =>
          `c.location ILIKE $${valueIndex + idx}`
        );

        baseQuery += ` AND (${locationConditions.join(' AND ')})`;

        locationWords.forEach(word => {
          values.push(`%${word}%`);
        });

        valueIndex += locationWords.length;
      } else {
        // Fallback to simple search if no valid words
        baseQuery += ` AND c.location ILIKE $${valueIndex}`;
        values.push(`%${locationValue}%`);
        valueIndex++;
      }
    }

    // Add price range filters if provided
    if (min_price !== undefined) {
      baseQuery += ` AND c.hourly_rate >= $${valueIndex}`;
      values.push(min_price);
      valueIndex++;
    }

    if (max_price !== undefined) {
      baseQuery += ` AND c.hourly_rate <= $${valueIndex}`;
      values.push(max_price);
      valueIndex++;
    }

    // If date is provided, filter courts by availability on that date
    let finalQuery = baseQuery;
    if (date) {
      // Get the day of week from the date (0 = Sunday, 1 = Monday, etc.)
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();

      finalQuery = `
        WITH available_courts AS (
          ${baseQuery}
        )
        SELECT DISTINCT ac.*
        FROM available_courts ac
        JOIN court_timeslots ct ON ac.id = ct.court_id
        LEFT JOIN bookings b ON ac.id = b.court_id
          AND b.status != 'cancelled'
          AND DATE(b.start_time) = $${valueIndex}
        WHERE ct.day_of_week = $${valueIndex + 1}
          AND ct.is_available = true
          AND (b.id IS NULL OR (
            -- Check if there are any timeslots not fully booked for this date
            EXISTS (
              SELECT 1 FROM court_timeslots ct2
              WHERE ct2.court_id = ac.id
              AND ct2.day_of_week = $${valueIndex + 1}
              AND ct2.is_available = true
              AND NOT EXISTS (
                SELECT 1 FROM bookings b2
                WHERE b2.court_id = ac.id
                AND b2.status != 'cancelled'
                AND DATE(b2.start_time) = $${valueIndex}
                AND b2.start_time <= (DATE($${valueIndex}) + ct2.start_time::time)
                AND b2.end_time >= (DATE($${valueIndex}) + ct2.end_time::time)
              )
            )
          ))
      `;

      values.push(date, dayOfWeek);
      valueIndex += 2;
    }

    // Add ordering
    finalQuery += ` ORDER BY ${date ? 'ac' : 'c'}.created_at DESC`;

    try {
      const result = await db.query(finalQuery, values);
      return result.rows;
    } catch (error) {
      console.error('Error in searchWithFilters:', error);
      throw error;
    }
  },

  /**
   * Get top courts by number of bookings
   * @param {number} limit - Limit
   * @returns {Promise<Array>} - Array of court objects with booking count
   */
  async getTopByBookings(limit = 5) {
    const query = `
      SELECT c.*, u.name as owner_name, COUNT(b.id) as booking_count
      FROM courts c
      JOIN users u ON c.owner_id = u.id
      LEFT JOIN bookings b ON c.id = b.court_id
      GROUP BY c.id, u.name
      ORDER BY booking_count DESC
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
   * Get courts with filters
   * @param {Object} filters - Filters
   * @param {string} filters.name - Court name
   * @param {string} filters.location - Court location
   * @param {string} filters.skill_level - Court skill level
   * @param {number} filters.owner_id - Owner ID
   * @param {boolean} filters.is_available - Is available
   * @param {string} filters.date - Date to check availability (YYYY-MM-DD)
   * @param {number} filters.limit - Limit
   * @param {number} filters.offset - Offset
   * @returns {Promise<Array>} - Array of court objects
   */
  async getByFilters(filters) {
    const {
      name,
      location,
      skill_level,
      owner_id,
      is_available,
      date,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT c.*, u.name as owner_name, u.phone as owner_phone
      FROM courts c
      JOIN users u ON c.owner_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let valueIndex = 1;

    if (name) {
      query += ` AND c.name ILIKE $${valueIndex}`;
      values.push(`%${name}%`);
      valueIndex++;
    }

    if (location) {
      // Handle location search more intelligently
      // Split location into words and search for each word
      const locationWords = location.split(/\s+/).filter(word => word.length > 1);

      if (locationWords.length > 0) {
        const locationConditions = locationWords.map((_, idx) =>
          `c.location ILIKE $${valueIndex + idx}`
        );

        query += ` AND (${locationConditions.join(' AND ')})`;

        locationWords.forEach(word => {
          values.push(`%${word}%`);
        });

        valueIndex += locationWords.length;
      } else {
        // Fallback to simple search if no valid words
        query += ` AND c.location ILIKE $${valueIndex}`;
        values.push(`%${location}%`);
        valueIndex++;
      }
    }

    if (skill_level) {
      query += ` AND c.skill_level = $${valueIndex}`;
      values.push(skill_level);
      valueIndex++;
    }

    if (owner_id) {
      query += ` AND c.owner_id = $${valueIndex}`;
      values.push(owner_id);
      valueIndex++;
    }

    if (is_available !== undefined) {
      query += ` AND c.is_available = $${valueIndex}`;
      values.push(is_available);
      valueIndex++;
    }

    // If date is provided, filter courts by availability on that date
    if (date) {
      // Get the day of week from the date (0 = Sunday, 1 = Monday, etc.)
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();

      // Join with court_timeslots to check if there are available timeslots for this day
      query = `
        WITH available_courts AS (
          ${query}
        )
        SELECT DISTINCT ac.*
        FROM available_courts ac
        JOIN court_timeslots ct ON ac.id = ct.court_id
        LEFT JOIN bookings b ON ac.id = b.court_id
          AND b.status != 'cancelled'
          AND DATE(b.start_time) = $${valueIndex}
        WHERE ct.day_of_week = $${valueIndex + 1}
          AND ct.is_available = true
          AND (b.id IS NULL OR (
            -- Check if there are any timeslots not fully booked for this date
            EXISTS (
              SELECT 1 FROM court_timeslots ct2
              WHERE ct2.court_id = ac.id
              AND ct2.day_of_week = $${valueIndex + 1}
              AND ct2.is_available = true
              AND NOT EXISTS (
                SELECT 1 FROM bookings b2
                WHERE b2.court_id = ac.id
                AND b2.status != 'cancelled'
                AND DATE(b2.start_time) = $${valueIndex}
                AND b2.start_time <= (DATE($${valueIndex}) + ct2.start_time::time)
                AND b2.end_time >= (DATE($${valueIndex}) + ct2.end_time::time)
              )
            )
          ))
      `;

      values.push(date, dayOfWeek);
      valueIndex += 2;
    }

    query += ` ORDER BY ${date ? 'ac' : 'c'}.created_at DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limit, offset);

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error in getByFilters:', error);
      throw error;
    }
  },

  /**
   * Update court notes
   * @param {number} id - Court ID
   * @param {string} adminNotes - Admin notes
   * @returns {Promise<Object>} - Updated court
   */
  async updateNotes(id, adminNotes) {
    const query = `
      UPDATE courts
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
  }
};

module.exports = Court;

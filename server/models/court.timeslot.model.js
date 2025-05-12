const db = require('../config/db.config');

const CourtTimeslot = {
  // Create a new timeslot
  async create(timeslotData) {
    const {
      court_id,
      day_of_week,
      start_time,
      end_time,
      price = 0,
      is_available = true,
      specific_date = null
    } = timeslotData;

    const query = `
      INSERT INTO court_timeslots (
        court_id,
        day_of_week,
        start_time,
        end_time,
        price,
        is_available,
        specific_date,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      court_id,
      day_of_week,
      start_time,
      end_time,
      price,
      is_available,
      specific_date
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find timeslot by ID
  async findById(id) {
    const query = 'SELECT * FROM court_timeslots WHERE id = $1';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Update timeslot
  async update(id, timeslotData) {
    const {
      day_of_week,
      start_time,
      end_time,
      price,
      is_available,
      specific_date
    } = timeslotData;

    // Build the query dynamically based on provided fields
    let updateFields = [];
    let values = [];
    let valueIndex = 1;

    if (day_of_week !== undefined) {
      updateFields.push(`day_of_week = $${valueIndex}`);
      values.push(day_of_week);
      valueIndex++;
    }

    if (start_time !== undefined) {
      updateFields.push(`start_time = $${valueIndex}`);
      values.push(start_time);
      valueIndex++;
    }

    if (end_time !== undefined) {
      updateFields.push(`end_time = $${valueIndex}`);
      values.push(end_time);
      valueIndex++;
    }

    if (price !== undefined) {
      updateFields.push(`price = $${valueIndex}`);
      values.push(price);
      valueIndex++;
    }

    if (is_available !== undefined) {
      updateFields.push(`is_available = $${valueIndex}`);
      values.push(is_available);
      valueIndex++;
    }

    if (specific_date !== undefined) {
      if (specific_date === null) {
        updateFields.push(`specific_date = NULL`);
      } else {
        updateFields.push(`specific_date = $${valueIndex}`);
        values.push(specific_date);
        valueIndex++;
      }
    }

    updateFields.push(`updated_at = NOW()`);

    // If no fields to update, return the existing timeslot
    if (values.length === 0) {
      return this.findById(id);
    }

    // Add the ID as the last parameter
    values.push(id);

    const query = `
      UPDATE court_timeslots
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Delete timeslot
  async delete(id) {
    const query = 'DELETE FROM court_timeslots WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get all timeslots
  async getAll() {
    const query = 'SELECT * FROM court_timeslots ORDER BY day_of_week, start_time';

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get timeslots by court ID
  async getByCourtId(courtId) {
    const query = `
      SELECT * FROM court_timeslots
      WHERE court_id = $1
      ORDER BY day_of_week, start_time
    `;

    try {
      const result = await db.query(query, [courtId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get timeslots by court ID and day of week
  async getByCourtIdAndDay(courtId, dayOfWeek) {
    const query = `
      SELECT * FROM court_timeslots
      WHERE court_id = $1 AND day_of_week = $2
      ORDER BY start_time
    `;

    try {
      const result = await db.query(query, [courtId, dayOfWeek]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get available timeslots by court ID and day of week
  async getAvailableByCourtIdAndDay(courtId, dayOfWeek) {
    const query = `
      SELECT * FROM court_timeslots
      WHERE court_id = $1 AND day_of_week = $2 AND is_available = true
      ORDER BY start_time
    `;

    try {
      const result = await db.query(query, [courtId, dayOfWeek]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get timeslots by court ID and specific date
  async getByCourtIdAndDate(courtId, specificDate) {
    const query = `
      SELECT * FROM court_timeslots
      WHERE court_id = $1 AND specific_date = $2
      ORDER BY start_time
    `;

    try {
      const result = await db.query(query, [courtId, specificDate]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get available timeslots by court ID and specific date
  async getAvailableByCourtIdAndDate(courtId, specificDate) {
    const query = `
      SELECT * FROM court_timeslots
      WHERE court_id = $1 AND specific_date = $2 AND is_available = true
      ORDER BY start_time
    `;

    try {
      const result = await db.query(query, [courtId, specificDate]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get timeslots for a specific date, falling back to day of week if no specific date timeslots exist
  async getTimeslotsForDate(courtId, specificDate) {
    // First, get the day of week for the specific date
    const date = new Date(specificDate);
    const dayOfWeek = date.getDay();

    try {
      // First, try to get timeslots for the specific date
      const specificDateTimeslots = await this.getByCourtIdAndDate(courtId, specificDate);

      // If we have specific date timeslots, return them
      if (specificDateTimeslots.length > 0) {
        return specificDateTimeslots;
      }

      // Otherwise, fall back to day of week timeslots
      const dayOfWeekTimeslots = await this.getByCourtIdAndDay(courtId, dayOfWeek);

      // Return day of week timeslots with a flag indicating they're default timeslots
      return dayOfWeekTimeslots.map(timeslot => ({
        ...timeslot,
        is_default_timeslot: true
      }));
    } catch (error) {
      throw error;
    }
  },

  // Get available timeslots for a specific date, falling back to day of week if no specific date timeslots exist
  async getAvailableTimeslotsForDate(courtId, specificDate) {
    // First, get the day of week for the specific date
    const date = new Date(specificDate);
    const dayOfWeek = date.getDay();

    try {
      // First, try to get available timeslots for the specific date
      const specificDateTimeslots = await this.getAvailableByCourtIdAndDate(courtId, specificDate);

      // If we have specific date timeslots, return them
      if (specificDateTimeslots.length > 0) {
        return specificDateTimeslots;
      }

      // Otherwise, fall back to day of week timeslots
      const dayOfWeekTimeslots = await this.getAvailableByCourtIdAndDay(courtId, dayOfWeek);

      // Return day of week timeslots with a flag indicating they're default timeslots
      return dayOfWeekTimeslots.map(timeslot => ({
        ...timeslot,
        is_default_timeslot: true
      }));
    } catch (error) {
      throw error;
    }
  },

  // Check if timeslot is available
  async isAvailable(id) {
    const query = 'SELECT is_available FROM court_timeslots WHERE id = $1';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0]?.is_available || false;
    } catch (error) {
      throw error;
    }
  },

  // Set timeslot availability
  async setAvailability(id, isAvailable) {
    const query = `
      UPDATE court_timeslots
      SET is_available = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await db.query(query, [isAvailable, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Copy day of week timeslots to a specific date
  async copyDayOfWeekTimeslotsToDate(courtId, dayOfWeek, specificDate) {
    try {
      // Get all timeslots for the day of week
      const dayOfWeekTimeslots = await this.getByCourtIdAndDay(courtId, dayOfWeek);

      // Create new timeslots for the specific date
      const newTimeslots = [];

      for (const timeslot of dayOfWeekTimeslots) {
        const newTimeslot = await this.create({
          court_id: courtId,
          day_of_week: dayOfWeek,
          start_time: timeslot.start_time,
          end_time: timeslot.end_time,
          price: timeslot.price,
          is_available: timeslot.is_available,
          specific_date: specificDate
        });

        newTimeslots.push(newTimeslot);
      }

      return newTimeslots;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get price range for a court based on timeslots
   * @param {number} courtId - Court ID
   * @param {string} specificDate - Specific date (YYYY-MM-DD)
   * @returns {Promise<Object>} - Object with min and max price
   */
  async getPriceRangeForCourt(courtId, specificDate = null) {
    try {
      let query;
      let params = [courtId];

      if (specificDate) {
        // First, get the day of week for the specific date
        const date = new Date(specificDate);
        const dayOfWeek = date.getDay();

        // Try to get specific date timeslots first
        query = `
          SELECT MIN(price) as min_price, MAX(price) as max_price
          FROM court_timeslots
          WHERE court_id = $1 AND specific_date = $2 AND is_available = true
        `;
        params = [courtId, specificDate];

        const specificResult = await db.query(query, params);

        // If we have specific date timeslots with prices, return them
        if (specificResult.rows[0].min_price !== null) {
          return {
            min_price: parseFloat(specificResult.rows[0].min_price),
            max_price: parseFloat(specificResult.rows[0].max_price)
          };
        }

        // Otherwise, fall back to day of week timeslots
        query = `
          SELECT MIN(price) as min_price, MAX(price) as max_price
          FROM court_timeslots
          WHERE court_id = $1 AND day_of_week = $2 AND is_available = true
        `;
        params = [courtId, dayOfWeek];
      } else {
        // If no specific date, get price range across all timeslots
        query = `
          SELECT MIN(price) as min_price, MAX(price) as max_price
          FROM court_timeslots
          WHERE court_id = $1 AND is_available = true
        `;
      }

      const result = await db.query(query, params);

      return {
        min_price: parseFloat(result.rows[0].min_price || 0),
        max_price: parseFloat(result.rows[0].max_price || 0)
      };
    } catch (error) {
      console.error('Error getting price range for court:', error);
      throw error;
    }
  },

  /**
   * Get courts with price ranges within specified min and max prices
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @param {string} specificDate - Specific date (YYYY-MM-DD)
   * @returns {Promise<Array>} - Array of court IDs
   */
  async getCourtsWithinPriceRange(minPrice, maxPrice, specificDate = null) {
    try {
      let query;
      let params = [];

      if (specificDate) {
        // Get the day of week for the specific date
        const date = new Date(specificDate);
        const dayOfWeek = date.getDay();

        // First try with specific date
        query = `
          WITH court_prices AS (
            SELECT DISTINCT court_id,
                   FIRST_VALUE(price) OVER (PARTITION BY court_id ORDER BY price) as min_price,
                   FIRST_VALUE(price) OVER (PARTITION BY court_id ORDER BY price DESC) as max_price
            FROM court_timeslots
            WHERE specific_date = $1 AND is_available = true
          )
          SELECT court_id
          FROM court_prices
          WHERE
            (min_price <= $2 AND max_price >= $3) OR
            (min_price BETWEEN $3 AND $2) OR
            (max_price BETWEEN $3 AND $2)
        `;
        params = [specificDate, maxPrice, minPrice];

        const specificResult = await db.query(query, params);

        // If we have results, return them
        if (specificResult.rows.length > 0) {
          return specificResult.rows.map(row => row.court_id);
        }

        // Otherwise, fall back to day of week
        query = `
          WITH court_prices AS (
            SELECT DISTINCT court_id,
                   FIRST_VALUE(price) OVER (PARTITION BY court_id ORDER BY price) as min_price,
                   FIRST_VALUE(price) OVER (PARTITION BY court_id ORDER BY price DESC) as max_price
            FROM court_timeslots
            WHERE day_of_week = $1 AND is_available = true
          )
          SELECT court_id
          FROM court_prices
          WHERE
            (min_price <= $2 AND max_price >= $3) OR
            (min_price BETWEEN $3 AND $2) OR
            (max_price BETWEEN $3 AND $2)
        `;
        params = [dayOfWeek, maxPrice, minPrice];
      } else {
        // If no specific date, check across all timeslots
        query = `
          WITH court_prices AS (
            SELECT DISTINCT court_id,
                   FIRST_VALUE(price) OVER (PARTITION BY court_id ORDER BY price) as min_price,
                   FIRST_VALUE(price) OVER (PARTITION BY court_id ORDER BY price DESC) as max_price
            FROM court_timeslots
            WHERE is_available = true
          )
          SELECT court_id
          FROM court_prices
          WHERE
            (min_price <= $1 AND max_price >= $2) OR
            (min_price BETWEEN $2 AND $1) OR
            (max_price BETWEEN $2 AND $1)
        `;
        params = [maxPrice, minPrice];
      }

      const result = await db.query(query, params);
      return result.rows.map(row => row.court_id);
    } catch (error) {
      console.error('Error getting courts within price range:', error);
      throw error;
    }
  }
};

module.exports = CourtTimeslot;

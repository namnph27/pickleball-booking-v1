const db = require('../config/db.config');

const Court = {
  // Create a new court
  async create(courtData) {
    const {
      name,
      description,
      location,
      hourly_rate,
      owner_id,
      skill_level,
      image_url,
      is_available = true
    } = courtData;

    const query = `
      INSERT INTO courts (
        name,
        description,
        location,
        hourly_rate,
        owner_id,
        skill_level,
        image_url,
        is_available,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      name,
      description,
      location,
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
    const query = `
      SELECT c.*, u.name as owner_name
      FROM courts c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = $1
    `;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Update court
  async update(id, courtData) {
    const {
      name,
      description,
      location,
      hourly_rate,
      skill_level,
      image_url,
      is_available
    } = courtData;

    const query = `
      UPDATE courts
      SET
        name = $1,
        description = $2,
        location = $3,
        hourly_rate = $4,
        skill_level = $5,
        image_url = $6,
        is_available = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const values = [
      name,
      description,
      location,
      hourly_rate,
      skill_level,
      image_url,
      is_available,
      id
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
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
      SELECT c.*, u.name as owner_name
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
      SELECT c.*, u.name as owner_name
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
      SELECT c.*, u.name as owner_name
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
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT c.*, u.name as owner_name
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
      query += ` AND c.location ILIKE $${valueIndex}`;
      values.push(`%${location}%`);
      valueIndex++;
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

    query += ` ORDER BY c.created_at DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limit, offset);

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
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

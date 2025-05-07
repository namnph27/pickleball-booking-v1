const db = require('../config/db.config');

const Promotion = {
  // Create a new promotion
  async create(promotionData) {
    const {
      code,
      description,
      discount_percent,
      start_date,
      end_date,
      is_active = true
    } = promotionData;

    const query = `
      INSERT INTO promotions (
        code,
        description,
        discount_percent,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      code,
      description,
      discount_percent,
      start_date,
      end_date,
      is_active
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find promotion by ID
  async findById(id) {
    const query = 'SELECT * FROM promotions WHERE id = $1';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find promotion by code
  async findByCode(code) {
    const query = 'SELECT * FROM promotions WHERE code = $1';

    try {
      const result = await db.query(query, [code]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Update promotion
  async update(id, promotionData) {
    const {
      description,
      discount_percent,
      start_date,
      end_date,
      is_active
    } = promotionData;

    // Build the query dynamically based on provided fields
    let updateFields = [];
    let values = [];
    let valueIndex = 1;

    if (description !== undefined) {
      updateFields.push(`description = $${valueIndex}`);
      values.push(description);
      valueIndex++;
    }

    if (discount_percent !== undefined) {
      updateFields.push(`discount_percent = $${valueIndex}`);
      values.push(discount_percent);
      valueIndex++;
    }

    if (start_date !== undefined) {
      updateFields.push(`start_date = $${valueIndex}`);
      values.push(start_date);
      valueIndex++;
    }

    if (end_date !== undefined) {
      updateFields.push(`end_date = $${valueIndex}`);
      values.push(end_date);
      valueIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${valueIndex}`);
      values.push(is_active);
      valueIndex++;
    }

    updateFields.push(`updated_at = NOW()`);

    // If no fields to update, return the existing promotion
    if (values.length === 0) {
      return this.findById(id);
    }

    // Add the ID as the last parameter
    values.push(id);

    const query = `
      UPDATE promotions
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

  // Delete promotion
  async delete(id) {
    const query = 'DELETE FROM promotions WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get all promotions
  async getAll() {
    const query = 'SELECT * FROM promotions ORDER BY created_at DESC';

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get active promotions
  async getActive() {
    const query = `
      SELECT * FROM promotions
      WHERE is_active = true AND end_date >= NOW()
      ORDER BY created_at DESC
    `;

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get expired promotions
  async getExpired() {
    const query = `
      SELECT * FROM promotions
      WHERE end_date < NOW()
      ORDER BY created_at DESC
    `;

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get upcoming promotions
  async getUpcoming() {
    const query = `
      SELECT * FROM promotions
      WHERE start_date > NOW()
      ORDER BY start_date ASC
    `;

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get active promotions for a specific user
  async getActiveByUserId(userId) {
    const query = `
      SELECT * FROM promotions
      WHERE is_active = true
      AND end_date >= NOW()
      AND (
        user_specific = false
        OR (user_specific = true AND specific_user_id = $1)
      )
      ORDER BY created_at DESC
    `;

    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get expiring promotions within a date range
  async getExpiringPromotions(startDate, endDate) {
    const query = `
      SELECT * FROM promotions
      WHERE is_active = true
      AND end_date BETWEEN $1 AND $2
      ORDER BY end_date ASC
    `;

    try {
      const result = await db.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get promotions by type (based on code prefix)
  async getByType(prefix) {
    const query = `
      SELECT * FROM promotions
      WHERE code LIKE $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await db.query(query, [prefix + '%']);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get most used promotions
  async getMostUsed(limit = 10) {
    const query = `
      SELECT p.*, COUNT(pu.id) as usage_count
      FROM promotions p
      JOIN promotion_usages pu ON p.id = pu.promotion_id
      GROUP BY p.id
      ORDER BY usage_count DESC
      LIMIT $1
    `;

    try {
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get promotions with highest discount amount
  async getHighestDiscount(limit = 10) {
    const query = `
      SELECT p.*, SUM(pu.discount_amount) as total_discount
      FROM promotions p
      JOIN promotion_usages pu ON p.id = pu.promotion_id
      GROUP BY p.id
      ORDER BY total_discount DESC
      LIMIT $1
    `;

    try {
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Promotion;

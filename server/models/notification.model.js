const db = require('../config/db.config');

const Notification = {
  // Create a new notification
  async create(notificationData) {
    const {
      user_id,
      title,
      message,
      type = null,
      related_id = null,
      related_type = null,
      is_system = false
    } = notificationData;

    const query = `
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        related_id,
        related_type,
        is_system,
        is_read,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
      RETURNING *
    `;

    const values = [
      user_id,
      title,
      message,
      type,
      related_id,
      related_type,
      is_system
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find notification by ID
  async findById(id) {
    const query = 'SELECT * FROM notifications WHERE id = $1';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Update notification (mark as read)
  async markAsRead(id) {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
      RETURNING *
    `;

    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Delete notification
  async delete(id) {
    const query = 'DELETE FROM notifications WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get all notifications for a user
  async getByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await db.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get unread notifications for a user
  async getUnreadByUserId(userId) {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1 AND is_read = false
      ORDER BY created_at DESC
    `;

    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get unread count for a user
  async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;

    try {
      const result = await db.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  },

  // Get notifications by type
  async getByType(type, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM notifications
      WHERE type = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await db.query(query, [type, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Create system notification (sent to all users)
  async createSystemNotification(title, message, type = null, related_id = null, related_type = null) {
    const query = `
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        related_id,
        related_type,
        is_system,
        is_read,
        created_at
      )
      SELECT
        id,
        $1,
        $2,
        $3,
        $4,
        $5,
        true,
        false,
        NOW()
      FROM users
      RETURNING *
    `;

    const values = [
      title,
      message,
      type,
      related_id,
      related_type
    ];

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get notifications with filters
   * @param {Object} filters - Filters
   * @param {number} filters.user_id - User ID
   * @param {string} filters.type - Notification type
   * @param {boolean} filters.is_read - Is read
   * @param {boolean} filters.is_system - Is system notification
   * @param {string} filters.start_date - Start date (ISO string)
   * @param {string} filters.end_date - End date (ISO string)
   * @param {number} filters.limit - Limit
   * @param {number} filters.offset - Offset
   * @returns {Promise<Array>} - Array of notification objects
   */
  async getByFilters(filters) {
    const {
      user_id,
      type,
      is_read,
      is_system,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT n.*, u.name as user_name
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let valueIndex = 1;

    if (user_id) {
      query += ` AND n.user_id = $${valueIndex}`;
      values.push(user_id);
      valueIndex++;
    }

    if (type) {
      query += ` AND n.type = $${valueIndex}`;
      values.push(type);
      valueIndex++;
    }

    if (is_read !== undefined) {
      query += ` AND n.is_read = $${valueIndex}`;
      values.push(is_read);
      valueIndex++;
    }

    if (is_system !== undefined) {
      query += ` AND n.is_system = $${valueIndex}`;
      values.push(is_system);
      valueIndex++;
    }

    if (start_date) {
      query += ` AND n.created_at >= $${valueIndex}`;
      values.push(start_date);
      valueIndex++;
    }

    if (end_date) {
      query += ` AND n.created_at <= $${valueIndex}`;
      values.push(end_date);
      valueIndex++;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limit, offset);

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get total notification count
   * @returns {Promise<number>} - Total notification count
   */
  async getCount() {
    const query = `SELECT COUNT(*) as count FROM notifications`;

    try {
      const result = await db.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get notification count by is_read
   * @param {boolean} isRead - Is read
   * @returns {Promise<number>} - Notification count
   */
  async getCountByIsRead(isRead) {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE is_read = $1
    `;

    try {
      const result = await db.query(query, [isRead]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get notification count by is_system
   * @param {boolean} isSystem - Is system notification
   * @returns {Promise<number>} - Notification count
   */
  async getCountByIsSystem(isSystem) {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE is_system = $1
    `;

    try {
      const result = await db.query(query, [isSystem]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get notification count by type
   * @returns {Promise<Array>} - Array of notification counts by type
   */
  async getCountByType() {
    const query = `
      SELECT type, COUNT(*) as count
      FROM notifications
      WHERE type IS NOT NULL
      GROUP BY type
      ORDER BY count DESC
    `;

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get recent notifications
   * @param {number} limit - Limit
   * @returns {Promise<Array>} - Array of notification objects
   */
  async getRecent(limit = 10) {
    const query = `
      SELECT n.*, u.name as user_name
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
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

module.exports = Notification;

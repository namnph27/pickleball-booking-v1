const db = require('../config/db.config');

const AdminLog = {
  // Create a new admin log
  async create(logData) {
    const {
      admin_id,
      action_type,
      entity_type,
      entity_id,
      details = {}
    } = logData;

    try {
      // First check if the admin_logs table exists
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'admin_logs'
        )
      `;

      const tableCheckResult = await db.query(tableCheckQuery);
      const tableExists = tableCheckResult.rows[0].exists;

      if (!tableExists) {
        console.error('admin_logs table does not exist, creating it...');

        // Create the admin_logs table if it doesn't exist
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS admin_logs (
            id SERIAL PRIMARY KEY,
            admin_id INTEGER NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INTEGER,
            details JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW()
          )
        `;

        await db.query(createTableQuery);
        console.log('admin_logs table created successfully');
      }

      const query = `
        INSERT INTO admin_logs (
          admin_id,
          action_type,
          entity_type,
          entity_id,
          details,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const values = [
        admin_id,
        action_type,
        entity_type,
        entity_id,
        details
      ];

      console.log('Creating admin log with data:', {
        admin_id, action_type, entity_type, entity_id
      });

      const result = await db.query(query, values);
      console.log('Admin log created successfully');
      return result.rows[0];
    } catch (error) {
      console.error('Error creating admin log:', error);
      console.error('Error stack:', error.stack);

      // Don't throw the error, just return null
      // This prevents admin log errors from breaking the main functionality
      return null;
    }
  },

  // Get logs by admin ID
  async getByAdminId(adminId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM admin_logs
      WHERE admin_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await db.query(query, [adminId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get logs by action type
  async getByActionType(actionType, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM admin_logs
      WHERE action_type = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await db.query(query, [actionType, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get logs by entity
  async getByEntity(entityType, entityId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM admin_logs
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;

    try {
      const result = await db.query(query, [entityType, entityId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get recent logs
  async getRecent(limit = 50) {
    const query = `
      SELECT al.*, a.username as admin_username
      FROM admin_logs al
      JOIN admins a ON al.admin_id = a.id
      ORDER BY al.created_at DESC
      LIMIT $1
    `;

    try {
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get logs with filters
  async getByFilters(filters) {
    const {
      admin_id,
      action_type,
      entity_type,
      entity_id,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT al.*, a.username as admin_username
      FROM admin_logs al
      JOIN admins a ON al.admin_id = a.id
      WHERE 1=1
    `;

    const values = [];
    let valueIndex = 1;

    if (admin_id) {
      query += ` AND al.admin_id = $${valueIndex}`;
      values.push(admin_id);
      valueIndex++;
    }

    if (action_type) {
      query += ` AND al.action_type = $${valueIndex}`;
      values.push(action_type);
      valueIndex++;
    }

    if (entity_type) {
      query += ` AND al.entity_type = $${valueIndex}`;
      values.push(entity_type);
      valueIndex++;
    }

    if (entity_id) {
      query += ` AND al.entity_id = $${valueIndex}`;
      values.push(entity_id);
      valueIndex++;
    }

    if (start_date) {
      query += ` AND al.created_at >= $${valueIndex}`;
      values.push(start_date);
      valueIndex++;
    }

    if (end_date) {
      query += ` AND al.created_at <= $${valueIndex}`;
      values.push(end_date);
      valueIndex++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limit, offset);

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = AdminLog;

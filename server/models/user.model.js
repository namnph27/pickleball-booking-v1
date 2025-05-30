const db = require('../config/db.config');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const User = {
  // Create a new user
  async create(userData) {
    const { name, email, password, phone, role = 'customer', id_card, tax_code, approval_status } = userData;

    console.log('Creating user with data:', { name, email, phone, role, id_card, tax_code, approval_status });

    // Validate required fields
    if (!name || !email || !password) {
      console.error('Missing required fields for user creation');
      throw new Error('Name, email, and password are required');
    }

    try {
      // First, check the structure of the users table to determine available columns
      const tableInfoQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
      `;

      console.log('Checking users table structure with query:', tableInfoQuery);
      const tableInfoResult = await db.query(tableInfoQuery);
      const availableColumns = tableInfoResult.rows.map(row => row.column_name);

      console.log('Available columns in users table:', availableColumns);

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Build dynamic query based on available columns
      let columns = ['name', 'email', 'password', 'role', 'created_at', 'updated_at'];
      let placeholders = ['$1', '$2', '$3', '$4', 'NOW()', 'NOW()'];
      let values = [name, email, hashedPassword, role];
      let returningColumns = ['id', 'name', 'email', 'role', 'created_at'];
      let paramIndex = 5;

      // Add phone if provided
      if (phone) {
        columns.push('phone');
        placeholders.push(`$${paramIndex}`);
        values.push(phone);
        returningColumns.push('phone');
        paramIndex++;
      }

      // Add is_active if the column exists
      if (availableColumns.includes('is_active')) {
        columns.push('is_active');
        placeholders.push('TRUE');
        returningColumns.push('is_active');
      }

      // Add court owner specific fields if applicable
      if (role === 'court_owner' && id_card && tax_code) {
        // Add id_card if the column exists
        if (availableColumns.includes('id_card')) {
          columns.push('id_card');
          placeholders.push(`$${paramIndex}`);
          values.push(id_card);
          returningColumns.push('id_card');
          paramIndex++;
        }

        // Add tax_code if the column exists
        if (availableColumns.includes('tax_code')) {
          columns.push('tax_code');
          placeholders.push(`$${paramIndex}`);
          values.push(tax_code);
          returningColumns.push('tax_code');
          paramIndex++;
        }

        // Add approval_status if the column exists
        if (availableColumns.includes('approval_status')) {
          const approvalStatusValue = approval_status || 'pending';
          columns.push('approval_status');
          placeholders.push(`$${paramIndex}`);
          values.push(approvalStatusValue);
          returningColumns.push('approval_status');
          paramIndex++;
        }
      }

      // Build the final query
      const query = `
        INSERT INTO users (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING ${returningColumns.join(', ')}
      `;

      console.log('Executing dynamic SQL query to create user:', query);
      console.log('With values:', values.map((v, i) => i === 2 ? '[HASHED_PASSWORD]' : v)); // Don't log the hashed password

      const result = await db.query(query, values);
      console.log('User created successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error stack:', error.stack);

      // Check for specific database errors
      if (error.code === '23505') { // Unique violation
        console.error('Duplicate key violation - email already exists');
        throw new Error('Email already in use');
      } else if (error.code === '42P01') { // Undefined table
        console.error('Table "users" does not exist');
        throw new Error('Database schema issue: users table does not exist');
      } else if (error.code === '42703') { // Undefined column
        console.error('Column does not exist in users table');
        throw new Error('Database schema issue: column does not exist in users table');
      }

      throw error;
    }
  },

  // Find user by email
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';

    try {
      const result = await db.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find user by ID
  async findById(id) {
    console.log('User.findById: Finding user with ID:', id);
    const query = 'SELECT * FROM users WHERE id = $1';
    console.log('User.findById: Executing query:', query);

    try {
      const result = await db.query(query, [id]);
      console.log(`User.findById: Query result rows: ${result.rows.length}`);

      if (result.rows.length === 0) {
        console.log('User.findById: No user found with ID:', id);
        return null;
      }

      console.log('User.findById: User found:', result.rows[0].id, result.rows[0].email, result.rows[0].role);
      return result.rows[0];
    } catch (error) {
      console.error('User.findById: Error finding user:', error);
      console.error('User.findById: Error stack:', error.stack);
      throw error;
    }
  },

  // Update user
  async update(id, userData) {
    const { name, email, phone, role, id_card, tax_code, approval_status } = userData;

    // Build dynamic update query
    let updateFields = [];
    let values = [];
    let valueIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${valueIndex}`);
      values.push(name);
      valueIndex++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${valueIndex}`);
      values.push(email);
      valueIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${valueIndex}`);
      values.push(phone);
      valueIndex++;
    }

    if (role !== undefined) {
      updateFields.push(`role = $${valueIndex}`);
      values.push(role);
      valueIndex++;
    }

    if (id_card !== undefined) {
      updateFields.push(`id_card = $${valueIndex}`);
      values.push(id_card);
      valueIndex++;
    }

    if (tax_code !== undefined) {
      updateFields.push(`tax_code = $${valueIndex}`);
      values.push(tax_code);
      valueIndex++;
    }

    if (approval_status !== undefined) {
      updateFields.push(`approval_status = $${valueIndex}`);
      values.push(approval_status);
      valueIndex++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    // If no fields to update, return the existing user
    if (values.length === 0) {
      return this.findById(id);
    }

    // Add the ID as the last parameter
    values.push(id);

    const query = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id, name, email, phone, role, id_card, tax_code, approval_status, created_at, updated_at
    `;

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Delete user
  async delete(id) {
    // Sử dụng transaction để đảm bảo tính nhất quán
    const client = await db.pool.connect();
    console.log(`Starting transaction to delete user with ID: ${id}`);

    try {
      await client.query('BEGIN');

      // Kiểm tra xem người dùng có tồn tại không
      const checkUserQuery = 'SELECT role FROM users WHERE id = $1';
      console.log('Checking if user exists with query:', checkUserQuery);
      const userResult = await client.query(checkUserQuery, [id]);

      if (userResult.rows.length === 0) {
        console.log(`User with ID ${id} not found, rolling back transaction`);
        await client.query('ROLLBACK');
        return null;
      }

      const userRole = userResult.rows[0].role;
      console.log(`User with ID ${id} has role: ${userRole}`);

      // Nếu là chủ sân, xóa các bản ghi liên quan trước
      if (userRole === 'court_owner') {
        console.log(`Deleting court owner (ID: ${id}) with cascading delete...`);

        try {
          // Xóa các bản ghi trong booking_players liên quan đến các booking của sân thuộc chủ sân
          const deleteBookingPlayersQuery = `
            DELETE FROM booking_players
            WHERE booking_id IN (
              SELECT b.id FROM bookings b
              JOIN courts c ON b.court_id = c.id
              WHERE c.owner_id = $1
            )
          `;
          console.log('Deleting related booking_players with query:', deleteBookingPlayersQuery);
          await client.query(deleteBookingPlayersQuery, [id]);
          console.log('Successfully deleted related booking_players');

          // Xóa các bản ghi trong booking_join_requests liên quan đến các booking của sân thuộc chủ sân
          const deleteJoinRequestsQuery = `
            DELETE FROM booking_join_requests
            WHERE booking_id IN (
              SELECT b.id FROM bookings b
              JOIN courts c ON b.court_id = c.id
              WHERE c.owner_id = $1
            )
          `;
          console.log('Deleting related booking_join_requests with query:', deleteJoinRequestsQuery);
          await client.query(deleteJoinRequestsQuery, [id]);
          console.log('Successfully deleted related booking_join_requests');
        } catch (err) {
          console.error('Error during cascading delete operations:', err);
          console.error('Error stack:', err.stack);
          throw err; // Re-throw to be caught by the outer catch block
        }
      }

      // Xóa người dùng (các bảng khác sẽ được xóa theo CASCADE)
      const deleteUserQuery = 'DELETE FROM users WHERE id = $1 RETURNING *';
      console.log('Deleting user with query:', deleteUserQuery);
      const result = await client.query(deleteUserQuery, [id]);
      console.log(`User with ID ${id} deleted successfully`);

      await client.query('COMMIT');
      console.log('Transaction committed successfully');
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting user:', error);
      console.error('Error stack:', error.stack);

      try {
        console.log('Rolling back transaction due to error');
        await client.query('ROLLBACK');
        console.log('Transaction rolled back successfully');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }

      throw error;
    } finally {
      try {
        console.log('Releasing database client');
        client.release();
        console.log('Database client released successfully');
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  },

  // Get all users
  async getAll() {
    const query = 'SELECT id, name, email, phone, role, created_at, updated_at FROM users';

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Update password
  async updatePassword(id, newPassword) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const query = `
      UPDATE users
      SET password = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;

    try {
      const result = await db.query(query, [hashedPassword, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Update 2FA secret
  async update2FASecret(id, secret) {
    const query = `
      UPDATE users
      SET twofa_secret = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;

    try {
      const result = await db.query(query, [secret, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Enable 2FA
  async enable2FA(id) {
    const query = `
      UPDATE users
      SET twofa_enabled = true, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Disable 2FA
  async disable2FA(id) {
    const query = `
      UPDATE users
      SET twofa_enabled = false, twofa_secret = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get users by role
  async getByRole(role) {
    const query = 'SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE role = $1';

    try {
      const result = await db.query(query, [role]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Update reward points
  async updateRewardPoints(id, points) {
    const query = `
      UPDATE users
      SET reward_points = reward_points + $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, reward_points
    `;

    try {
      const result = await db.query(query, [points, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Get reward points
  async getRewardPoints(id) {
    const query = 'SELECT reward_points FROM users WHERE id = $1';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0]?.reward_points || 0;
    } catch (error) {
      throw error;
    }
  },

  // Get users with birthdays on a specific day
  async getUsersByBirthday(month, day) {
    // Note: This assumes there's a birth_date column in the users table
    // If not, you'll need to add it with an ALTER TABLE statement
    const query = `
      SELECT * FROM users
      WHERE EXTRACT(MONTH FROM birth_date) = $1
      AND EXTRACT(DAY FROM birth_date) = $2
    `;

    try {
      const result = await db.query(query, [month, day]);
      return result.rows;
    } catch (error) {
      // If the birth_date column doesn't exist, return an empty array
      console.error('Error getting users by birthday:', error);
      return [];
    }
  },

  // Get users with expiring points
  async getUsersWithExpiringPoints(startDate, endDate) {
    // Note: This assumes there's a points_expiry system
    // If points don't expire, this method will return an empty array
    const query = `
      SELECT u.id, u.name, u.email, pe.points as expiring_points, pe.expiry_date
      FROM users u
      JOIN points_expiry pe ON u.id = pe.user_id
      WHERE pe.expiry_date BETWEEN $1 AND $2
      AND pe.points > 0
      ORDER BY pe.expiry_date ASC
    `;

    try {
      const result = await db.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      // If the points_expiry table doesn't exist, return an empty array
      console.error('Error getting users with expiring points:', error);
      return [];
    }
  },

  // Get top users by reward points
  async getTopUsersByPoints(limit = 10) {
    const query = `
      SELECT id, name, email, reward_points
      FROM users
      ORDER BY reward_points DESC
      LIMIT $1
    `;

    try {
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get users who haven't booked in a while
  async getInactiveUsers(daysInactive = 30) {
    const query = `
      SELECT u.id, u.name, u.email, u.reward_points, MAX(b.created_at) as last_booking_date
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      GROUP BY u.id
      HAVING MAX(b.created_at) < NOW() - INTERVAL '${daysInactive} days'
      OR MAX(b.created_at) IS NULL
      ORDER BY last_booking_date ASC NULLS FIRST
    `;

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Update user's birth date
  async updateBirthDate(id, birthDate) {
    // Note: This assumes there's a birth_date column in the users table
    // If not, you'll need to add it with an ALTER TABLE statement
    const query = `
      UPDATE users
      SET birth_date = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;

    try {
      const result = await db.query(query, [birthDate, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating birth date:', error);
      return null;
    }
  },

  /**
   * Get recent users
   * @param {number} limit - Limit
   * @returns {Promise<Array>} - Array of user objects
   */
  async getRecent(limit = 10) {
    const query = `
      SELECT id, name, email, phone, role, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
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
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<Array>} - Array of user objects
   */
  async getByRole(role) {
    const query = `
      SELECT id, name, email, phone, role, created_at, updated_at
      FROM users
      WHERE role = $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await db.query(query, [role]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get users with filters
   * @param {Object} filters - Filters
   * @param {string} filters.name - User name
   * @param {string} filters.email - User email
   * @param {string} filters.role - User role
   * @param {number} filters.limit - Limit
   * @param {number} filters.offset - Offset
   * @returns {Promise<Array>} - Array of user objects
   */
  async getByFilters(filters) {
    const {
      name,
      email,
      role,
      limit = 50,
      offset = 0
    } = filters;

    try {
      // Kiểm tra xem các cột cần thiết có tồn tại không
      const checkColumnsQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name IN ('is_active', 'is_verified')
      `;

      const columnsResult = await db.query(checkColumnsQuery);
      const existingColumns = columnsResult.rows.map(row => row.column_name);

      console.log('Existing columns:', existingColumns);

      // Xây dựng câu truy vấn SELECT dựa trên các cột tồn tại
      let selectClause = 'id, name, email, phone, role, created_at, updated_at';

      if (existingColumns.includes('is_active')) {
        selectClause += ', is_active';
      } else {
        selectClause += ', TRUE as is_active'; // Mặc định là active nếu cột không tồn tại
      }

      if (existingColumns.includes('is_verified')) {
        selectClause += ', is_verified';
      } else {
        selectClause += ', FALSE as is_verified'; // Mặc định là chưa xác minh nếu cột không tồn tại
      }

      let query = `
        SELECT ${selectClause}
        FROM users
        WHERE 1=1
      `;

      const values = [];
      let valueIndex = 1;

      if (name) {
        query += ` AND name ILIKE $${valueIndex}`;
        values.push(`%${name}%`);
        valueIndex++;
      }

      if (email) {
        query += ` AND email ILIKE $${valueIndex}`;
        values.push(`%${email}%`);
        valueIndex++;
      }

      if (role) {
        query += ` AND role = $${valueIndex}`;
        values.push(role);
        valueIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
      values.push(limit, offset);

      console.log('Executing query:', query);
      console.log('With values:', values);

      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error in getByFilters:', error);
      throw error;
    }
  },

  /**
   * Update user status (active/inactive)
   * @param {number} id - User ID
   * @param {boolean} isActive - Is active
   * @returns {Promise<Object>} - Updated user
   */
  async updateStatus(id, isActive) {
    const query = `
      UPDATE users
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, email, phone, role, is_active, created_at, updated_at
    `;

    try {
      const result = await db.query(query, [isActive, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify court owner
   * @param {number} id - User ID
   * @param {boolean} isVerified - Is verified
   * @returns {Promise<Object>} - Updated user
   */
  async verifyCourtOwner(id, isVerified) {
    const query = `
      UPDATE users
      SET is_verified = $1, updated_at = NOW()
      WHERE id = $2 AND role = 'court_owner'
      RETURNING id, name, email, phone, role, is_verified, created_at, updated_at
    `;

    try {
      const result = await db.query(query, [isVerified, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user statistics
   * @returns {Promise<Object>} - User statistics
   */
  async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
        COUNT(CASE WHEN role = 'court_owner' THEN 1 END) as court_owners,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30_days,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7_days,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as new_users_today
      FROM users
    `;

    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user notes
   * @param {number} id - User ID
   * @param {string} adminNotes - Admin notes
   * @returns {Promise<Object>} - Updated user
   */
  async updateNotes(id, adminNotes) {
    const query = `
      UPDATE users
      SET admin_notes = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, email, phone, role, admin_notes, created_at, updated_at
    `;

    try {
      const result = await db.query(query, [adminNotes, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update court owner approval status
   * @param {number} id - User ID
   * @param {string} approvalStatus - Approval status ('pending', 'approved', 'rejected')
   * @param {string} adminNotes - Optional admin notes about the approval decision
   * @returns {Promise<Object>} - Updated user
   */
  async updateApprovalStatus(id, approvalStatus, adminNotes = null) {
    let query, values;

    if (adminNotes) {
      query = `
        UPDATE users
        SET approval_status = $1, admin_notes = $2, updated_at = NOW()
        WHERE id = $3 AND role = 'court_owner'
        RETURNING id, name, email, phone, role, approval_status, admin_notes, created_at, updated_at
      `;
      values = [approvalStatus, adminNotes, id];
    } else {
      query = `
        UPDATE users
        SET approval_status = $1, updated_at = NOW()
        WHERE id = $2 AND role = 'court_owner'
        RETURNING id, name, email, phone, role, approval_status, admin_notes, created_at, updated_at
      `;
      values = [approvalStatus, id];
    }

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get court owners by approval status
   * @param {string} approvalStatus - Approval status ('pending', 'approved', 'rejected')
   * @returns {Promise<Array>} - Array of court owner objects
   */
  async getCourtOwnersByApprovalStatus(approvalStatus) {
    console.log(`Executing getCourtOwnersByApprovalStatus with status: ${approvalStatus}`);

    try {
      // Kiểm tra xem cột approval_status có tồn tại không
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'approval_status'
      `;

      const columnCheck = await db.query(checkColumnQuery);
      console.log('Column check result:', columnCheck.rows);

      if (columnCheck.rows.length === 0) {
        console.error('approval_status column does not exist in users table');
        // Trả về mảng rỗng nếu cột không tồn tại
        return [];
      }

      // Kiểm tra xem có chủ sân nào không
      const countQuery = `
        SELECT COUNT(*) as count
        FROM users
        WHERE role = 'court_owner'
      `;

      const countResult = await db.query(countQuery);
      console.log('Total court owners:', countResult.rows[0].count);

      // Truy vấn chính
      const query = `
        SELECT id, name, email, phone, role, id_card, tax_code, approval_status, admin_notes, created_at, updated_at
        FROM users
        WHERE role = 'court_owner' AND approval_status = $1
        ORDER BY created_at DESC
      `;

      const result = await db.query(query, [approvalStatus]);
      console.log(`Found ${result.rows.length} court owners with status ${approvalStatus}`);
      return result.rows;
    } catch (error) {
      console.error('Error in getCourtOwnersByApprovalStatus:', error);
      throw error;
    }
  },

  /**
   * Create password reset token
   * @param {string} email - User email
   * @returns {Promise<Object>} - Object containing reset token and user
   */
  async createPasswordResetToken(email) {
    try {
      // Find user by email
      const user = await this.findByEmail(email);
      if (!user) {
        return null;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Hash token
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Set token expiry (1 hour from now)
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 1);

      // Save token to database
      const query = `
        UPDATE users
        SET reset_password_token = $1, reset_password_expires = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id
      `;

      await db.query(query, [hashedToken, tokenExpiry, user.id]);

      return {
        resetToken,
        user
      };
    } catch (error) {
      console.error('Error creating password reset token:', error);
      throw error;
    }
  },

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object|null>} - User object if token is valid, null otherwise
   */
  async verifyPasswordResetToken(token) {
    try {
      // Hash token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid token
      const query = `
        SELECT *
        FROM users
        WHERE reset_password_token = $1
        AND reset_password_expires > NOW()
      `;

      const result = await db.query(query, [hashedToken]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error verifying password reset token:', error);
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object|null>} - User object if password was reset, null otherwise
   */
  async resetPasswordWithToken(token, newPassword) {
    try {
      // Verify token
      const user = await this.verifyPasswordResetToken(token);

      if (!user) {
        return null;
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token
      const query = `
        UPDATE users
        SET password = $1, reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email
      `;

      const result = await db.query(query, [hashedPassword, user.id]);

      return result.rows[0];
    } catch (error) {
      console.error('Error resetting password with token:', error);
      throw error;
    }
  }
};

module.exports = User;

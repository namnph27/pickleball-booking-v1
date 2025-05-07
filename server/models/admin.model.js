const db = require('../config/db.config');
const bcrypt = require('bcrypt');

const Admin = {
  // Create a new admin
  async create(adminData) {
    const { username, password, email, full_name, is_super_admin = false } = adminData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const query = `
      INSERT INTO admins (username, password, email, full_name, is_super_admin, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, username, email, full_name, is_super_admin, created_at
    `;
    
    const values = [username, hashedPassword, email, full_name, is_super_admin];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Find admin by username
  async findByUsername(username) {
    const query = 'SELECT * FROM admins WHERE username = $1';
    
    try {
      const result = await db.query(query, [username]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Find admin by email
  async findByEmail(email) {
    const query = 'SELECT * FROM admins WHERE email = $1';
    
    try {
      const result = await db.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Find admin by ID
  async findById(id) {
    const query = 'SELECT id, username, email, full_name, is_super_admin, last_login, created_at, updated_at FROM admins WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Update admin
  async update(id, adminData) {
    const { username, email, full_name } = adminData;
    
    const query = `
      UPDATE admins
      SET username = $1, email = $2, full_name = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, username, email, full_name, is_super_admin, created_at, updated_at
    `;
    
    const values = [username, email, full_name, id];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Update admin password
  async updatePassword(id, password) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const query = `
      UPDATE admins
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
  
  // Update last login
  async updateLastLogin(id) {
    const query = `
      UPDATE admins
      SET last_login = NOW()
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
  
  // Delete admin
  async delete(id) {
    const query = 'DELETE FROM admins WHERE id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Get all admins
  async getAll() {
    const query = 'SELECT id, username, email, full_name, is_super_admin, last_login, created_at, updated_at FROM admins';
    
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
  }
};

module.exports = Admin;

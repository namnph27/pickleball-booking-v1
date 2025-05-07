const db = require('../config/db.config');

const RewardHistory = {
  // Create a new reward history entry
  async create(historyData) {
    const { 
      user_id, 
      points, 
      description, 
      type 
    } = historyData;
    
    const query = `
      INSERT INTO reward_history (
        user_id, 
        points, 
        description, 
        type, 
        created_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    
    const values = [
      user_id, 
      points, 
      description, 
      type
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Find history entry by ID
  async findById(id) {
    const query = 'SELECT * FROM reward_history WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Get all history entries
  async getAll() {
    const query = 'SELECT * FROM reward_history ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get history entries by user ID
  async getByUserId(userId) {
    const query = 'SELECT * FROM reward_history WHERE user_id = $1 ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get history entries by type
  async getByType(type) {
    const query = 'SELECT * FROM reward_history WHERE type = $1 ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query, [type]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get history entries by date range
  async getByDateRange(startDate, endDate) {
    const query = `
      SELECT * FROM reward_history 
      WHERE created_at BETWEEN $1 AND $2
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get history entries by user ID and type
  async getByUserIdAndType(userId, type) {
    const query = `
      SELECT * FROM reward_history 
      WHERE user_id = $1 AND type = $2
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [userId, type]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get total points earned by user
  async getTotalPointsEarned(userId) {
    const query = `
      SELECT SUM(points) as total_points
      FROM reward_history
      WHERE user_id = $1 AND points > 0
    `;
    
    try {
      const result = await db.query(query, [userId]);
      return parseInt(result.rows[0]?.total_points || 0);
    } catch (error) {
      throw error;
    }
  },
  
  // Get total points redeemed by user
  async getTotalPointsRedeemed(userId) {
    const query = `
      SELECT SUM(ABS(points)) as total_points
      FROM reward_history
      WHERE user_id = $1 AND points < 0
    `;
    
    try {
      const result = await db.query(query, [userId]);
      return parseInt(result.rows[0]?.total_points || 0);
    } catch (error) {
      throw error;
    }
  }
};

module.exports = RewardHistory;

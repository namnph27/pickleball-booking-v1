const db = require('../config/db.config');

const PromotionUsage = {
  // Create a new promotion usage
  async create(usageData) {
    const { 
      promotion_id, 
      user_id, 
      booking_id, 
      discount_amount 
    } = usageData;
    
    const query = `
      INSERT INTO promotion_usages (
        promotion_id, 
        user_id, 
        booking_id, 
        discount_amount, 
        created_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    
    const values = [
      promotion_id, 
      user_id, 
      booking_id, 
      discount_amount
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Find usage by ID
  async findById(id) {
    const query = 'SELECT * FROM promotion_usages WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Get usages by promotion ID
  async getByPromotionId(promotionId) {
    const query = 'SELECT * FROM promotion_usages WHERE promotion_id = $1 ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query, [promotionId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get usages by user ID
  async getByUserId(userId) {
    const query = 'SELECT * FROM promotion_usages WHERE user_id = $1 ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get usages by booking ID
  async getByBookingId(bookingId) {
    const query = 'SELECT * FROM promotion_usages WHERE booking_id = $1';
    
    try {
      const result = await db.query(query, [bookingId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Check if user has used a promotion
  async hasUserUsedPromotion(userId, promotionId) {
    const query = 'SELECT COUNT(*) as count FROM promotion_usages WHERE user_id = $1 AND promotion_id = $2';
    
    try {
      const result = await db.query(query, [userId, promotionId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  },
  
  // Get usage count for a promotion
  async getUsageCount(promotionId) {
    const query = 'SELECT COUNT(*) as count FROM promotion_usages WHERE promotion_id = $1';
    
    try {
      const result = await db.query(query, [promotionId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  },
  
  // Get total discount amount for a promotion
  async getTotalDiscountAmount(promotionId) {
    const query = 'SELECT SUM(discount_amount) as total FROM promotion_usages WHERE promotion_id = $1';
    
    try {
      const result = await db.query(query, [promotionId]);
      return parseFloat(result.rows[0].total || 0);
    } catch (error) {
      throw error;
    }
  },
  
  // Get usage statistics for a promotion
  async getUsageStatistics(promotionId) {
    const query = `
      SELECT 
        COUNT(*) as usage_count,
        SUM(discount_amount) as total_discount,
        COUNT(DISTINCT user_id) as unique_users
      FROM promotion_usages 
      WHERE promotion_id = $1
    `;
    
    try {
      const result = await db.query(query, [promotionId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = PromotionUsage;

const db = require('../config/db.config');

const PaymentLog = {
  /**
   * Create a new payment log entry
   * @param {number} paymentId - Payment ID
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created payment log
   */
  async create(paymentId, eventType, eventData = {}) {
    const query = `
      INSERT INTO payment_logs (payment_id, event_type, event_data, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [paymentId, eventType, eventData]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get payment logs by payment ID
   * @param {number} paymentId - Payment ID
   * @returns {Promise<Array>} Array of payment logs
   */
  async getByPaymentId(paymentId) {
    const query = `
      SELECT * FROM payment_logs
      WHERE payment_id = $1
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [paymentId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get payment logs by event type
   * @param {string} eventType - Event type
   * @returns {Promise<Array>} Array of payment logs
   */
  async getByEventType(eventType) {
    const query = `
      SELECT * FROM payment_logs
      WHERE event_type = $1
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query, [eventType]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get recent payment logs
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Array of payment logs
   */
  async getRecent(limit = 100) {
    const query = `
      SELECT pl.*, p.transaction_id, p.amount, p.payment_method, p.payment_gateway
      FROM payment_logs pl
      JOIN payments p ON pl.payment_id = p.id
      ORDER BY pl.created_at DESC
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

module.exports = PaymentLog;

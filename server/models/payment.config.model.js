const db = require('../config/db.config');

const PaymentConfig = {
  /**
   * Get all payment gateway configurations
   * @returns {Promise<Array>} Array of payment gateway configurations
   */
  async getAll() {
    const query = 'SELECT * FROM payment_configs ORDER BY gateway_name';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get payment gateway configuration by name
   * @param {string} gatewayName - Payment gateway name
   * @returns {Promise<Object>} Payment gateway configuration
   */
  async getByName(gatewayName) {
    const query = 'SELECT * FROM payment_configs WHERE gateway_name = $1';
    
    try {
      const result = await db.query(query, [gatewayName]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get all active payment gateway configurations
   * @returns {Promise<Array>} Array of active payment gateway configurations
   */
  async getActive() {
    const query = 'SELECT * FROM payment_configs WHERE is_active = true ORDER BY gateway_name';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update payment gateway configuration
   * @param {string} gatewayName - Payment gateway name
   * @param {Object} configData - Configuration data
   * @param {boolean} isActive - Is gateway active
   * @returns {Promise<Object>} Updated payment gateway configuration
   */
  async update(gatewayName, configData, isActive) {
    const query = `
      UPDATE payment_configs
      SET config_data = $1, is_active = $2, updated_at = NOW()
      WHERE gateway_name = $3
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [configData, isActive, gatewayName]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Create payment gateway configuration
   * @param {string} gatewayName - Payment gateway name
   * @param {Object} configData - Configuration data
   * @param {boolean} isActive - Is gateway active
   * @returns {Promise<Object>} Created payment gateway configuration
   */
  async create(gatewayName, configData, isActive = true) {
    const query = `
      INSERT INTO payment_configs (gateway_name, config_data, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [gatewayName, configData, isActive]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = PaymentConfig;

const db = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const Payment = {
  /**
   * Create a new payment
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.booking_id - Booking ID
   * @param {number} paymentData.user_id - User ID
   * @param {number} paymentData.amount - Amount
   * @param {string} paymentData.payment_method - Payment method
   * @param {string} paymentData.payment_gateway - Payment gateway
   * @param {string} paymentData.transaction_id - Transaction ID
   * @param {string} paymentData.status - Status
   * @param {Object} paymentData.payment_data - Payment data
   * @returns {Promise<Object>} Created payment
   */
  async create(paymentData) {
    const {
      booking_id,
      user_id,
      amount,
      payment_method,
      payment_gateway = null,
      transaction_id = null,
      status = 'pending',
      payment_data = {}
    } = paymentData;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const query = `
      INSERT INTO payments (
        booking_id,
        user_id,
        amount,
        payment_method,
        payment_gateway,
        transaction_id,
        status,
        payment_data,
        invoice_number,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      booking_id,
      user_id,
      amount,
      payment_method,
      payment_gateway,
      transaction_id,
      status,
      payment_data,
      invoiceNumber
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Find payment by ID
  async findById(id) {
    const query = 'SELECT * FROM payments WHERE id = $1';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update payment
   * @param {number} id - Payment ID
   * @param {Object} paymentData - Payment data to update
   * @returns {Promise<Object>} Updated payment
   */
  async update(id, paymentData) {
    const {
      status,
      transaction_id,
      payment_gateway,
      payment_data,
      invoice_url,
      refund_status,
      refund_amount,
      refund_date
    } = paymentData;

    // Build the query dynamically based on provided fields
    let updateFields = [];
    let values = [];
    let valueIndex = 1;

    if (status !== undefined) {
      updateFields.push(`status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }

    if (transaction_id !== undefined) {
      updateFields.push(`transaction_id = $${valueIndex}`);
      values.push(transaction_id);
      valueIndex++;
    }

    if (payment_gateway !== undefined) {
      updateFields.push(`payment_gateway = $${valueIndex}`);
      values.push(payment_gateway);
      valueIndex++;
    }

    if (payment_data !== undefined) {
      updateFields.push(`payment_data = $${valueIndex}`);
      values.push(payment_data);
      valueIndex++;
    }

    if (invoice_url !== undefined) {
      updateFields.push(`invoice_url = $${valueIndex}`);
      values.push(invoice_url);
      valueIndex++;
    }

    if (refund_status !== undefined) {
      updateFields.push(`refund_status = $${valueIndex}`);
      values.push(refund_status);
      valueIndex++;
    }

    if (refund_amount !== undefined) {
      updateFields.push(`refund_amount = $${valueIndex}`);
      values.push(refund_amount);
      valueIndex++;
    }

    if (refund_date !== undefined) {
      updateFields.push(`refund_date = $${valueIndex}`);
      values.push(refund_date);
      valueIndex++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    // If no fields to update, return the existing payment
    if (values.length === 0) {
      return this.findById(id);
    }

    // Add the ID as the last parameter
    values.push(id);

    const query = `
      UPDATE payments
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

  // Get all payments
  async getAll() {
    const query = 'SELECT * FROM payments ORDER BY created_at DESC';

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get payments by user ID
  async getByUserId(userId) {
    const query = `
      SELECT p.*, b.start_time, b.end_time, c.name as court_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN courts c ON b.court_id = c.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `;

    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get payments by booking ID
  async getByBookingId(bookingId) {
    const query = 'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC';

    try {
      const result = await db.query(query, [bookingId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get payments by status
  async getByStatus(status) {
    const query = 'SELECT * FROM payments WHERE status = $1 ORDER BY created_at DESC';

    try {
      const result = await db.query(query, [status]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Get payments by date range
  async getByDateRange(startDate, endDate) {
    const query = `
      SELECT * FROM payments
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

  // Get total revenue
  async getTotalRevenue() {
    const query = `
      SELECT SUM(amount) as total_revenue
      FROM payments
      WHERE status = 'completed'
    `;

    try {
      const result = await db.query(query);
      return parseFloat(result.rows[0]?.total_revenue || 0);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get revenue by date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<number>} Total revenue
   */
  async getRevenueByDateRange(startDate, endDate) {
    const query = `
      SELECT SUM(amount) as total_revenue
      FROM payments
      WHERE status = 'completed' AND created_at BETWEEN $1 AND $2
    `;

    try {
      const result = await db.query(query, [startDate, endDate]);
      return parseFloat(result.rows[0]?.total_revenue || 0);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get revenue by date
   * @param {Object} params - Parameters
   * @param {string} params.start_date - Start date
   * @param {string} params.end_date - End date
   * @returns {Promise<Array>} Revenue by date
   */
  async getRevenueByDate(params) {
    const { start_date, end_date } = params;

    const query = `
      SELECT
        DATE(created_at) as date,
        SUM(amount) as total_revenue,
        COUNT(*) as count
      FROM payments
      WHERE status = 'completed' AND created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    try {
      const result = await db.query(query, [start_date, end_date]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get revenue by date grouped by day, week, month, or year
   * @param {Object} params - Parameters
   * @param {string} params.start_date - Start date
   * @param {string} params.end_date - End date
   * @param {string} params.group_by - Group by (day, week, month, year)
   * @returns {Promise<Array>} Revenue by date grouped
   */
  async getRevenueByDateGrouped(params) {
    const { start_date, end_date, group_by = 'day' } = params;

    let dateFormat;
    let groupBy;

    switch (group_by) {
      case 'week':
        dateFormat = 'YYYY-WW';
        groupBy = `TO_CHAR(created_at, 'YYYY-WW')`;
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        groupBy = `TO_CHAR(created_at, 'YYYY-MM')`;
        break;
      case 'year':
        dateFormat = 'YYYY';
        groupBy = `TO_CHAR(created_at, 'YYYY')`;
        break;
      case 'day':
      default:
        dateFormat = 'YYYY-MM-DD';
        groupBy = `TO_CHAR(created_at, 'YYYY-MM-DD')`;
        break;
    }

    const query = `
      SELECT
        ${groupBy} as date,
        SUM(amount) as total_revenue,
        COUNT(*) as count
      FROM payments
      WHERE status = 'completed' AND created_at BETWEEN $1 AND $2
      GROUP BY ${groupBy}
      ORDER BY date
    `;

    try {
      const result = await db.query(query, [start_date, end_date]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get revenue by payment method
   * @param {Object} params - Parameters
   * @param {string} params.start_date - Start date
   * @param {string} params.end_date - End date
   * @returns {Promise<Array>} Revenue by payment method
   */
  async getRevenueByPaymentMethod(params = {}) {
    const { start_date, end_date } = params;

    let query = `
      SELECT payment_method, SUM(amount) as total_revenue, COUNT(*) as count
      FROM payments
      WHERE status = 'completed'
    `;

    const values = [];

    if (start_date && end_date) {
      query += ` AND created_at BETWEEN $1 AND $2`;
      values.push(start_date, end_date);
    }

    query += `
      GROUP BY payment_method
      ORDER BY total_revenue DESC
    `;

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get revenue by payment gateway
   * @param {Object} params - Parameters
   * @param {string} params.start_date - Start date
   * @param {string} params.end_date - End date
   * @returns {Promise<Array>} Revenue by payment gateway
   */
  async getRevenueByPaymentGateway(params = {}) {
    const { start_date, end_date } = params;

    let query = `
      SELECT payment_gateway, SUM(amount) as total_revenue, COUNT(*) as count
      FROM payments
      WHERE status = 'completed'
    `;

    const values = [];

    if (start_date && end_date) {
      query += ` AND created_at BETWEEN $1 AND $2`;
      values.push(start_date, end_date);
    }

    query += `
      GROUP BY payment_gateway
      ORDER BY total_revenue DESC
    `;

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get count by status
   * @param {string} status - Payment status
   * @param {Object} params - Parameters
   * @param {string} params.start_date - Start date
   * @param {string} params.end_date - End date
   * @returns {Promise<number>} Count
   */
  async getCountByStatus(status, params = {}) {
    const { start_date, end_date } = params;

    let query = `
      SELECT COUNT(*) as count
      FROM payments
      WHERE status = $1
    `;

    const values = [status];

    if (start_date && end_date) {
      query += ` AND created_at BETWEEN $2 AND $3`;
      values.push(start_date, end_date);
    }

    try {
      const result = await db.query(query, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Process refund
   * @param {number} id - Payment ID
   * @param {number} amount - Refund amount
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Updated payment
   */
  async processRefund(id, amount, reason) {
    // Start a transaction
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Get payment
      const paymentQuery = 'SELECT * FROM payments WHERE id = $1';
      const paymentResult = await client.query(paymentQuery, [id]);
      const payment = paymentResult.rows[0];

      if (!payment) {
        await client.query('ROLLBACK');
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        await client.query('ROLLBACK');
        throw new Error('Payment must be completed to process refund');
      }

      if (amount > payment.amount) {
        await client.query('ROLLBACK');
        throw new Error('Refund amount cannot exceed payment amount');
      }

      // Update payment
      const updateQuery = `
        UPDATE payments
        SET refund_status = 'refunded',
            refund_amount = $1,
            refund_date = NOW(),
            payment_data = jsonb_set(payment_data, '{refund}', $2),
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const refundData = JSON.stringify({
        amount,
        reason,
        date: new Date().toISOString()
      });

      const updateResult = await client.query(updateQuery, [amount, refundData, id]);
      const updatedPayment = updateResult.rows[0];

      // Create payment log
      const logQuery = `
        INSERT INTO payment_logs (payment_id, event_type, event_data, created_at)
        VALUES ($1, 'refund', $2, NOW())
        RETURNING *
      `;

      await client.query(logQuery, [id, { amount, reason }]);

      await client.query('COMMIT');
      return updatedPayment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Log payment event
   * @param {number} paymentId - Payment ID
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created log
   */
  async logEvent(paymentId, eventType, eventData = {}) {
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
   * @returns {Promise<Array>} Payment logs
   */
  async getLogsByPaymentId(paymentId) {
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
   * Get booking details for a payment
   * @param {number} paymentId - Payment ID
   * @returns {Promise<Object>} Booking details
   */
  async getBookingDetails(paymentId) {
    const query = `
      SELECT
        p.id as payment_id,
        b.id as booking_id,
        b.court_id,
        c.name as court_name,
        b.start_time,
        b.end_time,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;

    try {
      const result = await db.query(query, [paymentId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get payments by filters
   * @param {Object} filters - Filters
   * @param {string} filters.start_date - Start date
   * @param {string} filters.end_date - End date
   * @param {string} filters.payment_method - Payment method
   * @param {string} filters.payment_gateway - Payment gateway
   * @param {string} filters.status - Payment status
   * @returns {Promise<Array>} Filtered payments
   */
  async getByFilters(filters = {}) {
    const {
      start_date,
      end_date,
      payment_method,
      payment_gateway,
      status
    } = filters;

    let conditions = [];
    let values = [];
    let valueIndex = 1;

    if (start_date && end_date) {
      conditions.push(`created_at BETWEEN $${valueIndex} AND $${valueIndex + 1}`);
      values.push(start_date, end_date);
      valueIndex += 2;
    } else if (start_date) {
      conditions.push(`created_at >= $${valueIndex}`);
      values.push(start_date);
      valueIndex++;
    } else if (end_date) {
      conditions.push(`created_at <= $${valueIndex}`);
      values.push(end_date);
      valueIndex++;
    }

    if (payment_method) {
      conditions.push(`payment_method = $${valueIndex}`);
      values.push(payment_method);
      valueIndex++;
    }

    if (payment_gateway) {
      conditions.push(`payment_gateway = $${valueIndex}`);
      values.push(payment_gateway);
      valueIndex++;
    }

    if (status) {
      conditions.push(`status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }

    let query = `
      SELECT p.*, b.start_time, b.end_time, c.name as court_name, u.name as user_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON p.user_id = u.id
    `;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY p.created_at DESC`;

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get total revenue with filters
   * @param {Object} filters - Filters
   * @returns {Promise<number>} Total revenue
   */
  async getTotalRevenue(filters = {}) {
    const {
      start_date,
      end_date,
      payment_method,
      payment_gateway
    } = filters;

    let conditions = ["status = 'completed'"];
    let values = [];
    let valueIndex = 1;

    if (start_date && end_date) {
      conditions.push(`created_at BETWEEN $${valueIndex} AND $${valueIndex + 1}`);
      values.push(start_date, end_date);
      valueIndex += 2;
    } else if (start_date) {
      conditions.push(`created_at >= $${valueIndex}`);
      values.push(start_date);
      valueIndex++;
    } else if (end_date) {
      conditions.push(`created_at <= $${valueIndex}`);
      values.push(end_date);
      valueIndex++;
    }

    if (payment_method) {
      conditions.push(`payment_method = $${valueIndex}`);
      values.push(payment_method);
      valueIndex++;
    }

    if (payment_gateway) {
      conditions.push(`payment_gateway = $${valueIndex}`);
      values.push(payment_gateway);
      valueIndex++;
    }

    const query = `
      SELECT SUM(amount) as total_revenue
      FROM payments
      WHERE ${conditions.join(' AND ')}
    `;

    try {
      const result = await db.query(query, values);
      return parseFloat(result.rows[0]?.total_revenue || 0);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get revenue by date
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} Revenue by date
   */
  async getRevenueByDate(filters = {}) {
    const {
      start_date,
      end_date,
      payment_method,
      payment_gateway
    } = filters;

    let conditions = ["status = 'completed'"];
    let values = [];
    let valueIndex = 1;

    if (start_date && end_date) {
      conditions.push(`created_at BETWEEN $${valueIndex} AND $${valueIndex + 1}`);
      values.push(start_date, end_date);
      valueIndex += 2;
    } else if (start_date) {
      conditions.push(`created_at >= $${valueIndex}`);
      values.push(start_date);
      valueIndex++;
    } else if (end_date) {
      conditions.push(`created_at <= $${valueIndex}`);
      values.push(end_date);
      valueIndex++;
    }

    if (payment_method) {
      conditions.push(`payment_method = $${valueIndex}`);
      values.push(payment_method);
      valueIndex++;
    }

    if (payment_gateway) {
      conditions.push(`payment_gateway = $${valueIndex}`);
      values.push(payment_gateway);
      valueIndex++;
    }

    const query = `
      SELECT
        DATE(created_at) as date,
        SUM(amount) as total_revenue,
        COUNT(*) as count
      FROM payments
      WHERE ${conditions.join(' AND ')}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get revenue by payment method with filters
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} Revenue by payment method
   */
  async getRevenueByPaymentMethod(filters = {}) {
    const {
      start_date,
      end_date
    } = filters;

    let conditions = ["status = 'completed'"];
    let values = [];
    let valueIndex = 1;

    if (start_date && end_date) {
      conditions.push(`created_at BETWEEN $${valueIndex} AND $${valueIndex + 1}`);
      values.push(start_date, end_date);
      valueIndex += 2;
    } else if (start_date) {
      conditions.push(`created_at >= $${valueIndex}`);
      values.push(start_date);
      valueIndex++;
    } else if (end_date) {
      conditions.push(`created_at <= $${valueIndex}`);
      values.push(end_date);
      valueIndex++;
    }

    const query = `
      SELECT
        payment_method,
        SUM(amount) as total_revenue,
        COUNT(*) as count
      FROM payments
      WHERE ${conditions.join(' AND ')}
      GROUP BY payment_method
      ORDER BY total_revenue DESC
    `;

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get revenue by payment gateway with filters
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} Revenue by payment gateway
   */
  async getRevenueByPaymentGateway(filters = {}) {
    const {
      start_date,
      end_date
    } = filters;

    let conditions = ["status = 'completed'", "payment_gateway IS NOT NULL"];
    let values = [];
    let valueIndex = 1;

    if (start_date && end_date) {
      conditions.push(`created_at BETWEEN $${valueIndex} AND $${valueIndex + 1}`);
      values.push(start_date, end_date);
      valueIndex += 2;
    } else if (start_date) {
      conditions.push(`created_at >= $${valueIndex}`);
      values.push(start_date);
      valueIndex++;
    } else if (end_date) {
      conditions.push(`created_at <= $${valueIndex}`);
      values.push(end_date);
      valueIndex++;
    }

    const query = `
      SELECT
        payment_gateway,
        SUM(amount) as total_revenue,
        COUNT(*) as count
      FROM payments
      WHERE ${conditions.join(' AND ')}
      GROUP BY payment_gateway
      ORDER BY total_revenue DESC
    `;

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Payment;

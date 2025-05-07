const crypto = require('crypto');
const moment = require('moment');
const querystring = require('querystring');
const PaymentConfig = require('../../models/payment.config.model');

/**
 * VNPay Payment Service
 */
class VNPayService {
  constructor() {
    this.config = null;
  }
  
  /**
   * Initialize VNPay service
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Get VNPay config from database
      const vnpayConfig = await PaymentConfig.getByName('vnpay');
      
      if (!vnpayConfig || !vnpayConfig.is_active) {
        throw new Error('VNPay payment gateway is not configured or not active');
      }
      
      this.config = vnpayConfig.config_data;
    } catch (error) {
      console.error('Error initializing VNPay service:', error);
      throw error;
    }
  }
  
  /**
   * Create payment URL
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.amount - Amount
   * @param {string} paymentData.orderId - Order ID
   * @param {string} paymentData.orderInfo - Order info
   * @param {string} paymentData.returnUrl - Return URL
   * @param {string} paymentData.ipAddr - IP address
   * @returns {Promise<string>} Payment URL
   */
  async createPayment(paymentData) {
    try {
      if (!this.config) {
        await this.init();
      }
      
      const {
        amount,
        orderId,
        orderInfo,
        returnUrl = this.config.return_url,
        ipAddr
      } = paymentData;
      
      // Create date format for VNPay
      const createDate = moment().format('YYYYMMDDHHmmss');
      const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');
      
      // Create VNPay parameters
      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.config.terminal_id,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100, // VNPay requires amount in VND * 100
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate
      };
      
      // Sort parameters by key
      const sortedParams = this.sortObject(vnpParams);
      
      // Create query string
      const queryParams = querystring.stringify(sortedParams);
      
      // Create signature
      const hmac = crypto.createHmac('sha512', this.config.secret_key);
      const signed = hmac.update(Buffer.from(queryParams, 'utf-8')).digest('hex');
      
      // Add signature to query string
      const paymentUrl = `${this.config.endpoint}?${queryParams}&vnp_SecureHash=${signed}`;
      
      return paymentUrl;
    } catch (error) {
      console.error('Error creating VNPay payment URL:', error);
      throw error;
    }
  }
  
  /**
   * Verify VNPay payment callback
   * @param {Object} callbackData - Callback data from VNPay
   * @returns {Promise<boolean>} Is valid callback
   */
  async verifyCallback(callbackData) {
    try {
      if (!this.config) {
        await this.init();
      }
      
      // Get secure hash from callback data
      const secureHash = callbackData.vnp_SecureHash;
      
      // Remove secure hash from callback data
      delete callbackData.vnp_SecureHash;
      delete callbackData.vnp_SecureHashType;
      
      // Sort parameters by key
      const sortedParams = this.sortObject(callbackData);
      
      // Create query string
      const queryParams = querystring.stringify(sortedParams);
      
      // Create signature
      const hmac = crypto.createHmac('sha512', this.config.secret_key);
      const signed = hmac.update(Buffer.from(queryParams, 'utf-8')).digest('hex');
      
      // Compare signatures
      return secureHash === signed;
    } catch (error) {
      console.error('Error verifying VNPay callback:', error);
      return false;
    }
  }
  
  /**
   * Sort object by key
   * @param {Object} obj - Object to sort
   * @returns {Object} Sorted object
   */
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        sorted[key] = obj[key];
      }
    }
    
    return sorted;
  }
  
  /**
   * Create refund request
   * @param {Object} refundData - Refund data
   * @param {string} refundData.orderId - Order ID
   * @param {string} refundData.transactionId - Transaction ID
   * @param {number} refundData.amount - Amount
   * @param {string} refundData.transactionDate - Transaction date (yyyyMMddHHmmss)
   * @param {string} refundData.ipAddr - IP address
   * @returns {Promise<Object>} Refund result
   */
  async refundPayment(refundData) {
    try {
      if (!this.config) {
        await this.init();
      }
      
      const {
        orderId,
        transactionId,
        amount,
        transactionDate,
        ipAddr
      } = refundData;
      
      // Create date format for VNPay
      const createDate = moment().format('YYYYMMDDHHmmss');
      
      // Create VNPay parameters
      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'refund',
        vnp_TmnCode: this.config.terminal_id,
        vnp_TransactionType: '02', // Full refund
        vnp_TxnRef: orderId,
        vnp_Amount: amount * 100, // VNPay requires amount in VND * 100
        vnp_TransactionNo: transactionId,
        vnp_TransactionDate: transactionDate,
        vnp_CreateBy: 'System',
        vnp_CreateDate: createDate,
        vnp_IpAddr: ipAddr,
        vnp_OrderInfo: `Refund for order ${orderId}`
      };
      
      // Sort parameters by key
      const sortedParams = this.sortObject(vnpParams);
      
      // Create query string
      const queryParams = querystring.stringify(sortedParams);
      
      // Create signature
      const hmac = crypto.createHmac('sha512', this.config.secret_key);
      const signed = hmac.update(Buffer.from(queryParams, 'utf-8')).digest('hex');
      
      // Add signature to parameters
      sortedParams.vnp_SecureHash = signed;
      
      // Send request to VNPay
      // In a real implementation, you would use axios to send this request
      // For now, we'll just return the parameters
      return sortedParams;
    } catch (error) {
      console.error('Error creating VNPay refund request:', error);
      throw error;
    }
  }
}

module.exports = new VNPayService();

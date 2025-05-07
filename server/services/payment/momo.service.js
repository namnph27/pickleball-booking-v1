const axios = require('axios');
const crypto = require('crypto');
const PaymentConfig = require('../../models/payment.config.model');

/**
 * MoMo Payment Service
 */
class MomoPaymentService {
  constructor() {
    this.config = null;
  }
  
  /**
   * Initialize MoMo payment service
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Get MoMo config from database
      const momoConfig = await PaymentConfig.getByName('momo');
      
      if (!momoConfig || !momoConfig.is_active) {
        throw new Error('MoMo payment gateway is not configured or not active');
      }
      
      this.config = momoConfig.config_data;
    } catch (error) {
      console.error('Error initializing MoMo payment service:', error);
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
   * @param {string} paymentData.notifyUrl - Notify URL
   * @param {string} paymentData.extraData - Extra data
   * @returns {Promise<Object>} Payment URL and request ID
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
        notifyUrl = this.config.notify_url,
        extraData = ''
      } = paymentData;
      
      // Create request data
      const requestId = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const requestType = 'captureWallet';
      
      const rawData = {
        partnerCode: this.config.partner_code,
        accessKey: this.config.access_key,
        requestId,
        amount: amount.toString(),
        orderId,
        orderInfo,
        redirectUrl: returnUrl,
        ipnUrl: notifyUrl,
        extraData: Buffer.from(JSON.stringify(extraData)).toString('base64'),
        requestType
      };
      
      // Create signature
      const signature = this.createSignature(rawData);
      
      // Add signature to request data
      const requestData = {
        ...rawData,
        signature
      };
      
      // Send request to MoMo
      const response = await axios.post(this.config.endpoint, requestData);
      
      if (response.data.resultCode !== 0) {
        throw new Error(`MoMo error: ${response.data.message}`);
      }
      
      return {
        payUrl: response.data.payUrl,
        requestId,
        orderId,
        signature: response.data.signature
      };
    } catch (error) {
      console.error('Error creating MoMo payment:', error);
      throw error;
    }
  }
  
  /**
   * Verify MoMo payment callback
   * @param {Object} callbackData - Callback data from MoMo
   * @returns {Promise<boolean>} Is valid callback
   */
  async verifyCallback(callbackData) {
    try {
      if (!this.config) {
        await this.init();
      }
      
      const {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = callbackData;
      
      // Create raw data for signature verification
      const rawData = {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData
      };
      
      // Verify signature
      const calculatedSignature = this.createSignature(rawData);
      
      return calculatedSignature === signature;
    } catch (error) {
      console.error('Error verifying MoMo callback:', error);
      return false;
    }
  }
  
  /**
   * Create signature for MoMo request
   * @param {Object} data - Request data
   * @returns {string} Signature
   */
  createSignature(data) {
    // Sort keys alphabetically
    const keys = Object.keys(data).sort();
    
    // Create raw signature string
    let rawSignature = '';
    
    for (const key of keys) {
      if (data[key] !== undefined && data[key] !== null) {
        rawSignature += `&${key}=${data[key]}`;
      }
    }
    
    // Remove first '&' character
    rawSignature = rawSignature.substring(1);
    
    // Create HMAC SHA256 signature
    return crypto
      .createHmac('sha256', this.config.secret_key)
      .update(rawSignature)
      .digest('hex');
  }
  
  /**
   * Query payment status
   * @param {string} orderId - Order ID
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>} Payment status
   */
  async queryPaymentStatus(orderId, requestId) {
    try {
      if (!this.config) {
        await this.init();
      }
      
      // Create request data
      const rawData = {
        partnerCode: this.config.partner_code,
        accessKey: this.config.access_key,
        requestId,
        orderId,
        lang: 'vi'
      };
      
      // Create signature
      const signature = this.createSignature(rawData);
      
      // Add signature to request data
      const requestData = {
        ...rawData,
        signature
      };
      
      // Send request to MoMo
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/query',
        requestData
      );
      
      return response.data;
    } catch (error) {
      console.error('Error querying MoMo payment status:', error);
      throw error;
    }
  }
  
  /**
   * Refund MoMo payment
   * @param {Object} refundData - Refund data
   * @param {string} refundData.orderId - Order ID
   * @param {string} refundData.transId - Transaction ID
   * @param {number} refundData.amount - Amount
   * @param {string} refundData.description - Description
   * @returns {Promise<Object>} Refund result
   */
  async refundPayment(refundData) {
    try {
      if (!this.config) {
        await this.init();
      }
      
      const {
        orderId,
        transId,
        amount,
        description
      } = refundData;
      
      // Create request data
      const requestId = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      const rawData = {
        partnerCode: this.config.partner_code,
        accessKey: this.config.access_key,
        requestId,
        amount: amount.toString(),
        orderId: `RF_${orderId}`,
        transId,
        lang: 'vi',
        description
      };
      
      // Create signature
      const signature = this.createSignature(rawData);
      
      // Add signature to request data
      const requestData = {
        ...rawData,
        signature
      };
      
      // Send request to MoMo
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/refund',
        requestData
      );
      
      return response.data;
    } catch (error) {
      console.error('Error refunding MoMo payment:', error);
      throw error;
    }
  }
}

module.exports = new MomoPaymentService();

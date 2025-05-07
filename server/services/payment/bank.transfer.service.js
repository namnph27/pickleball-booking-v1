const PaymentConfig = require('../../models/payment.config.model');

/**
 * Bank Transfer Service
 */
class BankTransferService {
  constructor() {
    this.config = null;
  }
  
  /**
   * Initialize Bank Transfer service
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Get Bank Transfer config from database
      const bankConfig = await PaymentConfig.getByName('bank_transfer');
      
      if (!bankConfig || !bankConfig.is_active) {
        throw new Error('Bank Transfer payment gateway is not configured or not active');
      }
      
      this.config = bankConfig.config_data;
    } catch (error) {
      console.error('Error initializing Bank Transfer service:', error);
      throw error;
    }
  }
  
  /**
   * Get bank transfer information
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.amount - Amount
   * @param {string} paymentData.orderId - Order ID
   * @returns {Promise<Object>} Bank transfer information
   */
  async getBankTransferInfo(paymentData) {
    try {
      if (!this.config) {
        await this.init();
      }
      
      const { amount, orderId } = paymentData;
      
      // Create bank transfer information
      const bankTransferInfo = {
        accountNumber: this.config.account_number,
        accountName: this.config.account_name,
        bankName: this.config.bank_name,
        branch: this.config.branch,
        amount,
        reference: `PB-${orderId}`, // Payment reference
        instructions: `Please include the reference code PB-${orderId} in your transfer description.`
      };
      
      return bankTransferInfo;
    } catch (error) {
      console.error('Error getting bank transfer information:', error);
      throw error;
    }
  }
  
  /**
   * Verify bank transfer
   * @param {Object} verifyData - Verification data
   * @param {string} verifyData.orderId - Order ID
   * @param {string} verifyData.transactionId - Transaction ID
   * @param {string} verifyData.bankName - Bank name
   * @param {string} verifyData.accountNumber - Account number
   * @param {string} verifyData.transferDate - Transfer date
   * @param {string} verifyData.reference - Reference
   * @returns {Promise<boolean>} Is valid transfer
   */
  async verifyTransfer(verifyData) {
    try {
      if (!this.config) {
        await this.init();
      }
      
      // In a real implementation, you would verify the transfer with the bank
      // For now, we'll just return true
      return true;
    } catch (error) {
      console.error('Error verifying bank transfer:', error);
      return false;
    }
  }
}

module.exports = new BankTransferService();

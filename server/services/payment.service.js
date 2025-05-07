const MomoPaymentService = require('./payment/momo.service');
const VNPayService = require('./payment/vnpay.service');
const BankTransferService = require('./payment/bank.transfer.service');
const PaymentConfig = require('../models/payment.config.model');
const Payment = require('../models/payment.model');
const InvoiceService = require('./invoice.service');

/**
 * Payment Service
 * Central service to handle all payment gateways
 */
class PaymentService {
  constructor() {
    this.gateways = {
      momo: MomoPaymentService,
      vnpay: VNPayService,
      bank_transfer: BankTransferService
    };
  }
  
  /**
   * Get active payment gateways
   * @returns {Promise<Array>} Active payment gateways
   */
  async getActiveGateways() {
    try {
      const activeConfigs = await PaymentConfig.getActive();
      return activeConfigs.map(config => ({
        name: config.gateway_name,
        displayName: this.getDisplayName(config.gateway_name),
        config: config.config_data
      }));
    } catch (error) {
      console.error('Error getting active payment gateways:', error);
      throw error;
    }
  }
  
  /**
   * Get display name for payment gateway
   * @param {string} gatewayName - Payment gateway name
   * @returns {string} Display name
   */
  getDisplayName(gatewayName) {
    const displayNames = {
      momo: 'MoMo',
      vnpay: 'VNPay',
      bank_transfer: 'Chuyển khoản ngân hàng',
      credit_card: 'Thẻ tín dụng/ghi nợ',
      reward_points: 'Điểm thưởng'
    };
    
    return displayNames[gatewayName] || gatewayName;
  }
  
  /**
   * Create payment
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.booking_id - Booking ID
   * @param {number} paymentData.user_id - User ID
   * @param {number} paymentData.amount - Amount
   * @param {string} paymentData.payment_method - Payment method
   * @param {string} paymentData.payment_gateway - Payment gateway
   * @returns {Promise<Object>} Payment result
   */
  async createPayment(paymentData) {
    try {
      const {
        booking_id,
        user_id,
        amount,
        payment_method,
        payment_gateway
      } = paymentData;
      
      // Create payment record with pending status
      const payment = await Payment.create({
        booking_id,
        user_id,
        amount,
        payment_method,
        payment_gateway,
        status: 'pending'
      });
      
      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }
  
  /**
   * Process payment with gateway
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.payment_id - Payment ID
   * @param {string} paymentData.payment_gateway - Payment gateway
   * @param {Object} paymentData.gateway_data - Gateway specific data
   * @returns {Promise<Object>} Payment result with redirect URL if applicable
   */
  async processPaymentWithGateway(paymentData) {
    try {
      const {
        payment_id,
        payment_gateway,
        gateway_data
      } = paymentData;
      
      // Get payment details
      const payment = await Payment.findById(payment_id);
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      // Check if gateway exists
      if (!this.gateways[payment_gateway]) {
        throw new Error(`Payment gateway ${payment_gateway} not supported`);
      }
      
      // Process payment with gateway
      let gatewayResult;
      
      switch (payment_gateway) {
        case 'momo':
          gatewayResult = await this.gateways.momo.createPayment({
            amount: payment.amount,
            orderId: `PB-${payment.id}`,
            orderInfo: `Thanh toán đặt sân Pickleball #${payment.booking_id}`,
            extraData: { payment_id: payment.id },
            returnUrl: gateway_data.returnUrl,
            notifyUrl: gateway_data.notifyUrl
          });
          break;
          
        case 'vnpay':
          gatewayResult = await this.gateways.vnpay.createPayment({
            amount: payment.amount,
            orderId: `PB-${payment.id}`,
            orderInfo: `Thanh toán đặt sân Pickleball #${payment.booking_id}`,
            returnUrl: gateway_data.returnUrl,
            ipAddr: gateway_data.ipAddr
          });
          break;
          
        case 'bank_transfer':
          gatewayResult = await this.gateways.bank_transfer.getBankTransferInfo({
            amount: payment.amount,
            orderId: payment.id
          });
          break;
          
        default:
          throw new Error(`Payment gateway ${payment_gateway} not implemented`);
      }
      
      // Update payment with gateway data
      await Payment.update(payment.id, {
        payment_data: gatewayResult,
        updated_at: new Date()
      });
      
      return {
        payment,
        gateway_result: gatewayResult
      };
    } catch (error) {
      console.error('Error processing payment with gateway:', error);
      throw error;
    }
  }
  
  /**
   * Handle payment callback
   * @param {string} gateway - Payment gateway
   * @param {Object} callbackData - Callback data
   * @returns {Promise<Object>} Updated payment
   */
  async handlePaymentCallback(gateway, callbackData) {
    try {
      let paymentId;
      let transactionId;
      let status;
      
      // Extract data based on gateway
      switch (gateway) {
        case 'momo':
          // Verify MoMo signature
          const isValidSignature = await this.gateways.momo.verifyCallback(callbackData);
          
          if (!isValidSignature) {
            throw new Error('Invalid MoMo signature');
          }
          
          // Extract payment ID from orderId (PB-{payment_id})
          paymentId = callbackData.orderId.split('-')[1];
          transactionId = callbackData.transId;
          status = callbackData.resultCode === 0 ? 'completed' : 'failed';
          break;
          
        case 'vnpay':
          // Verify VNPay signature
          const isValidVNPaySignature = await this.gateways.vnpay.verifyCallback(callbackData);
          
          if (!isValidVNPaySignature) {
            throw new Error('Invalid VNPay signature');
          }
          
          // Extract payment ID from orderId (PB-{payment_id})
          paymentId = callbackData.vnp_TxnRef.split('-')[1];
          transactionId = callbackData.vnp_TransactionNo;
          status = callbackData.vnp_ResponseCode === '00' ? 'completed' : 'failed';
          break;
          
        default:
          throw new Error(`Payment gateway ${gateway} not supported for callbacks`);
      }
      
      // Get payment
      const payment = await Payment.findById(paymentId);
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      // Update payment status
      const updatedPayment = await Payment.update(paymentId, {
        status,
        transaction_id: transactionId,
        payment_data: { ...payment.payment_data, callback: callbackData },
        updated_at: new Date()
      });
      
      // If payment is completed, generate invoice
      if (status === 'completed') {
        await this.generateInvoice(paymentId);
      }
      
      // Log payment event
      await Payment.logEvent(paymentId, `payment_${status}`, callbackData);
      
      return updatedPayment;
    } catch (error) {
      console.error('Error handling payment callback:', error);
      throw error;
    }
  }
  
  /**
   * Generate invoice for payment
   * @param {number} paymentId - Payment ID
   * @returns {Promise<string>} Invoice URL
   */
  async generateInvoice(paymentId) {
    try {
      // Get payment with booking and user details
      const payment = await Payment.findById(paymentId);
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      // Check if payment is completed
      if (payment.status !== 'completed') {
        throw new Error('Cannot generate invoice for incomplete payment');
      }
      
      // Get booking and user details
      const bookingDetails = await Payment.getBookingDetails(paymentId);
      
      // Generate invoice data
      const invoiceData = {
        invoiceNumber: payment.invoice_number,
        date: payment.created_at,
        customer: {
          id: payment.user_id,
          name: bookingDetails.user_name,
          email: bookingDetails.user_email
        },
        booking: {
          id: payment.booking_id,
          court_id: bookingDetails.court_id,
          court_name: bookingDetails.court_name,
          start_time: bookingDetails.start_time,
          end_time: bookingDetails.end_time
        },
        payment: {
          id: payment.id,
          amount: payment.amount,
          payment_method: payment.payment_method,
          payment_gateway: payment.payment_gateway,
          transaction_id: payment.transaction_id,
          status: payment.status
        }
      };
      
      // Generate invoice PDF
      const invoicePath = await InvoiceService.generateInvoice(invoiceData);
      
      // Get invoice URL
      const invoiceUrl = InvoiceService.getInvoiceUrl(payment.invoice_number);
      
      // Update payment with invoice URL
      await Payment.update(paymentId, {
        invoice_url: invoiceUrl,
        updated_at: new Date()
      });
      
      return invoiceUrl;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }
  
  /**
   * Process refund
   * @param {Object} refundData - Refund data
   * @param {number} refundData.payment_id - Payment ID
   * @param {number} refundData.amount - Refund amount
   * @param {string} refundData.reason - Refund reason
   * @returns {Promise<Object>} Refund result
   */
  async processRefund(refundData) {
    try {
      const {
        payment_id,
        amount,
        reason
      } = refundData;
      
      // Get payment
      const payment = await Payment.findById(payment_id);
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      // Check if payment is completed
      if (payment.status !== 'completed') {
        throw new Error('Cannot refund incomplete payment');
      }
      
      // Check if payment is already refunded
      if (payment.refund_status === 'refunded') {
        throw new Error('Payment is already refunded');
      }
      
      // Check if refund amount is valid
      if (amount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }
      
      // Process refund with gateway
      let refundResult;
      
      switch (payment.payment_gateway) {
        case 'momo':
          refundResult = await this.gateways.momo.refundPayment({
            orderId: `PB-${payment.id}`,
            transId: payment.transaction_id,
            amount,
            description: reason
          });
          break;
          
        case 'vnpay':
          refundResult = await this.gateways.vnpay.createRefund({
            transactionId: payment.transaction_id,
            amount,
            orderId: `RF-${payment.id}`,
            transactionDate: payment.created_at,
            user: 'admin'
          });
          break;
          
        case 'bank_transfer':
          // For bank transfers, we just mark it as refunded
          // In a real application, you would need to handle this manually
          refundResult = { status: 'success', message: 'Refund marked for manual processing' };
          break;
          
        default:
          throw new Error(`Refund not supported for payment gateway ${payment.payment_gateway}`);
      }
      
      // Update payment with refund data
      const updatedPayment = await Payment.update(payment_id, {
        refund_status: 'refunded',
        refund_amount: amount,
        refund_date: new Date(),
        payment_data: { ...payment.payment_data, refund: refundResult },
        updated_at: new Date()
      });
      
      // Log refund event
      await Payment.logEvent(payment_id, 'payment_refunded', {
        amount,
        reason,
        refund_result: refundResult
      });
      
      return {
        payment: updatedPayment,
        refund_result: refundResult
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }
  
  /**
   * Get payment reports
   * @param {Object} filters - Report filters
   * @param {string} filters.start_date - Start date
   * @param {string} filters.end_date - End date
   * @param {string} filters.payment_method - Payment method
   * @param {string} filters.payment_gateway - Payment gateway
   * @param {string} filters.status - Payment status
   * @returns {Promise<Object>} Payment reports
   */
  async getPaymentReports(filters = {}) {
    try {
      const {
        start_date,
        end_date,
        payment_method,
        payment_gateway,
        status
      } = filters;
      
      // Get payments by filters
      const payments = await Payment.getByFilters({
        start_date,
        end_date,
        payment_method,
        payment_gateway,
        status
      });
      
      // Get total revenue
      const totalRevenue = await Payment.getTotalRevenue(filters);
      
      // Get revenue by payment method
      const revenueByMethod = await Payment.getRevenueByPaymentMethod(filters);
      
      // Get revenue by payment gateway
      const revenueByGateway = await Payment.getRevenueByPaymentGateway(filters);
      
      // Get revenue by date
      const revenueByDate = await Payment.getRevenueByDate(filters);
      
      return {
        payments,
        total_revenue: totalRevenue,
        revenue_by_method: revenueByMethod,
        revenue_by_gateway: revenueByGateway,
        revenue_by_date: revenueByDate
      };
    } catch (error) {
      console.error('Error getting payment reports:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();

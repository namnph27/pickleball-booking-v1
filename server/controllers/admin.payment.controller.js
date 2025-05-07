const Payment = require('../models/payment.model');
const PaymentService = require('../services/payment.service');
const PaymentConfig = require('../models/payment.config.model');

// Get all payments with filters
const getAllPayments = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      payment_method,
      payment_gateway,
      status
    } = req.query;
    
    const payments = await Payment.getByFilters({
      start_date,
      end_date,
      payment_method,
      payment_gateway,
      status
    });
    
    res.status(200).json({ payments });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Get payment logs
    const logs = await Payment.getLogsByPaymentId(id);
    
    // Get booking details
    const bookingDetails = await Payment.getBookingDetails(id);
    
    res.status(200).json({
      payment,
      logs,
      booking_details: bookingDetails
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching payment' });
  }
};

// Process refund
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    // Validate required fields
    if (!amount || !reason) {
      return res.status(400).json({ message: 'Amount and reason are required' });
    }
    
    // Process refund
    const refundResult = await PaymentService.processRefund({
      payment_id: id,
      amount,
      reason
    });
    
    res.status(200).json({ 
      message: 'Refund processed successfully',
      payment: refundResult.payment,
      refund_result: refundResult.refund_result
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: `Server error while processing refund: ${error.message}` });
  }
};

// Get payment reports
const getPaymentReports = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      payment_method,
      payment_gateway
    } = req.query;
    
    const reports = await PaymentService.getPaymentReports({
      start_date,
      end_date,
      payment_method,
      payment_gateway
    });
    
    res.status(200).json(reports);
  } catch (error) {
    console.error('Get payment reports error:', error);
    res.status(500).json({ message: 'Server error while generating payment reports' });
  }
};

// Get payment gateway configurations
const getPaymentConfigs = async (req, res) => {
  try {
    const configs = await PaymentConfig.getAll();
    res.status(200).json({ configs });
  } catch (error) {
    console.error('Get payment configs error:', error);
    res.status(500).json({ message: 'Server error while fetching payment configurations' });
  }
};

// Update payment gateway configuration
const updatePaymentConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, config_data } = req.body;
    
    // Validate required fields
    if (is_active === undefined && !config_data) {
      return res.status(400).json({ message: 'No data provided for update' });
    }
    
    // Update payment gateway configuration
    const updatedConfig = await PaymentConfig.update(id, {
      is_active,
      config_data
    });
    
    res.status(200).json({
      message: 'Payment gateway configuration updated successfully',
      config: updatedConfig
    });
  } catch (error) {
    console.error('Update payment config error:', error);
    res.status(500).json({ message: 'Server error while updating payment configuration' });
  }
};

// Get payment statistics
const getPaymentStatistics = async (req, res) => {
  try {
    // Get total revenue
    const totalRevenue = await Payment.getTotalRevenue();
    
    // Get total completed payments
    const completedPayments = await Payment.getByStatus('completed');
    
    // Get total pending payments
    const pendingPayments = await Payment.getByStatus('pending');
    
    // Get total failed payments
    const failedPayments = await Payment.getByStatus('failed');
    
    // Get revenue by payment method
    const revenueByMethod = await Payment.getRevenueByPaymentMethod();
    
    // Get revenue by payment gateway
    const revenueByGateway = await Payment.getRevenueByPaymentGateway();
    
    // Get revenue by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenueByDate = await Payment.getRevenueByDate({
      start_date: thirtyDaysAgo.toISOString()
    });
    
    res.status(200).json({
      total_revenue: totalRevenue,
      completed_payments: completedPayments.length,
      pending_payments: pendingPayments.length,
      failed_payments: failedPayments.length,
      revenue_by_method: revenueByMethod,
      revenue_by_gateway: revenueByGateway,
      revenue_by_date: revenueByDate
    });
  } catch (error) {
    console.error('Get payment statistics error:', error);
    res.status(500).json({ message: 'Server error while fetching payment statistics' });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  processRefund,
  getPaymentReports,
  getPaymentConfigs,
  updatePaymentConfig,
  getPaymentStatistics
};

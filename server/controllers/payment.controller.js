const Payment = require('../models/payment.model');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const PaymentService = require('../services/payment.service');
const InvoiceService = require('../services/invoice.service');

// Process payment for a booking
const processPayment = async (req, res) => {
  try {
    const {
      booking_id,
      payment_method,
      payment_gateway,
      return_url,
      cancel_url
    } = req.body;

    // Validate required fields
    if (!booking_id || !payment_method) {
      return res.status(400).json({ message: 'Booking ID and payment method are required' });
    }

    // Check if booking exists
    const booking = await Booking.findById(booking_id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to pay for this booking
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to pay for this booking' });
    }

    // Check if booking is already paid
    const existingPayment = await Payment.getByBookingId(booking_id);

    if (existingPayment.length > 0 && existingPayment[0].status === 'completed') {
      return res.status(400).json({ message: 'Booking is already paid' });
    }

    // Process payment based on payment method
    let paymentResult;

    switch (payment_method) {
      case 'online_payment':
        // Validate payment gateway
        if (!payment_gateway) {
          return res.status(400).json({ message: 'Payment gateway is required for online payment' });
        }

        // Create payment record
        const payment = await PaymentService.createPayment({
          booking_id,
          user_id: req.user.id,
          amount: booking.total_price,
          payment_method,
          payment_gateway
        });

        // Process payment with gateway
        paymentResult = await PaymentService.processPaymentWithGateway({
          payment_id: payment.id,
          payment_gateway,
          gateway_data: {
            returnUrl: return_url || `${req.protocol}://${req.get('host')}/api/payments/${payment_gateway}/callback`,
            cancelUrl: cancel_url || `${req.protocol}://${req.get('host')}/api/payments/cancel`,
            ipAddr: req.ip
          }
        });

        // Return payment result with redirect URL
        return res.status(200).json({
          payment: paymentResult.payment,
          redirect_url: paymentResult.gateway_result.payUrl || paymentResult.gateway_result
        });

      case 'reward_points':
        // Check if user has enough reward points
        const rewardPoints = await User.getRewardPoints(req.user.id);
        const requiredPoints = booking.total_price * 100; // 1 point = $0.01

        if (rewardPoints < requiredPoints) {
          return res.status(400).json({
            message: 'Insufficient reward points',
            required_points: requiredPoints,
            available_points: rewardPoints
          });
        }

        // Create payment record
        const pointsPayment = await PaymentService.createPayment({
          booking_id,
          user_id: req.user.id,
          amount: booking.total_price,
          payment_method: 'reward_points'
        });

        // Deduct reward points
        await User.updateRewardPoints(req.user.id, -requiredPoints);

        // Update payment status
        const updatedPayment = await Payment.update(pointsPayment.id, {
          status: 'completed',
          transaction_id: `RP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          updated_at: new Date()
        });

        // Update booking status
        await Booking.update(booking_id, { status: 'confirmed' });

        // Generate invoice
        await PaymentService.generateInvoice(pointsPayment.id);

        return res.status(200).json({
          message: 'Payment processed successfully with reward points',
          payment: updatedPayment
        });

      case 'credit_card':
      case 'paypal':
        // For backward compatibility
        // Create payment record
        const legacyPayment = await PaymentService.createPayment({
          booking_id,
          user_id: req.user.id,
          amount: booking.total_price,
          payment_method
        });

        // Update payment status
        const transactionId = `${payment_method === 'credit_card' ? 'CC' : 'PP'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const updatedLegacyPayment = await Payment.update(legacyPayment.id, {
          status: 'completed',
          transaction_id: transactionId,
          updated_at: new Date()
        });

        // Update booking status
        await Booking.update(booking_id, { status: 'confirmed' });

        // Generate invoice
        await PaymentService.generateInvoice(legacyPayment.id);

        return res.status(201).json({
          message: 'Payment processed successfully',
          payment: updatedLegacyPayment
        });

      default:
        return res.status(400).json({ message: 'Invalid payment method' });
    }
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: `Server error while processing payment: ${error.message}` });
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

    // Check if user is authorized to view this payment
    if (payment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to view this payment' });
    }

    res.status(200).json({ payment });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching payment' });
  }
};

// Get all payments for current user
const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.getByUserId(req.user.id);
    res.status(200).json({ payments });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
};

// Get payment receipt
const getPaymentReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is authorized to view this payment
    if (payment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to view this payment' });
    }

    // Check if payment is completed
    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot generate receipt for incomplete payment' });
    }

    // Check if invoice URL exists
    if (!payment.invoice_url) {
      // Generate invoice
      const invoiceUrl = await PaymentService.generateInvoice(payment.id);

      // Return invoice URL
      return res.status(200).json({ receipt_url: invoiceUrl });
    }

    // Return existing invoice URL
    res.status(200).json({ receipt_url: payment.invoice_url });
  } catch (error) {
    console.error('Get payment receipt error:', error);
    res.status(500).json({ message: 'Server error while generating receipt' });
  }
};

// Handle payment callback
const handlePaymentCallback = async (req, res) => {
  try {
    const { gateway } = req.params;
    const callbackData = req.method === 'GET' ? req.query : req.body;

    // Process payment callback
    const payment = await PaymentService.handlePaymentCallback(gateway, callbackData);

    // If payment is completed, update booking status
    if (payment.status === 'completed') {
      await Booking.update(payment.booking_id, { status: 'confirmed' });
    }

    // Redirect to success or failure page based on payment status
    if (payment.status === 'completed') {
      return res.redirect(`/payment/success?payment_id=${payment.id}`);
    } else {
      return res.redirect(`/payment/failure?payment_id=${payment.id}&error=${encodeURIComponent('Payment failed')}`);
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    return res.redirect(`/payment/failure?error=${encodeURIComponent(error.message)}`);
  }
};

// Get active payment gateways
const getActivePaymentGateways = async (req, res) => {
  try {
    const gateways = await PaymentService.getActiveGateways();
    res.status(200).json({ gateways });
  } catch (error) {
    console.error('Get active payment gateways error:', error);
    res.status(500).json({ message: 'Server error while fetching payment gateways' });
  }
};

// Request payment cancellation
const requestPaymentCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate required fields
    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    // Get payment
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is authorized to cancel this payment
    if (payment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to cancel this payment' });
    }

    // Check if payment is completed
    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot cancel incomplete payment' });
    }

    // Check if payment is already refunded
    if (payment.refund_status === 'refunded') {
      return res.status(400).json({ message: 'Payment is already refunded' });
    }

    // Update payment status
    await Payment.update(payment.id, {
      refund_status: 'requested',
      payment_data: {
        ...payment.payment_data,
        cancellation_request: {
          reason,
          date: new Date().toISOString()
        }
      },
      updated_at: new Date()
    });

    // Log cancellation request
    await Payment.logEvent(payment.id, 'cancellation_requested', { reason });

    res.status(200).json({
      message: 'Payment cancellation requested successfully',
      payment_id: payment.id
    });
  } catch (error) {
    console.error('Request payment cancellation error:', error);
    res.status(500).json({ message: 'Server error while requesting payment cancellation' });
  }
};

module.exports = {
  processPayment,
  handlePaymentCallback,
  getPaymentById,
  getUserPayments,
  getPaymentReceipt,
  getActivePaymentGateways,
  requestPaymentCancellation
};

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public payment routes
router.get('/gateways', paymentController.getActivePaymentGateways);

// Payment callback routes (public)
router.get('/:gateway/callback', paymentController.handlePaymentCallback);
router.post('/:gateway/callback', paymentController.handlePaymentCallback);
router.post('/:gateway/ipn', paymentController.handlePaymentCallback);

// Protected payment routes
router.post('/', verifyToken, paymentController.processPayment);
router.get('/my-payments', verifyToken, paymentController.getUserPayments);
router.get('/:id', verifyToken, paymentController.getPaymentById);
router.get('/:id/receipt', verifyToken, paymentController.getPaymentReceipt);
router.post('/:id/cancel', verifyToken, paymentController.requestPaymentCancellation);

module.exports = router;

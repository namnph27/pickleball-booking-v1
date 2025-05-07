const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const paymentController = require('../controllers/payment.controller');
const { verifyToken, isCourtOwner } = require('../middleware/auth.middleware');

// Booking routes (protected)
router.post('/', verifyToken, bookingController.createBooking);
router.get('/my-bookings', verifyToken, bookingController.getUserBookings);
router.get('/:id', verifyToken, bookingController.getBookingById);
router.post('/:id/cancel', verifyToken, bookingController.cancelBooking);

// Court owner booking routes (protected)
router.get('/court/:courtId', verifyToken, isCourtOwner, bookingController.getCourtBookings);
router.put('/:id/status', verifyToken, isCourtOwner, bookingController.updateBookingStatus);

// Payment routes (protected)
router.post('/payment', verifyToken, paymentController.processPayment);
router.get('/payment/:id', verifyToken, paymentController.getPaymentById);
router.get('/payments', verifyToken, paymentController.getUserPayments);
router.get('/payment/:id/receipt', verifyToken, paymentController.getPaymentReceipt);

module.exports = router;

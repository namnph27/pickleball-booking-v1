/**
 * Routes for the "Join Existing Court" feature
 */
const express = require('express');
const router = express.Router();
const bookingJoinController = require('../controllers/booking.join.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes
router.get('/joinable', bookingJoinController.getJoinableCourts);
router.get('/joinable/:id', bookingJoinController.getJoinableCourtDetails);

// Protected routes (require authentication)
router.post('/request', verifyToken, bookingJoinController.sendJoinRequest);
router.get('/requests/booking/:booking_id', verifyToken, bookingJoinController.getJoinRequests);
router.get('/requests/user', verifyToken, bookingJoinController.getUserJoinRequests);
router.put('/request/:id/respond', verifyToken, bookingJoinController.respondToJoinRequest);

module.exports = router;

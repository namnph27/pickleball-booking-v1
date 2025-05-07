const express = require('express');
const router = express.Router();
const adminBookingController = require('../controllers/admin.booking.controller');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Admin booking routes (protected)
router.get('/', verifyAdminToken, adminBookingController.getAllBookings);
router.get('/statistics', verifyAdminToken, adminBookingController.getBookingStatistics);
router.get('/:id', verifyAdminToken, adminBookingController.getBookingById);
router.put('/:id/status', verifyAdminToken, adminBookingController.updateBookingStatus);
router.put('/:id/notes', verifyAdminToken, adminBookingController.addBookingNotes);

module.exports = router;

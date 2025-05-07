const express = require('express');
const router = express.Router();
const adminCourtController = require('../controllers/admin.court.controller');
const { verifyAdminToken } = require('../middleware/admin.auth.middleware');

// Admin court routes (protected)
router.get('/', verifyAdminToken, adminCourtController.getAllCourts);
router.get('/statistics', verifyAdminToken, adminCourtController.getCourtStatistics);
router.get('/top-by-bookings', verifyAdminToken, adminCourtController.getTopCourtsByBookings);
router.get('/:id', verifyAdminToken, adminCourtController.getCourtById);
router.put('/:id/status', verifyAdminToken, adminCourtController.updateCourtStatus);
router.put('/:id/notes', verifyAdminToken, adminCourtController.addCourtNotes);

module.exports = router;

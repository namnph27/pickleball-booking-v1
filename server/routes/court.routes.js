const express = require('express');
const router = express.Router();
const courtController = require('../controllers/court.controller');
const courtTimeslotController = require('../controllers/court.timeslot.controller');
const courtAvailabilityController = require('../controllers/court.availability.controller');
const { verifyToken, isCourtOwner } = require('../middleware/auth.middleware');

// Public court routes
router.get('/', courtController.getAllCourts);
router.get('/available', courtController.getAvailableCourts);
router.get('/search', courtController.searchCourts);
router.get('/:id', courtController.getCourtById);

// Court owner routes (protected)
router.post('/', verifyToken, isCourtOwner, courtController.createCourt);
router.put('/:id', verifyToken, isCourtOwner, courtController.updateCourt);
router.delete('/:id', verifyToken, isCourtOwner, courtController.deleteCourt);
router.get('/owner/my-courts', verifyToken, isCourtOwner, courtController.getCourtsByOwner);

// Court availability route
router.get('/:courtId/availability', courtAvailabilityController.getCourtAvailability);

// Court timeslot routes
router.get('/:courtId/timeslots', courtTimeslotController.getTimeslotsByCourtId);
router.get('/:courtId/timeslots/available', courtTimeslotController.getAvailableTimeslots);
router.get('/:courtId/timeslots/by-date', courtTimeslotController.getTimeslotsByDate);
router.post('/:courtId/timeslots', verifyToken, isCourtOwner, courtTimeslotController.createTimeslot);
router.post('/:courtId/timeslots/copy-day', verifyToken, isCourtOwner, courtTimeslotController.copyDayOfWeekTimeslotsToDate);
router.delete('/:courtId/timeslots/by-date', verifyToken, isCourtOwner, courtTimeslotController.deleteTimeslotsByDate);
router.put('/timeslots/:id', verifyToken, isCourtOwner, courtTimeslotController.updateTimeslot);
router.delete('/timeslots/:id', verifyToken, isCourtOwner, courtTimeslotController.deleteTimeslot);

module.exports = router;

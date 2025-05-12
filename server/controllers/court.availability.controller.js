/**
 * Court Availability Controller
 * Handles API endpoints for court availability
 */
const Court = require('../models/court.model');
const CourtTimeslot = require('../models/court.timeslot.model');
const Booking = require('../models/booking.model');

/**
 * Get court availability for a specific date
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getCourtAvailability = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Check if court exists
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Get timeslots for the specific date, falling back to day of week if needed
    const timeslots = await CourtTimeslot.getTimeslotsForDate(courtId, date);

    // Get bookings for this court on the specified date
    const bookings = await Booking.getByCourtAndDate(courtId, date);

    // Process timeslots to determine availability
    const availability = timeslots.map(timeslot => {
      const startTime = timeslot.start_time;
      const endTime = timeslot.end_time;
      
      // Check if this timeslot is already booked
      const isBooked = bookings.some(booking => {
        const bookingStartTime = new Date(booking.start_time).toTimeString().split(' ')[0];
        const bookingEndTime = new Date(booking.end_time).toTimeString().split(' ')[0];
        
        return (
          (bookingStartTime <= startTime && bookingEndTime > startTime) ||
          (bookingStartTime < endTime && bookingEndTime >= endTime) ||
          (bookingStartTime >= startTime && bookingEndTime <= endTime)
        );
      });

      return {
        id: timeslot.id,
        start_time: startTime,
        end_time: endTime,
        price: timeslot.price,
        available: timeslot.is_available && !isBooked
      };
    });

    res.status(200).json({ availability });
  } catch (error) {
    console.error('Get court availability error:', error);
    res.status(500).json({ message: 'Server error while fetching court availability' });
  }
};

module.exports = {
  getCourtAvailability
};

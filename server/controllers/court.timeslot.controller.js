const Court = require('../models/court.model');
const CourtTimeslot = require('../models/court.timeslot.model');

// Get all timeslots for a court
const getTimeslotsByCourtId = async (req, res) => {
  try {
    const { courtId } = req.params;

    // Check if court exists
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Get timeslots
    const timeslots = await CourtTimeslot.getByCourtId(courtId);

    res.status(200).json({ timeslots });
  } catch (error) {
    console.error('Get timeslots by court ID error:', error);
    res.status(500).json({ message: 'Server error while fetching timeslots' });
  }
};

// Create timeslot (court owner only)
const createTimeslot = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { day_of_week, start_time, end_time, price = 0 } = req.body;

    // Validate required fields
    if (day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ message: 'Day of week, start time, and end time are required' });
    }

    // Check if court exists
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Check if user is the owner of the court
    if (court.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to add timeslots to this court' });
    }

    // Validate day of week (0-6)
    if (day_of_week < 0 || day_of_week > 6) {
      return res.status(400).json({ message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' });
    }

    // Create timeslot
    const newTimeslot = await CourtTimeslot.create({
      court_id: courtId,
      day_of_week,
      start_time,
      end_time,
      price: Number(price),
      is_available: true
    });

    res.status(201).json({
      message: 'Timeslot created successfully',
      timeslot: newTimeslot
    });
  } catch (error) {
    console.error('Create timeslot error:', error);
    res.status(500).json({ message: 'Server error while creating timeslot' });
  }
};

// Update timeslot (court owner only)
const updateTimeslot = async (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, start_time, end_time, price, is_available } = req.body;

    // Check if timeslot exists
    const timeslot = await CourtTimeslot.findById(id);

    if (!timeslot) {
      return res.status(404).json({ message: 'Timeslot not found' });
    }

    // Check if court exists
    const court = await Court.findById(timeslot.court_id);

    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Check if user is the owner of the court
    if (court.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update timeslots for this court' });
    }

    // Validate day of week (0-6) if provided
    if (day_of_week !== undefined && (day_of_week < 0 || day_of_week > 6)) {
      return res.status(400).json({ message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' });
    }

    // Update timeslot
    const updatedTimeslot = await CourtTimeslot.update(id, {
      day_of_week,
      start_time,
      end_time,
      price: price !== undefined ? Number(price) : undefined,
      is_available
    });

    res.status(200).json({
      message: 'Timeslot updated successfully',
      timeslot: updatedTimeslot
    });
  } catch (error) {
    console.error('Update timeslot error:', error);
    res.status(500).json({ message: 'Server error while updating timeslot' });
  }
};

// Delete timeslot (court owner only)
const deleteTimeslot = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if timeslot exists
    const timeslot = await CourtTimeslot.findById(id);

    if (!timeslot) {
      return res.status(404).json({ message: 'Timeslot not found' });
    }

    // Check if court exists
    const court = await Court.findById(timeslot.court_id);

    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Check if user is the owner of the court
    if (court.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete timeslots for this court' });
    }

    // Delete timeslot
    await CourtTimeslot.delete(id);

    res.status(200).json({ message: 'Timeslot deleted successfully' });
  } catch (error) {
    console.error('Delete timeslot error:', error);
    res.status(500).json({ message: 'Server error while deleting timeslot' });
  }
};

// Get available timeslots for a court
const getAvailableTimeslots = async (req, res) => {
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

    // Get day of week from date
    const dayOfWeek = new Date(date).getDay();

    // Get timeslots for the court and day of week
    const timeslots = await CourtTimeslot.getAvailableByCourtIdAndDay(courtId, dayOfWeek);

    res.status(200).json({ timeslots });
  } catch (error) {
    console.error('Get available timeslots error:', error);
    res.status(500).json({ message: 'Server error while fetching available timeslots' });
  }
};

module.exports = {
  getTimeslotsByCourtId,
  createTimeslot,
  updateTimeslot,
  deleteTimeslot,
  getAvailableTimeslots
};

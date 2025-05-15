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
    const { day_of_week, start_time, end_time, price = 0, specific_date = null, is_available = true } = req.body;

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

    // Validate specific_date format if provided
    if (specific_date && !/^\d{4}-\d{2}-\d{2}$/.test(specific_date)) {
      return res.status(400).json({ message: 'Specific date must be in YYYY-MM-DD format' });
    }

    // Check if the timeslot is within the 2-day restriction window when creating with a non-zero price
    if (Number(price) > 0 && specific_date) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time to start of day

      const timeslotDate = new Date(specific_date);
      timeslotDate.setHours(0, 0, 0, 0); // Reset time to start of day

      // Calculate the difference in days
      const timeDifference = timeslotDate.getTime() - currentDate.getTime();
      const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

      // If the timeslot is less than 2 days in the future, don't allow price changes
      if (daysDifference < 2) {
        return res.status(400).json({
          message: 'Price changes are not allowed for timeslots less than 2 days from now'
        });
      }
    }

    // Create timeslot
    const newTimeslot = await CourtTimeslot.create({
      court_id: courtId,
      day_of_week,
      start_time,
      end_time,
      price: Number(price),
      is_available,
      specific_date
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
    const { day_of_week, start_time, end_time, price, is_available, specific_date } = req.body;

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

    // Validate specific_date format if provided
    if (specific_date && !/^\d{4}-\d{2}-\d{2}$/.test(specific_date)) {
      return res.status(400).json({ message: 'Specific date must be in YYYY-MM-DD format' });
    }

    // Check if the timeslot is within the 2-day restriction window
    if (price !== undefined && timeslot.price !== Number(price) && specific_date) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time to start of day

      const timeslotDate = new Date(specific_date);
      timeslotDate.setHours(0, 0, 0, 0); // Reset time to start of day

      // Calculate the difference in days
      const timeDifference = timeslotDate.getTime() - currentDate.getTime();
      const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

      // If the timeslot is less than 2 days in the future, don't allow price changes
      if (daysDifference < 2) {
        return res.status(400).json({
          message: 'Price changes are not allowed for timeslots less than 2 days from now'
        });
      }
    }

    // Update timeslot
    const updatedTimeslot = await CourtTimeslot.update(id, {
      day_of_week,
      start_time,
      end_time,
      price: price !== undefined ? Number(price) : undefined,
      is_available,
      specific_date
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

    // Get timeslots for the specific date, falling back to day of week if needed
    const timeslots = await CourtTimeslot.getAvailableTimeslotsForDate(courtId, date);

    res.status(200).json({ timeslots });
  } catch (error) {
    console.error('Get available timeslots error:', error);
    res.status(500).json({ message: 'Server error while fetching available timeslots' });
  }
};

// Get timeslots for a specific date
const getTimeslotsByDate = async (req, res) => {
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

    res.status(200).json({ timeslots });
  } catch (error) {
    console.error('Get timeslots by date error:', error);
    res.status(500).json({ message: 'Server error while fetching timeslots' });
  }
};

// Copy day of week timeslots to a specific date
const copyDayOfWeekTimeslotsToDate = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { day_of_week, specific_date } = req.body;

    if (day_of_week === undefined || !specific_date) {
      return res.status(400).json({ message: 'Day of week and specific date are required' });
    }

    // Check if court exists
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Check if user is the owner of the court
    if (court.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to manage timeslots for this court' });
    }

    // Validate day of week (0-6)
    if (day_of_week < 0 || day_of_week > 6) {
      return res.status(400).json({ message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' });
    }

    // Validate specific_date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(specific_date)) {
      return res.status(400).json({ message: 'Specific date must be in YYYY-MM-DD format' });
    }

    // Check if the specific date is within the 2-day restriction window
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to start of day

    const timeslotDate = new Date(specific_date);
    timeslotDate.setHours(0, 0, 0, 0); // Reset time to start of day

    // Calculate the difference in days
    const timeDifference = timeslotDate.getTime() - currentDate.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

    // If the date is less than 2 days in the future, don't allow copying timeslots with prices
    if (daysDifference < 2) {
      // Get the day of week timeslots to check if they have prices
      const dayOfWeekTimeslots = await CourtTimeslot.getByCourtIdAndDay(courtId, day_of_week);
      const hasNonZeroPrices = dayOfWeekTimeslots.some(ts => ts.price > 0);

      if (hasNonZeroPrices) {
        return res.status(400).json({
          message: 'Cannot copy timeslots with prices to dates less than 2 days from now'
        });
      }
    }

    // Check if there are already timeslots for this specific date
    const existingTimeslots = await CourtTimeslot.getByCourtIdAndDate(courtId, specific_date);

    if (existingTimeslots.length > 0) {
      return res.status(400).json({
        message: 'There are already timeslots for this date. Delete them first before copying.',
        timeslots: existingTimeslots
      });
    }

    // Copy timeslots
    const newTimeslots = await CourtTimeslot.copyDayOfWeekTimeslotsToDate(courtId, day_of_week, specific_date);

    res.status(201).json({
      message: 'Timeslots copied successfully',
      timeslots: newTimeslots
    });
  } catch (error) {
    console.error('Copy timeslots error:', error);
    res.status(500).json({ message: 'Server error while copying timeslots' });
  }
};

// Delete all timeslots for a specific date
const deleteTimeslotsByDate = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { specific_date } = req.body;

    if (!specific_date) {
      return res.status(400).json({ message: 'Specific date is required' });
    }

    // Check if court exists
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Check if user is the owner of the court
    if (court.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete timeslots for this court' });
    }

    // Validate specific_date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(specific_date)) {
      return res.status(400).json({ message: 'Specific date must be in YYYY-MM-DD format' });
    }

    // Delete timeslots for the specific date
    const query = `
      DELETE FROM court_timeslots
      WHERE court_id = $1 AND specific_date = $2
      RETURNING id
    `;

    const db = require('../config/db.config');
    const result = await db.query(query, [courtId, specific_date]);
    const deletedCount = result.rowCount;

    res.status(200).json({
      message: `${deletedCount} timeslots deleted successfully for date ${specific_date}`
    });
  } catch (error) {
    console.error('Delete timeslots by date error:', error);
    res.status(500).json({ message: 'Server error while deleting timeslots' });
  }
};

module.exports = {
  getTimeslotsByCourtId,
  createTimeslot,
  updateTimeslot,
  deleteTimeslot,
  getAvailableTimeslots,
  getTimeslotsByDate,
  copyDayOfWeekTimeslotsToDate,
  deleteTimeslotsByDate
};

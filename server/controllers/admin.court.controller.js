const Court = require('../models/court.model');
const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const NotificationService = require('../services/notification.service');
const AdminLog = require('../models/admin.log.model');

// Get all courts with filters
const getAllCourts = async (req, res) => {
  try {
    const {
      name,
      location,
      skill_level,
      owner_id,
      is_available,
      limit = 50,
      offset = 0
    } = req.query;
    
    const courts = await Court.getByFilters({
      name,
      location,
      skill_level,
      owner_id: owner_id ? parseInt(owner_id) : undefined,
      is_available: is_available === 'true' ? true : (is_available === 'false' ? false : undefined),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({ courts });
  } catch (error) {
    console.error('Get all courts error:', error);
    res.status(500).json({ message: 'Server error while fetching courts' });
  }
};

// Get court by ID
const getCourtById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get court
    const court = await Court.findById(id);
    
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }
    
    // Get court owner
    const owner = await User.findById(court.owner_id);
    
    // Get court bookings
    const bookings = await Booking.getByCourtId(id);
    
    res.status(200).json({
      court,
      owner,
      bookings
    });
  } catch (error) {
    console.error('Get court by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching court' });
  }
};

// Update court status (available/unavailable)
const updateCourtStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;
    
    // Check if court exists
    const court = await Court.findById(id);
    
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }
    
    // Update court status
    const updatedCourt = await Court.update(id, {
      ...court,
      is_available
    });
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: is_available ? 'activate_court' : 'deactivate_court',
      entity_type: 'court',
      entity_id: id,
      details: { court_id: id, court_name: court.name }
    });
    
    // Send notification to court owner
    await NotificationService.sendNotification({
      user_id: court.owner_id,
      title: is_available ? 'Court Activated' : 'Court Deactivated',
      message: is_available 
        ? `Your court "${court.name}" has been activated and is now visible to users.` 
        : `Your court "${court.name}" has been deactivated and is no longer visible to users.`,
      type: 'court_status',
      related_id: id,
      related_type: 'court'
    });
    
    res.status(200).json({
      message: `Court ${is_available ? 'activated' : 'deactivated'} successfully`,
      court: updatedCourt
    });
  } catch (error) {
    console.error('Update court status error:', error);
    res.status(500).json({ message: 'Server error while updating court status' });
  }
};

// Add admin notes to court
const addCourtNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    
    // Check if court exists
    const court = await Court.findById(id);
    
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }
    
    // Update court notes
    const updatedCourt = await Court.updateNotes(id, admin_notes);
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'update_court_notes',
      entity_type: 'court',
      entity_id: id,
      details: { court_id: id, court_name: court.name }
    });
    
    res.status(200).json({
      message: 'Court notes updated successfully',
      court: updatedCourt
    });
  } catch (error) {
    console.error('Add court notes error:', error);
    res.status(500).json({ message: 'Server error while updating court notes' });
  }
};

// Get top courts by bookings
const getTopCourtsByBookings = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topCourts = await Court.getTopByBookings(parseInt(limit));
    
    res.status(200).json({ courts: topCourts });
  } catch (error) {
    console.error('Get top courts by bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching top courts' });
  }
};

// Get court statistics
const getCourtStatistics = async (req, res) => {
  try {
    // Get total courts
    const allCourts = await Court.getAll();
    
    // Get active courts
    const activeCourts = allCourts.filter(court => court.is_available).length;
    
    // Get inactive courts
    const inactiveCourts = allCourts.length - activeCourts;
    
    // Get courts by skill level
    const beginnerCourts = allCourts.filter(court => court.skill_level === 'beginner').length;
    const intermediateCourts = allCourts.filter(court => court.skill_level === 'intermediate').length;
    const advancedCourts = allCourts.filter(court => court.skill_level === 'advanced').length;
    const allLevelsCourts = allCourts.filter(court => court.skill_level === 'all').length;
    
    // Get top courts by bookings
    const topCourts = await Court.getTopByBookings(5);
    
    res.status(200).json({
      total_courts: allCourts.length,
      active_courts: activeCourts,
      inactive_courts: inactiveCourts,
      courts_by_skill_level: {
        beginner: beginnerCourts,
        intermediate: intermediateCourts,
        advanced: advancedCourts,
        all: allLevelsCourts
      },
      top_courts: topCourts
    });
  } catch (error) {
    console.error('Get court statistics error:', error);
    res.status(500).json({ message: 'Server error while fetching court statistics' });
  }
};

module.exports = {
  getAllCourts,
  getCourtById,
  updateCourtStatus,
  addCourtNotes,
  getTopCourtsByBookings,
  getCourtStatistics
};

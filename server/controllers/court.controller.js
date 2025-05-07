const Court = require('../models/court.model');
const CourtTimeslot = require('../models/court.timeslot.model');

// Get all courts
const getAllCourts = async (req, res) => {
  try {
    const courts = await Court.getAll();
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
    const court = await Court.findById(id);
    
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }
    
    // Get timeslots for the court
    const timeslots = await CourtTimeslot.getByCourtId(id);
    
    res.status(200).json({ 
      court,
      timeslots
    });
  } catch (error) {
    console.error('Get court by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching court' });
  }
};

// Create court (court owner only)
const createCourt = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      location, 
      hourly_rate, 
      skill_level, 
      image_url 
    } = req.body;
    
    // Validate required fields
    if (!name || !location || !hourly_rate) {
      return res.status(400).json({ message: 'Name, location, and hourly rate are required' });
    }
    
    // Create court
    const newCourt = await Court.create({
      name,
      description,
      location,
      hourly_rate,
      owner_id: req.user.id,
      skill_level: skill_level || 'all',
      image_url,
      is_available: true
    });
    
    res.status(201).json({
      message: 'Court created successfully',
      court: newCourt
    });
  } catch (error) {
    console.error('Create court error:', error);
    res.status(500).json({ message: 'Server error while creating court' });
  }
};

// Update court (court owner only)
const updateCourt = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      location, 
      hourly_rate, 
      skill_level, 
      image_url, 
      is_available 
    } = req.body;
    
    // Check if court exists
    const court = await Court.findById(id);
    
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }
    
    // Check if user is the owner of the court
    if (court.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this court' });
    }
    
    // Update court
    const updatedCourt = await Court.update(id, {
      name,
      description,
      location,
      hourly_rate,
      skill_level,
      image_url,
      is_available
    });
    
    res.status(200).json({
      message: 'Court updated successfully',
      court: updatedCourt
    });
  } catch (error) {
    console.error('Update court error:', error);
    res.status(500).json({ message: 'Server error while updating court' });
  }
};

// Delete court (court owner only)
const deleteCourt = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if court exists
    const court = await Court.findById(id);
    
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }
    
    // Check if user is the owner of the court
    if (court.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this court' });
    }
    
    // Delete court
    await Court.delete(id);
    
    res.status(200).json({ message: 'Court deleted successfully' });
  } catch (error) {
    console.error('Delete court error:', error);
    res.status(500).json({ message: 'Server error while deleting court' });
  }
};

// Search courts
const searchCourts = async (req, res) => {
  try {
    const { query, skill_level } = req.query;
    
    let courts = [];
    
    if (query) {
      courts = await Court.search(query);
    } else {
      courts = await Court.getAll();
    }
    
    // Filter by skill level if provided
    if (skill_level) {
      courts = courts.filter(court => 
        court.skill_level === skill_level || court.skill_level === 'all'
      );
    }
    
    res.status(200).json({ courts });
  } catch (error) {
    console.error('Search courts error:', error);
    res.status(500).json({ message: 'Server error while searching courts' });
  }
};

// Get courts by owner
const getCourtsByOwner = async (req, res) => {
  try {
    const courts = await Court.getByOwnerId(req.user.id);
    res.status(200).json({ courts });
  } catch (error) {
    console.error('Get courts by owner error:', error);
    res.status(500).json({ message: 'Server error while fetching courts' });
  }
};

// Get available courts
const getAvailableCourts = async (req, res) => {
  try {
    const courts = await Court.getAvailable();
    res.status(200).json({ courts });
  } catch (error) {
    console.error('Get available courts error:', error);
    res.status(500).json({ message: 'Server error while fetching available courts' });
  }
};

module.exports = {
  getAllCourts,
  getCourtById,
  createCourt,
  updateCourt,
  deleteCourt,
  searchCourts,
  getCourtsByOwner,
  getAvailableCourts
};

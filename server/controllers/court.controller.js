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
    console.log('Getting court by ID:', id);

    const court = await Court.findById(id);
    console.log('Court found:', court);

    if (!court) {
      console.log('Court not found with ID:', id);
      return res.status(404).json({ message: 'Court not found' });
    }

    // Get timeslots for the court
    const timeslots = await CourtTimeslot.getByCourtId(id);
    console.log('Timeslots found:', timeslots.length);

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
      district,
      district_name,
      hourly_rate = 0,
      image_url
    } = req.body;

    // Validate required fields
    if (!location || !district) {
      return res.status(400).json({ message: 'Location and district are required' });
    }

    // Create court
    const newCourt = await Court.create({
      name,
      description,
      location,
      district,
      district_name,
      hourly_rate,
      owner_id: req.user.id,
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
    console.log('Updating court with ID:', id);
    console.log('Request body:', req.body);

    const {
      name,
      description,
      location,
      district,
      district_name,
      hourly_rate,
      image_url,
      is_available
    } = req.body;

    // Validate required fields
    if (!name || !location || !district) {
      console.error('Missing required fields for court update');
      return res.status(400).json({ message: 'Name, location, and district are required' });
    }

    // Check if court exists
    const court = await Court.findById(id);
    console.log('Existing court:', court);

    if (!court) {
      console.error('Court not found with ID:', id);
      return res.status(404).json({ message: 'Court not found' });
    }

    // Check if user is the owner of the court
    if (court.owner_id !== req.user.id) {
      console.error('User not authorized to update court. User ID:', req.user.id, 'Court owner ID:', court.owner_id);
      return res.status(403).json({ message: 'You are not authorized to update this court' });
    }

    // Prepare update data with defaults for missing fields
    const updateData = {
      name: name || court.name,
      description: description !== undefined ? description : court.description,
      location: location || court.location,
      district: district || court.district,
      district_name: district_name || court.district_name,
      hourly_rate: hourly_rate !== undefined ? hourly_rate : court.hourly_rate,
      skill_level: court.skill_level,
      image_url: image_url !== undefined ? image_url : court.image_url,
      is_available: is_available !== undefined ? is_available : court.is_available
    };

    console.log('Court update data:', updateData);

    // Update court
    const updatedCourt = await Court.update(id, updateData);
    console.log('Updated court:', updatedCourt);

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
    const {
      query,
      skill_level,
      date,
      district,
      location,
      min_price,
      max_price,
      price_range
    } = req.query;

    // Parse price range if provided
    let parsedMinPrice = min_price;
    let parsedMaxPrice = max_price;

    if (price_range && !min_price && !max_price) {
      if (price_range === '1000000+') {
        parsedMinPrice = 1000000;
      } else if (price_range.includes('-')) {
        const [min, max] = price_range.split('-').map(Number);
        parsedMinPrice = min;
        parsedMaxPrice = max;
      }
    }

    // If we have advanced filters (date, district, location, price), use the new searchWithFilters method
    if (date || district || location || parsedMinPrice || parsedMaxPrice) {
      // Prepare location parameter - district can be a code (quan_1) or a full location name
      let locationParam = district;

      // If district is a code like 'quan_1', we need to convert it to a location name
      // This is a simple approach - in a real app, you might have a mapping table
      if (district && district.startsWith('quan_')) {
        // Extract district number and format it for search
        const districtNumber = district.replace('quan_', '');
        locationParam = `Quận ${districtNumber}`;
      } else if (district && district.includes('_')) {
        // Handle other district codes like 'binh_thanh', 'thu_duc', etc.
        // Convert snake_case to title case for search
        locationParam = district
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      const courts = await Court.searchWithFilters({
        query,
        date,
        district: locationParam,
        location: location, // Pass the location parameter as well
        min_price: parsedMinPrice ? Number(parsedMinPrice) : undefined,
        max_price: parsedMaxPrice ? Number(parsedMaxPrice) : undefined
      });

      // Filter by skill level if provided
      const filteredCourts = skill_level
        ? courts.filter(court => court.skill_level === skill_level || court.skill_level === 'all')
        : courts;

      return res.status(200).json({ courts: filteredCourts });
    }

    // Otherwise, use the original search method
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

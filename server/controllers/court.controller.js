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
    const { date } = req.query;
    console.log('Getting court by ID:', id);

    const court = await Court.findById(id);
    console.log('Court found:', court);

    if (!court) {
      console.log('Court not found with ID:', id);
      return res.status(404).json({ message: 'Court not found' });
    }

    // Get timeslots for the court
    let timeslots;
    if (date) {
      // If date is provided, get timeslots for that specific date
      timeslots = await CourtTimeslot.getTimeslotsForDate(id, date);
    } else {
      // Otherwise, get all timeslots
      timeslots = await CourtTimeslot.getByCourtId(id);
    }
    console.log('Timeslots found:', timeslots.length);

    // Get price range for the court
    const priceRange = await CourtTimeslot.getPriceRangeForCourt(id, date);
    court.min_price = priceRange.min_price;
    court.max_price = priceRange.max_price;

    // If min and max are the same, just show one price
    if (priceRange.min_price === priceRange.max_price) {
      court.price_display = `${priceRange.min_price.toLocaleString()} VNĐ`;
    } else {
      court.price_display = `${priceRange.min_price.toLocaleString()} - ${priceRange.max_price.toLocaleString()} VNĐ`;
    }

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

    // If we have price filters, use the timeslot-based price filtering
    if (parsedMinPrice || parsedMaxPrice) {
      // Set default values if only one end of the range is provided
      const minPrice = parsedMinPrice !== undefined ? Number(parsedMinPrice) : 0;
      const maxPrice = parsedMaxPrice !== undefined ? Number(parsedMaxPrice) : 1000000000; // Very high max as default

      // Get court IDs that have timeslots within the price range
      const courtIds = await CourtTimeslot.getCourtsWithinPriceRange(minPrice, maxPrice, date);

      // If no courts match the price range, return empty array
      if (courtIds.length === 0) {
        return res.status(200).json({ courts: [] });
      }

      // Prepare location parameter - district can be a code (quan_1) or a full location name
      let locationParam = district;

      // If district is a code like 'quan_1', we need to convert it to a location name
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

      // Get courts with other filters and then filter by the court IDs
      const allFilteredCourts = await Court.searchWithFilters({
        query,
        date,
        district: locationParam,
        location: location
        // Don't pass min_price and max_price here since we're filtering by court IDs
      });

      // Filter by court IDs from price range
      let courts = allFilteredCourts.filter(court => courtIds.includes(court.id));

      // Filter by skill level if provided
      if (skill_level) {
        courts = courts.filter(court =>
          court.skill_level === skill_level || court.skill_level === 'all'
        );
      }

      // For each court, get the price range for the selected date
      for (const court of courts) {
        const priceRange = await CourtTimeslot.getPriceRangeForCourt(court.id, date);
        court.min_price = priceRange.min_price;
        court.max_price = priceRange.max_price;

        // If min and max are the same, just show one price
        if (priceRange.min_price === priceRange.max_price) {
          court.price_display = `${priceRange.min_price.toLocaleString()} VNĐ`;
        } else {
          court.price_display = `${priceRange.min_price.toLocaleString()} - ${priceRange.max_price.toLocaleString()} VNĐ`;
        }
      }

      return res.status(200).json({ courts });
    }
    // If we have advanced filters (date, district, location) but no price filters
    else if (date || district || location) {
      // Prepare location parameter - district can be a code (quan_1) or a full location name
      let locationParam = district;

      // If district is a code like 'quan_1', we need to convert it to a location name
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

      let courts = await Court.searchWithFilters({
        query,
        date,
        district: locationParam,
        location: location
      });

      // Filter by skill level if provided
      if (skill_level) {
        courts = courts.filter(court =>
          court.skill_level === skill_level || court.skill_level === 'all'
        );
      }

      // For each court, get the price range for the selected date
      for (const court of courts) {
        const priceRange = await CourtTimeslot.getPriceRangeForCourt(court.id, date);
        court.min_price = priceRange.min_price;
        court.max_price = priceRange.max_price;

        // If min and max are the same, just show one price
        if (priceRange.min_price === priceRange.max_price) {
          court.price_display = `${priceRange.min_price.toLocaleString()} VNĐ`;
        } else {
          court.price_display = `${priceRange.min_price.toLocaleString()} - ${priceRange.max_price.toLocaleString()} VNĐ`;
        }
      }

      return res.status(200).json({ courts });
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

    // For each court, get the general price range (not date-specific)
    for (const court of courts) {
      const priceRange = await CourtTimeslot.getPriceRangeForCourt(court.id);
      court.min_price = priceRange.min_price;
      court.max_price = priceRange.max_price;

      // If min and max are the same, just show one price
      if (priceRange.min_price === priceRange.max_price) {
        court.price_display = `${priceRange.min_price.toLocaleString()} VNĐ`;
      } else {
        court.price_display = `${priceRange.min_price.toLocaleString()} - ${priceRange.max_price.toLocaleString()} VNĐ`;
      }
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

    // For each court, get the general price range (not date-specific)
    for (const court of courts) {
      const priceRange = await CourtTimeslot.getPriceRangeForCourt(court.id);
      court.min_price = priceRange.min_price;
      court.max_price = priceRange.max_price;

      // If min and max are the same, just show one price
      if (priceRange.min_price === priceRange.max_price) {
        court.price_display = `${priceRange.min_price.toLocaleString()} VNĐ`;
      } else {
        court.price_display = `${priceRange.min_price.toLocaleString()} - ${priceRange.max_price.toLocaleString()} VNĐ`;
      }
    }

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

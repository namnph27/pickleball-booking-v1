const Promotion = require('../models/promotion.model');
const PromotionUsage = require('../models/promotion.usage.model');
const PromotionService = require('../services/promotion.service');
const NotificationService = require('../services/notification.service');

// Get all active promotions
const getActivePromotions = async (req, res) => {
  try {
    const promotions = await Promotion.getActive();
    res.status(200).json({ promotions });
  } catch (error) {
    console.error('Get active promotions error:', error);
    res.status(500).json({ message: 'Server error while fetching promotions' });
  }
};

// Verify promotion code
const verifyPromotionCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ message: 'Promotion code is required' });
    }

    // Use the promotion service to verify the code
    const verificationResult = await PromotionService.verifyPromotionCode(code, req.user.id);

    if (!verificationResult.valid) {
      return res.status(400).json({
        valid: false,
        message: verificationResult.message
      });
    }

    res.status(200).json({
      valid: true,
      message: 'Promotion code is valid',
      promotion: verificationResult.promotion
    });
  } catch (error) {
    console.error('Verify promotion code error:', error);
    res.status(500).json({ message: 'Server error while verifying promotion code' });
  }
};

// Create promotion (admin only)
const createPromotion = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_percent,
      start_date,
      end_date,
      is_active,
      usage_limit,
      user_specific,
      specific_user_id
    } = req.body;

    // Validate required fields
    if (!discount_percent || !start_date || !end_date) {
      return res.status(400).json({
        message: 'Discount percent, start date, and end date are required'
      });
    }

    // Validate discount percent (0-100)
    if (discount_percent < 0 || discount_percent > 100) {
      return res.status(400).json({ message: 'Discount percent must be between 0 and 100' });
    }

    // If code is provided, check if it already exists
    if (code) {
      const existingPromotion = await Promotion.findByCode(code);

      if (existingPromotion) {
        return res.status(400).json({ message: 'Promotion code already exists' });
      }
    }

    // Create promotion using the service
    const promotionData = {
      code,
      description,
      discount_percent,
      start_date,
      end_date,
      is_active: is_active !== undefined ? is_active : true,
      usage_limit,
      user_specific: user_specific || false,
      specific_user_id
    };

    const newPromotion = await PromotionService.createPromotion(promotionData);

    res.status(201).json({
      message: 'Promotion created successfully',
      promotion: newPromotion
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ message: 'Server error while creating promotion' });
  }
};

// Update promotion (admin only)
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, discount_percent, start_date, end_date, is_active } = req.body;

    // Check if promotion exists
    const promotion = await Promotion.findById(id);

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    // Validate discount percent if provided
    if (discount_percent !== undefined && (discount_percent < 0 || discount_percent > 100)) {
      return res.status(400).json({ message: 'Discount percent must be between 0 and 100' });
    }

    // Update promotion
    const updatedPromotion = await Promotion.update(id, {
      description,
      discount_percent,
      start_date,
      end_date,
      is_active
    });

    res.status(200).json({
      message: 'Promotion updated successfully',
      promotion: updatedPromotion
    });
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({ message: 'Server error while updating promotion' });
  }
};

// Delete promotion (admin only)
const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if promotion exists
    const promotion = await Promotion.findById(id);

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    // Delete promotion
    await Promotion.delete(id);

    res.status(200).json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ message: 'Server error while deleting promotion' });
  }
};

// Get all promotions (admin only)
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.getAll();
    res.status(200).json({ promotions });
  } catch (error) {
    console.error('Get all promotions error:', error);
    res.status(500).json({ message: 'Server error while fetching promotions' });
  }
};

// Apply promotion to booking
const applyPromotion = async (req, res) => {
  try {
    const { code, booking_id, total_price } = req.body;

    if (!code || !booking_id || !total_price) {
      return res.status(400).json({
        message: 'Promotion code, booking ID, and total price are required'
      });
    }

    // Apply promotion
    const result = await PromotionService.applyPromotion({
      code,
      userId: req.user.id,
      bookingId: booking_id,
      totalPrice: total_price
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Promotion applied successfully',
      promotion: result.promotion,
      discount_amount: result.discount_amount,
      discounted_price: result.discounted_price
    });
  } catch (error) {
    console.error('Apply promotion error:', error);
    res.status(500).json({ message: 'Server error while applying promotion' });
  }
};

// Get promotion statistics (admin only)
const getPromotionStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if promotion exists
    const promotion = await Promotion.findById(id);

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    // Get statistics
    const statistics = await PromotionService.getPromotionStatistics(id);

    res.status(200).json(statistics);
  } catch (error) {
    console.error('Get promotion statistics error:', error);
    res.status(500).json({ message: 'Server error while fetching promotion statistics' });
  }
};

// Create welcome promotion for new user
const createWelcomePromotion = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Create welcome promotion
    const promotion = await PromotionService.createWelcomePromotion(user_id);

    res.status(201).json({
      message: 'Welcome promotion created successfully',
      promotion
    });
  } catch (error) {
    console.error('Create welcome promotion error:', error);
    res.status(500).json({ message: 'Server error while creating welcome promotion' });
  }
};

// Create birthday promotion
const createBirthdayPromotion = async (req, res) => {
  try {
    const { user_id, user_name } = req.body;

    if (!user_id || !user_name) {
      return res.status(400).json({ message: 'User ID and name are required' });
    }

    // Create birthday promotion
    const promotion = await PromotionService.createBirthdayPromotion(user_id, user_name);

    res.status(201).json({
      message: 'Birthday promotion created successfully',
      promotion
    });
  } catch (error) {
    console.error('Create birthday promotion error:', error);
    res.status(500).json({ message: 'Server error while creating birthday promotion' });
  }
};

// Create seasonal promotion
const createSeasonalPromotion = async (req, res) => {
  try {
    const { season, discount_percent, start_date, end_date } = req.body;

    if (!season || !discount_percent || !start_date || !end_date) {
      return res.status(400).json({
        message: 'Season, discount percent, start date, and end date are required'
      });
    }

    // Validate discount percent (0-100)
    if (discount_percent < 0 || discount_percent > 100) {
      return res.status(400).json({ message: 'Discount percent must be between 0 and 100' });
    }

    // Create seasonal promotion
    const promotion = await PromotionService.createSeasonalPromotion(
      season,
      discount_percent,
      new Date(start_date),
      new Date(end_date)
    );

    res.status(201).json({
      message: 'Seasonal promotion created successfully',
      promotion
    });
  } catch (error) {
    console.error('Create seasonal promotion error:', error);
    res.status(500).json({ message: 'Server error while creating seasonal promotion' });
  }
};

module.exports = {
  getActivePromotions,
  verifyPromotionCode,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getAllPromotions,
  applyPromotion,
  getPromotionStatistics,
  createWelcomePromotion,
  createBirthdayPromotion,
  createSeasonalPromotion
};

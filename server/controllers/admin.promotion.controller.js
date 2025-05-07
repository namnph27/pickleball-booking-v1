const Promotion = require('../models/promotion.model');
const PromotionUsage = require('../models/promotion.usage.model');
const PromotionService = require('../services/promotion.service');
const NotificationService = require('../services/notification.service');
const AdminLog = require('../models/admin.log.model');

// Get all promotions with filters
const getAllPromotions = async (req, res) => {
  try {
    const {
      code,
      is_active,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;
    
    const promotions = await Promotion.getByFilters({
      code,
      is_active: is_active === 'true' ? true : (is_active === 'false' ? false : undefined),
      start_date,
      end_date,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({ promotions });
  } catch (error) {
    console.error('Get all promotions error:', error);
    res.status(500).json({ message: 'Server error while fetching promotions' });
  }
};

// Get promotion by ID
const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get promotion
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    
    // Get promotion usages
    const usages = await PromotionUsage.getByPromotionId(id);
    
    // Get promotion statistics
    const statistics = await PromotionService.getPromotionStatistics(id);
    
    res.status(200).json({
      promotion,
      usages,
      statistics
    });
  } catch (error) {
    console.error('Get promotion by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching promotion' });
  }
};

// Create promotion
const createPromotion = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_percent,
      start_date,
      end_date,
      is_active = true,
      user_specific = false,
      specific_user_id = null,
      usage_limit = null
    } = req.body;
    
    // Validate required fields
    if (!code || !description || !discount_percent || !start_date || !end_date) {
      return res.status(400).json({ message: 'Code, description, discount percent, start date, and end date are required' });
    }
    
    // Check if code already exists
    const existingPromotion = await Promotion.findByCode(code);
    if (existingPromotion) {
      return res.status(400).json({ message: 'Promotion code already exists' });
    }
    
    // Create promotion
    const promotion = await Promotion.create({
      code,
      description,
      discount_percent,
      start_date,
      end_date,
      is_active,
      user_specific,
      specific_user_id,
      usage_limit
    });
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'create_promotion',
      entity_type: 'promotion',
      entity_id: promotion.id,
      details: { promotion_code: code }
    });
    
    // Send notification to specific user if user-specific
    if (user_specific && specific_user_id) {
      await NotificationService.sendNotification({
        user_id: specific_user_id,
        title: 'New Promotion Code',
        message: `You have received a new promotion code: ${code}. ${description}`,
        type: 'promotion',
        related_id: promotion.id,
        related_type: 'promotion'
      });
    }
    // Send system notification if not user-specific
    else if (!user_specific) {
      await NotificationService.sendSystemNotification(
        'New Promotion Available',
        `Use code ${code} to get ${discount_percent}% off your next booking! ${description}`,
        'promotion',
        promotion.id,
        'promotion'
      );
    }
    
    res.status(201).json({
      message: 'Promotion created successfully',
      promotion
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ message: 'Server error while creating promotion' });
  }
};

// Update promotion
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      discount_percent,
      start_date,
      end_date,
      is_active,
      usage_limit
    } = req.body;
    
    // Check if promotion exists
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    
    // Update promotion
    const updatedPromotion = await Promotion.update(id, {
      description: description || promotion.description,
      discount_percent: discount_percent || promotion.discount_percent,
      start_date: start_date || promotion.start_date,
      end_date: end_date || promotion.end_date,
      is_active: is_active !== undefined ? is_active : promotion.is_active,
      usage_limit: usage_limit !== undefined ? usage_limit : promotion.usage_limit
    });
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'update_promotion',
      entity_type: 'promotion',
      entity_id: id,
      details: { promotion_code: promotion.code }
    });
    
    // Send notification to specific user if user-specific
    if (promotion.user_specific && promotion.specific_user_id) {
      await NotificationService.sendNotification({
        user_id: promotion.specific_user_id,
        title: 'Promotion Updated',
        message: `Your promotion code ${promotion.code} has been updated. Please check the details.`,
        type: 'promotion',
        related_id: id,
        related_type: 'promotion'
      });
    }
    
    res.status(200).json({
      message: 'Promotion updated successfully',
      promotion: updatedPromotion
    });
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({ message: 'Server error while updating promotion' });
  }
};

// Delete promotion
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
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'delete_promotion',
      entity_type: 'promotion',
      entity_id: id,
      details: { promotion_code: promotion.code }
    });
    
    res.status(200).json({
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ message: 'Server error while deleting promotion' });
  }
};

// Get promotion statistics
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

// Create welcome promotion
const createWelcomePromotion = async (req, res) => {
  try {
    const { user_id, discount_percent = 10 } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if user exists
    const user = await User.findById(user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create welcome promotion
    const promotion = await PromotionService.createWelcomePromotion(user_id, user.name, discount_percent);
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'create_welcome_promotion',
      entity_type: 'promotion',
      entity_id: promotion.id,
      details: { user_id, promotion_code: promotion.code }
    });
    
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
    const { user_id, discount_percent = 15 } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if user exists
    const user = await User.findById(user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create birthday promotion
    const promotion = await PromotionService.createBirthdayPromotion(user_id, user.name, discount_percent);
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'create_birthday_promotion',
      entity_type: 'promotion',
      entity_id: promotion.id,
      details: { user_id, promotion_code: promotion.code }
    });
    
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
    const { 
      name, 
      description, 
      discount_percent, 
      start_date, 
      end_date 
    } = req.body;
    
    if (!name || !description || !discount_percent || !start_date || !end_date) {
      return res.status(400).json({ 
        message: 'Name, description, discount percent, start date, and end date are required' 
      });
    }
    
    // Create seasonal promotion
    const promotion = await PromotionService.createSeasonalPromotion(
      name,
      description,
      discount_percent,
      start_date,
      end_date
    );
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'create_seasonal_promotion',
      entity_type: 'promotion',
      entity_id: promotion.id,
      details: { promotion_code: promotion.code, name }
    });
    
    res.status(201).json({
      message: 'Seasonal promotion created successfully',
      promotion
    });
  } catch (error) {
    console.error('Create seasonal promotion error:', error);
    res.status(500).json({ message: 'Server error while creating seasonal promotion' });
  }
};

// Get promotion usage report
const getPromotionUsageReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Get all promotions
    const promotions = await Promotion.getAll();
    
    // Get usage statistics for each promotion
    const usageReport = await Promise.all(
      promotions.map(async (promotion) => {
        const statistics = await PromotionService.getPromotionStatistics(promotion.id);
        return {
          id: promotion.id,
          code: promotion.code,
          description: promotion.description,
          discount_percent: promotion.discount_percent,
          start_date: promotion.start_date,
          end_date: promotion.end_date,
          is_active: promotion.is_active,
          usage_count: statistics.usage_count,
          total_discount: statistics.total_discount,
          unique_users: statistics.unique_users,
          conversion_rate: statistics.conversion_rate
        };
      })
    );
    
    // Sort by usage count (descending)
    usageReport.sort((a, b) => b.usage_count - a.usage_count);
    
    res.status(200).json({ promotions: usageReport });
  } catch (error) {
    console.error('Get promotion usage report error:', error);
    res.status(500).json({ message: 'Server error while fetching promotion usage report' });
  }
};

module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionStatistics,
  createWelcomePromotion,
  createBirthdayPromotion,
  createSeasonalPromotion,
  getPromotionUsageReport
};

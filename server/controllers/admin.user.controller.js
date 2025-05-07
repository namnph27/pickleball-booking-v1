const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const RewardHistory = require('../models/reward.history.model');
const NotificationService = require('../services/notification.service');
const AdminLog = require('../models/admin.log.model');

// Get all users with filters
const getAllUsers = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      limit = 50,
      offset = 0
    } = req.query;
    
    const users = await User.getByFilters({
      name,
      email,
      role,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's bookings
    const bookings = await Booking.getByUserId(id);
    
    // Get user's reward history
    const rewardHistory = await RewardHistory.getByUserId(id);
    
    // Get user's courts (if court owner)
    let courts = [];
    if (user.role === 'court_owner') {
      courts = await Court.getByOwnerId(id);
    }
    
    res.status(200).json({
      user,
      bookings,
      reward_history: rewardHistory,
      courts
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
};

// Update user status (active/inactive)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    // Check if user exists
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user status
    const updatedUser = await User.updateStatus(id, is_active);
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: is_active ? 'activate_user' : 'deactivate_user',
      entity_type: 'user',
      entity_id: id,
      details: { user_id: id, user_email: user.email }
    });
    
    // Send notification to user
    await NotificationService.sendNotification({
      user_id: id,
      title: is_active ? 'Account Activated' : 'Account Deactivated',
      message: is_active 
        ? 'Your account has been activated. You can now use all features of the platform.' 
        : 'Your account has been deactivated. Please contact support for more information.',
      type: 'account_status',
      related_id: null,
      related_type: 'user'
    });
    
    res.status(200).json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
};

// Verify court owner
const verifyCourtOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;
    
    // Check if user exists and is a court owner
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'court_owner') {
      return res.status(400).json({ message: 'User is not a court owner' });
    }
    
    // Update verification status
    const updatedUser = await User.verifyCourtOwner(id, is_verified);
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: is_verified ? 'verify_court_owner' : 'unverify_court_owner',
      entity_type: 'user',
      entity_id: id,
      details: { user_id: id, user_email: user.email }
    });
    
    // Send notification to user
    await NotificationService.sendNotification({
      user_id: id,
      title: is_verified ? 'Account Verified' : 'Account Verification Revoked',
      message: is_verified 
        ? 'Your court owner account has been verified. You can now add and manage courts.' 
        : 'Your court owner verification has been revoked. Please contact support for more information.',
      type: 'account_verification',
      related_id: null,
      related_type: 'user'
    });
    
    res.status(200).json({
      message: `Court owner ${is_verified ? 'verified' : 'unverified'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Verify court owner error:', error);
    res.status(500).json({ message: 'Server error while verifying court owner' });
  }
};

// Add admin notes to user
const addUserNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    
    // Check if user exists
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user notes
    const updatedUser = await User.updateNotes(id, admin_notes);
    
    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'update_user_notes',
      entity_type: 'user',
      entity_id: id,
      details: { user_id: id, user_email: user.email }
    });
    
    res.status(200).json({
      message: 'User notes updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Add user notes error:', error);
    res.status(500).json({ message: 'Server error while updating user notes' });
  }
};

// Get user statistics
const getUserStatistics = async (req, res) => {
  try {
    const statistics = await User.getStatistics();
    
    res.status(200).json(statistics);
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ message: 'Server error while fetching user statistics' });
  }
};

// Get inactive users
const getInactiveUsers = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const inactiveUsers = await User.getInactiveUsers(parseInt(days));
    
    res.status(200).json({ users: inactiveUsers });
  } catch (error) {
    console.error('Get inactive users error:', error);
    res.status(500).json({ message: 'Server error while fetching inactive users' });
  }
};

// Get top users by reward points
const getTopUsersByPoints = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topUsers = await User.getTopUsersByPoints(parseInt(limit));
    
    res.status(200).json({ users: topUsers });
  } catch (error) {
    console.error('Get top users by points error:', error);
    res.status(500).json({ message: 'Server error while fetching top users' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  verifyCourtOwner,
  addUserNotes,
  getUserStatistics,
  getInactiveUsers,
  getTopUsersByPoints
};

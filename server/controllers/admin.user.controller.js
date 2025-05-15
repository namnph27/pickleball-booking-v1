const User = require('../models/user.model');
const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const RewardHistory = require('../models/reward.history.model');
const NotificationService = require('../services/notification.service');
const AdminLog = require('../models/admin.log.model');

// Get all users with filters
const getAllUsers = async (req, res) => {
  try {
    console.log('Admin getAllUsers called with query:', req.query);

    const {
      name,
      email,
      role,
      limit = 50,
      offset = 0
    } = req.query;

    // Validate pagination parameters
    const parsedLimit = parseInt(limit) || 50;
    const parsedOffset = parseInt(offset) || 0;

    console.log('Fetching users with filters:', {
      name,
      email,
      role,
      limit: parsedLimit,
      offset: parsedOffset
    });

    const users = await User.getByFilters({
      name,
      email,
      role,
      limit: parsedLimit,
      offset: parsedOffset
    });

    console.log(`Found ${users.length} users`);

    // Ensure all users have the required fields
    const processedUsers = users.map(user => ({
      ...user,
      is_active: user.is_active !== undefined ? user.is_active : true,
      is_verified: user.is_verified !== undefined ? user.is_verified : false
    }));

    res.status(200).json({
      users: processedUsers,
      total: processedUsers.length, // Thêm tổng số người dùng để phân trang
      page: Math.floor(parsedOffset / parsedLimit) + 1,
      limit: parsedLimit
    });
  } catch (error) {
    console.error('Get all users error:', error);
    console.error('Error stack:', error.stack);
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

// Create new user
const createUser = async (req, res) => {
  try {
    console.log('Admin createUser called with body:', req.body);
    const { name, email, password, phone, role, id_card, tax_code } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.error('Missing required fields');
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format');
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      console.error('Password too short');
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.error('Email already in use:', email);
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Validate court owner fields if applicable
    if (role === 'court_owner' && (!id_card || !tax_code)) {
      console.error('Missing court owner required fields');
      return res.status(400).json({ message: 'ID card and tax code are required for court owners' });
    }

    // Create user
    const userData = { name, email, password, phone, role };

    // Add court owner specific fields if applicable
    if (role === 'court_owner') {
      userData.id_card = id_card;
      userData.tax_code = tax_code;

      // Set approval status to approved for admin-created court owners
      userData.approval_status = 'approved';
    }

    console.log('Creating user with data:', userData);
    const newUser = await User.create(userData);
    console.log('User created successfully:', newUser);

    // Log admin action
    try {
      await AdminLog.create({
        admin_id: req.admin.id,
        action_type: 'create_user',
        entity_type: 'user',
        entity_id: newUser.id,
        details: { user_id: newUser.id, user_email: newUser.email, user_role: newUser.role }
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Error creating admin log:', logError);
    }

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    console.error('Error stack:', error.stack);

    // Check for specific error messages
    if (error.message) {
      if (error.message.includes('Email already in use')) {
        return res.status(400).json({ message: 'Email already in use' });
      } else if (error.message.includes('Database schema issue')) {
        return res.status(500).json({
          message: 'Database configuration error. Please contact the administrator.',
          details: error.message
        });
      }
    }

    // Check for specific database errors
    if (error.code) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ message: 'Email already in use' });
      } else if (error.code === '42P01') { // Undefined table
        return res.status(500).json({ message: 'Database schema error: Table does not exist' });
      } else if (error.code === '42703') { // Undefined column
        return res.status(500).json({ message: 'Database schema error: Column does not exist' });
      } else if (error.code === '28P01') { // Invalid password
        return res.status(500).json({ message: 'Database connection error: Invalid password' });
      } else if (error.code === '3D000') { // Database does not exist
        return res.status(500).json({ message: 'Database connection error: Database does not exist' });
      } else if (error.code === 'ECONNREFUSED') { // Connection refused
        return res.status(500).json({ message: 'Database connection error: Connection refused' });
      }
    }

    res.status(500).json({
      message: 'Server error while creating user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, id_card, tax_code } = req.body;

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already in use by another user
    if (email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ message: 'Email already in use by another user' });
      }
    }

    // Update user data
    const userData = { name, email, phone };

    // If role is changing to court_owner, add court owner specific fields
    if (role === 'court_owner' && user.role !== 'court_owner') {
      userData.role = role;
      userData.id_card = id_card;
      userData.tax_code = tax_code;
      userData.approval_status = 'approved'; // Admin-updated users are automatically approved
    }
    // If role is changing from court_owner, remove court owner specific fields
    else if (role !== 'court_owner' && user.role === 'court_owner') {
      userData.role = role;
      userData.id_card = null;
      userData.tax_code = null;
      userData.approval_status = null;
    }
    // If role is not changing but is court_owner, update court owner specific fields
    else if (role === 'court_owner' && user.role === 'court_owner') {
      userData.id_card = id_card;
      userData.tax_code = tax_code;
    }

    const updatedUser = await User.update(id, userData);

    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'update_user',
      entity_type: 'user',
      entity_id: id,
      details: { user_id: id, user_email: updatedUser.email }
    });

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error while updating user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await User.delete(id);

    // Log admin action
    await AdminLog.create({
      admin_id: req.admin.id,
      action_type: 'delete_user',
      entity_type: 'user',
      entity_id: id,
      details: { user_id: id, user_email: user.email, user_role: user.role }
    });

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  verifyCourtOwner,
  addUserNotes,
  getUserStatistics,
  getInactiveUsers,
  getTopUsersByPoints
};

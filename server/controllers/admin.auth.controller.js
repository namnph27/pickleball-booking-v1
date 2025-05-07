const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');

// Admin login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if admin exists
    const admin = await Admin.findByUsername(username);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await Admin.verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login time
    await Admin.updateLastLogin(admin.id);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, is_super_admin: admin.is_super_admin, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name,
        is_super_admin: admin.is_super_admin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current admin profile
const getProfile = async (req, res) => {
  try {
    // Admin is already attached to req by auth middleware
    res.status(200).json({
      admin: {
        id: req.admin.id,
        username: req.admin.username,
        email: req.admin.email,
        full_name: req.admin.full_name,
        is_super_admin: req.admin.is_super_admin,
        last_login: req.admin.last_login,
        created_at: req.admin.created_at
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Change admin password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    // Get admin with password
    const admin = await Admin.findById(req.admin.id);
    
    // Verify current password
    const isPasswordValid = await Admin.verifyPassword(current_password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    await Admin.updatePassword(admin.id, new_password);
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
};

// Create new admin (super admin only)
const createAdmin = async (req, res) => {
  try {
    // Check if requester is super admin
    if (!req.admin.is_super_admin) {
      return res.status(403).json({ message: 'Only super admins can create new admins' });
    }
    
    const { username, password, email, full_name, is_super_admin } = req.body;
    
    // Check if username or email already exists
    const existingUsername = await Admin.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const existingEmail = await Admin.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Create new admin
    const newAdmin = await Admin.create({
      username,
      password,
      email,
      full_name,
      is_super_admin: is_super_admin || false
    });
    
    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        full_name: newAdmin.full_name,
        is_super_admin: newAdmin.is_super_admin,
        created_at: newAdmin.created_at
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error while creating admin' });
  }
};

module.exports = {
  login,
  getProfile,
  changePassword,
  createAdmin
};

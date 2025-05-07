const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');

// Middleware to verify admin JWT token
const verifyAdminToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is for admin
    if (decoded.type !== 'admin') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    
    // Check if admin exists
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }
    
    // Add admin to request object
    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check if admin is super admin
const isSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.is_super_admin) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Super admin role required' });
  }
};

module.exports = {
  verifyAdminToken,
  isSuperAdmin
};

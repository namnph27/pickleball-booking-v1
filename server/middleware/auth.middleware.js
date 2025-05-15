const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  console.log('verifyToken middleware: Checking authorization for path:', req.path);
  console.log('verifyToken middleware: Headers:', JSON.stringify(req.headers));

  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('verifyToken middleware: Authorization header:', authHeader);

    const token = authHeader?.split(' ')[1];
    console.log('verifyToken middleware: Extracted token:', token ? 'Present (not shown for security)' : 'Missing');

    if (!token) {
      console.log('verifyToken middleware: No token provided');
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Verify token
    console.log('verifyToken middleware: Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('verifyToken middleware: Token decoded successfully:', decoded.id, decoded.role, decoded.type);

    // Check if token is for user (not admin)
    if (decoded.type === 'admin') {
      console.log('verifyToken middleware: Invalid token type (admin token used for user route)');
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Check if user exists
    console.log('verifyToken middleware: Finding user with ID:', decoded.id);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('verifyToken middleware: User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('verifyToken middleware: User found:', user.id, user.email, user.role);

    // Add user to request object
    req.user = user;
    console.log('verifyToken middleware: Authentication successful, proceeding to next middleware/controller');
    next();
  } catch (error) {
    console.error('verifyToken middleware: Error details:', error);

    if (error.name === 'JsonWebTokenError') {
      console.log('verifyToken middleware: Invalid token error');
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      console.log('verifyToken middleware: Token expired error');
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check if user is court owner
const isCourtOwner = (req, res, next) => {
  if (req.user && req.user.role === 'court_owner') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Court owner role required' });
  }
};

module.exports = {
  verifyToken,
  isCourtOwner
};

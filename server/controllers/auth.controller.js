const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Register a new user
const register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { name, email, password, phone, role, id_card, tax_code } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields for registration');
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Validate required fields for court owner
    if (role === 'court_owner' && (!id_card || !tax_code)) {
      console.log('Missing required fields for court owner registration');
      return res.status(400).json({ message: 'ID card number and tax code are required for court owners' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      phone,
      role: role || 'customer' // Default role is customer
    };

    // Add court owner specific fields if applicable
    if (role === 'court_owner') {
      userData.id_card = id_card;
      userData.tax_code = tax_code;
    }

    const newUser = await User.create(userData);

    console.log('New user created:', { id: newUser.id, email: newUser.email, role: newUser.role });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Tạo thông báo phù hợp dựa trên vai trò
    let message = 'User registered successfully';
    if (role === 'court_owner') {
      message = 'Registration successful. Your account is pending approval by an administrator.';
    }

    res.status(201).json({
      message,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        approval_status: newUser.approval_status
      },
      requires_approval: role === 'court_owner'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại email hoặc đăng ký tài khoản mới.' });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Wrong password' });
    }

    // Kiểm tra trạng thái phê duyệt cho chủ sân
    if (user.role === 'court_owner') {
      // Cho phép đăng nhập với tài khoản đang chờ phê duyệt hoặc bị từ chối, nhưng đánh dấu trạng thái
      // Frontend sẽ xử lý chuyển hướng đến trang pending-approval hoặc rejected-account
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Chuẩn bị thông tin người dùng để trả về
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Thêm trạng thái phê duyệt nếu là chủ sân
    if (user.role === 'court_owner') {
      userResponse.approval_status = user.approval_status || 'pending';
    }

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const userResponse = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      created_at: req.user.created_at
    };

    // Thêm trạng thái phê duyệt nếu là chủ sân
    if (req.user.role === 'court_owner') {
      userResponse.approval_status = req.user.approval_status || 'pending';
    }

    res.status(200).json({
      user: userResponse
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Update user
    const updatedUser = await User.update(req.user.id, {
      name,
      email: req.user.email, // Email cannot be changed
      phone
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id);

    // Verify current password
    const isPasswordValid = await User.verifyPassword(current_password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    await User.updatePassword(user.id, new_password);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
};

// Setup 2FA
const setup2FA = async (req, res) => {
  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `PickleballBooking:${req.user.email}`
    });

    // Save secret to user
    await User.update2FASecret(req.user.id, secret.base32);

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      message: '2FA setup initiated',
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({ message: 'Server error while setting up 2FA' });
  }
};

// Verify and enable 2FA
const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;

    // Get user with 2FA secret
    const user = await User.findById(req.user.id);

    if (!user.twofa_secret) {
      return res.status(400).json({ message: '2FA not set up yet' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    // Enable 2FA
    await User.enable2FA(user.id);

    res.status(200).json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ message: 'Server error while verifying 2FA' });
  }
};

// Disable 2FA
const disable2FA = async (req, res) => {
  try {
    // Disable 2FA
    await User.disable2FA(req.user.id);

    res.status(200).json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ message: 'Server error while disabling 2FA' });
  }
};

// Verify 2FA during login
const verify2FALogin = async (req, res) => {
  try {
    const { email, token } = req.body;

    // Get user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại email hoặc đăng ký tài khoản mới.' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(401).json({ message: 'Mã xác thực không hợp lệ. Vui lòng kiểm tra lại mã trong ứng dụng xác thực của bạn.' });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user.id, role: user.role, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Chuẩn bị thông tin người dùng để trả về
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Thêm trạng thái phê duyệt nếu là chủ sân
    if (user.role === 'court_owner') {
      userResponse.approval_status = user.approval_status || 'pending';
    }

    res.status(200).json({
      message: 'Login successful',
      token: jwtToken,
      user: userResponse
    });
  } catch (error) {
    console.error('Verify 2FA login error:', error);
    res.status(500).json({ message: 'Server error during 2FA verification' });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`Attempting to delete account for user ID: ${userId}, role: ${userRole}`);

    // Nếu là chủ sân, cần xử lý đặc biệt
    if (userRole === 'court_owner') {
      console.log('Deleting court owner account, checking for related courts...');

      // Kiểm tra xem chủ sân có sân nào không
      const db = require('../config/db.config');
      const courtCheckQuery = 'SELECT COUNT(*) as count FROM courts WHERE owner_id = $1';
      const courtResult = await db.query(courtCheckQuery, [userId]);

      if (courtResult.rows[0].count > 0) {
        console.log(`User has ${courtResult.rows[0].count} courts, will be deleted via CASCADE`);
      }
    }

    // Delete user
    const deletedUser = await User.delete(userId);

    if (!deletedUser) {
      console.log(`User ID ${userId} not found or could not be deleted`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`User ID ${userId} deleted successfully`);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    // Trả về thông báo lỗi chi tiết hơn
    const errorMessage = error.message || 'Server error while deleting account';
    res.status(500).json({ message: errorMessage });
  }
};

// Delete rejected account
const deleteRejectedAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const approvalStatus = req.user.approval_status;

    console.log(`Attempting to delete rejected account for user ID: ${userId}, role: ${userRole}, status: ${approvalStatus}`);

    // Chỉ cho phép xóa tài khoản chủ sân bị từ chối
    if (userRole !== 'court_owner' || approvalStatus !== 'rejected') {
      return res.status(403).json({ message: 'Only rejected court owner accounts can be deleted with this endpoint' });
    }

    // Delete user
    const deletedUser = await User.delete(userId);

    if (!deletedUser) {
      console.log(`User ID ${userId} not found or could not be deleted`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Rejected court owner account ID ${userId} deleted successfully`);
    res.status(200).json({ message: 'Rejected account deleted successfully' });
  } catch (error) {
    console.error('Delete rejected account error:', error);
    // Trả về thông báo lỗi chi tiết hơn
    const errorMessage = error.message || 'Server error while deleting rejected account';
    res.status(500).json({ message: errorMessage });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Create password reset token
    const resetData = await User.createPasswordResetToken(email);

    if (!resetData) {
      // Không trả về lỗi cụ thể để tránh tiết lộ thông tin người dùng
      return res.status(200).json({
        message: 'If your email is registered, you will receive a password reset link shortly'
      });
    }

    // Trong môi trường thực tế, gửi email với link reset password
    // Ví dụ: await sendPasswordResetEmail(resetData.user.email, resetData.resetToken);

    // Tạm thời log token để test
    console.log('Password reset token:', resetData.resetToken);
    console.log('Reset link would be:', `${process.env.FRONTEND_URL}/reset-password/${resetData.resetToken}`);

    res.status(200).json({
      message: 'If your email is registered, you will receive a password reset link shortly',
      // Trong môi trường phát triển, trả về token để test
      resetToken: process.env.NODE_ENV === 'development' ? resetData.resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error while processing forgot password request' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password, password_confirmation } = req.body;

    // Validate required fields
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    // Validate password confirmation
    if (password !== password_confirmation) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Reset password with token
    const user = await User.resetPasswordWithToken(token, password);

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  setup2FA,
  verify2FA,
  disable2FA,
  verify2FALogin,
  deleteAccount,
  deleteRejectedAccount,
  forgotPassword,
  resetPassword
};

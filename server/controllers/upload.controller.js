const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Handle file upload
const uploadFile = async (req, res) => {
  try {
    console.log('Upload request received:', req.body);
    console.log('Files received:', req.files);

    if (!req.files || Object.keys(req.files).length === 0) {
      console.error('No files were uploaded');
      return res.status(400).json({ message: 'No files were uploaded' });
    }

    const file = req.files.file;
    console.log('File received:', file.name, file.mimetype, file.size);
    const fileType = req.body.type || 'general';

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, JPG and GIF are allowed' });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB' });
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../public/uploads', fileType);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExt = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // Move file to upload directory
    await file.mv(filePath);

    // Return file URL
    const fileUrl = `/uploads/${fileType}/${fileName}`;

    res.status(200).json({
      message: 'File uploaded successfully',
      url: fileUrl
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ message: 'Server error while uploading file' });
  }
};

module.exports = {
  uploadFile
};

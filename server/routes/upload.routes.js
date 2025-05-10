const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Upload file route (protected)
router.post('/', verifyToken, uploadController.uploadFile);

module.exports = router;

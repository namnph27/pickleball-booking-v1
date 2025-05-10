const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const fileUpload = require('express-fileupload');
const path = require('path');
const socketService = require('./services/socket.service');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
socketService.initialize(server);

// Middleware
// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

// Configure Helmet but disable contentSecurityPolicy for local development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  abortOnLimit: true,
  createParentPath: true
}));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Pickleball Court Booking API' });
});

// Import routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/courts', require('./routes/court.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/bookings/join', require('./routes/booking.join.routes'));
app.use('/api/promotions', require('./routes/promotion.routes'));
app.use('/api/rewards', require('./routes/reward.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/upload', require('./routes/upload.routes'));

// Admin routes (separate admin panel)
app.use('/api/admin/auth', require('./routes/admin.auth.routes'));
app.use('/api/admin/dashboard', require('./routes/admin.dashboard.routes'));
app.use('/api/admin/users', require('./routes/admin.user.routes'));
app.use('/api/admin/courts', require('./routes/admin.court.routes'));
app.use('/api/admin/court-owners', require('./routes/admin.court-owner.routes'));
app.use('/api/admin/bookings', require('./routes/admin.booking.routes'));
app.use('/api/admin/promotions', require('./routes/admin.promotion.routes'));
app.use('/api/admin/notifications', require('./routes/admin.notification.routes'));
app.use('/api/admin/payments', require('./routes/admin.payment.routes'));
app.use('/api/admin/reports', require('./routes/admin.report.routes'));
app.use('/api/admin/scheduled-tasks', require('./routes/scheduled.task.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.io server is running`);
});

module.exports = app;

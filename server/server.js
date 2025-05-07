const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Pickleball Court Booking API' });
});

// Import routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/courts', require('./routes/court.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/promotions', require('./routes/promotion.routes'));
app.use('/api/rewards', require('./routes/reward.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// Admin routes (separate admin panel)
app.use('/api/admin/auth', require('./routes/admin.auth.routes'));
app.use('/api/admin/dashboard', require('./routes/admin.dashboard.routes'));
app.use('/api/admin/users', require('./routes/admin.user.routes'));
app.use('/api/admin/courts', require('./routes/admin.court.routes'));
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

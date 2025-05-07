const request = require('supertest');
const app = require('../server');
const db = require('../config/db.config');
const Booking = require('../models/booking.model');
const BookingLock = require('../models/booking.lock.model');
const jwt = require('jsonwebtoken');

// Mock the database module
jest.mock('../config/db.config');
jest.mock('../models/booking.model');
jest.mock('../models/booking.lock.model');
jest.mock('../models/court.model');
jest.mock('../models/promotion.model');

describe('Booking API Integration Tests', () => {
  let authToken;
  
  beforeEach(() => {
    // Create a valid JWT token for testing
    authToken = jwt.sign(
      { id: 1, role: 'customer', type: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  describe('POST /api/bookings', () => {
    it('should create a booking successfully', async () => {
      // Mock BookingLock.acquireLock to return a lock
      BookingLock.acquireLock.mockResolvedValueOnce({
        id: 1,
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1
      });
      
      // Mock Court.findById to return a court
      require('../models/court.model').findById.mockResolvedValueOnce({
        id: 1,
        name: 'Test Court',
        is_available: true,
        hourly_rate: 50
      });
      
      // Mock Booking.createWithLock to return a booking
      Booking.createWithLock.mockResolvedValueOnce({
        id: 1,
        court_id: 1,
        user_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        total_price: 50,
        status: 'pending'
      });
      
      // Mock BookingLock.releaseLock to return true
      BookingLock.releaseLock.mockResolvedValueOnce(true);
      
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          court_id: 1,
          start_time: '2025-06-01T10:00:00Z',
          end_time: '2025-06-01T11:00:00Z'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Booking created successfully');
      expect(response.body).toHaveProperty('booking');
      expect(response.body.booking).toHaveProperty('id', 1);
      
      // Verify lock was acquired
      expect(BookingLock.acquireLock).toHaveBeenCalledWith({
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1,
        lock_duration_seconds: 30
      });
      
      // Verify booking was created
      expect(Booking.createWithLock).toHaveBeenCalledWith({
        court_id: 1,
        user_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        total_price: 50,
        status: 'pending'
      });
      
      // Verify lock was released
      expect(BookingLock.releaseLock).toHaveBeenCalledWith({
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1
      });
    });
    
    it('should return 409 if timeslot is being booked by another user', async () => {
      // Mock BookingLock.acquireLock to return null (lock held by another user)
      BookingLock.acquireLock.mockResolvedValueOnce(null);
      
      // Mock Court.findById to return a court
      require('../models/court.model').findById.mockResolvedValueOnce({
        id: 1,
        name: 'Test Court',
        is_available: true,
        hourly_rate: 50
      });
      
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          court_id: 1,
          start_time: '2025-06-01T10:00:00Z',
          end_time: '2025-06-01T11:00:00Z'
        });
      
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message', 'This timeslot is currently being booked by another user. Please try again in a moment.');
      
      // Verify lock was attempted
      expect(BookingLock.acquireLock).toHaveBeenCalledWith({
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1,
        lock_duration_seconds: 30
      });
      
      // Verify booking was not created
      expect(Booking.createWithLock).not.toHaveBeenCalled();
    });
    
    it('should return 400 if timeslot is not available', async () => {
      // Mock BookingLock.acquireLock to return a lock
      BookingLock.acquireLock.mockResolvedValueOnce({
        id: 1,
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1
      });
      
      // Mock Court.findById to return a court
      require('../models/court.model').findById.mockResolvedValueOnce({
        id: 1,
        name: 'Test Court',
        is_available: true,
        hourly_rate: 50
      });
      
      // Mock Booking.createWithLock to throw an error
      Booking.createWithLock.mockRejectedValueOnce(new Error('The selected time slot is not available'));
      
      // Mock BookingLock.releaseLock to return true
      BookingLock.releaseLock.mockResolvedValueOnce(true);
      
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          court_id: 1,
          start_time: '2025-06-01T10:00:00Z',
          end_time: '2025-06-01T11:00:00Z'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'The selected time slot is not available');
      
      // Verify lock was acquired
      expect(BookingLock.acquireLock).toHaveBeenCalled();
      
      // Verify booking creation was attempted
      expect(Booking.createWithLock).toHaveBeenCalled();
      
      // Verify lock was released
      expect(BookingLock.releaseLock).toHaveBeenCalled();
    });
    
    it('should handle concurrent booking requests correctly', async () => {
      // This test simulates two concurrent booking requests for the same timeslot
      
      // First request acquires the lock
      BookingLock.acquireLock
        .mockResolvedValueOnce({
          id: 1,
          court_id: 1,
          start_time: '2025-06-01T10:00:00Z',
          end_time: '2025-06-01T11:00:00Z',
          user_id: 1
        })
        // Second request fails to acquire the lock
        .mockResolvedValueOnce(null);
      
      // Mock Court.findById to return a court for both requests
      require('../models/court.model').findById
        .mockResolvedValueOnce({
          id: 1,
          name: 'Test Court',
          is_available: true,
          hourly_rate: 50
        })
        .mockResolvedValueOnce({
          id: 1,
          name: 'Test Court',
          is_available: true,
          hourly_rate: 50
        });
      
      // Mock Booking.createWithLock to return a booking
      Booking.createWithLock.mockResolvedValueOnce({
        id: 1,
        court_id: 1,
        user_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        total_price: 50,
        status: 'pending'
      });
      
      // Mock BookingLock.releaseLock to return true
      BookingLock.releaseLock.mockResolvedValueOnce(true);
      
      // Create a second token for the second user
      const authToken2 = jwt.sign(
        { id: 2, role: 'customer', type: 'user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      
      // Send both requests concurrently
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            court_id: 1,
            start_time: '2025-06-01T10:00:00Z',
            end_time: '2025-06-01T11:00:00Z'
          }),
        request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${authToken2}`)
          .send({
            court_id: 1,
            start_time: '2025-06-01T10:00:00Z',
            end_time: '2025-06-01T11:00:00Z'
          })
      ]);
      
      // First request should succeed
      expect(response1.status).toBe(201);
      expect(response1.body).toHaveProperty('message', 'Booking created successfully');
      
      // Second request should fail with 409 Conflict
      expect(response2.status).toBe(409);
      expect(response2.body).toHaveProperty('message', 'This timeslot is currently being booked by another user. Please try again in a moment.');
      
      // Verify both lock attempts were made
      expect(BookingLock.acquireLock).toHaveBeenCalledTimes(2);
      
      // Verify only one booking was created
      expect(Booking.createWithLock).toHaveBeenCalledTimes(1);
      
      // Verify lock was released
      expect(BookingLock.releaseLock).toHaveBeenCalledTimes(1);
    });
  });
});

const Booking = require('../models/booking.model');
const db = require('../config/db.config');

// Mock the database module
jest.mock('../config/db.config', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn()
    })
  }
}));

describe('Booking Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createWithLock', () => {
    it('should create a booking with lock mechanism', async () => {
      // Mock client query responses
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      
      // Mock successful court query
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Test Court', is_available: true }]
      });
      
      // Mock successful availability check (no conflicting bookings)
      mockClient.query.mockResolvedValueOnce({
        rows: []
      });
      
      // Mock successful booking creation
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          court_id: 1,
          user_id: 1,
          start_time: '2025-06-01T10:00:00Z',
          end_time: '2025-06-01T11:00:00Z',
          total_price: 50,
          status: 'pending'
        }]
      });
      
      // Mock pool.connect to return our mock client
      db.pool.connect.mockResolvedValue(mockClient);
      
      const bookingData = {
        court_id: 1,
        user_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        total_price: 50,
        status: 'pending'
      };
      
      const result = await Booking.createWithLock(bookingData);
      
      // Verify transaction was started
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      
      // Verify court existence was checked
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM courts'),
        [1]
      );
      
      // Verify availability was checked with FOR UPDATE SKIP LOCKED
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('FOR UPDATE SKIP LOCKED'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z']
      );
      
      // Verify transaction was committed
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      
      // Verify client was released
      expect(mockClient.release).toHaveBeenCalled();
      
      // Verify correct result was returned
      expect(result).toEqual({
        id: 1,
        court_id: 1,
        user_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        total_price: 50,
        status: 'pending'
      });
    });
    
    it('should throw error if court is not available', async () => {
      // Mock client query responses
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      
      // Mock court query with no results (court not found or not available)
      mockClient.query.mockResolvedValueOnce({
        rows: []
      });
      
      // Mock pool.connect to return our mock client
      db.pool.connect.mockResolvedValue(mockClient);
      
      const bookingData = {
        court_id: 1,
        user_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        total_price: 50,
        status: 'pending'
      };
      
      await expect(Booking.createWithLock(bookingData)).rejects.toThrow('Court not found or not available');
      
      // Verify transaction was started
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      
      // Verify transaction was rolled back
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      
      // Verify client was released
      expect(mockClient.release).toHaveBeenCalled();
    });
    
    it('should throw error if timeslot is not available', async () => {
      // Mock client query responses
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      
      // Mock successful court query
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Test Court', is_available: true }]
      });
      
      // Mock availability check with conflicting booking
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1 }]
      });
      
      // Mock pool.connect to return our mock client
      db.pool.connect.mockResolvedValue(mockClient);
      
      const bookingData = {
        court_id: 1,
        user_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        total_price: 50,
        status: 'pending'
      };
      
      await expect(Booking.createWithLock(bookingData)).rejects.toThrow('The selected time slot is not available');
      
      // Verify transaction was started
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      
      // Verify transaction was rolled back
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      
      // Verify client was released
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
  
  describe('checkAvailability', () => {
    it('should return true if timeslot is available', async () => {
      // Mock db.query to return no conflicting bookings
      db.query.mockResolvedValueOnce({
        rows: [{ count: '0' }]
      });
      
      const result = await Booking.checkAvailability(
        1, // courtId
        '2025-06-01T10:00:00Z', // startTime
        '2025-06-01T11:00:00Z' // endTime
      );
      
      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z']
      );
    });
    
    it('should return false if timeslot is not available', async () => {
      // Mock db.query to return conflicting bookings
      db.query.mockResolvedValueOnce({
        rows: [{ count: '1' }]
      });
      
      const result = await Booking.checkAvailability(
        1, // courtId
        '2025-06-01T10:00:00Z', // startTime
        '2025-06-01T11:00:00Z' // endTime
      );
      
      expect(result).toBe(false);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z']
      );
    });
    
    it('should use provided client for transaction if provided', async () => {
      // Mock client
      const mockClient = {
        query: jest.fn().mockResolvedValueOnce({
          rows: [{ count: '0' }]
        })
      };
      
      const result = await Booking.checkAvailability(
        1, // courtId
        '2025-06-01T10:00:00Z', // startTime
        '2025-06-01T11:00:00Z', // endTime
        mockClient // client
      );
      
      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z']
      );
      // Verify db.query was not called
      expect(db.query).not.toHaveBeenCalled();
    });
  });
});

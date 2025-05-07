const BookingLock = require('../models/booking.lock.model');
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

describe('BookingLock Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('acquireLock', () => {
    it('should acquire a lock when none exists', async () => {
      // Mock client query responses
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      
      // Mock clean expired locks
      mockClient.query.mockResolvedValueOnce({});
      
      // Mock check for existing lock (none found)
      mockClient.query.mockResolvedValueOnce({
        rows: []
      });
      
      // Mock insert new lock
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          court_id: 1,
          start_time: '2025-06-01T10:00:00Z',
          end_time: '2025-06-01T11:00:00Z',
          user_id: 1,
          lock_expiry: '2025-06-01T09:30:30Z',
          created_at: '2025-06-01T09:30:00Z'
        }]
      });
      
      // Mock pool.connect to return our mock client
      db.pool.connect.mockResolvedValue(mockClient);
      
      const lockData = {
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1,
        lock_duration_seconds: 30
      };
      
      const result = await BookingLock.acquireLock(lockData);
      
      // Verify transaction was started
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      
      // Verify expired locks were cleaned
      expect(mockClient.query).toHaveBeenCalledWith('SELECT clean_expired_locks()');
      
      // Verify check for existing lock was performed
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM booking_locks'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z']
      );
      
      // Verify new lock was inserted
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO booking_locks'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z', 1]
      );
      
      // Verify transaction was committed
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      
      // Verify client was released
      expect(mockClient.release).toHaveBeenCalled();
      
      // Verify correct result was returned
      expect(result).toEqual({
        id: 1,
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1,
        lock_expiry: '2025-06-01T09:30:30Z',
        created_at: '2025-06-01T09:30:00Z'
      });
    });
    
    it('should extend lock if it belongs to the same user', async () => {
      // Mock client query responses
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      
      // Mock clean expired locks
      mockClient.query.mockResolvedValueOnce({});
      
      // Mock check for existing lock (found, same user)
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          court_id: 1,
          start_time: '2025-06-01T10:00:00Z',
          end_time: '2025-06-01T11:00:00Z',
          user_id: 1,
          lock_expiry: '2025-06-01T09:30:30Z',
          created_at: '2025-06-01T09:30:00Z'
        }]
      });
      
      // Mock update existing lock
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          court_id: 1,
          start_time: '2025-06-01T10:00:00Z',
          end_time: '2025-06-01T11:00:00Z',
          user_id: 1,
          lock_expiry: '2025-06-01T09:31:00Z',
          created_at: '2025-06-01T09:30:00Z'
        }]
      });
      
      // Mock pool.connect to return our mock client
      db.pool.connect.mockResolvedValue(mockClient);
      
      const lockData = {
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1,
        lock_duration_seconds: 30
      };
      
      const result = await BookingLock.acquireLock(lockData);
      
      // Verify transaction was started
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      
      // Verify expired locks were cleaned
      expect(mockClient.query).toHaveBeenCalledWith('SELECT clean_expired_locks()');
      
      // Verify check for existing lock was performed
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM booking_locks'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z']
      );
      
      // Verify lock was extended
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE booking_locks'),
        [1]
      );
      
      // Verify transaction was committed
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      
      // Verify client was released
      expect(mockClient.release).toHaveBeenCalled();
      
      // Verify correct result was returned
      expect(result).toEqual({
        id: 1,
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1,
        lock_expiry: '2025-06-01T09:31:00Z',
        created_at: '2025-06-01T09:30:00Z'
      });
    });
    
    it('should return null if lock is held by another user', async () => {
      // Mock client query responses
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      
      // Mock clean expired locks
      mockClient.query.mockResolvedValueOnce({});
      
      // Mock check for existing lock (found, different user)
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          court_id: 1,
          start_time: '2025-06-01T10:00:00Z',
          end_time: '2025-06-01T11:00:00Z',
          user_id: 2, // Different user
          lock_expiry: '2025-06-01T09:30:30Z',
          created_at: '2025-06-01T09:30:00Z'
        }]
      });
      
      // Mock pool.connect to return our mock client
      db.pool.connect.mockResolvedValue(mockClient);
      
      const lockData = {
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1,
        lock_duration_seconds: 30
      };
      
      const result = await BookingLock.acquireLock(lockData);
      
      // Verify transaction was started
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      
      // Verify expired locks were cleaned
      expect(mockClient.query).toHaveBeenCalledWith('SELECT clean_expired_locks()');
      
      // Verify check for existing lock was performed
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM booking_locks'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z']
      );
      
      // Verify transaction was committed
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      
      // Verify client was released
      expect(mockClient.release).toHaveBeenCalled();
      
      // Verify null was returned
      expect(result).toBeNull();
    });
  });
  
  describe('releaseLock', () => {
    it('should release a lock', async () => {
      // Mock db.query to return successful deletion
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1 }]
      });
      
      const lockData = {
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1
      };
      
      const result = await BookingLock.releaseLock(lockData);
      
      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM booking_locks'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z', 1]
      );
    });
    
    it('should return false if lock does not exist', async () => {
      // Mock db.query to return no deletion
      db.query.mockResolvedValueOnce({
        rows: []
      });
      
      const lockData = {
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1
      };
      
      const result = await BookingLock.releaseLock(lockData);
      
      expect(result).toBe(false);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM booking_locks'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z', 1]
      );
    });
  });
  
  describe('checkLock', () => {
    it('should return lock if it exists', async () => {
      // Mock db.query to return existing lock
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          court_id: 1,
          start_time: '2025-06-01T10:00:00Z',
          end_time: '2025-06-01T11:00:00Z',
          user_id: 1,
          lock_expiry: '2025-06-01T09:30:30Z',
          created_at: '2025-06-01T09:30:00Z'
        }]
      });
      
      const lockData = {
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z'
      };
      
      const result = await BookingLock.checkLock(lockData);
      
      expect(result).toEqual({
        id: 1,
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z',
        user_id: 1,
        lock_expiry: '2025-06-01T09:30:30Z',
        created_at: '2025-06-01T09:30:00Z'
      });
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM booking_locks'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z']
      );
    });
    
    it('should return null if lock does not exist', async () => {
      // Mock db.query to return no lock
      db.query.mockResolvedValueOnce({
        rows: []
      });
      
      const lockData = {
        court_id: 1,
        start_time: '2025-06-01T10:00:00Z',
        end_time: '2025-06-01T11:00:00Z'
      };
      
      const result = await BookingLock.checkLock(lockData);
      
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM booking_locks'),
        [1, '2025-06-01T10:00:00Z', '2025-06-01T11:00:00Z']
      );
    });
  });
  
  describe('cleanExpiredLocks', () => {
    it('should clean expired locks', async () => {
      // Mock db.query to return deleted locks
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1 }, { id: 2 }]
      });
      
      const result = await BookingLock.cleanExpiredLocks();
      
      expect(result).toBe(2);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM booking_locks')
      );
    });
  });
});

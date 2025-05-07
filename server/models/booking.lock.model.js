const db = require('../config/db.config');

const BookingLock = {
  /**
   * Acquire a lock for a court timeslot
   * @param {Object} lockData - Lock data
   * @param {number} lockData.court_id - Court ID
   * @param {string} lockData.start_time - Start time (ISO string)
   * @param {string} lockData.end_time - End time (ISO string)
   * @param {number} lockData.user_id - User ID
   * @param {number} lockData.lock_duration_seconds - Lock duration in seconds (default: 30)
   * @returns {Promise<Object>} - Lock object
   */
  async acquireLock(lockData) {
    const { 
      court_id, 
      start_time, 
      end_time, 
      user_id,
      lock_duration_seconds = 30
    } = lockData;
    
    // Start a transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clean expired locks first
      await client.query('SELECT clean_expired_locks()');
      
      // Check if there's an existing lock for this timeslot
      const checkQuery = `
        SELECT * FROM booking_locks 
        WHERE court_id = $1 
        AND start_time = $2 
        AND end_time = $3
        AND lock_expiry > NOW()
      `;
      
      const checkResult = await client.query(checkQuery, [court_id, start_time, end_time]);
      
      if (checkResult.rows.length > 0) {
        const existingLock = checkResult.rows[0];
        
        // If the lock belongs to the same user, extend it
        if (existingLock.user_id === user_id) {
          const updateQuery = `
            UPDATE booking_locks
            SET lock_expiry = NOW() + INTERVAL '${lock_duration_seconds} seconds'
            WHERE id = $1
            RETURNING *
          `;
          
          const updateResult = await client.query(updateQuery, [existingLock.id]);
          await client.query('COMMIT');
          return updateResult.rows[0];
        }
        
        // Lock is held by another user
        await client.query('COMMIT');
        return null;
      }
      
      // No existing lock, create a new one
      const insertQuery = `
        INSERT INTO booking_locks (
          court_id, 
          start_time, 
          end_time, 
          user_id, 
          lock_expiry, 
          created_at
        )
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${lock_duration_seconds} seconds', NOW())
        RETURNING *
      `;
      
      const insertResult = await client.query(insertQuery, [court_id, start_time, end_time, user_id]);
      await client.query('COMMIT');
      return insertResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  /**
   * Release a lock for a court timeslot
   * @param {Object} lockData - Lock data
   * @param {number} lockData.court_id - Court ID
   * @param {string} lockData.start_time - Start time (ISO string)
   * @param {string} lockData.end_time - End time (ISO string)
   * @param {number} lockData.user_id - User ID
   * @returns {Promise<boolean>} - True if lock was released, false otherwise
   */
  async releaseLock(lockData) {
    const { court_id, start_time, end_time, user_id } = lockData;
    
    const query = `
      DELETE FROM booking_locks
      WHERE court_id = $1
      AND start_time = $2
      AND end_time = $3
      AND user_id = $4
      RETURNING id
    `;
    
    try {
      const result = await db.query(query, [court_id, start_time, end_time, user_id]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Check if a lock exists for a court timeslot
   * @param {Object} lockData - Lock data
   * @param {number} lockData.court_id - Court ID
   * @param {string} lockData.start_time - Start time (ISO string)
   * @param {string} lockData.end_time - End time (ISO string)
   * @returns {Promise<Object|null>} - Lock object if exists, null otherwise
   */
  async checkLock(lockData) {
    const { court_id, start_time, end_time } = lockData;
    
    const query = `
      SELECT * FROM booking_locks
      WHERE court_id = $1
      AND start_time = $2
      AND end_time = $3
      AND lock_expiry > NOW()
    `;
    
    try {
      const result = await db.query(query, [court_id, start_time, end_time]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Clean expired locks
   * @returns {Promise<number>} - Number of locks cleaned
   */
  async cleanExpiredLocks() {
    const query = `
      DELETE FROM booking_locks
      WHERE lock_expiry < NOW()
      RETURNING id
    `;
    
    try {
      const result = await db.query(query);
      return result.rows.length;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = BookingLock;

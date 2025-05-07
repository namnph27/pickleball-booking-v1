const db = require('../config/db.config');

const CourtTimeslot = {
  // Create a new timeslot
  async create(timeslotData) {
    const { 
      court_id, 
      day_of_week, 
      start_time, 
      end_time, 
      is_available = true 
    } = timeslotData;
    
    const query = `
      INSERT INTO court_timeslots (
        court_id, 
        day_of_week, 
        start_time, 
        end_time, 
        is_available, 
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      court_id, 
      day_of_week, 
      start_time, 
      end_time, 
      is_available
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Find timeslot by ID
  async findById(id) {
    const query = 'SELECT * FROM court_timeslots WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Update timeslot
  async update(id, timeslotData) {
    const { 
      day_of_week, 
      start_time, 
      end_time, 
      is_available 
    } = timeslotData;
    
    // Build the query dynamically based on provided fields
    let updateFields = [];
    let values = [];
    let valueIndex = 1;
    
    if (day_of_week !== undefined) {
      updateFields.push(`day_of_week = $${valueIndex}`);
      values.push(day_of_week);
      valueIndex++;
    }
    
    if (start_time !== undefined) {
      updateFields.push(`start_time = $${valueIndex}`);
      values.push(start_time);
      valueIndex++;
    }
    
    if (end_time !== undefined) {
      updateFields.push(`end_time = $${valueIndex}`);
      values.push(end_time);
      valueIndex++;
    }
    
    if (is_available !== undefined) {
      updateFields.push(`is_available = $${valueIndex}`);
      values.push(is_available);
      valueIndex++;
    }
    
    updateFields.push(`updated_at = NOW()`);
    
    // If no fields to update, return the existing timeslot
    if (values.length === 0) {
      return this.findById(id);
    }
    
    // Add the ID as the last parameter
    values.push(id);
    
    const query = `
      UPDATE court_timeslots
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Delete timeslot
  async delete(id) {
    const query = 'DELETE FROM court_timeslots WHERE id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Get all timeslots
  async getAll() {
    const query = 'SELECT * FROM court_timeslots ORDER BY day_of_week, start_time';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get timeslots by court ID
  async getByCourtId(courtId) {
    const query = `
      SELECT * FROM court_timeslots 
      WHERE court_id = $1 
      ORDER BY day_of_week, start_time
    `;
    
    try {
      const result = await db.query(query, [courtId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get timeslots by court ID and day of week
  async getByCourtIdAndDay(courtId, dayOfWeek) {
    const query = `
      SELECT * FROM court_timeslots 
      WHERE court_id = $1 AND day_of_week = $2 
      ORDER BY start_time
    `;
    
    try {
      const result = await db.query(query, [courtId, dayOfWeek]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get available timeslots by court ID and day of week
  async getAvailableByCourtIdAndDay(courtId, dayOfWeek) {
    const query = `
      SELECT * FROM court_timeslots 
      WHERE court_id = $1 AND day_of_week = $2 AND is_available = true 
      ORDER BY start_time
    `;
    
    try {
      const result = await db.query(query, [courtId, dayOfWeek]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Check if timeslot is available
  async isAvailable(id) {
    const query = 'SELECT is_available FROM court_timeslots WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0]?.is_available || false;
    } catch (error) {
      throw error;
    }
  },
  
  // Set timeslot availability
  async setAvailability(id, isAvailable) {
    const query = `
      UPDATE court_timeslots
      SET is_available = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [isAvailable, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = CourtTimeslot;

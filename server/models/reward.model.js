const db = require('../config/db.config');

const Reward = {
  // Create a new reward
  async create(rewardData) {
    const { 
      name, 
      description, 
      points_required, 
      is_active = true 
    } = rewardData;
    
    const query = `
      INSERT INTO rewards (
        name, 
        description, 
        points_required, 
        is_active, 
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      name, 
      description, 
      points_required, 
      is_active
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Find reward by ID
  async findById(id) {
    const query = 'SELECT * FROM rewards WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Update reward
  async update(id, rewardData) {
    const { 
      name, 
      description, 
      points_required, 
      is_active 
    } = rewardData;
    
    // Build the query dynamically based on provided fields
    let updateFields = [];
    let values = [];
    let valueIndex = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${valueIndex}`);
      values.push(name);
      valueIndex++;
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${valueIndex}`);
      values.push(description);
      valueIndex++;
    }
    
    if (points_required !== undefined) {
      updateFields.push(`points_required = $${valueIndex}`);
      values.push(points_required);
      valueIndex++;
    }
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${valueIndex}`);
      values.push(is_active);
      valueIndex++;
    }
    
    updateFields.push(`updated_at = NOW()`);
    
    // If no fields to update, return the existing reward
    if (values.length === 0) {
      return this.findById(id);
    }
    
    // Add the ID as the last parameter
    values.push(id);
    
    const query = `
      UPDATE rewards
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
  
  // Delete reward
  async delete(id) {
    const query = 'DELETE FROM rewards WHERE id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Get all rewards
  async getAll() {
    const query = 'SELECT * FROM rewards ORDER BY points_required ASC';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get active rewards
  async getActive() {
    const query = 'SELECT * FROM rewards WHERE is_active = true ORDER BY points_required ASC';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Reward;

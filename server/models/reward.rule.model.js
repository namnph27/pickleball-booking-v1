const db = require('../config/db.config');

const RewardRule = {
  // Create a new reward rule
  async create(ruleData) {
    const { 
      name, 
      description, 
      action_type, 
      points, 
      is_percentage = false, 
      percentage_base = null, 
      min_amount = null, 
      max_points = null, 
      is_active = true 
    } = ruleData;
    
    const query = `
      INSERT INTO reward_rules (
        name, 
        description, 
        action_type, 
        points, 
        is_percentage, 
        percentage_base, 
        min_amount, 
        max_points, 
        is_active, 
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      name, 
      description, 
      action_type, 
      points, 
      is_percentage, 
      percentage_base, 
      min_amount, 
      max_points, 
      is_active
    ];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Find reward rule by ID
  async findById(id) {
    const query = 'SELECT * FROM reward_rules WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Find reward rule by action type
  async findByActionType(actionType) {
    const query = 'SELECT * FROM reward_rules WHERE action_type = $1 AND is_active = true';
    
    try {
      const result = await db.query(query, [actionType]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Update reward rule
  async update(id, ruleData) {
    const { 
      name, 
      description, 
      action_type, 
      points, 
      is_percentage, 
      percentage_base, 
      min_amount, 
      max_points, 
      is_active 
    } = ruleData;
    
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
    
    if (action_type !== undefined) {
      updateFields.push(`action_type = $${valueIndex}`);
      values.push(action_type);
      valueIndex++;
    }
    
    if (points !== undefined) {
      updateFields.push(`points = $${valueIndex}`);
      values.push(points);
      valueIndex++;
    }
    
    if (is_percentage !== undefined) {
      updateFields.push(`is_percentage = $${valueIndex}`);
      values.push(is_percentage);
      valueIndex++;
    }
    
    if (percentage_base !== undefined) {
      updateFields.push(`percentage_base = $${valueIndex}`);
      values.push(percentage_base);
      valueIndex++;
    }
    
    if (min_amount !== undefined) {
      updateFields.push(`min_amount = $${valueIndex}`);
      values.push(min_amount);
      valueIndex++;
    }
    
    if (max_points !== undefined) {
      updateFields.push(`max_points = $${valueIndex}`);
      values.push(max_points);
      valueIndex++;
    }
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${valueIndex}`);
      values.push(is_active);
      valueIndex++;
    }
    
    updateFields.push(`updated_at = NOW()`);
    
    // If no fields to update, return the existing rule
    if (values.length === 0) {
      return this.findById(id);
    }
    
    // Add the ID as the last parameter
    values.push(id);
    
    const query = `
      UPDATE reward_rules
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
  
  // Delete reward rule
  async delete(id) {
    const query = 'DELETE FROM reward_rules WHERE id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Get all reward rules
  async getAll() {
    const query = 'SELECT * FROM reward_rules ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Get active reward rules
  async getActive() {
    const query = 'SELECT * FROM reward_rules WHERE is_active = true ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Calculate points for an action
  async calculatePoints(actionType, amount = 0, userId = null) {
    try {
      // Get the rule for this action type
      const rule = await this.findByActionType(actionType);
      
      if (!rule || !rule.is_active) {
        return 0;
      }
      
      // Check if the amount meets the minimum requirement
      if (rule.min_amount !== null && amount < rule.min_amount) {
        return 0;
      }
      
      // Calculate points
      let points = rule.points;
      
      // If percentage-based, calculate based on amount
      if (rule.is_percentage) {
        points = Math.floor((amount * rule.points) / 100);
      }
      
      // Apply maximum points limit if set
      if (rule.max_points !== null && points > rule.max_points) {
        points = rule.max_points;
      }
      
      return points;
    } catch (error) {
      console.error('Error calculating points:', error);
      return 0;
    }
  }
};

module.exports = RewardRule;

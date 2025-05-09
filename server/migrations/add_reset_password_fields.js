/**
 * Migration to add reset password fields to users table
 */
const db = require('../config/db.config');

async function addResetPasswordFields() {
  try {
    console.log('Starting migration: Add reset password fields to users table');
    
    // Check if reset_password_token column exists
    const checkTokenColumn = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'reset_password_token'
    `);
    
    // Check if reset_password_expires column exists
    const checkExpiresColumn = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'reset_password_expires'
    `);
    
    // Add reset_password_token column if it doesn't exist
    if (checkTokenColumn.rows.length === 0) {
      console.log('Adding reset_password_token column to users table');
      await db.query(`
        ALTER TABLE users
        ADD COLUMN reset_password_token VARCHAR(255)
      `);
      console.log('reset_password_token column added successfully');
    } else {
      console.log('reset_password_token column already exists');
    }
    
    // Add reset_password_expires column if it doesn't exist
    if (checkExpiresColumn.rows.length === 0) {
      console.log('Adding reset_password_expires column to users table');
      await db.query(`
        ALTER TABLE users
        ADD COLUMN reset_password_expires TIMESTAMP
      `);
      console.log('reset_password_expires column added successfully');
    } else {
      console.log('reset_password_expires column already exists');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
addResetPasswordFields()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

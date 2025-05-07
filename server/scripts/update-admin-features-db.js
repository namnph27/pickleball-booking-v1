const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'HoaiNam',
  database: process.env.DB_NAME || 'pickleball_v1'
});

// Read the SQL file
const sqlFilePath = path.join(__dirname, '../config/admin-features-update.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Execute the SQL
async function executeSQL() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database update for admin features...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Execute the SQL
    await client.query(sql);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Database update for admin features completed successfully!');
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error updating database for admin features:', error);
  } finally {
    // Release the client
    client.release();
    
    // Close the pool
    await pool.end();
  }
}

// Run the function
executeSQL();

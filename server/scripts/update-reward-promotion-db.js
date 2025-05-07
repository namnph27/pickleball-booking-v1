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

// Read SQL file
const sqlFilePath = path.join(__dirname, '../config/reward-promotion-update.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Execute SQL
async function executeSQL() {
  const client = await pool.connect();

  try {
    console.log('Updating reward and promotion database...');

    // Start a transaction
    await client.query('BEGIN');

    // Execute the SQL
    await client.query(sql);

    // Commit the transaction
    await client.query('COMMIT');

    console.log('Reward and promotion database updated successfully!');
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error updating reward and promotion database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

executeSQL();

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Log database connection parameters (without password)
console.log('Database connection parameters:');
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  DB_PORT:', process.env.DB_PORT || 5432);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('Connected to the database successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  console.error('Error details:', err.message);
  console.error('Error stack:', err.stack);
  process.exit(-1);
});

// Wrap the query method to add debugging
const query = async (text, params) => {
  console.log('DB Query:', text);
  console.log('DB Params:', params);

  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    console.log('DB Query completed in', duration, 'ms');
    console.log('DB Result rows:', result.rows.length);

    return result;
  } catch (error) {
    console.error('DB Query error:', error.message);
    console.error('DB Query error stack:', error.stack);
    throw error;
  }
};

module.exports = {
  query,
  pool,
};

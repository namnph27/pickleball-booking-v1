const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new pool with connection details
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function resetAdminPassword() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to PostgreSQL database');
    
    // Generate new hashed password
    const plainPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log(`Plain password: ${plainPassword}`);
    console.log(`Hashed password: ${hashedPassword}`);
    
    // Update admin password
    const result = await client.query(`
      UPDATE admins
      SET password = $1, updated_at = NOW()
      WHERE username = 'admin'
      RETURNING id, username, email
    `, [hashedPassword]);
    
    if (result.rows.length > 0) {
      console.log(`Password reset for admin: ${result.rows[0].username} (${result.rows[0].email})`);
    } else {
      console.log('No admin user found with username "admin"');
    }
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

resetAdminPassword();

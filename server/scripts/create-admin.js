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

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to PostgreSQL database');
    
    // Check if admin table exists
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      );
    `);
    
    const tableExists = tableResult.rows[0].exists;
    console.log(`Admin table exists: ${tableExists}`);
    
    if (tableExists) {
      // Check if admin user exists
      const adminResult = await client.query('SELECT * FROM admins');
      console.log(`Found ${adminResult.rows.length} admin users`);
      
      if (adminResult.rows.length === 0) {
        console.log('No admin users found. Creating default admin...');
        
        // Create default admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        await client.query(`
          INSERT INTO admins (username, password, email, full_name, is_super_admin, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, ['admin', hashedPassword, 'admin@example.com', 'System Administrator', true]);
        
        console.log('Default admin created successfully');
      } else {
        console.log('Admin users already exist');
        
        // Print admin users
        adminResult.rows.forEach((admin, index) => {
          console.log(`Admin ${index + 1}: ${admin.username} (${admin.email})`);
        });
      }
    } else {
      console.log('Admin table does not exist. Please run init-db script first.');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();

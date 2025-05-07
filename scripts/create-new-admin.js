const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Create a new pool with connection details
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'HoaiNam',
  database: process.env.DB_NAME || 'pickleball_v1'
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createNewAdmin() {
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
    
    if (!tableExists) {
      console.error('Admin table does not exist. Please run the init-db script first.');
      return;
    }
    
    // Get admin details from user input
    const username = await promptUser('Enter username for new admin: ');
    const password = await promptUser('Enter password for new admin: ');
    const email = await promptUser('Enter email for new admin: ');
    const fullName = await promptUser('Enter full name for new admin: ');
    const isSuperAdmin = (await promptUser('Make this admin a super admin? (y/n): ')).toLowerCase() === 'y';
    
    // Check if username already exists
    const usernameCheck = await client.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      console.error(`Admin with username "${username}" already exists.`);
      return;
    }
    
    // Check if email already exists
    const emailCheck = await client.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      console.error(`Admin with email "${email}" already exists.`);
      return;
    }
    
    // Create new admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const result = await client.query(`
      INSERT INTO admins (username, password, email, full_name, is_super_admin, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, username, email, full_name, is_super_admin
    `, [username, hashedPassword, email, fullName, isSuperAdmin]);
    
    console.log('New admin created successfully:');
    console.log(result.rows[0]);
  } catch (error) {
    console.error('Error creating new admin:', error);
  } finally {
    rl.close();
    client.release();
    await pool.end();
  }
}

function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

createNewAdmin();

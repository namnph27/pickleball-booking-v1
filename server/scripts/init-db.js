const { Client, Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// First, connect to PostgreSQL server to create the database if it doesn't exist
async function createDatabase() {
  // Connect to the default 'postgres' database first
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if our database exists
    const checkDbResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );

    // If database doesn't exist, create it
    if (checkDbResult.rowCount === 0) {
      console.log(`Creating database: ${process.env.DB_NAME}`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database ${process.env.DB_NAME} created successfully`);
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Then, connect to our database and initialize schema
async function initializeSchema() {
  // Create a new pool with connection details to our database
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // Read the SQL file
  const sqlFilePath = path.join(__dirname, '../config/init.sql');
  const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

  const client = await pool.connect();
  
  try {
    console.log(`Connected to database: ${process.env.DB_NAME}`);
    console.log('Initializing database schema...');
    
    // Drop all existing tables first
    console.log('Dropping existing tables if any...');
    await client.query(`
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS posts CASCADE;
      DROP TABLE IF EXISTS court_timeslots CASCADE;
      DROP TABLE IF EXISTS promotions CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS bookings CASCADE;
      DROP TABLE IF EXISTS courts CASCADE;
      DROP TABLE IF EXISTS admins CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
    // Execute the SQL script
    await client.query(sqlScript);
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the initialization process
async function initializeDatabase() {
  try {
    await createDatabase();
    await initializeSchema();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();

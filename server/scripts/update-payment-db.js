const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function updatePaymentDatabase() {
  // Create a new pool with connection details to our database
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // Read the SQL file
  const sqlFilePath = path.join(__dirname, '../config/payment-update.sql');
  const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

  const client = await pool.connect();
  
  try {
    console.log(`Connected to database: ${process.env.DB_NAME}`);
    console.log('Updating payment tables...');
    
    // Execute the SQL script
    await client.query(sqlScript);
    
    console.log('Payment database updated successfully');
  } catch (error) {
    console.error('Error updating payment database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the update process
updatePaymentDatabase()
  .then(() => {
    console.log('Payment database update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Payment database update failed:', error);
    process.exit(1);
  });

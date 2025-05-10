/**
 * Script to update the courts table schema to add district fields
 * and modify the court_timeslots table to add price field
 */

require('dotenv').config();
const { Pool } = require('pg');

// Create a new pool using the connection string from environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'HoaiNam',
  database: process.env.DB_NAME || 'pickleball_v1'
});

async function updateSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Bắt đầu cập nhật cơ sở dữ liệu cho tính năng quản lý sân và giá theo khung giờ...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Add district fields to courts table
    console.log('Thêm trường district vào bảng courts...');
    await client.query(`
      ALTER TABLE courts 
      ADD COLUMN IF NOT EXISTS district VARCHAR(50),
      ADD COLUMN IF NOT EXISTS district_name VARCHAR(100);
    `);
    
    // 2. Add price field to court_timeslots table
    console.log('Thêm trường price vào bảng court_timeslots...');
    await client.query(`
      ALTER TABLE court_timeslots 
      ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;
    `);
    
    // 3. Create indexes for performance
    console.log('Tạo các chỉ mục cho hiệu suất...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_courts_district ON courts(district);
      CREATE INDEX IF NOT EXISTS idx_court_timeslots_price ON court_timeslots(price);
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Cập nhật cơ sở dữ liệu thành công!');
  } catch (error) {
    // Rollback transaction in case of error
    await client.query('ROLLBACK');
    console.error('Lỗi khi cập nhật cơ sở dữ liệu:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Run the update
updateSchema().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});

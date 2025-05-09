/**
 * Script to update database schema for "Join Existing Court" feature
 * 
 * This script adds:
 * 1. New columns to bookings table
 * 2. New booking_join_requests table
 * 3. New booking_players table
 */

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

async function updateDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Bắt đầu cập nhật cơ sở dữ liệu cho tính năng "Tham gia sân sẵn có"...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Update bookings table
    console.log('Cập nhật bảng bookings...');
    await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS skill_level VARCHAR(20),
      ADD COLUMN IF NOT EXISTS current_players INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS needed_players INTEGER DEFAULT 3,
      ADD COLUMN IF NOT EXISTS allow_join BOOLEAN DEFAULT FALSE;
    `);
    
    // 2. Create booking_join_requests table
    console.log('Tạo bảng booking_join_requests...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking_join_requests (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        players_count INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
        message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(booking_id, user_id)
      );
    `);
    
    // 3. Create booking_players table
    console.log('Tạo bảng booking_players...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking_players (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_booker BOOLEAN DEFAULT FALSE,
        players_count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(booking_id, user_id)
      );
    `);
    
    // 4. Create indexes for performance
    console.log('Tạo các chỉ mục cho hiệu suất...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_skill_level ON bookings(skill_level);
      CREATE INDEX IF NOT EXISTS idx_bookings_allow_join ON bookings(allow_join);
      CREATE INDEX IF NOT EXISTS idx_booking_join_requests_booking_id ON booking_join_requests(booking_id);
      CREATE INDEX IF NOT EXISTS idx_booking_join_requests_user_id ON booking_join_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_booking_join_requests_status ON booking_join_requests(status);
      CREATE INDEX IF NOT EXISTS idx_booking_players_booking_id ON booking_players(booking_id);
      CREATE INDEX IF NOT EXISTS idx_booking_players_user_id ON booking_players(user_id);
    `);
    
    // 5. Add notification types for join requests
    console.log('Cập nhật bảng notifications...');
    await client.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS related_id INTEGER,
      ADD COLUMN IF NOT EXISTS related_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
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
updateDatabase().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});

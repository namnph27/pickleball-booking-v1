const { Pool } = require('pg');
const dotenv = require('dotenv');

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

async function addAdminNotesColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Kiểm tra cột admin_notes trong bảng users...');
    
    // Kiểm tra xem cột admin_notes có tồn tại không
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'admin_notes'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Cột admin_notes không tồn tại, đang thêm vào...');
      
      // Thêm cột admin_notes
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT;
      `);
      
      console.log('Đã thêm cột admin_notes vào bảng users');
    } else {
      console.log('Cột admin_notes đã tồn tại trong bảng users');
    }
    
    console.log('Hoàn tất!');
  } catch (error) {
    console.error('Lỗi khi thêm cột admin_notes:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Chạy hàm
addAdminNotesColumn();

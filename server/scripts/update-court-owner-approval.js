const { Pool } = require('pg');
require('dotenv').config();

// Kết nối đến cơ sở dữ liệu
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'HoaiNam',
  database: process.env.DB_NAME || 'pickleball_v1'
});

async function updateCourtOwnerApproval() {
  const client = await pool.connect();
  
  try {
    console.log('Bắt đầu cập nhật bảng users cho phê duyệt chủ sân...');
    
    // Thêm cột approval_status nếu chưa tồn tại
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';
    `);
    
    // Cập nhật các chủ sân hiện có thành đã được phê duyệt
    const updateResult = await client.query(`
      UPDATE users SET approval_status = 'approved' 
      WHERE role = 'court_owner' AND (is_verified = TRUE OR approval_status IS NULL);
    `);
    
    console.log(`Đã cập nhật ${updateResult.rowCount} chủ sân hiện có thành 'approved'`);
    
    // Tạo index cho cột mới
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
    `);
    
    // Kiểm tra xem cột đã được thêm chưa
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'approval_status'
    `);
    
    console.log('Kết quả kiểm tra:', checkResult.rows);
    console.log('Cập nhật bảng users cho phê duyệt chủ sân thành công!');
  } catch (error) {
    console.error('Lỗi khi cập nhật bảng users:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Chạy hàm cập nhật
updateCourtOwnerApproval();

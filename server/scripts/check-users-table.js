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

async function checkUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('Kiểm tra cấu trúc bảng users...');
    
    // Kiểm tra cấu trúc bảng users
    const tableResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Cấu trúc bảng users:');
    tableResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
    });
    
    // Kiểm tra xem cột approval_status có tồn tại không
    const approvalStatusResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'approval_status'
    `);
    
    if (approvalStatusResult.rows.length > 0) {
      console.log('\nCột approval_status tồn tại trong bảng users');
      
      // Kiểm tra dữ liệu trong cột approval_status
      const statusCountResult = await client.query(`
        SELECT approval_status, COUNT(*) as count
        FROM users
        WHERE role = 'court_owner'
        GROUP BY approval_status
      `);
      
      console.log('\nSố lượng chủ sân theo trạng thái phê duyệt:');
      if (statusCountResult.rows.length === 0) {
        console.log('Không có chủ sân nào');
      } else {
        statusCountResult.rows.forEach(row => {
          console.log(`- ${row.approval_status || 'NULL'}: ${row.count}`);
        });
      }
    } else {
      console.log('\nCột approval_status KHÔNG tồn tại trong bảng users');
      
      // Thêm cột approval_status nếu chưa tồn tại
      console.log('\nThêm cột approval_status vào bảng users...');
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
      
      console.log('Đã thêm cột approval_status vào bảng users');
    }
    
    // Kiểm tra xem có chủ sân nào không
    const courtOwnerResult = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'court_owner'
    `);
    
    console.log(`\nTổng số chủ sân: ${courtOwnerResult.rows[0].count}`);
    
    // Kiểm tra xem có chủ sân nào đang chờ phê duyệt không
    const pendingResult = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'court_owner' AND approval_status = 'pending'
    `);
    
    console.log(`Số chủ sân đang chờ phê duyệt: ${pendingResult.rows[0].count}`);
    
    // Hiển thị danh sách chủ sân đang chờ phê duyệt
    if (parseInt(pendingResult.rows[0].count) > 0) {
      const pendingOwnersResult = await client.query(`
        SELECT id, name, email, phone, id_card, tax_code, created_at
        FROM users
        WHERE role = 'court_owner' AND approval_status = 'pending'
        ORDER BY created_at DESC
      `);
      
      console.log('\nDanh sách chủ sân đang chờ phê duyệt:');
      pendingOwnersResult.rows.forEach(owner => {
        console.log(`- ID: ${owner.id}, Tên: ${owner.name}, Email: ${owner.email}, CCCD: ${owner.id_card}, MST: ${owner.tax_code}`);
      });
    }
    
    console.log('\nKiểm tra hoàn tất!');
  } catch (error) {
    console.error('Lỗi khi kiểm tra bảng users:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Chạy hàm kiểm tra
checkUsersTable();

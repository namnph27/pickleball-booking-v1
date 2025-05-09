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

async function updateUsersTable() {
  const client = await pool.connect();

  try {
    console.log('Bắt đầu cập nhật bảng users...');

    // Thêm cột id_card và tax_code nếu chưa tồn tại
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS id_card VARCHAR(20);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_code VARCHAR(20);
    `);

    // Tạo index cho các cột mới
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_id_card ON users(id_card);
      CREATE INDEX IF NOT EXISTS idx_users_tax_code ON users(tax_code);
    `);

    // Kiểm tra xem các cột đã được thêm chưa
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND (column_name = 'id_card' OR column_name = 'tax_code')
    `);

    console.log('Kết quả kiểm tra:', checkResult.rows);
    console.log('Cập nhật bảng users thành công!');
  } catch (error) {
    console.error('Lỗi khi cập nhật bảng users:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Chạy hàm cập nhật
updateUsersTable();

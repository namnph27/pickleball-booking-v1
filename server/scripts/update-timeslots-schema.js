/**
 * Script to update the court_timeslots table schema to support specific dates
 * This adds a specific_date column and modifies the existing functionality
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

async function addSpecificDateColumn() {
  try {
    console.log('Thêm cột specific_date vào bảng court_timeslots...');
    await pool.query('ALTER TABLE court_timeslots ADD COLUMN IF NOT EXISTS specific_date DATE');
    console.log('Thêm cột thành công!');
    return true;
  } catch (error) {
    console.error('Lỗi khi thêm cột:', error);
    return false;
  }
}

async function createIndexes() {
  try {
    console.log('Tạo index cho cột specific_date...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_court_timeslots_specific_date ON court_timeslots(specific_date)');

    console.log('Tạo index kết hợp cho court_id, specific_date, và day_of_week...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_court_timeslots_court_date_day ON court_timeslots(court_id, specific_date, day_of_week)');

    console.log('Tạo index thành công!');
    return true;
  } catch (error) {
    console.error('Lỗi khi tạo index:', error);
    return false;
  }
}

async function updateConstraint() {
  try {
    console.log('Xóa ràng buộc duy nhất cũ nếu tồn tại...');
    await pool.query('ALTER TABLE court_timeslots DROP CONSTRAINT IF EXISTS court_timeslots_court_id_day_time_unique');

    // Check if constraint already exists
    const constraintCheck = await pool.query("SELECT 1 FROM pg_constraint WHERE conname = 'court_timeslots_unique_slot'");

    if (constraintCheck.rows.length === 0) {
      console.log('Tạo ràng buộc duy nhất mới...');

      // Use a simpler query without COALESCE
      const query = "ALTER TABLE court_timeslots ADD CONSTRAINT court_timeslots_unique_slot UNIQUE (court_id, day_of_week, start_time, end_time, specific_date)";
      await pool.query(query);
    } else {
      console.log('Ràng buộc duy nhất đã tồn tại.');
    }

    console.log('Cập nhật ràng buộc thành công!');
    return true;
  } catch (error) {
    console.error('Lỗi khi cập nhật ràng buộc:', error);
    return false;
  }
}

async function updateSchema() {
  try {
    console.log('Bắt đầu cập nhật cơ sở dữ liệu cho tính năng quản lý khung giờ theo ngày cụ thể...');

    const columnAdded = await addSpecificDateColumn();
    if (!columnAdded) {
      throw new Error('Không thể thêm cột specific_date');
    }

    const indexesCreated = await createIndexes();
    if (!indexesCreated) {
      throw new Error('Không thể tạo index');
    }

    const constraintUpdated = await updateConstraint();
    if (!constraintUpdated) {
      throw new Error('Không thể cập nhật ràng buộc');
    }

    console.log('Cập nhật cơ sở dữ liệu thành công!');
  } catch (error) {
    console.error('Lỗi khi cập nhật cơ sở dữ liệu:', error);
  } finally {
    await pool.end();
  }
}

// Run the update
updateSchema();

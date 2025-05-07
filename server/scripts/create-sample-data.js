const { Pool } = require('pg');
const bcrypt = require('bcrypt');
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

// Sample users data
const sampleUsers = [
  {
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    password: 'password123',
    phone: '0901234567',
    role: 'customer'
  },
  {
    name: 'Trần Thị B',
    email: 'tranthib@example.com',
    password: 'password123',
    phone: '0909876543',
    role: 'customer'
  },
  {
    name: 'Lê Văn C',
    email: 'levanc@example.com',
    password: 'password123',
    phone: '0905555555',
    role: 'court_owner'
  },
  {
    name: 'Phạm Thị D',
    email: 'phamthid@example.com',
    password: 'password123',
    phone: '0908888888',
    role: 'court_owner'
  }
];

// Sample courts data
const sampleCourts = [
  {
    name: 'Sân Pickleball Quận 1',
    description: 'Sân Pickleball chất lượng cao tại trung tâm Quận 1',
    location: 'Quận 1, TP.HCM',
    hourly_rate: 200000,
    skill_level: 'all',
    image_url: 'https://example.com/court1.jpg',
    is_available: true
  },
  {
    name: 'Sân Pickleball Quận 2',
    description: 'Sân Pickleball ngoài trời với view đẹp',
    location: 'Quận 2, TP.HCM',
    hourly_rate: 180000,
    skill_level: 'beginner',
    image_url: 'https://example.com/court2.jpg',
    is_available: true
  },
  {
    name: 'Sân Pickleball Quận 3',
    description: 'Sân Pickleball trong nhà, có máy lạnh',
    location: 'Quận 3, TP.HCM',
    hourly_rate: 250000,
    skill_level: 'intermediate',
    image_url: 'https://example.com/court3.jpg',
    is_available: true
  },
  {
    name: 'Sân Pickleball Quận 7',
    description: 'Sân Pickleball tiêu chuẩn quốc tế',
    location: 'Quận 7, TP.HCM',
    hourly_rate: 300000,
    skill_level: 'advanced',
    image_url: 'https://example.com/court4.jpg',
    is_available: true
  }
];

// Create sample users
async function createSampleUsers() {
  const client = await pool.connect();
  
  try {
    console.log('Creating sample users...');
    
    for (const user of sampleUsers) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      // Check if user already exists
      const checkResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );
      
      if (checkResult.rowCount > 0) {
        console.log(`User with email ${user.email} already exists, skipping...`);
        continue;
      }
      
      // Insert user
      const result = await client.query(
        `INSERT INTO users (name, email, password, phone, role, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, name, email, role`,
        [user.name, user.email, hashedPassword, user.phone, user.role, true]
      );
      
      console.log(`Created user: ${result.rows[0].name} (${result.rows[0].email}) with role ${result.rows[0].role}`);
    }
    
    console.log('Sample users created successfully');
  } catch (error) {
    console.error('Error creating sample users:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Create sample courts
async function createSampleCourts() {
  const client = await pool.connect();
  
  try {
    console.log('Creating sample courts...');
    
    // Get court owners
    const courtOwnersResult = await client.query(
      "SELECT id FROM users WHERE role = 'court_owner'"
    );
    
    if (courtOwnersResult.rowCount === 0) {
      console.log('No court owners found, cannot create courts');
      return;
    }
    
    const courtOwners = courtOwnersResult.rows;
    
    for (let i = 0; i < sampleCourts.length; i++) {
      const court = sampleCourts[i];
      const ownerId = courtOwners[i % courtOwners.length].id;
      
      // Check if court already exists
      const checkResult = await client.query(
        'SELECT id FROM courts WHERE name = $1 AND location = $2',
        [court.name, court.location]
      );
      
      if (checkResult.rowCount > 0) {
        console.log(`Court "${court.name}" at "${court.location}" already exists, skipping...`);
        continue;
      }
      
      // Insert court
      const result = await client.query(
        `INSERT INTO courts (name, description, location, hourly_rate, owner_id, skill_level, image_url, is_available, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING id, name, location`,
        [court.name, court.description, court.location, court.hourly_rate, ownerId, court.skill_level, court.image_url, court.is_available]
      );
      
      console.log(`Created court: ${result.rows[0].name} at ${result.rows[0].location}`);
    }
    
    console.log('Sample courts created successfully');
  } catch (error) {
    console.error('Error creating sample courts:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the sample data creation process
async function createSampleData() {
  try {
    await createSampleUsers();
    await createSampleCourts();
    console.log('Sample data creation completed successfully');
  } catch (error) {
    console.error('Sample data creation failed:', error);
  } finally {
    await pool.end();
  }
}

createSampleData();

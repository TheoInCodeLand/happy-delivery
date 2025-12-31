const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function setupDatabase() {
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Setting up database schema...');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database schema created successfully!');
    
    // Insert sample data
    console.log('🌱 Inserting sample data...');
    await seedDatabase();
    
    console.log('🎉 Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

async function seedDatabase() {
  const sampleQueries = [
    `INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone_number) 
     VALUES ('11111111-1111-1111-1111-111111111111', 'customer@example.com', '$2a$10$hashedpassword', 'customer', 'John', 'Doe', '+1234567890')
     ON CONFLICT (email) DO NOTHING;`,
    
    `INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone_number) 
     VALUES ('22222222-2222-2222-2222-222222222222', 'driver@example.com', '$2a$10$hashedpassword', 'driver', 'Mike', 'Johnson', '+1234567891')
     ON CONFLICT (email) DO NOTHING;`
  ];
  
  for (const query of sampleQueries) {
    await pool.query(query);
  }
}

setupDatabase();
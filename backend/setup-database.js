const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function setupDatabase() {
  // Get connection string from environment or .env file
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://username:password@ep-cool-sun-123456.us-east-2.aws.neon.tech/dbname';

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Neon
    }
  });

  try {
    await client.connect();
    console.log('---------- Connected to Neon PostgreSQL ----------');

    // Read and execute the schema
    const sql = fs.readFileSync('database_schema.sql', 'utf8');
    await client.query(sql);
    
    console.log('Database schema created successfully!');
  } catch (error) {
    console.error('Error setting up database:', error.message);
  } finally {
    await client.end();
  }
}

setupDatabase();
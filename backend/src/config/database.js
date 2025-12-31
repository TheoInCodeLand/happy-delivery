const { Pool } = require('pg');
require('dotenv').config();

// Remove channel_binding from the URL if it exists
const connectionString = process.env.DATABASE_URL.replace('&channel_binding=require', '');

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Essential for serverless/cloud DBs
  connectionTimeoutMillis: 10000, // 10 seconds to allow for cold starts
  idleTimeoutMillis: 30000,       // Keep connections alive for 30s
  max: 10,                        // Max clients in pool
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to Neon PostgreSQL database');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
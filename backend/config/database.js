const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'college_canteen',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DATABASE_URL || process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
});

module.exports = pool;

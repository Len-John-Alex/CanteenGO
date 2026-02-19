const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function getCode() {
    try {
        const res = await pool.query('SELECT verification_code FROM students WHERE student_id = $1', ['B25CS1236']);
        console.log('Verification Code Result:', JSON.stringify(res.rows, null, 2));
        await pool.end();
    } catch (err) {
        console.error('Database Error:', err);
        process.exit(1);
    }
}

getCode();

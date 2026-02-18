const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        await client.connect();
        console.log('Connected to PG');

        // Test Student Login
        const studentId = 'STU001';
        const rawPassword = 'password123';

        const res = await client.query('SELECT * FROM students WHERE student_id = $1', [studentId]);

        if (res.rows.length === 0) {
            console.log('FAIL: Student not found in database');
        } else {
            const user = res.rows[0];
            console.log('SUCCESS: Student found:', user.student_id);
            console.log('Account Verified:', user.is_verified);

            const match = await bcrypt.compare(rawPassword, user.password);
            console.log('Password match:', match);

            if (match && user.is_verified) {
                console.log('VERDICT: Login should work for STU001');
            }
        }

        // Test Staff Login
        const staffId = 'STAFF036';
        const staffPass = 'whatisthepassword';

        const staffRes = await client.query('SELECT * FROM staff WHERE staff_id = $1', [staffId]);
        if (staffRes.rows.length === 0) {
            console.log('FAIL: Staff not found in database');
        } else {
            const user = staffRes.rows[0];
            console.log('SUCCESS: Staff found:', user.staff_id);
            const match = await bcrypt.compare(staffPass, user.password);
            console.log('Staff Password match:', match);
        }

    } catch (e) {
        console.error('ERROR during test:', e);
    } finally {
        await client.end();
    }
}

test();

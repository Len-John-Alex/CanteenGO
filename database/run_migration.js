const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const fs = require('fs');

const runMigration = async () => {
    try {
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'college_canteen',
            port: process.env.DB_PORT || 5432,
            ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
        });

        await client.connect();
        console.log('Connected to database.');

        let schemas = ['01_add_time_slots.sql', '02_add_orders.sql'];

        if (process.argv[2]) {
            schemas = [process.argv[2]];
        }

        for (const schema of schemas) {
            console.log(`Running migration: ${schema}...`);
            let filePath;
            if (process.argv[2] && (schema.includes('/') || schema.includes('\\'))) {
                filePath = path.resolve(process.cwd(), schema);
            } else {
                filePath = path.join(__dirname, schema);
            }
            const sql = fs.readFileSync(filePath, 'utf8');
            await client.query(sql);
        }
        console.log('Migration completed successfully.');

        // Verify
        const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'time_slots'");
        console.table(res.rows);

        await client.end();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();

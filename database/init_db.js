const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const fs = require('fs');

const initDb = async () => {
    try {
        const clientConfig = {
            connectionString: process.env.DATABASE_URL,
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'college_canteen',
            port: process.env.DB_PORT || 5432,
            ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
        };

        const client = new Client(clientConfig);

        await client.connect();
        console.log('Connected to database.');

        const sqlFiles = [
            'schema.sql'
        ];

        for (const file of sqlFiles) {
            console.log(`Running: ${file}...`);
            const filePath = path.join(__dirname, file);
            let sql = fs.readFileSync(filePath, 'utf8');
            // PostgreSQL doesn't support multiple statements in one query easily with standard drivers 
            // but the 'pg' Client.query() CAN handle multiple statements if they are separated by semicolons.
            await client.query(sql);
            console.log(`Successfully applied ${file}`);
        }

        console.log('Database initialization completed successfully!');
        await client.end();
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};

initDb();

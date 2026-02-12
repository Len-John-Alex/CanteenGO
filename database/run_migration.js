const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const fs = require('fs');

const runMigration = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'college_canteen',
            multipleStatements: true
        });

        console.log('Connected to database.');

        let schemas = ['01_add_time_slots.sql', '02_add_orders.sql'];

        // If an argument is provided, run only that migration
        if (process.argv[2]) {
            schemas = [process.argv[2]];
            // Handle if path is provided
            if (schemas[0].includes('/') || schemas[0].includes('\\')) {
                // assume absolute or relative path is handled by path.basename in the loop if we want, 
                // but simpler to just use path.resolve
            }
        }

        for (const schema of schemas) {
            console.log(`Running migration: ${schema}...`);
            let filePath;
            if (process.argv[2]) {
                filePath = path.resolve(process.cwd(), schema);
            } else {
                filePath = path.join(__dirname, schema);
            }
            const sql = fs.readFileSync(filePath, 'utf8');
            await connection.query(sql);
        }
        console.log('Migration completed successfully.');

        // Verify
        const [rows] = await connection.query('DESCRIBE time_slots');
        console.table(rows);

        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();

#!/usr/bin/env node
// Script to recreate the shared_with_emails column as proper JSON type

require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

async function recreateColumn() {
    try {
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'banana_db',
            port: parseInt(process.env.DB_PORT || '3306'),
        };

        console.log('Connecting to database...');
        const pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();

        console.log('Checking current column...');
        const [rows] = await connection.execute(
            "SHOW COLUMNS FROM registrations LIKE 'shared_with_emails'"
        );

        if (rows.length > 0) {
            console.log('Dropping existing column...');
            await connection.execute(
                "ALTER TABLE registrations DROP COLUMN shared_with_emails"
            );
            console.log('✅ Column dropped successfully');
        }

        console.log('Adding column as JSON type...');
        await connection.execute(
            "ALTER TABLE registrations ADD COLUMN shared_with_emails JSON NULL"
        );
        console.log('✅ Column added as JSON type successfully');

        // Verify the new column type
        console.log('Verifying new column type...');
        const [newRows] = await connection.execute(
            "SHOW COLUMNS FROM registrations LIKE 'shared_with_emails'"
        );

        if (newRows.length > 0) {
            console.log('New column definition:', newRows[0]);
            if (newRows[0].Type === 'json') {
                console.log('✅ Column is now properly set as JSON type');
            } else {
                console.log('⚠️ Column type is still not JSON:', newRows[0].Type);
            }
        }

        connection.release();
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

recreateColumn();
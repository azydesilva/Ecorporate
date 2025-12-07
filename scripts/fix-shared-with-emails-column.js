#!/usr/bin/env node
// Script to fix the shared_with_emails column to be proper JSON type

require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

async function fixColumn() {
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

        console.log('Checking current column type...');
        const [rows] = await connection.execute(
            "SHOW COLUMNS FROM registrations LIKE 'shared_with_emails'"
        );

        if (rows.length > 0) {
            const column = rows[0];
            console.log('Current column definition:', column);

            if (column.Type === 'longtext' || column.Type === 'text') {
                console.log('Converting column to JSON type...');
                // First, we need to ensure all existing data is valid JSON
                // Then modify the column type
                await connection.execute(
                    "ALTER TABLE registrations MODIFY shared_with_emails JSON NULL"
                );
                console.log('✅ Column converted to JSON type successfully');
            } else if (column.Type === 'json') {
                console.log('✅ Column is already JSON type');
            } else {
                console.log('⚠️ Unexpected column type:', column.Type);
            }
        } else {
            console.log('❌ Column shared_with_emails does not exist');
            console.log('Adding column as JSON type...');
            await connection.execute(
                "ALTER TABLE registrations ADD COLUMN shared_with_emails JSON NULL"
            );
            console.log('✅ Column added as JSON type successfully');
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

fixColumn();
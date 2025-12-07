#!/usr/bin/env node
// Script to check if shared_with_emails column exists in registrations table

require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

async function checkColumn() {
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

        console.log('Checking for shared_with_emails column...');
        const [rows] = await connection.execute(
            "SHOW COLUMNS FROM registrations LIKE 'shared_with_emails'"
        );

        if (rows.length > 0) {
            console.log('✅ Column shared_with_emails EXISTS:');
            console.log(rows[0]);
        } else {
            console.log('❌ Column shared_with_emails does NOT exist');

            // List all columns to see what we have
            console.log('\nAll columns in registrations table:');
            const [allColumns] = await connection.execute('SHOW COLUMNS FROM registrations');
            allColumns.forEach(col => {
                console.log(`- ${col.Field}`);
            });
        }

        connection.release();
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkColumn();
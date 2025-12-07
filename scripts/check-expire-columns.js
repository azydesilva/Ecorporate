#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkExpireColumns() {
    console.log('🔍 Checking expire date related columns in registrations table...');

    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'wp@XRT.2003',
        database: process.env.DB_NAME || 'banana_db',
        port: parseInt(process.env.DB_PORT || '3306'),
    };

    try {
        // Create connection
        const connection = await mysql.createConnection(dbConfig);

        // Get all columns from registrations table
        const [columns] = await connection.execute('DESCRIBE registrations');

        console.log('📋 Expire date related columns in registrations table:');
        columns.forEach(column => {
            if (column.Field.includes('expire') || column.Field.includes('expired') || column.Field.includes('notification')) {
                console.log(`  - ${column.Field}: ${column.Type} (${column.Null}) Default: ${column.Default || 'NULL'}`);
            }
        });

        await connection.end();

    } catch (error) {
        console.error('❌ Failed to check expire columns:', error.message);
        process.exit(1);
    }
}

checkExpireColumns();
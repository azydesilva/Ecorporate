#!/usr/bin/env node

// Database migration script to add password reset columns to users table
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    database: process.env.DB_NAME || 'banana_db',
    port: parseInt(process.env.DB_PORT || '3306'),
};

async function migrateDatabase() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully');

        // Add password reset columns to users table
        console.log('Adding password reset columns to users table...');

        // Add reset_token column
        try {
            await connection.execute(
                'ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL'
            );
            console.log('✅ Added reset_token column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  reset_token column already exists');
            } else {
                throw error;
            }
        }

        // Add reset_token_expires column
        try {
            await connection.execute(
                'ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP NULL'
            );
            console.log('✅ Added reset_token_expires column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  reset_token_expires column already exists');
            } else {
                throw error;
            }
        }

        console.log('✅ Database migration completed successfully');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database migration failed:', error);
        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

// Run migration
migrateDatabase().catch(error => {
    console.error('Unhandled error during migration:', error);
    process.exit(1);
});
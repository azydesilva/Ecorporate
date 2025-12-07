#!/usr/bin/env node

/**
 * Migration script to add additional_fees column to registrations table
 * This allows storing calculated additional director and shareholder charges in the database
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edashboard',
    port: process.env.DB_PORT || 3306
};

async function addAdditionalFeesToRegistrations() {
    let connection;

    try {
        console.log('🔄 Starting migration: Add additional_fees column to registrations table...');

        // Create database connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Check if additional_fees column already exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'additional_fees'
        `, [process.env.DB_NAME || 'edashboard']);

        if (columns.length > 0) {
            console.log('ℹ️  additional_fees column already exists in registrations table, skipping migration');
            return;
        }

        // Add additional_fees column
        await connection.execute(`
            ALTER TABLE registrations 
            ADD COLUMN additional_fees JSON DEFAULT NULL
        `);

        console.log('✅ Successfully added additional_fees column to registrations table');

        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the migration
addAdditionalFeesToRegistrations();

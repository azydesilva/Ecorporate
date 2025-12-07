#!/usr/bin/env node

/**
 * Migration script to add additional_fees column to settings table
 * This allows storing additional director and shareholder charges in the database
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateAddAdditionalFeesColumn() {
    let connection;

    try {
        console.log('🔄 Starting migration: Add additional_fees column to settings table...');

        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edashboard',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Check if additional_fees column already exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'additional_fees'
        `, [process.env.DB_NAME || 'edashboard']);

        if (columns.length > 0) {
            console.log('ℹ️  additional_fees column already exists, skipping migration');
            return;
        }

        // Add additional_fees column
        await connection.execute(`
            ALTER TABLE settings 
            ADD COLUMN additional_fees JSON DEFAULT NULL
        `);

        console.log('✅ Successfully added additional_fees column to settings table');

        // Update existing settings record to have default additional_fees structure
        const [existingSettings] = await connection.execute('SELECT id FROM settings LIMIT 1');

        if (existingSettings.length > 0) {
            const defaultAdditionalFees = {
                directors: {
                    local: 0,
                    foreign: 0
                },
                shareholders: {
                    localNaturalPerson: 0,
                    localLegalEntity: 0,
                    foreignNaturalPerson: 0,
                    foreignLegalEntity: 0
                }
            };

            await connection.execute(`
                UPDATE settings 
                SET additional_fees = ? 
                WHERE id = ?
            `, [JSON.stringify(defaultAdditionalFees), existingSettings[0].id]);

            console.log('✅ Updated existing settings record with default additional_fees structure');
        }

        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateAddAdditionalFeesColumn()
        .then(() => {
            console.log('✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateAddAdditionalFeesColumn };

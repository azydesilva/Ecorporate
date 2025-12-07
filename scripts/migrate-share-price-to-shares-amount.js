#!/usr/bin/env node

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    database: process.env.DB_NAME || 'banana_db'
};

// Colors for terminal output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color, symbol, message) {
    console.log(`${color}${symbol} ${message}${colors.reset}`);
}

async function migrateSharePriceToSharesAmount() {
    let connection;

    try {
        log(colors.blue, '🔄', 'Starting migration: share_price → shares_amount');

        // Create connection
        connection = await mysql.createConnection(dbConfig);
        log(colors.green, '✅', 'Connected to database');

        // Check if share_price column exists
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        const hasSharePrice = existingColumns.includes('share_price');
        const hasSharesAmount = existingColumns.includes('shares_amount');

        if (!hasSharePrice && hasSharesAmount) {
            log(colors.yellow, '⚠️', 'Migration already completed. Column shares_amount exists and share_price does not exist.');
            return;
        }

        if (!hasSharePrice) {
            log(colors.red, '❌', 'Column share_price not found in registrations table');
            process.exit(1);
        }

        if (hasSharesAmount) {
            log(colors.yellow, '⚠️', 'Column shares_amount already exists. Will drop it and recreate from share_price data.');
            await connection.execute('ALTER TABLE registrations DROP COLUMN shares_amount');
            log(colors.yellow, '🗑️', 'Dropped existing shares_amount column');
        }

        // Create the new column first
        await connection.execute(`
            ALTER TABLE registrations 
            ADD COLUMN shares_amount VARCHAR(50) AFTER postal_code
        `);
        log(colors.green, '✅', 'Added new column: shares_amount');

        // Copy data from share_price to shares_amount
        await connection.execute(`
            UPDATE registrations 
            SET shares_amount = share_price 
            WHERE share_price IS NOT NULL
        `);
        log(colors.green, '📋', 'Copied data from share_price to shares_amount');

        // Drop the old column
        await connection.execute('ALTER TABLE registrations DROP COLUMN share_price');
        log(colors.green, '🗑️', 'Dropped old column: share_price');

        // Verify the migration
        const [newColumns] = await connection.execute('DESCRIBE registrations');
        const finalColumns = newColumns.map(col => col.Field);

        if (finalColumns.includes('shares_amount') && !finalColumns.includes('share_price')) {
            log(colors.green, '✅', 'Migration completed successfully!');
            log(colors.blue, '📊', 'Column shares_amount is now available');
        } else {
            throw new Error('Migration verification failed');
        }

        // Show column information
        const [columnInfo] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'shares_amount'
        `, [dbConfig.database]);

        if (columnInfo.length > 0) {
            const col = columnInfo[0];
            log(colors.blue, '📋', `Column details: ${col.COLUMN_NAME} ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
        }

    } catch (error) {
        log(colors.red, '❌', `Migration failed: ${error.message}`);
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            log(colors.blue, '🔐', 'Database connection closed');
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateSharePriceToSharesAmount();
}

module.exports = { migrateSharePriceToSharesAmount };
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

async function verifySharesAmountColumn() {
    let connection;

    try {
        console.log('🔍 Verifying shares_amount column...');

        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Check column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'shares_amount'
        `, [dbConfig.database]);

        if (columns.length === 0) {
            console.log('❌ Column shares_amount not found');
            return false;
        }

        const col = columns[0];
        console.log('✅ Column shares_amount found:');
        console.log(`   - Type: ${col.DATA_TYPE}`);
        console.log(`   - Nullable: ${col.IS_NULLABLE}`);
        console.log(`   - Default: ${col.COLUMN_DEFAULT || 'NULL'}`);

        // Check if old column still exists
        const [oldColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'share_price'
        `, [dbConfig.database]);

        if (oldColumns.length > 0) {
            console.log('⚠️  Old column share_price still exists');
            return false;
        } else {
            console.log('✅ Old column share_price successfully removed');
        }

        // Test a simple query
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM registrations');
        console.log(`✅ Registrations table accessible (${rows[0].count} records)`);

        console.log('✅ Database migration verification completed successfully');
        return true;

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔐 Database connection closed');
        }
    }
}

// Run verification if called directly
if (require.main === module) {
    verifySharesAmountColumn().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { verifySharesAmountColumn };
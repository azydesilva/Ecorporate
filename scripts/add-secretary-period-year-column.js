const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSecretaryPeriodYearColumn() {
    let connection;

    try {
        console.log('🚀 Starting migration: Add secretary_period_year column...');

        // Database configuration
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'wp@XRT.2003',
            database: process.env.DB_NAME || 'banana_db',
            port: parseInt(process.env.DB_PORT || '3306'),
        };

        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully');

        // Check if column already exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'registrations' 
            AND COLUMN_NAME = 'secretary_period_year'
        `, [dbConfig.database]);

        if (columns.length > 0) {
            console.log('ℹ️  secretary_period_year column already exists. Skipping migration.');
            return;
        }

        // Add the column
        console.log('📝 Adding secretary_period_year column to registrations table...');
        await connection.execute(`
            ALTER TABLE registrations 
            ADD COLUMN secretary_period_year VARCHAR(4) NULL 
            AFTER expire_date
        `);

        console.log('✅ secretary_period_year column added successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('📡 Database connection closed');
        }
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    addSecretaryPeriodYearColumn()
        .then(() => {
            console.log('\n✅ Migration completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { addSecretaryPeriodYearColumn };


const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCompanyDetailsLockedColumn() {
    let connection;

    try {
        console.log('🔧 Starting migration: Add company_details_locked column...');

        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edashboard',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Check if column already exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'registrations' 
            AND COLUMN_NAME = 'company_details_locked'
        `);

        if (columns.length > 0) {
            console.log('✅ Column company_details_locked already exists, skipping migration');
            return;
        }

        // Add the column
        await connection.execute(`
            ALTER TABLE registrations 
            ADD COLUMN company_details_locked BOOLEAN DEFAULT FALSE 
            AFTER company_entity
        `);

        console.log('✅ Successfully added company_details_locked column to registrations table');

        // Verify the column was added
        const [newColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'registrations' 
            AND COLUMN_NAME = 'company_details_locked'
        `);

        if (newColumns.length > 0) {
            console.log('✅ Column verification successful:', newColumns[0]);
        } else {
            console.error('❌ Column verification failed - column not found');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the migration
if (require.main === module) {
    addCompanyDetailsLockedColumn()
        .then(() => {
            console.log('🎉 Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = addCompanyDetailsLockedColumn;

// Migration script to remove unnecessary columns from registrations table
const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeUnnecessaryColumns() {
    let connection;

    try {
        console.log('🚀 Starting migration to remove unnecessary columns...');

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

        // Define columns to remove
        const columnsToRemove = [
            'customer_documents',
            'import_export_status',
            'imports_to_add',
            'other_business_activities'
        ];

        // Check which columns exist
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        console.log(`📊 Found ${existingColumns.length} columns in registrations table`);

        let removedCount = 0;

        // Remove each column if it exists
        for (const columnName of columnsToRemove) {
            if (existingColumns.includes(columnName)) {
                try {
                    await connection.execute(`ALTER TABLE registrations DROP COLUMN ${columnName}`);
                    console.log(`✅ Removed column: ${columnName}`);
                    removedCount++;
                } catch (error) {
                    console.error(`❌ Error removing column ${columnName}:`, error.message);
                }
            } else {
                console.log(`ℹ️  Column ${columnName} does not exist. Skipping.`);
            }
        }

        if (removedCount > 0) {
            console.log(`\n✅ Migration completed successfully! Removed ${removedCount} columns.`);
        } else {
            console.log('\n✅ No columns needed to be removed. Migration complete.');
        }

        // Show final table structure (unnecessary columns)
        console.log('\n📋 Verifying unnecessary columns are removed:');
        const [finalColumns] = await connection.execute('DESCRIBE registrations');
        const finalColumnNames = finalColumns.map(col => col.Field);

        const stillExists = columnsToRemove.filter(col => finalColumnNames.includes(col));
        if (stillExists.length > 0) {
            console.log(`❌ Warning: These columns still exist: ${stillExists.join(', ')}`);
        } else {
            console.log('✅ All unnecessary columns successfully removed');
        }

        console.log('\n✅ Unnecessary columns removal migration completed successfully!');

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
    removeUnnecessaryColumns()
        .then(() => {
            console.log('🎉 Unnecessary columns removal migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = removeUnnecessaryColumns;
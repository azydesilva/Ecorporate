// Migration script to add step3_signed_additional_doc column to registrations table
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateStep3SignedAdditionalDoc() {
    let connection;

    try {
        console.log('🚀 Starting migration for step3_signed_additional_doc column...');

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
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        if (existingColumns.includes('step3_signed_additional_doc')) {
            console.log('ℹ️  Column step3_signed_additional_doc already exists. Skipping migration.');
            return;
        }

        // Add the new column
        await connection.execute(`
      ALTER TABLE registrations 
      ADD COLUMN step3_signed_additional_doc JSON
    `);

        console.log('✅ Successfully added step3_signed_additional_doc column to registrations table');

        // Verify the column was added
        const [newColumns] = await connection.execute('DESCRIBE registrations');
        const columnExists = newColumns.some(col => col.Field === 'step3_signed_additional_doc');

        if (columnExists) {
            console.log('✅ Verification successful: step3_signed_additional_doc column exists');
        } else {
            console.log('❌ Verification failed: step3_signed_additional_doc column not found');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  Column already exists, no action needed');
        } else {
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateStep3SignedAdditionalDoc()
        .then(() => {
            console.log('🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = migrateStep3SignedAdditionalDoc; 
// Migration script to copy data from make_simple_books_secretary to company_secreatary
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateCompanySecretaryData() {
    let connection;

    try {
        console.log('🚀 Starting data migration from make_simple_books_secretary to company_secreatary...');

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

        // Check if both columns exist
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        const hasOldColumn = existingColumns.includes('make_simple_books_secretary');
        const hasNewColumn = existingColumns.includes('company_secreatary');

        console.log(`📊 Column status: old=${hasOldColumn}, new=${hasNewColumn}`);

        if (hasOldColumn && hasNewColumn) {
            // Copy data from old column to new column
            const [result] = await connection.execute(`
                UPDATE registrations 
                SET company_secreatary = make_simple_books_secretary 
                WHERE make_simple_books_secretary IS NOT NULL AND company_secreatary IS NULL
            `);

            console.log(`✅ Data migration completed. Rows affected: ${result.affectedRows}`);

            // Drop the old column
            await connection.execute('ALTER TABLE registrations DROP COLUMN make_simple_books_secretary');
            console.log('✅ Dropped old make_simple_books_secretary column');
        } else if (hasNewColumn && !hasOldColumn) {
            console.log('ℹ️  Migration already completed. Only company_secreatary column exists.');
        } else if (hasOldColumn && !hasNewColumn) {
            console.log('⚠️  Old column exists but new column missing. Please run column creation first.');
        } else {
            console.log('⚠️  Neither column found. Database may need initialization.');
        }

        console.log('\n✅ Data migration completed successfully!');

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
    migrateCompanySecretaryData()
        .then(() => {
            console.log('🎉 Data migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = migrateCompanySecretaryData;
// Migration script to add company_activities column to registrations table
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCompanyActivitiesColumn() {
    let connection;

    try {
        console.log('🚀 Starting migration to add company_activities column...');

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

        // Check if the column already exists
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        console.log(`📊 Found ${existingColumns.length} columns in registrations table`);

        if (existingColumns.includes('company_activities')) {
            console.log('ℹ️  Column company_activities already exists. Skipping migration.');
            return;
        }

        // Add the new column
        await connection.execute(`
            ALTER TABLE registrations 
            ADD COLUMN company_activities TEXT
        `);

        console.log('✅ Successfully added company_activities column');

        // Verify the column was added
        console.log('\n📋 Verifying column addition:');
        const [finalColumns] = await connection.execute('DESCRIBE registrations');
        const finalColumnNames = finalColumns.map(col => col.Field);

        if (finalColumnNames.includes('company_activities')) {
            console.log('✅ Column company_activities successfully added');
        } else {
            console.log('❌ Warning: company_activities column not found after migration');
        }

        console.log('\n✅ Company Activities column addition migration completed successfully!');

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
    addCompanyActivitiesColumn()
        .then(() => {
            console.log('🎉 Company Activities column addition migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = addCompanyActivitiesColumn;
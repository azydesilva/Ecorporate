// Migration script to rename make_simple_books_secreatary column to company_secreatary
const mysql = require('mysql2/promise');
require('dotenv').config();

async function renameMakeSimpleBooksSecreataryToCompanySecreatary() {
    let connection;

    try {
        console.log('🚀 Starting migration to rename make_simple_books_secreatary to company_secreatary...');

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

        // Check if the old column exists
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        console.log(`📊 Found ${existingColumns.length} columns in registrations table`);

        if (existingColumns.includes('make_simple_books_secreatary')) {
            console.log('📋 Found make_simple_books_secreatary column. Proceeding with rename...');

            // Check if the new column already exists
            if (existingColumns.includes('company_secreatary')) {
                console.log('⚠️  company_secreatary column already exists. Migrating data and dropping old column...');

                // Copy data from old column to new column
                await connection.execute(`
                    UPDATE registrations 
                    SET company_secreatary = make_simple_books_secreatary 
                    WHERE make_simple_books_secreatary IS NOT NULL AND company_secreatary IS NULL
                `);
                console.log('✅ Data migrated from make_simple_books_secreatary to company_secreatary');

                // Drop the old column
                await connection.execute('ALTER TABLE registrations DROP COLUMN make_simple_books_secreatary');
                console.log('✅ Dropped old make_simple_books_secreatary column');
            } else {
                // Rename the column directly
                await connection.execute(`
                    ALTER TABLE registrations 
                    CHANGE COLUMN make_simple_books_secreatary company_secreatary VARCHAR(255)
                `);
                console.log('✅ Successfully renamed make_simple_books_secreatary to company_secreatary');
            }
        } else if (existingColumns.includes('company_secreatary')) {
            console.log('ℹ️  Column company_secreatary already exists and make_simple_books_secreatary not found. Migration may have already been completed.');
        } else {
            console.log('⚠️  Neither make_simple_books_secreatary nor company_secreatary column found. Creating company_secreatary column...');

            // Create the new column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN company_secreatary VARCHAR(255)
            `);
            console.log('✅ Created company_secreatary column');
        }

        // Verify the final state
        console.log('\n📋 Verifying column rename:');
        const [finalColumns] = await connection.execute('DESCRIBE registrations');
        const finalColumnNames = finalColumns.map(col => col.Field);

        if (finalColumnNames.includes('company_secreatary') && !finalColumnNames.includes('make_simple_books_secreatary')) {
            console.log('✅ Column successfully renamed to company_secreatary');
        } else if (finalColumnNames.includes('make_simple_books_secreatary')) {
            console.log('❌ Warning: make_simple_books_secreatary column still exists');
        } else {
            console.log('❌ Warning: company_secreatary column not found');
        }

        console.log('\n✅ Column rename migration completed successfully!');

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
    renameMakeSimpleBooksSecreataryToCompanySecreatary()
        .then(() => {
            console.log('🎉 Column rename migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = renameMakeSimpleBooksSecreataryToCompanySecreatary;
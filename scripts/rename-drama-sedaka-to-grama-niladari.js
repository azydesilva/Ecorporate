// Migration script to rename drama_sedaka_division column to grama_niladari
const mysql = require('mysql2/promise');
require('dotenv').config();

async function renameDramaSedakaToGramaNiladari() {
    let connection;

    try {
        console.log('🚀 Starting migration to rename drama_sedaka_division to grama_niladari...');

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

        if (existingColumns.includes('drama_sedaka_division')) {
            console.log('📋 Found drama_sedaka_division column. Proceeding with rename...');

            // Check if the new column already exists
            if (existingColumns.includes('grama_niladari')) {
                console.log('⚠️  grama_niladari column already exists. Migrating data and dropping old column...');

                // Copy data from old column to new column
                await connection.execute(`
                    UPDATE registrations 
                    SET grama_niladari = drama_sedaka_division 
                    WHERE drama_sedaka_division IS NOT NULL AND grama_niladari IS NULL
                `);
                console.log('✅ Data migrated from drama_sedaka_division to grama_niladari');

                // Drop the old column
                await connection.execute('ALTER TABLE registrations DROP COLUMN drama_sedaka_division');
                console.log('✅ Dropped old drama_sedaka_division column');
            } else {
                // Rename the column directly
                await connection.execute(`
                    ALTER TABLE registrations 
                    CHANGE COLUMN drama_sedaka_division grama_niladari VARCHAR(255)
                `);
                console.log('✅ Successfully renamed drama_sedaka_division to grama_niladari');
            }
        } else if (existingColumns.includes('grama_niladari')) {
            console.log('ℹ️  Column grama_niladari already exists and drama_sedaka_division not found. Migration may have already been completed.');
        } else {
            console.log('⚠️  Neither drama_sedaka_division nor grama_niladari column found. Creating grama_niladari column...');

            // Create the new column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN grama_niladari VARCHAR(255)
            `);
            console.log('✅ Created grama_niladari column');
        }

        // Verify the final state
        console.log('\n📋 Verifying column rename:');
        const [finalColumns] = await connection.execute('DESCRIBE registrations');
        const finalColumnNames = finalColumns.map(col => col.Field);

        if (finalColumnNames.includes('grama_niladari') && !finalColumnNames.includes('drama_sedaka_division')) {
            console.log('✅ Column successfully renamed to grama_niladari');
        } else if (finalColumnNames.includes('drama_sedaka_division')) {
            console.log('❌ Warning: drama_sedaka_division column still exists');
        } else {
            console.log('❌ Warning: grama_niladari column not found');
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
    renameDramaSedakaToGramaNiladari()
        .then(() => {
            console.log('🎉 Column rename migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = renameDramaSedakaToGramaNiladari;
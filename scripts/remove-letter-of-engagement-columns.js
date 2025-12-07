const mysql = require('mysql2/promise');

async function removeLetterOfEngagementColumns() {
    console.log('🔄 Starting removal of letter_of_engagement columns...');

    let connection;
    try {
        // Create connection to MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'wp@XRT.2003',
            database: process.env.DB_NAME || 'banana_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to MySQL database');

        // Check if letter_of_engagement column exists and drop it
        const [letterOfEngagementColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'letter_of_engagement'
        `, [process.env.DB_NAME || 'banana_db']);

        if (letterOfEngagementColumns.length > 0) {
            console.log('📝 Dropping letter_of_engagement column...');
            await connection.execute(`
                ALTER TABLE registrations 
                DROP COLUMN letter_of_engagement
            `);
            console.log('✅ letter_of_engagement column dropped successfully');
        } else {
            console.log('ℹ️ letter_of_engagement column does not exist (already removed)');
        }

        // Check if customer_letter_of_engagement column exists and drop it
        const [customerLetterOfEngagementColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'customer_letter_of_engagement'
        `, [process.env.DB_NAME || 'banana_db']);

        if (customerLetterOfEngagementColumns.length > 0) {
            console.log('📝 Dropping customer_letter_of_engagement column...');
            await connection.execute(`
                ALTER TABLE registrations 
                DROP COLUMN customer_letter_of_engagement
            `);
            console.log('✅ customer_letter_of_engagement column dropped successfully');
        } else {
            console.log('ℹ️ customer_letter_of_engagement column does not exist (already removed)');
        }

        // Verify the columns are removed
        console.log('🔍 Verifying column removal...');
        const [allColumns] = await connection.execute('DESCRIBE registrations');
        const remainingColumns = allColumns.map(col => col.Field);

        const letterEngagementColumns = remainingColumns.filter(col =>
            col.includes('letter_of_engagement') || col.includes('letterOfEngagement')
        );

        if (letterEngagementColumns.length === 0) {
            console.log('✅ All letter_of_engagement columns have been successfully removed');
        } else {
            console.log('⚠️ Some letter_of_engagement related columns still exist:');
            letterEngagementColumns.forEach(col => console.log(`  - ${col}`));
        }

        console.log('\n📊 Current registrations table structure:');
        console.log('Relevant document columns:');
        const documentColumns = remainingColumns.filter(col =>
            col.includes('form') || col.includes('aoa') || col.includes('address_proof') ||
            col.includes('document') || col.includes('certificate')
        );
        documentColumns.forEach(col => console.log(`  - ${col}`));

        console.log('\n🎉 Migration completed successfully!');
        console.log('📋 Summary: Removed all letter_of_engagement columns from database');
        console.log('💡 Note: form19 and customer_form19 columns are retained for document storage');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });

    removeLetterOfEngagementColumns()
        .then(() => {
            console.log('\n✨ Letter of engagement columns removal completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { removeLetterOfEngagementColumns };
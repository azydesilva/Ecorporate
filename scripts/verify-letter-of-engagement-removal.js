const mysql = require('mysql2/promise');

async function verifyLetterOfEngagementRemoval() {
    console.log('🔍 Verifying letter_of_engagement removal...');

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

        // Check database schema for any remaining letter_of_engagement columns
        console.log('🔍 Checking database schema...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME || 'banana_db']);

        console.log('\n📊 Current registrations table columns:');
        columns.forEach(col => {
            const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
            console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${nullable}`);
        });

        // Check specifically for any letter_of_engagement columns
        const letterEngagementColumns = columns.filter(col =>
            col.COLUMN_NAME.includes('letter_of_engagement') ||
            col.COLUMN_NAME.includes('letterOfEngagement')
        );

        console.log('\n🔍 Letter of engagement columns found:');
        if (letterEngagementColumns.length === 0) {
            console.log('✅ No letter_of_engagement columns found - removal successful!');
        } else {
            console.log('⚠️ Found remaining letter_of_engagement columns:');
            letterEngagementColumns.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
            });
        }

        // Check that form19 and customer_form19 columns exist
        const form19Columns = columns.filter(col =>
            col.COLUMN_NAME === 'form19' || col.COLUMN_NAME === 'customer_form19'
        );

        console.log('\n🔍 Form19 columns status:');
        if (form19Columns.length >= 2) {
            console.log('✅ Both form19 and customer_form19 columns exist');
            form19Columns.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
            });
        } else {
            console.log('⚠️ Missing form19 columns:');
            const expectedColumns = ['form19', 'customer_form19'];
            const existingForm19Columns = form19Columns.map(col => col.COLUMN_NAME);
            const missingColumns = expectedColumns.filter(col => !existingForm19Columns.includes(col));
            missingColumns.forEach(col => {
                console.log(`  - Missing: ${col}`);
            });
        }

        // Sample a few registrations to check data format
        console.log('\n🔍 Sampling registration data...');
        const [registrations] = await connection.execute(`
            SELECT id, company_name, form19, customer_form19 
            FROM registrations 
            LIMIT 3
        `);

        if (registrations.length > 0) {
            console.log('📊 Sample registration data:');
            registrations.forEach((reg, index) => {
                console.log(`  Registration ${index + 1}:`);
                console.log(`    ID: ${reg.id}`);
                console.log(`    Company: ${reg.company_name}`);
                console.log(`    form19: ${reg.form19 ? 'has data' : 'no data'}`);
                console.log(`    customer_form19: ${reg.customer_form19 ? 'has data' : 'no data'}`);
            });
        } else {
            console.log('ℹ️ No registration data found in database');
        }

        console.log('\n🎉 Verification completed successfully!');

    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run verification if this script is executed directly
if (require.main === module) {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });

    verifyLetterOfEngagementRemoval()
        .then(() => {
            console.log('\n✨ Letter of engagement removal verification completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Verification failed:', error);
            process.exit(1);
        });
}

module.exports = { verifyLetterOfEngagementRemoval };
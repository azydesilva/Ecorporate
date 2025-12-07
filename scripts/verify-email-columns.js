const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    port: parseInt(process.env.DB_PORT || '3306'),
};

const dbName = process.env.DB_NAME || 'banana_db';

async function verifyEmailColumns() {
    let connection;

    try {
        // Connect to MySQL server
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL server successfully');

        // Use the database
        await connection.query(`USE ${dbName}`);
        console.log(`✅ Using database '${dbName}'`);

        // Get users table structure
        const [columns] = await connection.execute('DESCRIBE users');

        console.log('\n📋 Users table columns:');
        columns.forEach(column => {
            console.log(`  - ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
        });

        // Check for email verification related columns
        const emailColumns = [
            'email_verified',
            'email_verification_token',
            'email_verification_sent_at',
            'email_verified_at',
            'reset_token',
            'reset_token_expires'
        ];

        console.log('\n🔍 Email verification related columns check:');
        let allFound = true;

        emailColumns.forEach(columnName => {
            const column = columns.find(col => col.Field === columnName);
            if (column) {
                console.log(`  ✅ ${columnName} - Found`);
            } else {
                console.log(`  ❌ ${columnName} - Missing`);
                allFound = false;
            }
        });

        if (allFound) {
            console.log('\n🎉 All email verification related columns are properly installed!');
        } else {
            console.log('\n❌ Some email verification related columns are missing.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verifyEmailColumns();
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testColumnAccess() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'wp@XRT.2003',
        database: process.env.DB_NAME || 'banana_db',
        port: parseInt(process.env.DB_PORT || '3306'),
    };

    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database:', dbConfig.database);

        // Test query with the column that's causing issues
        console.log('🔍 Testing query with expiry_notification_sent_at column...');
        const [rows] = await connection.execute(`
            SELECT 
                id, 
                company_name, 
                company_name_english,
                expire_date,
                is_expired,
                expiry_notification_sent_at
            FROM registrations 
            WHERE id = 'test' OR id IS NULL
            LIMIT 1
        `);

        console.log('✅ Query executed successfully!');
        console.log('📋 Sample row structure:', rows[0] || 'No rows returned');

    } catch (error) {
        console.error('❌ Error testing column access:', error.message);
        console.error('📋 Error code:', error.code);
        console.error('📋 SQL message:', error.sqlMessage);
    } finally {
        if (connection) {
            await connection.end();
            console.log('📡 Database connection closed');
        }
    }
}

testColumnAccess();
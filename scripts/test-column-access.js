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

        // First, try the query with the expiry_notification_sent_at column
        console.log('🔍 Testing query with expiry_notification_sent_at column...');
        try {
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
            
            console.log('✅ Query with expiry_notification_sent_at executed successfully!');
        } catch (error) {
            if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage.includes('expiry_notification_sent_at')) {
                console.log('⚠️ expiry_notification_sent_at column not found in database');
                console.log('📝 This is expected if the column was not yet added to the database');
                
                // Try a simpler query without the missing column
                console.log('🔍 Testing query without expiry_notification_sent_at column...');
                const [rows] = await connection.execute(`
                    SELECT 
                        id, 
                        company_name, 
                        company_name_english,
                        expire_date,
                        is_expired
                    FROM registrations 
                    WHERE id = 'test' OR id IS NULL
                    LIMIT 1
                `);
                
                console.log('✅ Query without expiry_notification_sent_at executed successfully!');
            } else {
                throw error;
            }
        }

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
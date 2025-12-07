const mysql = require('mysql2/promise');
require('dotenv').config();

async function addExpiryNotificationSentColumn() {
    // Database configuration - update with your actual database credentials
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'wp@XRT.2003',
        database: process.env.DB_NAME || 'banana_db',
        port: parseInt(process.env.DB_PORT || '3306'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    };

    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection(dbConfig);

        console.log('🔌 Connected to database');

        // Check if the column already exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'expiry_notification_sent_at'
        `, [dbConfig.database]);

        if (columns.length > 0) {
            console.log('✅ expiry_notification_sent_at column already exists');
            return;
        }

        // Add the column
        console.log('📝 Adding expiry_notification_sent_at column to registrations table...');
        await connection.execute(`
            ALTER TABLE registrations 
            ADD COLUMN expiry_notification_sent_at TIMESTAMP NULL 
            AFTER is_expired
        `);

        console.log('✅ expiry_notification_sent_at column added successfully!');

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
    addExpiryNotificationSentColumn()
        .then(() => {
            console.log('\n✅ Migration completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { addExpiryNotificationSentColumn };
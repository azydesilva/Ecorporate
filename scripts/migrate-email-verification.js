const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'banana_db'
};

async function migrateEmailVerification() {
    let connection;

    try {
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        // Add email verification columns to users table
        const columnsToAdd = [
            { name: 'email_verified', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'email_verification_token', type: 'VARCHAR(255)' },
            { name: 'email_verification_sent_at', type: 'TIMESTAMP NULL' },
            { name: 'email_verified_at', type: 'TIMESTAMP NULL' }
        ];

        for (const column of columnsToAdd) {
            try {
                // Check if column already exists
                const [existingColumns] = await connection.execute(
                    `SHOW COLUMNS FROM users LIKE '${column.name}'`
                );

                if (existingColumns.length === 0) {
                    // Add column if it doesn't exist
                    await connection.execute(
                        `ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`
                    );
                    console.log(`✅ Added column: ${column.name}`);
                } else {
                    console.log(`ℹ️  Column already exists: ${column.name}`);
                }
            } catch (error) {
                console.error(`❌ Error adding column ${column.name}:`, error.message);
            }
        }

        console.log('✅ Email verification migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateEmailVerification()
        .then(() => {
            console.log('🎉 Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = migrateEmailVerification;
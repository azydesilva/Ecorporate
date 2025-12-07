const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'banana_db'
};

async function migrateAddUserId() {
    let connection;

    try {
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        // Check if user_id column already exists
        const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'user_id'
    `, [dbConfig.database]);

        if (columns.length > 0) {
            console.log('✅ user_id column already exists in registrations table');
            return;
        }

        // Add user_id column to registrations table
        await connection.execute(`
      ALTER TABLE registrations 
      ADD COLUMN user_id VARCHAR(255) NOT NULL DEFAULT 'default_user'
    `);
        console.log('✅ Added user_id column to registrations table');

        // Add foreign key constraint (optional - can be added later if needed)
        // await connection.execute(`
        //   ALTER TABLE registrations 
        //   ADD CONSTRAINT fk_registrations_user_id 
        //   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        // `);

        console.log('✅ Migration completed successfully');

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
    migrateAddUserId()
        .then(() => {
            console.log('🎉 Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = migrateAddUserId;

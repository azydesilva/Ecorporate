const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
};

const dbName = process.env.DB_NAME || 'edashboard';

function log(symbol, message) {
    console.log(`${symbol} ${message}`);
}

async function runAdminResolutionDocMigration() {
    let connection;

    try {
        log('🚀', 'Starting admin_resolution_doc column migration...');

        // Connect to MySQL server
        connection = await mysql.createConnection(dbConfig);
        log('✅', 'Connected to MySQL server successfully');

        // Use the database
        await connection.query(`USE ${dbName}`);
        log('✅', `Using database '${dbName}'`);

        // Check if admin_resolution_doc column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'admin_resolution_doc'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the admin_resolution_doc column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN admin_resolution_doc JSON
            `);
            log('✅', 'admin_resolution_doc column added successfully');
        } else {
            log('➤', 'admin_resolution_doc column already exists');
        }

        log('🎉', 'Admin resolution doc column migration completed successfully!');

    } catch (error) {
        log('💥', 'Migration failed:');
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the migration
if (require.main === module) {
    runAdminResolutionDocMigration();
}

module.exports = { runAdminResolutionDocMigration };

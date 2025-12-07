const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
};

const dbName = process.env.DB_NAME || 'banana_db';

function log(symbol, message) {
    console.log(`${symbol} ${message}`);
}

async function runSignedAdminResolutionMigration() {
    let connection;

    try {
        log('🚀', 'Starting signed_admin_resolution column migration...');

        // Connect to MySQL server
        connection = await mysql.createConnection(dbConfig);
        log('✅', 'Connected to MySQL server successfully');

        // Use the database
        await connection.query(`USE ${dbName}`);
        log('✅', `Using database '${dbName}'`);

        // Check if signed_admin_resolution column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'signed_admin_resolution'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the signed_admin_resolution column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN signed_admin_resolution JSON
            `);
            log('✅', 'signed_admin_resolution column added successfully');
        } else {
            log('➤', 'signed_admin_resolution column already exists');
        }

        log('🎉', 'Signed admin resolution column migration completed successfully!');

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
    runSignedAdminResolutionMigration();
}

module.exports = { runSignedAdminResolutionMigration };

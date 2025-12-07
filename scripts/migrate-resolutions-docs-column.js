const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    port: parseInt(process.env.DB_PORT || '3306'),
};

const dbName = process.env.DB_NAME || 'banana_db';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function log(color, symbol, message) {
    console.log(`${color}${symbol} ${message}${colors.reset}`);
}

async function runResolutionsDocsMigration() {
    let connection;

    try {
        log(colors.cyan, '🚀', 'Starting resolutions_docs column migration...');

        // Connect to MySQL server
        connection = await mysql.createConnection(dbConfig);
        log(colors.green, '✅', 'Connected to MySQL server successfully');

        // Use the database
        await connection.query(`USE ${dbName}`);
        log(colors.green, '✅', `Using database '${dbName}'`);

        // Check if resolutions_docs column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'resolutions_docs'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the resolutions_docs column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN resolutions_docs JSON
            `);
            log(colors.green, '✅', 'resolutions_docs column added successfully');
        } else {
            log(colors.yellow, '➤', 'resolutions_docs column already exists');
        }

        log(colors.green, '🎉', 'Resolutions docs column migration completed successfully!');

    } catch (error) {
        log(colors.red, '💥', 'Migration failed:');
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
    runResolutionsDocsMigration();
}

module.exports = { runResolutionsDocsMigration };
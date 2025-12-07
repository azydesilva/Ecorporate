const mysql = require('mysql2/promise');

// Use the same configuration as in lib/database.ts
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

console.log('Database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port
});

async function testConnection() {
    try {
        console.log('Creating connection pool...');
        const pool = mysql.createPool(dbConfig);

        console.log('Getting connection...');
        const connection = await pool.getConnection();

        console.log('✅ Database connection successful');

        // Check if the shared_with_emails column exists
        console.log('Checking for shared_with_emails column...');
        const [rows] = await connection.execute(
            "SHOW COLUMNS FROM registrations LIKE 'shared_with_emails'"
        );

        if (rows.length > 0) {
            console.log('✅ Column shared_with_emails EXISTS:');
            console.log(rows[0]);

            // Test a simple query with JSON_SEARCH
            console.log('Testing JSON_SEARCH function...');
            try {
                // First, let's add a test row if none exists
                const [countRows] = await connection.execute("SELECT COUNT(*) as count FROM registrations");
                console.log('Total registrations:', countRows[0].count);

                if (countRows[0].count > 0) {
                    const [testRows] = await connection.execute(
                        "SELECT id, shared_with_emails, JSON_SEARCH(shared_with_emails, 'one', ?) as result FROM registrations LIMIT 1",
                        ['admin@example.com']
                    );
                    console.log('✅ JSON_SEARCH test successful');
                    console.log('Sample result:', testRows[0]);
                } else {
                    console.log('⚠️ No registrations found to test with');
                }
            } catch (searchError) {
                console.log('❌ JSON_SEARCH test failed:', searchError.message);
                console.log('Error code:', searchError.code);
                console.log('SQL state:', searchError.sqlState);
            }
        } else {
            console.log('❌ Column shared_with_emails does NOT exist');
        }

        connection.release();
        await pool.end();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Error code:', error.code);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

testConnection();
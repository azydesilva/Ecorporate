#!/usr/bin/env node
// Script to test the database connection used by the application

async function testAppDatabase() {
    try {
        console.log('Testing application database connection...');

        // Import the database pool used by the application
        const databaseModule = await import('../lib/database.js');
        const pool = databaseModule.default;

        if (!pool) {
            console.log('❌ Database pool not available');
            return;
        }

        console.log('✅ Database pool available');

        const connection = await pool.getConnection();
        console.log('✅ Database connection established');

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
                const [testRows] = await connection.execute(
                    "SELECT id, JSON_SEARCH(shared_with_emails, 'one', ?) as result FROM registrations LIMIT 1",
                    ['test@example.com']
                );
                console.log('✅ JSON_SEARCH test successful');
                console.log('Sample result:', testRows[0]);
            } catch (searchError) {
                console.log('❌ JSON_SEARCH test failed:', searchError.message);
            }
        } else {
            console.log('❌ Column shared_with_emails does NOT exist');
        }

        connection.release();
    } catch (error) {
        console.error('Error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

testAppDatabase();
const mysql = require('mysql2/promise');

async function testTitleUpdate() {
    try {
        // Database configuration for banana_db
        const dbConfig = {
            host: 'localhost',
            user: 'root',
            password: 'wp@XRT.2003',
            database: 'banana_db',
            port: 3306,
        };

        // Create connection
        const connection = await mysql.createConnection(dbConfig);

        console.log('Connected to database successfully');

        // Check current title
        const [rowsBefore] = await connection.execute('SELECT title FROM settings WHERE id = ?', ['settings-001']);
        console.log('Current title:', rowsBefore[0]?.title || 'No title found');

        // Update the title
        const newTitle = 'Updated Test Title From Script';
        const [result] = await connection.execute(
            'UPDATE settings SET title = ? WHERE id = ?',
            [newTitle, 'settings-001']
        );

        console.log('Update result - Rows affected:', result.affectedRows);

        // Verify the update
        const [rowsAfter] = await connection.execute('SELECT title FROM settings WHERE id = ?', ['settings-001']);
        console.log('Updated title:', rowsAfter[0]?.title || 'No title found');

        await connection.end();
    } catch (error) {
        console.error('Error testing title update:', error);
    }
}

testTitleUpdate();
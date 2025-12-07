const mysql = require('mysql2/promise');

async function clearUsers() {
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

        // Delete all users
        const [result] = await connection.execute('DELETE FROM users');
        console.log(`Deleted ${result.affectedRows} users from database`);

        await connection.end();
        console.log('Users cleared successfully');
    } catch (error) {
        console.error('Error clearing users:', error);
    }
}

clearUsers();
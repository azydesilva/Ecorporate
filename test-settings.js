const mysql = require('mysql2/promise');

async function testSettings() {
    console.log('Testing settings table...');

    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: 'wp@XRT.2003',
        database: 'banana_db',
        port: 3306,
    };

    try {
        // Create connection
        const connection = await mysql.createConnection(dbConfig);

        // Check the current settings
        const [rows] = await connection.execute('SELECT * FROM settings LIMIT 1');
        
        if (rows.length > 0) {
            console.log('Current settings:');
            console.log(rows[0]);
        } else {
            console.log('No settings found');
        }

        await connection.end();

    } catch (error) {
        console.error('Error testing settings:', error.message);
    }
}

testSettings();
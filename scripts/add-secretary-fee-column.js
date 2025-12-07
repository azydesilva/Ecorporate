const mysql = require('mysql2/promise');

async function addSecretaryFeeColumn() {
    console.log('Adding secretary_renew_fee column to settings table...');

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

        // Add the secretary_renew_fee column if it doesn't exist
        await connection.execute(`
            ALTER TABLE settings 
            ADD COLUMN IF NOT EXISTS secretary_renew_fee DECIMAL(10,2) DEFAULT 0.00
        `);

        console.log('✅ Successfully added secretary_renew_fee column to settings table');

        // Verify the column exists
        const [rows] = await connection.execute('DESCRIBE settings');
        const columns = rows.map(row => row.Field);
        console.log('📋 Current columns in settings table:', columns);

        if (columns.includes('secretary_renew_fee')) {
            console.log('✅ Verification successful: secretary_renew_fee column exists');
        } else {
            console.log('❌ Verification failed: secretary_renew_fee column not found');
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Failed to add secretary_renew_fee column:', error.message);
        process.exit(1);
    }
}

addSecretaryFeeColumn();
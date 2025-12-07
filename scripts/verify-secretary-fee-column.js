const mysql = require('mysql2/promise');

async function verifySecretaryFeeColumn() {
    console.log('🔍 Verifying secretary_renew_fee column in settings table...');

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

        // Check if the secretary_renew_fee column exists
        const [rows] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'banana_db' 
            AND TABLE_NAME = 'settings' 
            AND COLUMN_NAME = 'secretary_renew_fee'
        `);

        if (rows.length > 0) {
            const column = rows[0];
            console.log('✅ secretary_renew_fee column exists in settings table');
            console.log('   Column Name:', column.COLUMN_NAME);
            console.log('   Data Type:', column.DATA_TYPE);
            console.log('   Default Value:', column.COLUMN_DEFAULT);

            // Check the current value in the settings table
            const [settingsRows] = await connection.execute('SELECT id, secretary_renew_fee FROM settings LIMIT 1');
            if (settingsRows.length > 0) {
                console.log('   Current Value:', settingsRows[0].secretary_renew_fee);
            }
        } else {
            console.log('❌ secretary_renew_fee column does not exist in settings table');
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Error verifying secretary_renew_fee column:', error.message);
        process.exit(1);
    }
}

verifySecretaryFeeColumn();
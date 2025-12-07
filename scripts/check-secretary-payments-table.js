const mysql = require('mysql2/promise');

async function checkSecretaryPaymentsTable() {
    console.log('Checking secretary_renewal_payments table structure...');

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

        // Check the table structure
        const [rows] = await connection.execute('DESCRIBE secretary_renewal_payments');

        console.log('📋 Current columns in secretary_renewal_payments table:');
        rows.forEach(row => {
            console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
        });

        await connection.end();

    } catch (error) {
        console.error('❌ Failed to check secretary_renewal_payments table:', error.message);
        process.exit(1);
    }
}

checkSecretaryPaymentsTable();
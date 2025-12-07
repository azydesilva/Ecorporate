const mysql = require('mysql2/promise');

async function verifyColumns() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'wp@XRT.2003',
        database: process.env.DB_NAME || 'banana_db',
        port: parseInt(process.env.DB_PORT || '3306'),
    };

    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully');

        // Get all columns from registrations table
        const [columns] = await connection.execute('DESCRIBE registrations');
        const columnNames = columns.map(col => col.Field);

        console.log(`\n📊 Found ${columnNames.length} columns in registrations table:`);
        columnNames.forEach(col => console.log(`  - ${col}`));

        // Check for the columns we wanted to remove
        const columnsToRemove = [
            'customer_documents',
            'import_export_status',
            'imports_to_add',
            'other_business_activities'
        ];

        console.log('\n🔍 Checking for columns that should be removed:');
        const foundColumns = columnsToRemove.filter(col => columnNames.includes(col));
        const missingColumns = columnsToRemove.filter(col => !columnNames.includes(col));

        if (foundColumns.length > 0) {
            console.log(`❌ Found columns that should be removed: ${foundColumns.join(', ')}`);
        } else {
            console.log('✅ All columns that should be removed are indeed absent');
        }

        if (missingColumns.length > 0) {
            console.log(`✅ Confirmed absent columns: ${missingColumns.join(', ')}`);
        }

        // Show some key columns that should still be present
        const keyColumns = [
            'id',
            'company_name',
            'contact_person_name',
            'selected_package',
            'current_step',
            'status',
            'customer_form1',
            'customer_form19',
            'customer_aoa',
            'customer_form18',
            'customer_address_proof'
        ];

        console.log('\n🔍 Checking for key columns that should still be present:');
        const presentKeyColumns = keyColumns.filter(col => columnNames.includes(col));
        const missingKeyColumns = keyColumns.filter(col => !columnNames.includes(col));

        if (presentKeyColumns.length > 0) {
            console.log(`✅ Found key columns: ${presentKeyColumns.join(', ')}`);
        }

        if (missingKeyColumns.length > 0) {
            console.log(`❌ Missing key columns: ${missingKeyColumns.join(', ')}`);
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n📡 Database connection closed');
        }
    }
}

// Run verification if this file is executed directly
if (require.main === module) {
    verifyColumns()
        .then(() => {
            console.log('\n🎉 Column verification completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Column verification failed:', error);
            process.exit(1);
        });
}

module.exports = verifyColumns;
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    database: process.env.DB_NAME || 'banana_db',
    port: parseInt(process.env.DB_PORT || '3306'),
};

async function migrateCompanyEntityColumn() {
    let connection;

    try {
        console.log('🔄 Starting companyEntity column migration...');

        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Check if companyEntity column exists
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        if (!existingColumns.includes('company_entity')) {
            console.log('📝 Adding companyEntity column to registrations table...');

            // Add the companyEntity column
            await connection.execute(`
        ALTER TABLE registrations
        ADD COLUMN company_entity VARCHAR(50) DEFAULT '(PVT) LTD'
      `);

            console.log('✅ Successfully added companyEntity column to registrations table');
            console.log('📝 Default value set to: (PVT) LTD');
        } else {
            console.log('ℹ️ companyEntity column already exists in registrations table');
        }

        // Verify the column was added
        const [verifyColumns] = await connection.execute('DESCRIBE registrations');
        const companyEntityColumn = verifyColumns.find(col => col.Field === 'company_entity');

        if (companyEntityColumn) {
            console.log('✅ Verification successful:');
            console.log(`   - Column: ${companyEntityColumn.Field}`);
            console.log(`   - Type: ${companyEntityColumn.Type}`);
            console.log(`   - Default: ${companyEntityColumn.Default}`);
            console.log(`   - Nullable: ${companyEntityColumn.Null}`);
        }

        console.log('🎉 CompanyEntity column migration completed successfully!');

    } catch (error) {
        console.error('❌ Error during companyEntity column migration:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the migration
migrateCompanyEntityColumn();
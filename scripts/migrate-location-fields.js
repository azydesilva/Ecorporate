const mysql = require('mysql2/promise');

// Migration script to add province, district, and divisional_secretariat columns to registrations table
async function migrateLocationFields() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'wp@XRT.2003',
        database: process.env.DB_NAME || 'banana_db',
        port: parseInt(process.env.DB_PORT || '3306'),
    };

    let connection;

    try {
        console.log('🚀 Starting migration for location fields (province, district, divisional_secretariat)...');

        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully');

        // Check if registrations table exists
        const [tables] = await connection.execute("SHOW TABLES LIKE 'registrations'");
        if (tables.length === 0) {
            console.log('❌ Registrations table does not exist. Please run the initialization script first.');
            return;
        }

        // Get existing columns
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        console.log(`📊 Found ${existingColumns.length} existing columns in registrations table`);

        // Define the new location columns
        const locationColumns = [
            { name: 'province', type: 'VARCHAR(255)' },
            { name: 'district', type: 'VARCHAR(255)' },
            { name: 'divisional_secretariat', type: 'VARCHAR(255)' }
        ];

        let addedCount = 0;

        // Add missing location columns
        for (const column of locationColumns) {
            if (!existingColumns.includes(column.name)) {
                try {
                    await connection.execute(`ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`);
                    console.log(`✅ Added missing column: ${column.name}`);
                    addedCount++;
                } catch (error) {
                    if (error.code !== 'ER_DUP_FIELDNAME') {
                        console.error(`❌ Error adding column ${column.name}:`, error.message);
                    } else {
                        console.log(`⚠️  Column already exists: ${column.name}`);
                    }
                }
            } else {
                console.log(`ℹ️  Column already exists: ${column.name}`);
            }
        }

        if (addedCount > 0) {
            console.log(`\n✅ Migration completed successfully! Added ${addedCount} new location columns.`);
        } else {
            console.log('\n✅ All required location columns already exist. No migration needed.');
        }

        // Show final table structure for location fields
        console.log('\n📋 Location fields in registrations table:');
        const [finalColumns] = await connection.execute('DESCRIBE registrations');
        finalColumns.forEach(col => {
            if (['province', 'district', 'divisional_secretariat'].includes(col.Field)) {
                console.log(`- ${col.Field} (${col.Type})${col.Null === 'NO' ? ' NOT NULL' : ''}`);
            }
        });

        // Verify all required location columns exist
        const finalColumnNames = finalColumns.map(col => col.Field);
        const stillMissing = locationColumns.filter(col => !finalColumnNames.includes(col.name));

        if (stillMissing.length > 0) {
            console.log('\n❌ Some location columns are still missing:');
            stillMissing.forEach(col => console.log(`- ${col.name}`));
        } else {
            console.log('\n✅ All location columns verified successfully!');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔐 Database connection closed');
        }
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateLocationFields()
        .then(() => {
            console.log('🎉 Location fields migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = migrateLocationFields;
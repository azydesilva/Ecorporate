const mysql = require('mysql2/promise');

async function migrateDatabase() {
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: 'wp@XRT.2003',
        database: 'banana_db',
        port: 3306,
    };

    let connection;
    let pool;

    try {
        console.log('Starting database migration...');
        pool = mysql.createPool(dbConfig);
        connection = await pool.getConnection();

        // Define all expected columns for registrations table
        const expectedColumns = [
            { name: 'company_name_english', type: 'VARCHAR(255)' },
            { name: 'company_name_sinhala', type: 'VARCHAR(255)' },
            { name: 'is_foreign_owned', type: 'VARCHAR(10)' },
            { name: 'business_address_number', type: 'VARCHAR(255)' },
            { name: 'business_address_street', type: 'VARCHAR(255)' },
            { name: 'business_address_city', type: 'VARCHAR(255)' },
            { name: 'postal_code', type: 'VARCHAR(20)' },
            { name: 'shares_amount', type: 'VARCHAR(50)' },
            { name: 'number_of_shareholders', type: 'VARCHAR(10)' },
            { name: 'shareholders', type: 'JSON' },
            { name: 'make_simple_books_secretary', type: 'VARCHAR(10)' },
            { name: 'number_of_directors', type: 'VARCHAR(10)' },
            { name: 'directors', type: 'JSON' },
            { name: 'grama_niladari', type: 'VARCHAR(255)' },
            { name: 'company_activities', type: 'TEXT' },
            { name: 'business_email', type: 'VARCHAR(255)' },
            { name: 'business_contact_number', type: 'VARCHAR(255)' },
            { name: 'eroc_registered', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'resolutions_docs', type: 'JSON' }  // Added this line
        ];

        // Check if registrations table exists
        const [tables] = await connection.execute("SHOW TABLES LIKE 'registrations'");
        if (tables.length === 0) {
            console.log('❌ Registrations table does not exist. Please run the initialization script first.');
            return;
        }

        // Get existing columns
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        console.log(`Found ${existingColumns.length} existing columns in registrations table`);

        // Add missing columns
        let addedCount = 0;
        for (const column of expectedColumns) {
            if (!existingColumns.includes(column.name)) {
                try {
                    await connection.execute(`ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`);
                    console.log(`✅ Added missing column: ${column.name}`);
                    addedCount++;
                } catch (error) {
                    if (error.code !== 'ER_DUP_FIELDNAME') {
                        console.error(`❌ Error adding column ${column.name}:`, error.message);
                    }
                }
            } else {
                console.log(`⚠️  Column already exists: ${column.name}`);
            }
        }

        if (addedCount > 0) {
            console.log(`\n✅ Migration completed successfully! Added ${addedCount} new columns.`);
        } else {
            console.log('\n✅ All columns already exist. No migration needed.');
        }

        // Show final table structure
        console.log('\nFinal table structure:');
        const [finalColumns] = await connection.execute('DESCRIBE registrations');
        finalColumns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
        if (pool) {
            await pool.end();
        }
    }
}

// Run migration
migrateDatabase();
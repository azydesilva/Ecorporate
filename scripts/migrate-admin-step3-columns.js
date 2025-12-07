const mysql = require('mysql2/promise');

async function migrateAdminStep3Columns() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'wp@XRT.2003',
        database: process.env.DB_NAME || 'banana_db',
        port: parseInt(process.env.DB_PORT || '3306'),
    };

    let connection;
    let pool;

    try {
        console.log('🚀 Starting comprehensive database columns migration...');
        pool = mysql.createPool(dbConfig);
        connection = await pool.getConnection();

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

        // Define ALL required columns based on the API route SQL query
        const requiredColumns = [
            // Basic registration fields
            { name: 'id', type: 'VARCHAR(255) PRIMARY KEY' },
            { name: 'company_name', type: 'VARCHAR(255)' },
            { name: 'contact_person_name', type: 'VARCHAR(255)' },
            { name: 'contact_person_email', type: 'VARCHAR(255)' },
            { name: 'contact_person_phone', type: 'VARCHAR(255)' },
            { name: 'selected_package', type: 'VARCHAR(255)' },
            { name: 'payment_method', type: 'VARCHAR(255)' },
            { name: 'current_step', type: 'VARCHAR(255)' },
            { name: 'status', type: 'VARCHAR(255)' },
            { name: 'payment_approved', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'details_approved', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'documents_approved', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'documents_published', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'documents_acknowledged', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'payment_receipt', type: 'JSON' },
            { name: 'balance_payment_receipt', type: 'JSON' },

            // Document fields
            { name: 'form1', type: 'JSON' },
            { name: 'form19', type: 'JSON' },
            { name: 'aoa', type: 'JSON' },
            { name: 'form18', type: 'JSON' },
            { name: 'address_proof', type: 'JSON' },

            // Customer document fields
            { name: 'customer_form1', type: 'JSON' },
            { name: 'customer_form19', type: 'JSON' },
            { name: 'customer_aoa', type: 'JSON' },
            { name: 'customer_form18', type: 'JSON' },
            { name: 'customer_address_proof', type: 'JSON' },

            // Additional document fields
            { name: 'incorporation_certificate', type: 'JSON' },
            { name: 'step3_additional_doc', type: 'JSON' },
            { name: 'step3_signed_additional_doc', type: 'JSON' },
            { name: 'step4_final_additional_doc', type: 'JSON' },

            // Company details fields
            { name: 'company_name_english', type: 'VARCHAR(255)' },
            { name: 'company_name_sinhala', type: 'VARCHAR(255)' },
            { name: 'is_foreign_owned', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'business_address_number', type: 'VARCHAR(255)' },
            { name: 'business_address_street', type: 'VARCHAR(255)' },
            { name: 'business_address_city', type: 'VARCHAR(255)' },
            { name: 'postal_code', type: 'VARCHAR(255)' },
            { name: 'shares_amount', type: 'DECIMAL(10,2)' },
            { name: 'number_of_shareholders', type: 'INT' },
            { name: 'shareholders', type: 'JSON' },
            { name: 'make_simple_books_secretary', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'number_of_directors', type: 'INT' },
            { name: 'directors', type: 'JSON' },
            { name: 'exports_to_add', type: 'TEXT' },
            { name: 'drama_sedaka_division', type: 'VARCHAR(255)' },
            { name: 'business_email', type: 'VARCHAR(255)' },
            { name: 'business_contact_number', type: 'VARCHAR(255)' },

            // Timestamp fields
            { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
            { name: 'documents_published_at', type: 'TIMESTAMP NULL' }
        ];

        // Find missing columns
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col.name));

        console.log(`\n🔍 Found ${missingColumns.length} missing columns:`);
        missingColumns.forEach(col => console.log(`  - ${col.name} (${col.type})`));

        // Add missing columns
        let addedCount = 0;
        for (const column of missingColumns) {
            try {
                // Skip primary key column if it already exists
                if (column.type.includes('PRIMARY KEY') && existingColumns.includes(column.name)) {
                    console.log(`⚠️  Primary key column already exists: ${column.name}`);
                    continue;
                }

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
        }

        if (addedCount > 0) {
            console.log(`\n✅ Migration completed successfully! Added ${addedCount} new columns.`);
        } else {
            console.log('\n✅ All required columns already exist. No migration needed.');
        }

        // Show final table structure
        console.log('\n📋 Complete registrations table structure:');
        const [finalColumns] = await connection.execute('DESCRIBE registrations');
        finalColumns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})${col.Null === 'NO' ? ' NOT NULL' : ''}${col.Key === 'PRI' ? ' PRIMARY KEY' : ''}`);
        });

        // Verify all required columns exist
        const finalColumnNames = finalColumns.map(col => col.Field);
        const stillMissing = requiredColumns.filter(col => !finalColumnNames.includes(col.name));

        if (stillMissing.length > 0) {
            console.log('\n❌ Still missing columns after migration:');
            stillMissing.forEach(col => console.log(`  - ${col.name}`));
        } else {
            console.log('\n🎉 All required columns are present! Database migration is complete.');
        }

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

// Run migration if this script is executed directly
if (require.main === module) {
    migrateAdminStep3Columns().catch(console.error);
}

module.exports = { migrateAdminStep3Columns }; 
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'banana_db'
};

async function migrateCustomerDocuments() {
    let connection;

    try {
        // Connect to MySQL database
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');

        // Add new customer document columns
        const alterQueries = [
            'ALTER TABLE registrations ADD COLUMN IF NOT EXISTS customer_form1 JSON',
            'ALTER TABLE registrations ADD COLUMN IF NOT EXISTS customer_form19 JSON',
            'ALTER TABLE registrations ADD COLUMN IF NOT EXISTS customer_aoa JSON',
            'ALTER TABLE registrations ADD COLUMN IF NOT EXISTS customer_form18 JSON',
            'ALTER TABLE registrations ADD COLUMN IF NOT EXISTS customer_address_proof JSON',
            'ALTER TABLE registrations ADD COLUMN IF NOT EXISTS documents_acknowledged BOOLEAN DEFAULT FALSE'
        ];

        for (const query of alterQueries) {
            try {
                await connection.execute(query);
                console.log(`✅ Executed: ${query}`);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column already exists: ${query}`);
                } else {
                    console.error(`❌ Error executing: ${query}`, error.message);
                }
            }
        }

        // Migrate existing customer_documents data to separate columns
        console.log('🔄 Migrating existing customer_documents data to separate columns...');

        const [rows] = await connection.execute(
            'SELECT id, customer_documents FROM registrations WHERE customer_documents IS NOT NULL'
        );

        for (const row of rows) {
            try {
                const customerDocuments = JSON.parse(row.customer_documents);
                const updates = [];

                // Update each document type separately
                if (customerDocuments.form1) {
                    await connection.execute(
                        'UPDATE registrations SET customer_form1 = ? WHERE id = ?',
                        [JSON.stringify(customerDocuments.form1), row.id]
                    );
                    updates.push('form1');
                }

                if (customerDocuments.letterOfEngagement) {
                    await connection.execute(
                        'UPDATE registrations SET customer_form19 = ? WHERE id = ?',
                        [JSON.stringify(customerDocuments.letterOfEngagement), row.id]
                    );
                    updates.push('letterOfEngagement');
                }

                if (customerDocuments.aoa) {
                    await connection.execute(
                        'UPDATE registrations SET customer_aoa = ? WHERE id = ?',
                        [JSON.stringify(customerDocuments.aoa), row.id]
                    );
                    updates.push('aoa');
                }

                if (customerDocuments.form18) {
                    await connection.execute(
                        'UPDATE registrations SET customer_form18 = ? WHERE id = ?',
                        [JSON.stringify(customerDocuments.form18), row.id]
                    );
                    updates.push('form18');
                }

                if (customerDocuments.addressProof) {
                    await connection.execute(
                        'UPDATE registrations SET customer_address_proof = ? WHERE id = ?',
                        [JSON.stringify(customerDocuments.addressProof), row.id]
                    );
                    updates.push('addressProof');
                }

                if (updates.length > 0) {
                    console.log(`✅ Migrated documents for registration ${row.id}: ${updates.join(', ')}`);
                }
            } catch (error) {
                console.error(`❌ Error migrating customer documents for registration ${row.id}:`, error.message);
            }
        }

        console.log('✅ Customer documents migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateCustomerDocuments()
        .then(() => {
            console.log('🎉 Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateCustomerDocuments }; 
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateAddExpireDateFields() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edashboard',
            port: process.env.DB_PORT || 3306
        });

        console.log('🔗 Connected to MySQL database');

        // Add expire date fields to registrations table
        const columns = [
            {
                name: 'register_start_date',
                definition: 'DATE NULL COMMENT "Start date for company registration validity"'
            },
            {
                name: 'expire_days',
                definition: 'INT NULL COMMENT "Number of days from start date until expiration"'
            },
            {
                name: 'expire_date',
                definition: 'DATE NULL COMMENT "Calculated expiration date (start_date + expire_days)"'
            },
            {
                name: 'is_expired',
                definition: 'BOOLEAN DEFAULT FALSE COMMENT "Whether the registration has expired"'
            }
        ];

        for (const column of columns) {
            try {
                await connection.execute(`
          ALTER TABLE registrations 
          ADD COLUMN ${column.name} ${column.definition}
        `);
                console.log(`✅ Added ${column.name} column`);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️  ${column.name} column already exists`);
                } else {
                    console.error(`❌ Error adding ${column.name} column:`, error.message);
                    throw error;
                }
            }
        }

        console.log('✅ Migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateAddExpireDateFields()
        .then(() => {
            console.log('🎉 Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateAddExpireDateFields };

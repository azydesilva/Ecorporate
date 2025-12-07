const mysql = require('mysql2/promise');

async function migrateForm19Columns() {
    console.log('🔄 Starting Form 19 column migration...');

    let connection;
    try {
        // Create connection to MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'wp@XRT.2003',
            database: process.env.DB_NAME || 'banana_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to MySQL database');

        // Check if form19 column exists
        const [form19Columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'form19'
    `, [process.env.DB_NAME || 'banana_db']);

        if (form19Columns.length === 0) {
            console.log('📝 Adding form19 column...');
            await connection.execute(`
        ALTER TABLE registrations 
        ADD COLUMN form19 JSON AFTER letter_of_engagement
      `);
            console.log('✅ form19 column added successfully');
        } else {
            console.log('ℹ️ form19 column already exists');
        }

        // Check if customer_form19 column exists
        const [customerForm19Columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'customer_form19'
    `, [process.env.DB_NAME || 'banana_db']);

        if (customerForm19Columns.length === 0) {
            console.log('📝 Adding customer_form19 column...');
            await connection.execute(`
        ALTER TABLE registrations 
        ADD COLUMN customer_form19 JSON AFTER customer_letter_of_engagement
      `);
            console.log('✅ customer_form19 column added successfully');
        } else {
            console.log('ℹ️ customer_form19 column already exists');
        }

        // Migrate existing data from letter_of_engagement to form19
        console.log('📝 Migrating existing letter_of_engagement data to form19...');
        await connection.execute(`
      UPDATE registrations 
      SET form19 = letter_of_engagement 
      WHERE letter_of_engagement IS NOT NULL AND form19 IS NULL
    `);
        console.log('✅ Migrated letter_of_engagement data to form19');

        // Migrate existing data from customer_letter_of_engagement to customer_form19
        console.log('📝 Migrating existing customer_letter_of_engagement data to customer_form19...');
        await connection.execute(`
      UPDATE registrations 
      SET customer_form19 = customer_letter_of_engagement 
      WHERE customer_letter_of_engagement IS NOT NULL AND customer_form19 IS NULL
    `);
        console.log('✅ Migrated customer_letter_of_engagement data to customer_form19');

        console.log('🎉 Form 19 column migration completed successfully!');

    } catch (error) {
        console.error('❌ Error during Form 19 column migration:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the migration
if (require.main === module) {
    migrateForm19Columns()
        .then(() => {
            console.log('✅ Migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = migrateForm19Columns;
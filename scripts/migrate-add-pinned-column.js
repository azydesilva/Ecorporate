const mysql = require('mysql2/promise');
require('dotenv').config();

async function addPinnedColumn() {
    let connection;

    try {
        console.log('🔧 Starting migration: Add pinned column to registrations table...');

        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edashboard',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Check if pinned column already exists
        const [columns] = await connection.execute('DESCRIBE registrations');
        const columnExists = columns.some(col => col.Field === 'pinned');

        if (columnExists) {
            console.log('ℹ️  Pinned column already exists, skipping migration');
            return;
        }

        // Add the pinned column
        await connection.execute(`
            ALTER TABLE registrations 
            ADD COLUMN pinned BOOLEAN DEFAULT FALSE
        `);

        console.log('✅ Successfully added pinned column to registrations table');

        // Verify the column was added
        const [newColumns] = await connection.execute('DESCRIBE registrations');
        const pinnedColumn = newColumns.find(col => col.Field === 'pinned');

        if (pinnedColumn) {
            console.log('✅ Verification successful: pinned column exists');
            console.log('   Column details:', {
                field: pinnedColumn.Field,
                type: pinnedColumn.Type,
                null: pinnedColumn.Null,
                default: pinnedColumn.Default
            });
        } else {
            console.error('❌ Verification failed: pinned column not found');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
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
    addPinnedColumn()
        .then(() => {
            console.log('🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { addPinnedColumn };

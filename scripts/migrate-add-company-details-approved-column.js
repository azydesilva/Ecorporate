const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    console.log('🔧 Starting migration: Add company_details_approved column...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        console.log('✅ Connected to database');

        // Check if column exists
        const [rows] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'company_details_approved'`,
            [process.env.DB_NAME]
        );

        if (rows.length === 0) {
            // Add the column
            await connection.execute(
                `ALTER TABLE registrations ADD COLUMN company_details_approved BOOLEAN DEFAULT FALSE`
            );
            console.log('✅ Successfully added company_details_approved column to registrations table');
        } else {
            console.log('ℹ️ Column company_details_approved already exists, skipping addition.');
        }

        // Verify the column
        const [verifyRows] = await connection.execute(
            `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'company_details_approved'`,
            [process.env.DB_NAME]
        );
        console.log('✅ Column verification successful:', verifyRows[0]);

    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        await connection.end();
        console.log('🔌 Database connection closed');
        console.log('🎉 Migration completed successfully');
    }
}

runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});

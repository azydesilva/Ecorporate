#!/usr/bin/env node

/**
 * Cron job script to check and update expired registrations
 * This script should be run periodically (e.g., daily) to ensure registrations are properly marked as expired
 * 
 * To set up a cron job:
 * 1. Open crontab: crontab -e
 * 2. Add this line to run daily at 1:00 AM:
 *    0 1 * * * cd /path/to/EDashboard && node scripts/cron-check-expired-registrations.js >> logs/expiry-check.log 2>&1
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndUpdateExpiredRegistrations() {
    console.log('\n========================================');
    console.log('🔍 Starting expired registrations check (cron job)');
    console.log('⏰ Time:', new Date().toISOString());
    console.log('========================================\n');

    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'wp@XRT.2003',
        database: process.env.DB_NAME || 'banana_db',
        port: parseInt(process.env.DB_PORT || '3306'),
    };

    let connection;
    let updatedCount = 0;
    let correctedCount = 0;

    try {
        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Get today's date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        console.log(`📅 Today's date: ${todayStr}`);

        // Find registrations that should be marked as expired
        const [rows] = await connection.execute(
            `SELECT id, company_name, company_name_english, expire_date, is_expired 
             FROM registrations 
             WHERE status = 'completed' 
             AND expire_date IS NOT NULL 
             AND expire_date < ? 
             AND is_expired = 0`,
            [todayStr]
        );

        console.log(`📊 Found ${rows.length} registrations that should be marked as expired`);

        for (const row of rows) {
            console.log(`📝 Updating registration ${row.id}: ${row.company_name_english || row.company_name} (Expired: ${row.expire_date})`);
            
            // Update the is_expired flag
            await connection.execute(
                'UPDATE registrations SET is_expired = 1 WHERE id = ?',
                [row.id]
            );
            
            updatedCount++;
        }

        // Also check if there are any registrations incorrectly marked as expired
        const [incorrectRows] = await connection.execute(
            `SELECT id, company_name, company_name_english, expire_date, is_expired 
             FROM registrations 
             WHERE status = 'completed' 
             AND expire_date IS NOT NULL 
             AND expire_date >= ? 
             AND is_expired = 1`,
            [todayStr]
        );

        console.log(`📊 Found ${incorrectRows.length} registrations incorrectly marked as expired`);

        for (const row of incorrectRows) {
            const expireDate = new Date(row.expire_date);
            const isActuallyExpired = expireDate < today;
            
            if (!isActuallyExpired) {
                console.log(`📝 Correcting registration ${row.id}: ${row.company_name_english || row.company_name} (Not expired yet: ${row.expire_date})`);
                
                // Update the is_expired flag
                await connection.execute(
                    'UPDATE registrations SET is_expired = 0 WHERE id = ?',
                    [row.id]
                );
                
                correctedCount++;
            }
        }

        console.log('\n========================================');
        console.log('📊 Summary:');
        console.log(`   Registrations marked as expired: ${updatedCount}`);
        console.log(`   Registrations corrected: ${correctedCount}`);
        console.log('========================================\n');

        await connection.end();
        console.log('✅ Database connection closed');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

// Run the check if this file is executed directly
if (require.main === module) {
    checkAndUpdateExpiredRegistrations();
}

// Export the function for use in other modules
module.exports = { checkAndUpdateExpiredRegistrations };

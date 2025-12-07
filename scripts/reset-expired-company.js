#!/usr/bin/env node

/**
 * Reset a company's expired status for testing
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetExpiredCompany() {
    let connection;

    try {
        const companyName = process.argv[2] || 'E COMMERCE';

        console.log('\n========================================');
        console.log('🔄 Resetting Expired Company');
        console.log('========================================\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edashboard',
            port: parseInt(process.env.DB_PORT || '3306')
        });

        console.log('✅ Database connection established\n');
        console.log(`🔍 Looking for company: ${companyName}\n`);

        // Get company info before reset
        const [beforeRows] = await connection.execute(
            `SELECT r.id, r.company_name, u.name as user_name, u.email as user_email,
              r.expire_date, r.is_expired, r.expiry_notification_sent_at
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.company_name = ?`,
            [companyName]
        );

        if (beforeRows.length === 0) {
            console.log(`❌ Company "${companyName}" not found\n`);
            await connection.end();
            process.exit(1);
        }

        const company = beforeRows[0];
        console.log('📊 Company found:');
        console.log(`   Company: ${company.company_name}`);
        console.log(`   User: ${company.user_name || '❌ NO USER'}`);
        console.log(`   User Email: ${company.user_email || '❌ NO EMAIL'}`);
        console.log(`   Expire Date: ${company.expire_date}`);
        console.log(`   Currently Expired: ${company.is_expired ? 'YES' : 'NO'}`);
        console.log(`   Notification Sent: ${company.expiry_notification_sent_at || 'NO'}\n`);

        // Reset the company
        await connection.execute(
            `UPDATE registrations 
       SET is_expired = FALSE, 
           expiry_notification_sent_at = NULL
       WHERE company_name = ?`,
            [companyName]
        );

        console.log('✅ Company reset successfully!\n');

        // Get company info after reset
        const [afterRows] = await connection.execute(
            `SELECT is_expired, expiry_notification_sent_at
       FROM registrations
       WHERE company_name = ?`,
            [companyName]
        );

        const after = afterRows[0];
        console.log('📊 New status:');
        console.log(`   Is Expired: ${after.is_expired ? 'YES' : 'NO'}`);
        console.log(`   Notification Sent: ${after.expiry_notification_sent_at || 'NO'}\n`);

        console.log('========================================');
        console.log('💡 Next Step:');
        console.log('========================================\n');
        console.log('Run this command to send notification:');
        console.log('  npm run check-expired-companies\n');

        if (company.user_email) {
            console.log(`The email will be sent to: ${company.user_email}\n`);
        } else {
            console.log('⚠️  Warning: No user email found! Company will not qualify for notification.\n');
        }

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

resetExpiredCompany();


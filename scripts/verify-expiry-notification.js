#!/usr/bin/env node

/**
 * Verify that expiry notifications were sent and recorded correctly
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyExpiryNotification() {
    let connection;

    try {
        console.log('\n========================================');
        console.log('🔍 Verifying Expiry Notifications');
        console.log('========================================\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edashboard',
            port: parseInt(process.env.DB_PORT || '3306')
        });

        console.log('✅ Database connection established\n');

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        console.log(`📅 Checking companies with expire_date = ${todayStr}\n`);

        const [rows] = await connection.execute(
            `SELECT 
        r.id, 
        r.company_name, 
        u.name as user_name,
        u.email as user_email,
        r.expire_date,
        r.is_expired,
        r.expiry_notification_sent_at,
        TIMESTAMPDIFF(MINUTE, r.expiry_notification_sent_at, NOW()) as minutes_ago
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.expire_date = ?
       ORDER BY r.expiry_notification_sent_at DESC`,
            [todayStr]
        );

        if (rows.length === 0) {
            console.log('ℹ️  No companies found with today\'s expiry date\n');
        } else {
            console.log(`📊 Found ${rows.length} company(ies) expiring today:\n`);

            rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.company_name}`);
                console.log(`   ID: ${row.id}`);
                console.log(`   User: ${row.user_name || '❌ NO USER'}`);
                console.log(`   User Email: ${row.user_email || '❌ NO EMAIL'}`);
                console.log(`   Expire Date: ${row.expire_date}`);
                console.log(`   Is Expired: ${row.is_expired ? '✅ YES' : '❌ NO'}`);

                if (row.expiry_notification_sent_at) {
                    console.log(`   Notification Sent: ✅ YES`);
                    console.log(`   Sent At: ${row.expiry_notification_sent_at}`);
                    console.log(`   Time Ago: ${row.minutes_ago} minutes ago`);
                } else {
                    console.log(`   Notification Sent: ❌ NO`);
                }
                console.log('');
            });

            const notifiedCount = rows.filter(r => r.expiry_notification_sent_at).length;
            const expiredCount = rows.filter(r => r.is_expired).length;

            console.log('========================================');
            console.log('📊 Statistics:');
            console.log(`   Total expiring today: ${rows.length}`);
            console.log(`   Marked as expired: ${expiredCount}`);
            console.log(`   Notifications sent: ${notifiedCount}`);

            if (notifiedCount === rows.length && expiredCount === rows.length) {
                console.log('\n   ✅ All companies processed successfully!');
            } else {
                console.log('\n   ⚠️  Some companies may not have been processed');
            }
            console.log('========================================\n');
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

verifyExpiryNotification();


#!/usr/bin/env node

/**
 * Check real expired companies (not test companies)
 * This helps identify why real companies might not be getting emails
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRealExpiredCompanies() {
    let connection;

    try {
        console.log('\n========================================');
        console.log('🔍 Checking Real Expired Companies');
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
        console.log(`📅 Today's date: ${todayStr}\n`);

        // Check all expired companies (excluding test companies)
        console.log('1️⃣ Checking for real companies that have expired...\n');

        const [expiredCompanies] = await connection.execute(
            `SELECT 
        r.id, 
        r.company_name, 
        r.user_id,
        u.name as user_name,
        u.email as user_email,
        r.expire_date,
        r.is_expired,
        r.expiry_notification_sent_at,
        DATEDIFF(CURDATE(), r.expire_date) as days_expired
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.company_name NOT LIKE '%TEST%'
         AND r.expire_date IS NOT NULL
         AND r.expire_date <= CURDATE()
       ORDER BY r.expire_date DESC
       LIMIT 20`
        );

        if (expiredCompanies.length === 0) {
            console.log('   ℹ️  No real companies found with expired dates\n');
        } else {
            console.log(`   📊 Found ${expiredCompanies.length} real expired companies:\n`);

            expiredCompanies.forEach((company, index) => {
                console.log(`   ${index + 1}. ${company.company_name}`);
                console.log(`      ID: ${company.id}`);
                console.log(`      User: ${company.user_name || '❌ NO USER'}`);
                console.log(`      User Email: ${company.user_email || '❌ NO EMAIL'}`);
                console.log(`      Expire Date: ${company.expire_date}`);
                console.log(`      Days Expired: ${company.days_expired} days ago`);
                console.log(`      Is Expired Flag: ${company.is_expired ? '✅ YES' : '❌ NO'}`);
                console.log(`      Notification Sent: ${company.expiry_notification_sent_at ? '✅ YES at ' + company.expiry_notification_sent_at : '❌ NO'}`);
                console.log('');
            });
        }

        // Check companies expiring exactly today
        console.log('2️⃣ Checking for real companies expiring TODAY...\n');

        const [todayExpiring] = await connection.execute(
            `SELECT 
        r.id, 
        r.company_name, 
        r.user_id,
        u.name as user_name,
        u.email as user_email,
        r.expire_date,
        r.is_expired,
        r.expiry_notification_sent_at
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.company_name NOT LIKE '%TEST%'
         AND r.expire_date = ?`,
            [todayStr]
        );

        if (todayExpiring.length === 0) {
            console.log('   ℹ️  No real companies expiring today\n');
        } else {
            console.log(`   📊 Found ${todayExpiring.length} real companies expiring today:\n`);

            todayExpiring.forEach((company, index) => {
                console.log(`   ${index + 1}. ${company.company_name}`);
                console.log(`      ID: ${company.id}`);
                console.log(`      User: ${company.user_name || '❌ NO USER'}`);
                console.log(`      User Email: ${company.user_email || '❌ NO EMAIL'}`);
                console.log(`      Is Expired: ${company.is_expired ? '✅ YES' : '❌ NO'}`);
                console.log(`      Notification Sent: ${company.expiry_notification_sent_at ? '✅ YES' : '❌ NO'}`);
                console.log('');
            });
        }

        // Check companies that SHOULD get notification today
        console.log('3️⃣ Checking companies that QUALIFY for notification today...\n');

        const [qualifyingCompanies] = await connection.execute(
            `SELECT 
        r.id, 
        r.company_name, 
        r.user_id,
        u.name as user_name,
        u.email as user_email,
        r.expire_date,
        r.is_expired,
        r.expiry_notification_sent_at
       FROM registrations r
       INNER JOIN users u ON r.user_id = u.id
       WHERE r.company_name NOT LIKE '%TEST%'
         AND r.expire_date = ?
         AND r.is_expired = FALSE
         AND u.email IS NOT NULL
         AND (r.expiry_notification_sent_at IS NULL OR DATE(r.expiry_notification_sent_at) < ?)`,
            [todayStr, todayStr]
        );

        if (qualifyingCompanies.length === 0) {
            console.log('   ℹ️  No companies qualify for notification today\n');
            console.log('   Reasons why companies might not qualify:');
            console.log('   - No companies with expire_date = today');
            console.log('   - Already marked as expired (is_expired = TRUE)');
            console.log('   - Missing email address (contact_person_email IS NULL)');
            console.log('   - Already sent notification today\n');
        } else {
            console.log(`   ✅ Found ${qualifyingCompanies.length} companies that WILL receive notifications:\n`);

            qualifyingCompanies.forEach((company, index) => {
                console.log(`   ${index + 1}. ${company.company_name}`);
                console.log(`      ID: ${company.id}`);
                console.log(`      User: ${company.user_name}`);
                console.log(`      User Email: ${company.user_email}`);
                console.log(`      Expire Date: ${company.expire_date}`);
                console.log('');
            });

            console.log('   💡 Run this command to send notifications:');
            console.log('   npm run check-expired-companies\n');
        }

        // Check for potential issues
        console.log('4️⃣ Checking for potential issues...\n');

        const [missingEmail] = await connection.execute(
            `SELECT COUNT(*) as count 
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.company_name NOT LIKE '%TEST%'
         AND r.expire_date <= CURDATE()
         AND u.email IS NULL`
        );

        const [alreadyNotified] = await connection.execute(
            `SELECT COUNT(*) as count 
       FROM registrations 
       WHERE company_name NOT LIKE '%TEST%'
         AND expire_date = ?
         AND expiry_notification_sent_at IS NOT NULL`,
            [todayStr]
        );

        if (missingEmail[0].count > 0) {
            console.log(`   ⚠️  ${missingEmail[0].count} expired companies have no email address`);
        }

        if (alreadyNotified[0].count > 0) {
            console.log(`   ℹ️  ${alreadyNotified[0].count} companies were already notified today`);
        }

        if (missingEmail[0].count === 0 && alreadyNotified[0].count === 0) {
            console.log('   ✅ No issues found');
        }

        console.log('\n========================================');
        console.log('📊 Summary');
        console.log('========================================\n');

        const [stats] = await connection.execute(
            `SELECT 
        COUNT(*) as total_expired,
        SUM(CASE WHEN r.is_expired = TRUE THEN 1 ELSE 0 END) as marked_expired,
        SUM(CASE WHEN r.expiry_notification_sent_at IS NOT NULL THEN 1 ELSE 0 END) as notified,
        SUM(CASE WHEN u.email IS NULL THEN 1 ELSE 0 END) as missing_email
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.company_name NOT LIKE '%TEST%'
         AND r.expire_date <= CURDATE()`
        );

        const s = stats[0];
        console.log(`   Total expired companies (real): ${s.total_expired}`);
        console.log(`   Marked as expired: ${s.marked_expired}`);
        console.log(`   Notifications sent: ${s.notified}`);
        console.log(`   Missing email: ${s.missing_email}`);
        console.log('');

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

checkRealExpiredCompanies();


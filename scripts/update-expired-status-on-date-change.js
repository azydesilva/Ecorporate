#!/usr/bin/env node

/**
 * Update is_expired status for all companies based on their expire_date
 * This script checks if expire_date is in the past and updates is_expired accordingly
 * Run this after admins change expiry dates manually
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateExpiredStatus() {
    let connection;

    try {
        console.log('\n========================================');
        console.log('🔄 Updating Expired Status');
        console.log('========================================\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edashboard',
            port: parseInt(process.env.DB_PORT || '3306')
        });

        console.log('✅ Database connection established\n');

        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 Today's date: ${today}\n`);

        // Find companies that should be marked as expired (expire_date < today and is_expired = FALSE)
        console.log('1️⃣ Finding companies that should be marked as expired...\n');

        const [shouldBeExpired] = await connection.execute(
            `SELECT 
        r.id, 
        r.company_name,
        u.name as user_name,
        u.email as user_email,
        r.expire_date,
        r.is_expired,
        DATEDIFF(CURDATE(), r.expire_date) as days_past
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.expire_date IS NOT NULL
         AND r.expire_date < CURDATE()
         AND r.is_expired = FALSE`
        );

        if (shouldBeExpired.length === 0) {
            console.log('   ℹ️  No companies found that need to be marked as expired\n');
        } else {
            console.log(`   📊 Found ${shouldBeExpired.length} companies that should be expired:\n`);

            shouldBeExpired.forEach((company, index) => {
                console.log(`   ${index + 1}. ${company.company_name}`);
                console.log(`      ID: ${company.id}`);
                console.log(`      Expire Date: ${company.expire_date}`);
                console.log(`      Days Past: ${company.days_past} days ago`);
                console.log(`      Currently Expired: ${company.is_expired ? 'YES' : 'NO'}`);
                console.log('');
            });

            console.log('   🔄 Updating is_expired status...\n');

            // Update all companies with past expiry dates
            const [updateResult] = await connection.execute(
                `UPDATE registrations 
         SET is_expired = TRUE
         WHERE expire_date < CURDATE() 
           AND is_expired = FALSE
           AND expire_date IS NOT NULL`
            );

            console.log(`   ✅ Updated ${updateResult.affectedRows} companies to expired status\n`);
        }

        // Find companies that should NOT be expired (expire_date >= today but is_expired = TRUE)
        console.log('2️⃣ Finding companies that should NOT be marked as expired...\n');

        const [shouldNotBeExpired] = await connection.execute(
            `SELECT 
        r.id, 
        r.company_name,
        r.expire_date,
        r.is_expired,
        DATEDIFF(r.expire_date, CURDATE()) as days_remaining
       FROM registrations r
       WHERE r.expire_date IS NOT NULL
         AND r.expire_date >= CURDATE()
         AND r.is_expired = TRUE`
        );

        if (shouldNotBeExpired.length === 0) {
            console.log('   ℹ️  No companies found that are incorrectly marked as expired\n');
        } else {
            console.log(`   📊 Found ${shouldNotBeExpired.length} companies incorrectly marked as expired:\n`);

            shouldNotBeExpired.forEach((company, index) => {
                console.log(`   ${index + 1}. ${company.company_name}`);
                console.log(`      ID: ${company.id}`);
                console.log(`      Expire Date: ${company.expire_date}`);
                console.log(`      Days Remaining: ${company.days_remaining} days`);
                console.log('');
            });

            console.log('   🔄 Updating is_expired status...\n');

            // Update companies with future expiry dates to not expired
            const [updateResult2] = await connection.execute(
                `UPDATE registrations 
         SET is_expired = FALSE
         WHERE expire_date >= CURDATE() 
           AND is_expired = TRUE
           AND expire_date IS NOT NULL`
            );

            console.log(`   ✅ Updated ${updateResult2.affectedRows} companies to NOT expired status\n`);
        }

        // Show summary
        console.log('========================================');
        console.log('📊 Summary');
        console.log('========================================\n');

        const [stats] = await connection.execute(
            `SELECT 
        COUNT(*) as total_with_dates,
        SUM(CASE WHEN expire_date < CURDATE() THEN 1 ELSE 0 END) as past_dates,
        SUM(CASE WHEN expire_date >= CURDATE() THEN 1 ELSE 0 END) as future_dates,
        SUM(CASE WHEN is_expired = TRUE THEN 1 ELSE 0 END) as marked_expired,
        SUM(CASE WHEN expire_date < CURDATE() AND is_expired = TRUE THEN 1 ELSE 0 END) as correct_expired,
        SUM(CASE WHEN expire_date >= CURDATE() AND is_expired = FALSE THEN 1 ELSE 0 END) as correct_not_expired
       FROM registrations
       WHERE expire_date IS NOT NULL`
        );

        const s = stats[0];
        console.log(`   Total companies with expiry dates: ${s.total_with_dates}`);
        console.log(`   Past expiry dates: ${s.past_dates}`);
        console.log(`   Future expiry dates: ${s.future_dates}`);
        console.log(`   Currently marked as expired: ${s.marked_expired}`);
        console.log(`   Correctly expired: ${s.correct_expired}`);
        console.log(`   Correctly not expired: ${s.correct_not_expired}`);
        console.log('');

        if (s.correct_expired === s.past_dates && s.correct_not_expired === s.future_dates) {
            console.log('   ✅ All expiry statuses are now correct!\n');
        } else {
            console.log('   ⚠️  There may be some discrepancies. Run this script again.\n');
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

updateExpiredStatus();


#!/usr/bin/env node

/**
 * Script to check for expired companies and send notifications
 * This script should be run daily via cron job
 * 
 * To set up a cron job:
 * 1. Open crontab: crontab -e
 * 2. Add this line to run daily at 9:00 AM:
 *    0 9 * * * cd /path/to/EDashboard && node scripts/check-expired-companies.js >> logs/expiry-check.log 2>&1
 * 
 * Or use this line to run at midnight:
 *    0 0 * * * cd /path/to/EDashboard && node scripts/check-expired-companies.js >> logs/expiry-check.log 2>&1
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Email service function (simplified version for server-side script)
async function sendExpiryNotification(to, name, companyName, expireDate) {
    const fetch = (await import('node-fetch')).default;

    const formattedDate = new Date(expireDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                to: [to],
                subject: `Company Registration Expired - ${companyName}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #333;">⚠️ Company Registration Expired</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333;">Hello ${name}!</h2>
              <p>This is to inform you that your company registration has expired.</p>
              
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; text-align: center;">
                <h3 style="color: #856404; margin: 0 0 10px 0;">Company Registration Expired</h3>
                <h2 style="color: #333; margin: 10px 0; font-size: 24px;">${companyName}</h2>
                <p style="margin: 10px 0; color: #856404; font-size: 16px;"><strong>Expiry Date:</strong> ${formattedDate}</p>
              </div>
              
              <h3 style="color: #333;">What you need to do:</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li><strong>Contact our support team</strong> to renew your company registration</li>
                <li><strong>Review the renewal requirements</strong> and prepare necessary documents</li>
                <li><strong>Complete the renewal process</strong> as soon as possible to avoid penalties</li>
                <li><strong>Keep your company records up to date</strong> for compliance purposes</li>
              </ul>
              
              <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <h4 style="color: #721c24; margin: 0 0 10px 0;">⚠️ Important Notice:</h4>
                <p style="margin: 0; color: #721c24;">Operating a company with an expired registration may result in legal penalties and complications. Please take immediate action to renew your registration.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" 
                   style="background-color: #dc3545; color: white; padding: 14px 35px; text-decoration: none; 
                          border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Access Your Dashboard
                </a>
              </div>
              
              <p style="margin-top: 30px; font-size: 16px; color: #333;">If you need assistance with the renewal process, please contact our support team.</p>
              
              <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
              <p><small>For inquiries, please contact our support team through the dashboard or our official support channels.</small></p>
            </div>
            
            <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
              <p><small>This is an automated message. Please do not reply to this email.</small></p>
            </div>
          </div>
        `,
                headers: {
                    'Reply-To': 'noreply@balancedashboard.shop',
                    'X-Auto-Response-Suppress': 'All',
                    'Auto-Submitted': 'auto-generated',
                    'Precedence': 'bulk'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Resend API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        throw error;
    }
}

async function checkExpiredCompanies() {
    let connection;

    try {
        console.log('\n========================================');
        console.log('🔍 Starting expired companies check');
        console.log('⏰ Time:', new Date().toISOString());
        console.log('========================================\n');

        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edashboard',
            port: parseInt(process.env.DB_PORT || '3306'),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log('✅ Database connection established');

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        console.log('📅 Today\'s date:', todayStr);

        // Find all companies that expire today and haven't been marked as expired yet
        // Join with users table to get the user's registration email
        const [rows] = await connection.execute(
            `SELECT 
        r.id, 
        r.company_name, 
        r.company_name_english,
        r.user_id,
        u.name as user_name, 
        u.email as user_email,
        r.expire_date, 
        r.is_expired
       FROM registrations r
       INNER JOIN users u ON r.user_id = u.id
       WHERE r.expire_date = ? 
         AND r.is_expired = FALSE
         AND r.expire_date IS NOT NULL
         AND u.email IS NOT NULL
         AND (r.expiry_notification_sent_at IS NULL OR r.expiry_notification_sent_at < ?)`,
            [todayStr, todayStr]
        );

        console.log(`📊 Found ${rows.length} companies expiring today\n`);

        if (rows.length === 0) {
            console.log('✅ No companies expiring today. Exiting.');
            await connection.end();
            return;
        }

        let emailsSent = 0;
        let errors = 0;

        for (const row of rows) {
            try {
                console.log(`\n📧 Processing: ${row.company_name} (${row.id})`);
                console.log(`   User: ${row.user_name}`);
                console.log(`   User Email: ${row.user_email}`);
                console.log(`   Expire Date: ${row.expire_date}`);

                // Use company_name_english if available, otherwise fall back to company_name
                const companyNameToSend = row.company_name_english || row.company_name;

                // Send the expiry notification email to the user's registration email
                await sendExpiryNotification(
                    row.user_email,
                    row.user_name,
                    companyNameToSend,
                    row.expire_date
                );

                console.log(`   ✅ Email sent successfully`);

                // Mark the company as expired and record notification sent timestamp
                await connection.execute(
                    'UPDATE registrations SET is_expired = TRUE, expiry_notification_sent_at = NOW() WHERE id = ?',
                    [row.id]
                );

                console.log(`   ✅ Company marked as expired in database`);

                emailsSent++;
            } catch (emailError) {
                console.error(`   ❌ Error processing ${row.company_name}:`, emailError.message);
                errors++;
            }
        }

        console.log('\n========================================');
        console.log('📊 Summary:');
        console.log(`   Total companies checked: ${rows.length}`);
        console.log(`   Emails sent successfully: ${emailsSent}`);
        console.log(`   Errors: ${errors}`);
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

// Run the check
checkExpiredCompanies();


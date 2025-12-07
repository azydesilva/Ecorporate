import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { sendCompanyExpiryNotificationEmail } from '@/lib/email-service';

/**
 * API endpoint to check for expired companies and send email notifications
 * This should be called daily by a cron job
 * 
 * GET /api/notifications/check-expired-companies
 */
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Checking for expired companies at:', new Date().toISOString());

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const connection = await pool.getConnection();

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        console.log('📅 Today\'s date:', todayStr);

        // Find all companies that expire today and haven't been marked as expired yet
        // Join with users table to get the user's registration email
        const [rows]: any = await connection.execute(
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
         AND (r.expiry_notification_sent_at IS NULL OR DATE(r.expiry_notification_sent_at) < ?)`,
            [todayStr, todayStr]
        );

        console.log(`📊 Found ${rows.length} companies expiring today`);

        const results: {
            totalChecked: number;
            emailsSent: number;
            errors: Array<{ id: string, companyName: string, email: string, error: string }>;
            companies: Array<{ id: string, companyName: string, email: string, status: string }>;
        } = {
            totalChecked: rows.length,
            emailsSent: 0,
            errors: [],
            companies: []
        };

        for (const row of rows) {
            try {
                console.log(`📧 Sending expiry notification for company: ${row.company_name_english} (${row.id})`);

                // Use only company_name_english
                const companyNameToSend = row.company_name_english;

                // Send the expiry notification email to user's registration email
                await sendCompanyExpiryNotificationEmail({
                    to: row.user_email,
                    name: row.user_name,
                    companyName: companyNameToSend,
                    expireDate: row.expire_date
                });

                // Mark the company as expired and record notification sent timestamp
                await connection.execute(
                    'UPDATE registrations SET is_expired = TRUE, expiry_notification_sent_at = NOW() WHERE id = ?',
                    [row.id]
                );

                results.emailsSent++;
                results.companies.push({
                    id: row.id,
                    companyName: companyNameToSend,
                    email: row.user_email,
                    status: 'sent'
                });

                console.log(`✅ Expiry notification sent successfully for: ${row.company_name_english}`);
            } catch (emailError) {
                console.error(`❌ Error sending notification for ${row.company_name_english}:`, emailError);
                results.errors.push({
                    id: row.id,
                    companyName: row.company_name_english,
                    email: row.user_email,
                    error: emailError instanceof Error ? emailError.message : 'Unknown error'
                });
            }
        }

        connection.release();

        console.log(`✅ Expiry check completed. Sent ${results.emailsSent} emails out of ${results.totalChecked} expired companies`);

        return NextResponse.json({
            success: true,
            message: `Processed ${results.totalChecked} expired companies`,
            ...results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error checking for expired companies:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to check for expired companies',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

/**
 * POST endpoint - for manual testing or triggering from admin panel
 */
export async function POST(request: NextRequest) {
    // Reuse the same logic as GET
    return GET(request);
}
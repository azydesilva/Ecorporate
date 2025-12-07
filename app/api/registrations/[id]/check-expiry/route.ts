import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { sendCompanyExpiryNotificationEmail } from '@/lib/email-service';

// Helper function to check if registration has expired and send notification
export async function checkAndNotifyExpiry(registrationId: string) {
    try {
        if (!pool) {
            console.error('❌ Database pool not initialized');
            return { error: 'Database not available' };
        }

        const connection = await pool.getConnection();

        // Get registration with user details
        const [rows]: any = await connection.execute(
            `SELECT 
                r.id, 
                r.company_name, 
                r.company_name_english,
                r.expire_date,
                r.is_expired,
                r.expiry_notification_sent_at,
                u.name as user_name,
                u.email as user_email
            FROM registrations r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?`,
            [registrationId]
        );

        connection.release();

        if (Array.isArray(rows) && rows.length === 0) {
            return { error: 'Registration not found' };
        }

        const registration = rows[0];
        
        // Check if registration is expired and notification hasn't been sent
        const today = new Date();
        const expireDate = registration.expire_date ? new Date(registration.expire_date) : null;
        const isExpired = registration.is_expired || (expireDate && expireDate < today);
        
        // Check if we should send notification (not sent today or never sent)
        const notificationSentToday = registration.expiry_notification_sent_at && 
            new Date(registration.expiry_notification_sent_at).toDateString() === today.toDateString();
        
        if (isExpired && !notificationSentToday && registration.user_email) {
            try {
                // Use company_name_english if available, otherwise fall back to company_name
                const companyNameToSend = registration.company_name_english || registration.company_name;
                
                // Send expiry notification email
                await sendCompanyExpiryNotificationEmail({
                    to: registration.user_email,
                    name: registration.user_name,
                    companyName: companyNameToSend,
                    expireDate: registration.expire_date
                });
                
                console.log(`✅ Expiry notification sent for registration ${registrationId}`);
                
                // Update the registration to mark that notification was sent
                const updateConnection = await pool.getConnection();
                await updateConnection.execute(
                    'UPDATE registrations SET expiry_notification_sent_at = NOW(), is_expired = TRUE WHERE id = ?',
                    [registrationId]
                );
                updateConnection.release();
                
                return { 
                    success: true, 
                    notificationSent: true,
                    message: 'Expiry notification sent successfully'
                };
            } catch (emailError) {
                console.error(`❌ Error sending expiry notification for registration ${registrationId}:`, emailError);
                return { 
                    success: false, 
                    error: 'Failed to send expiry notification',
                    details: emailError instanceof Error ? emailError.message : 'Unknown error'
                };
            }
        }
        
        return { 
            success: true, 
            notificationSent: false,
            isExpired,
            message: 'No notification needed'
        };
    } catch (error) {
        console.error('❌ Error checking expiry:', error);
        return { 
            error: 'Failed to check expiry status',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// POST - Check expiry and send notification for a specific registration
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
        }
        
        const result = await checkAndNotifyExpiry(id);
        
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
        
        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ Error in POST /api/registrations/[id]/check-expiry:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
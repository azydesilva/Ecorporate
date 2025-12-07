import pool from './database';
import { sendCompanyExpiryNotificationEmail } from './email-service';

/**
 * Checks if a registration has expired and sends notification if needed
 * @param registrationId - The ID of the registration to check
 * @returns Object with result information
 */
export async function checkRegistrationExpiryAndNotify(registrationId: string) {
    try {
        if (!pool) {
            console.error('❌ Database pool not initialized');
            return { error: 'Database not available' };
        }

        const connection = await pool.getConnection();

        try {
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
                        isExpired: true,
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
        } catch (queryError: any) {
            connection.release();
            
            // Handle case where column doesn't exist
            if (queryError.code === 'ER_BAD_FIELD_ERROR' && queryError.sqlMessage.includes('expiry_notification_sent_at')) {
                console.warn('⚠️ expiry_notification_sent_at column not found, falling back to basic expiry check');
                
                // Retry with a simpler query that doesn't include the missing column
                const retryConnection = await pool.getConnection();
                const [rows]: any = await retryConnection.execute(
                    `SELECT 
                        r.id, 
                        r.company_name, 
                        r.company_name_english,
                        r.expire_date,
                        r.is_expired,
                        u.name as user_name,
                        u.email as user_email
                    FROM registrations r
                    LEFT JOIN users u ON r.user_id = u.id
                    WHERE r.id = ?`,
                    [registrationId]
                );
                retryConnection.release();

                if (Array.isArray(rows) && rows.length === 0) {
                    return { error: 'Registration not found' };
                }

                const registration = rows[0];
                
                // Check if registration is expired
                const today = new Date();
                const expireDate = registration.expire_date ? new Date(registration.expire_date) : null;
                const isExpired = registration.is_expired || (expireDate && expireDate < today);
                
                if (isExpired && registration.user_email) {
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
                        
                        return { 
                            success: true, 
                            notificationSent: true,
                            isExpired: true,
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
            }
            
            throw queryError;
        }
    } catch (error) {
        console.error('❌ Error checking expiry:', error);
        return { 
            error: 'Failed to check expiry status',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Checks all registrations for expiry and sends notifications if needed
 * @returns Object with result information
 */
export async function checkAllRegistrationsExpiryAndNotify() {
    try {
        if (!pool) {
            console.error('❌ Database pool not initialized');
            return { error: 'Database not available' };
        }

        const connection = await pool.getConnection();

        try {
            // Get all registrations with user details
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
                WHERE r.expire_date IS NOT NULL`
            );

            connection.release();

            const today = new Date();
            let notificationsSent = 0;
            let errors = 0;

            for (const registration of rows) {
                try {
                    // Check if registration is expired and notification hasn't been sent
                    const expireDate = registration.expire_date ? new Date(registration.expire_date) : null;
                    const isExpired = registration.is_expired || (expireDate && expireDate < today);
                    
                    // Check if we should send notification (not sent today or never sent)
                    const notificationSentToday = registration.expiry_notification_sent_at && 
                        new Date(registration.expiry_notification_sent_at).toDateString() === today.toDateString();
                    
                    if (isExpired && !notificationSentToday && registration.user_email) {
                        // Use company_name_english if available, otherwise fall back to company_name
                        const companyNameToSend = registration.company_name_english || registration.company_name;
                        
                        // Send expiry notification email
                        await sendCompanyExpiryNotificationEmail({
                            to: registration.user_email,
                            name: registration.user_name,
                            companyName: companyNameToSend,
                            expireDate: registration.expire_date
                        });
                        
                        console.log(`✅ Expiry notification sent for registration ${registration.id}`);
                        notificationsSent++;
                        
                        // Update the registration to mark that notification was sent
                        const updateConnection = await pool.getConnection();
                        await updateConnection.execute(
                            'UPDATE registrations SET expiry_notification_sent_at = NOW(), is_expired = TRUE WHERE id = ?',
                            [registration.id]
                        );
                        updateConnection.release();
                    }
                } catch (emailError) {
                    console.error(`❌ Error sending expiry notification for registration ${registration.id}:`, emailError);
                    errors++;
                }
            }
            
            return { 
                success: true, 
                notificationsSent,
                errors,
                totalChecked: rows.length,
                message: `Checked ${rows.length} registrations, sent ${notificationsSent} notifications with ${errors} errors`
            };
        } catch (queryError: any) {
            connection.release();
            
            // Handle case where column doesn't exist
            if (queryError.code === 'ER_BAD_FIELD_ERROR' && queryError.sqlMessage.includes('expiry_notification_sent_at')) {
                console.warn('⚠️ expiry_notification_sent_at column not found, falling back to basic expiry check for all registrations');
                
                // Retry with a simpler query that doesn't include the missing column
                const retryConnection = await pool.getConnection();
                const [rows]: any = await retryConnection.execute(
                    `SELECT 
                        r.id, 
                        r.company_name, 
                        r.company_name_english,
                        r.expire_date,
                        r.is_expired,
                        u.name as user_name,
                        u.email as user_email
                    FROM registrations r
                    LEFT JOIN users u ON r.user_id = u.id
                    WHERE r.expire_date IS NOT NULL`
                );
                retryConnection.release();

                const today = new Date();
                let notificationsSent = 0;
                let errors = 0;

                for (const registration of rows) {
                    try {
                        // Check if registration is expired
                        const expireDate = registration.expire_date ? new Date(registration.expire_date) : null;
                        const isExpired = registration.is_expired || (expireDate && expireDate < today);
                        
                        if (isExpired && registration.user_email) {
                            // Use company_name_english if available, otherwise fall back to company_name
                            const companyNameToSend = registration.company_name_english || registration.company_name;
                            
                            // Send expiry notification email
                            await sendCompanyExpiryNotificationEmail({
                                to: registration.user_email,
                                name: registration.user_name,
                                companyName: companyNameToSend,
                                expireDate: registration.expire_date
                            });
                            
                            console.log(`✅ Expiry notification sent for registration ${registration.id}`);
                            notificationsSent++;
                        }
                    } catch (emailError) {
                        console.error(`❌ Error sending expiry notification for registration ${registration.id}:`, emailError);
                        errors++;
                    }
                }
                
                return { 
                    success: true, 
                    notificationsSent,
                    errors,
                    totalChecked: rows.length,
                    message: `Checked ${rows.length} registrations, sent ${notificationsSent} notifications with ${errors} errors`
                };
            }
            
            throw queryError;
        }
    } catch (error) {
        console.error('❌ Error checking all registrations expiry:', error);
        return { 
            error: 'Failed to check all registrations expiry status',
            details: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
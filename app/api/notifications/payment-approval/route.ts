import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentApprovalEmail } from '@/lib/email-service';
import pool from '@/lib/database';

export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const { registrationId, companyName, name: nameFromBody, packageName } = body;

        // Resolve recipient from database using registrationId or companyName
        const connection = await pool.getConnection();

        let resolvedEmail: string | null = null;
        let resolvedName: string | null = null;
        let resolvedCompanyName: string | null = companyName || null;

        console.log('🔍 Payment approval - Looking up registration:', { registrationId, companyName });

        if (registrationId) {
            const [rows]: any = await connection.execute(
                'SELECT id, user_id, company_name, company_name_english, contact_person_name, contact_person_email FROM registrations WHERE id = ? LIMIT 1',
                [registrationId]
            );
            if (Array.isArray(rows) && rows.length > 0) {
                const reg = rows[0];
                console.log('🔍 Found registration:', reg);
                // Use only company_name_english
                resolvedCompanyName = reg.company_name_english || resolvedCompanyName;
                if (reg.user_id) {
                    const [userRows]: any = await connection.execute(
                        'SELECT name, email FROM users WHERE id = ? LIMIT 1',
                        [reg.user_id]
                    );
                    if (Array.isArray(userRows) && userRows.length > 0) {
                        resolvedEmail = userRows[0].email || null;
                        resolvedName = userRows[0].name || null;
                        console.log('🔍 Found user:', { email: resolvedEmail, name: resolvedName });
                    }
                }
                if (!resolvedEmail) {
                    resolvedEmail = reg.contact_person_email || null;
                    console.log('🔍 Using contact person email:', resolvedEmail);
                }
                if (!resolvedName) {
                    resolvedName = reg.contact_person_name || null;
                    console.log('🔍 Using contact person name:', resolvedName);
                }
            }
        } else if (companyName) {
            // Fallback lookup by company name (latest) - check only company_name_english
            const [rows]: any = await connection.execute(
                'SELECT id, user_id, company_name, company_name_english, contact_person_name, contact_person_email FROM registrations WHERE company_name_english = ? ORDER BY created_at DESC LIMIT 1',
                [companyName]
            );
            if (Array.isArray(rows) && rows.length > 0) {
                const reg = rows[0];
                console.log('🔍 Found registration by company name:', reg);
                // Use only company_name_english
                resolvedCompanyName = reg.company_name_english || resolvedCompanyName;
                if (reg.user_id) {
                    const [userRows]: any = await connection.execute(
                        'SELECT name, email FROM users WHERE id = ? LIMIT 1',
                        [reg.user_id]
                    );
                    if (Array.isArray(userRows) && userRows.length > 0) {
                        resolvedEmail = userRows[0].email || null;
                        resolvedName = userRows[0].name || null;
                        console.log('🔍 Found user by company name:', { email: resolvedEmail, name: resolvedName });
                    }
                }
                if (!resolvedEmail) {
                    resolvedEmail = reg.contact_person_email || null;
                    console.log('🔍 Using contact person email (by company name):', resolvedEmail);
                }
                if (!resolvedName) {
                    resolvedName = reg.contact_person_name || null;
                    console.log('🔍 Using contact person name (by company name):', resolvedName);
                }
            }
        }

        connection.release();

        console.log('🔍 Resolved email details:', {
            email: resolvedEmail,
            name: resolvedName,
            companyName: resolvedCompanyName
        });

        // Send email notification for payment approval
        if (resolvedEmail && resolvedName && resolvedCompanyName) {
            try {
                console.log('📧 Sending payment approval email to:', resolvedEmail);
                await sendPaymentApprovalEmail({
                    to: resolvedEmail,
                    name: resolvedName,
                    companyName: resolvedCompanyName,
                    packageName: packageName || undefined
                });
                console.log('✅ Payment approval email sent successfully to:', resolvedEmail);
            } catch (emailError) {
                console.error('❌ Failed to send payment approval email:', emailError);
                // Don't fail the entire operation if email fails
            }
        } else {
            console.warn('⚠️ Missing email details, skipping email notification:', {
                email: resolvedEmail,
                name: resolvedName,
                companyName: resolvedCompanyName
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Payment approval processed successfully',
            data: {
                id: registrationId,
                emailSent: !!(resolvedEmail && resolvedName && resolvedCompanyName),
                email: resolvedEmail,
                name: resolvedName,
                companyName: resolvedCompanyName
            }
        });

    } catch (error) {
        console.error('Error processing payment approval:', error);
        return NextResponse.json(
            {
                error: 'Failed to process payment approval',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
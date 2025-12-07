import { NextRequest, NextResponse } from 'next/server';
import { sendRegistrationCompletedEmail } from '@/lib/email-service';
import pool from '@/lib/database';

export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const { registrationId, companyName } = body;

        if (!registrationId && !companyName) {
            return NextResponse.json(
                { error: 'Either registrationId or companyName is required' },
                { status: 400 }
            );
        }

        // Resolve recipient from database using registrationId
        const connection = await pool.getConnection();

        let resolvedEmail: string | null = null;
        let resolvedName: string | null = null;
        let resolvedCompanyName: string | null = companyName || null;

        if (registrationId) {
            const [rows]: any = await connection.execute(
                'SELECT id, user_id, company_name, company_name_english, contact_person_name, contact_person_email FROM registrations WHERE id = ? LIMIT 1',
                [registrationId]
            );
            if (Array.isArray(rows) && rows.length > 0) {
                const reg = rows[0];
                // Use only company_name_english
                resolvedCompanyName = reg.company_name_english || resolvedCompanyName;
                // Prefer the user's registered email
                if (reg.user_id) {
                    const [userRows]: any = await connection.execute(
                        'SELECT name, email FROM users WHERE id = ? LIMIT 1',
                        [reg.user_id]
                    );
                    if (Array.isArray(userRows) && userRows.length > 0) {
                        resolvedEmail = userRows[0].email || null;
                        resolvedName = userRows[0].name || null;
                    }
                }
                // Fallback to registration contact details if user not found
                if (!resolvedEmail) {
                    resolvedEmail = reg.contact_person_email || null;
                }
                if (!resolvedName) {
                    resolvedName = reg.contact_person_name || null;
                }
            }
        } else if (companyName) {
            const [rows]: any = await connection.execute(
                'SELECT id, user_id, company_name, company_name_english, contact_person_name, contact_person_email FROM registrations WHERE company_name_english = ? ORDER BY created_at DESC LIMIT 1',
                [companyName]
            );
            if (Array.isArray(rows) && rows.length > 0) {
                const reg = rows[0];
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
                    }
                }
                if (!resolvedEmail) {
                    resolvedEmail = reg.contact_person_email || null;
                }
                if (!resolvedName) {
                    resolvedName = reg.contact_person_name || null;
                }
            }
        }

        connection.release();

        if (!resolvedEmail) {
            return NextResponse.json(
                { error: 'Unable to resolve recipient email from registration' },
                { status: 400 }
            );
        }

        const finalName = resolvedName || 'Customer';
        const finalCompanyName = resolvedCompanyName || companyName || '';

        // Send the registration completed email to the resolved recipient (user's registered email)
        const result = await sendRegistrationCompletedEmail({
            to: resolvedEmail,
            name: finalName,
            companyName: finalCompanyName
        });

        return NextResponse.json({
            success: true,
            message: 'Registration completed email sent successfully',
            data: result
        });

    } catch (error) {
        console.error('Error sending registration completed email:', error);
        return NextResponse.json(
            {
                error: 'Failed to send registration completed email',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}


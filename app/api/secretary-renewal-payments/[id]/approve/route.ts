import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// POST approve secretary renewal payment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('🚨 API CALL DETECTED - POST /api/secretary-renewal-payments/[id]/approve called at:', new Date().toISOString());

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const body = await request.json();

        // Validate required fields
        if (!body.approvedBy) {
            return NextResponse.json({ error: 'Approved by user ID is required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Get the registration ID from the payment record first
        const [paymentRows] = await connection.execute(
            'SELECT registration_id FROM secretary_renewal_payments WHERE id = ?',
            [id]
        );

        if (!Array.isArray(paymentRows) || paymentRows.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Secretary renewal payment not found' }, { status: 404 });
        }

        const registrationId = paymentRows[0].registration_id;

        // Update payment status to approved
        // Updated to match the actual table structure
        const [result]: any = await connection.execute(
            `UPDATE secretary_renewal_payments 
             SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [body.approvedBy, id]
        );

        if (result.affectedRows === 0) {
            connection.release();
            return NextResponse.json({ error: 'Secretary renewal payment not found' }, { status: 404 });
        }

        // If payment is approved, update the registration expire date and secretary period
        if (body.newExpireDays) {
            // Set the register start date to the approval date (today)
            const approvalDate = new Date();
            const newExpireDate = new Date(approvalDate);
            newExpireDate.setDate(newExpireDate.getDate() + body.newExpireDays);

            // Get current secretary period year
            const [registrationRows]: any = await connection.execute(
                'SELECT secretary_period_year FROM registrations WHERE id = ?',
                [registrationId]
            );

            let newSecretaryPeriodYear = '1'; // Default to 1 if not set
            if (registrationRows.length > 0 && registrationRows[0].secretary_period_year) {
                // Increment the current value by 1
                const currentYear = parseInt(registrationRows[0].secretary_period_year);
                newSecretaryPeriodYear = String(currentYear + 1);
            }

            // Update registration with new register start date, expire date, and secretary period
            await connection.execute(
                `UPDATE registrations 
                 SET register_start_date = ?, expire_days = ?, expire_date = ?, is_expired = 0, secretary_period_year = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    approvalDate.toISOString().split('T')[0], // Set register_start_date to approval date
                    body.newExpireDays,
                    newExpireDate.toISOString().split('T')[0],
                    newSecretaryPeriodYear,
                    registrationId
                ]
            );

            console.log(`✅ Secretary period year updated from ${registrationRows[0]?.secretary_period_year || '0'} to ${newSecretaryPeriodYear} for registration ${registrationId}`);
        }

        connection.release();

        return NextResponse.json({
            success: true,
            message: 'Secretary renewal payment approved successfully'
        });
    } catch (error) {
        console.error('Error approving secretary renewal payment:', error);
        return NextResponse.json({ error: 'Failed to approve secretary renewal payment' }, { status: 500 });
    }
}
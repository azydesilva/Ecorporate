import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// PUT update balance payment receipt
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const body = await request.json();

        console.log('📝 PUT /api/registrations/[id]/balance-payment - Updating balance payment receipt:', {
            id,
            balancePaymentReceipt: body.balancePaymentReceipt
        });

        const connection = await pool.getConnection();

        // Check if this is a rejection to update current_step
        const isRejection = body.balancePaymentReceipt?.status === 'rejected';
        // Check if this is an approval to set balance_payment_approved flag
        const isApproval = body.balancePaymentReceipt?.status === 'approved';

        // Update balance payment receipt and optionally current_step and balance_payment_approved
        const [result] = await connection.execute(
            `UPDATE registrations SET 
                balance_payment_receipt = ?,
                ${isRejection ? 'current_step = ?, ' : ''}
                ${isApproval ? 'balance_payment_approved = TRUE, ' : ''}
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                body.balancePaymentReceipt ? JSON.stringify(body.balancePaymentReceipt) : null,
                ...(isRejection ? ['documentation'] : []),
                id
            ]
        );

        connection.release();

        console.log('✅ Balance payment receipt updated successfully:', result);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Error updating balance payment receipt:', error);
        console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json({ error: 'Failed to update balance payment receipt' }, { status: 500 });
    }
} 
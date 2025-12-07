import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// POST reject secretary renewal payment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('🚨 API CALL DETECTED - POST /api/secretary-renewal-payments/[id]/reject called at:', new Date().toISOString());

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const body = await request.json();

        // Validate required fields
        if (!body.rejectedBy) {
            return NextResponse.json({ error: 'Rejected by user ID is required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Update payment status to rejected
        // Updated to match the actual table structure
        const [result]: any = await connection.execute(
            `UPDATE secretary_renewal_payments 
             SET status = 'rejected', rejected_by = ?, rejected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [body.rejectedBy, id]
        );

        connection.release();

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Secretary renewal payment not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Secretary renewal payment rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting secretary renewal payment:', error);
        return NextResponse.json({ error: 'Failed to reject secretary renewal payment' }, { status: 500 });
    }
}
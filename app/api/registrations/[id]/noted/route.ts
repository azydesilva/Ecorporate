import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// PUT update noted status
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

        console.log('📝 PUT /api/registrations/[id]/noted - Updating noted status:', {
            id,
            noted: body.noted
        });

        const connection = await pool.getConnection();

        // Update noted status and timestamp
        const [result] = await connection.execute(
            `UPDATE registrations SET 
                noted = ?,
                secretary_records_noted_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                body.noted || false,
                body.noted ? new Date() : null,
                id
            ]
        );

        connection.release();

        console.log('✅ Noted status updated successfully:', result);

        return NextResponse.json({
            success: true,
            message: 'Noted status updated successfully',
            noted: body.noted || false,
            secretaryRecordsNotedAt: body.noted ? new Date() : null
        });

    } catch (error) {
        console.error('❌ Error updating noted status:', error);
        return NextResponse.json({
            error: 'Failed to update noted status'
        }, { status: 500 });
    }
}

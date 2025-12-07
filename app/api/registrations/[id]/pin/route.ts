import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// PATCH to toggle pinned status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        console.log('🚨 API CALL DETECTED - PATCH /api/registrations/:id/pin called at:', new Date().toISOString());

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id: registrationId } = await params;
        if (!registrationId) {
            return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const { pinned } = body;

        if (typeof pinned !== 'boolean') {
            return NextResponse.json({ error: 'Pinned status must be a boolean' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Update the pinned status (without updating the timestamp)
        const [result]: any = await connection.execute(
            'UPDATE registrations SET pinned = ? WHERE id = ?',
            [pinned, registrationId]
        );

        connection.release();

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Registration ${pinned ? 'pinned' : 'unpinned'} successfully`,
            pinned
        });
    } catch (error) {
        console.error('Error toggling pinned status:', error);
        return NextResponse.json({ error: 'Failed to toggle pinned status' }, { status: 500 });
    }
}

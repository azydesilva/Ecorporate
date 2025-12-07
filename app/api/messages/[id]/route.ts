import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET message by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT id, title, content, created_at, updated_at, created_by, is_active FROM messages WHERE id = ?',
            [id]
        );
        connection.release();

        if (Array.isArray(rows) && rows.length === 0) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error('Error fetching message:', error);
        return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
    }
}

// PUT update message
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
        const { title, content, is_active } = body;

        // Validate required fields
        if (!title || !content) {
            return NextResponse.json({
                error: 'Missing required fields. Title and content are required.'
            }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // First check if message exists
        const [existingRows] = await connection.execute(
            'SELECT id FROM messages WHERE id = ?',
            [id]
        );

        if (Array.isArray(existingRows) && existingRows.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Update message
        await connection.execute(
            'UPDATE messages SET title = ?, content = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title, content, is_active !== undefined ? is_active : true, id]
        );

        connection.release();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating message:', error);
        return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }
}

// DELETE message
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const connection = await pool.getConnection();

        // First check if message exists
        const [existingRows] = await connection.execute(
            'SELECT id FROM messages WHERE id = ?',
            [id]
        );

        if (Array.isArray(existingRows) && existingRows.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Delete message
        await connection.execute('DELETE FROM messages WHERE id = ?', [id]);
        connection.release();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}

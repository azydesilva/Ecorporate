import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET user by ID
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
            'SELECT id, name, email, mobile_number, role, password, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );
        connection.release();

        if (Array.isArray(rows) && rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = rows[0];
        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            mobile_number: user.mobile_number,
            role: user.role,
            password: user.password
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PUT update user
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

        // Validate required fields
        if (!body.name || !body.email || !body.role) {
            return NextResponse.json({
                error: 'Missing required fields. Name, email, and role are required.'
            }, { status: 400 });
        }

        console.log('API: Updating user with data:', { id, body });

        const connection = await pool.getConnection();

        // First check if user exists
        const [existingRows] = await connection.execute(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );

        if (Array.isArray(existingRows) && existingRows.length === 0) {
            connection.release();
            console.error('User not found in database:', id);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update user
        const [result] = await connection.execute(
            `UPDATE users SET 
        name = ?, email = ?, mobile_number = ?, role = ?, password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
            [
                body.name,
                body.email,
                body.mobile_number || null,
                body.role,
                body.password || '', // Include password field
                id
            ]
        );

        connection.release();
        console.log('User updated successfully:', { id, result });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE user
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
        const [result] = await connection.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        connection.release();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
} 
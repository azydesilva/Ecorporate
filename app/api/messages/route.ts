import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET all messages
export async function GET() {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT id, title, content, created_at, updated_at, created_by, is_active FROM messages ORDER BY created_at DESC'
        );
        connection.release();

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST new message
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const { title, content, created_by } = body;

        // Validate required fields
        if (!title || !content || !created_by) {
            return NextResponse.json({
                error: 'Missing required fields. Title, content, and created_by are required.'
            }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Generate unique ID
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Insert new message
        await connection.execute(
            'INSERT INTO messages (id, title, content, created_by) VALUES (?, ?, ?, ?)',
            [messageId, title, content, created_by]
        );

        connection.release();

        return NextResponse.json({
            success: true,
            message: {
                id: messageId,
                title,
                content,
                created_by,
                is_active: true
            }
        });
    } catch (error) {
        console.error('Error creating message:', error);
        return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
}

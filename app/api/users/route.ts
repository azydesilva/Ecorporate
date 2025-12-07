import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET all users
export async function GET() {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT id, name, email, mobile_number, role, created_at, updated_at, email_verified, email_verified_at, email_verification_token, email_verification_sent_at FROM users ORDER BY created_at DESC');
        connection.release();

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST new user (registration)
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const connection = await pool.getConnection();

        // Check if email already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [body.email]
        );

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
            connection.release();
            return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
        }

        // Create new user
        const [result] = await connection.execute(
            `INSERT INTO users (id, name, email, mobile_number, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                body.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                body.name,
                body.email,
                body.mobile_number || null,
                body.password,
                body.role || 'customer'
            ]
        );

        connection.release();

        // Return user data without password
        const newUser = {
            id: body.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: body.name,
            email: body.email,
            mobile_number: body.mobile_number,
            role: body.role || 'customer'
        };

        return NextResponse.json({ success: true, user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
} 
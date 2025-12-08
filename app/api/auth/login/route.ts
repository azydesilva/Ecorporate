import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// POST login
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Find user with matching email and password
        const [rows]: any = await connection.execute(
            'SELECT id, name, email, mobile_number, role, password, email_verified, created_at, updated_at FROM users WHERE email = ? AND password = ?',
            [email, password]
        );

        connection.release();

        if (Array.isArray(rows) && rows.length === 0) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const user = rows[0];

        // Check if email is verified
        if (!user.email_verified) {
            return NextResponse.json({
                error: 'Please verify your email address before logging in. Check your inbox for the verification email.'
            }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile_number: user.mobile_number,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
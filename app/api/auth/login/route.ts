import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { sanitizeEmail, sanitizeInput } from '@/lib/security-utils';

// POST login
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        // Sanitize inputs to prevent XSS
        const email = sanitizeEmail(body.email);
        const password = sanitizeInput(body.password);

        if (!email || !password) {
            return NextResponse.json({ error: 'Valid email and password are required' }, { status: 400 });
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

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            user: userWithoutPassword,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
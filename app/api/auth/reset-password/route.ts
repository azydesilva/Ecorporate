import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// POST reset password
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const { email, token, newPassword } = body;

        if (!email || !token || !newPassword) {
            return NextResponse.json({ error: 'Email, token, and new password are required' }, { status: 400 });
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Find user with matching email and valid reset token
        const [rows]: any = await connection.execute(
            'SELECT id, name, email, reset_token, reset_token_expires FROM users WHERE email = ?',
            [email]
        );

        connection.release();

        if (Array.isArray(rows) && rows.length === 0) {
            return NextResponse.json({ error: 'Invalid password reset request' }, { status: 400 });
        }

        const user = rows[0];

        // Check if the reset token is valid and not expired
        if (user.reset_token !== token) {
            return NextResponse.json({ error: 'Invalid password reset token' }, { status: 400 });
        }

        const now = new Date();
        const tokenExpires = new Date(user.reset_token_expires);

        if (now > tokenExpires) {
            return NextResponse.json({ error: 'Password reset token has expired' }, { status: 400 });
        }

        // Update the user's password and clear the reset token
        const updateConnection = await pool.getConnection();
        await updateConnection.execute(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [newPassword, user.id]
        );
        updateConnection.release();

        return NextResponse.json({
            success: true,
            message: 'Your password has been successfully reset. You can now log in with your new password.'
        });
    } catch (error) {
        console.error('Error during password reset:', error);
        return NextResponse.json({ error: 'Password reset failed' }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '@/lib/email-service';

// POST request password reset
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Find user with matching email
        const [rows]: any = await connection.execute(
            'SELECT id, name, email FROM users WHERE email = ?',
            [email]
        );

        // For security reasons, we don't reveal if the email exists or not
        // We'll send an email either way
        if (Array.isArray(rows) && rows.length > 0) {
            const user = rows[0];

            // Generate a password reset token
            const resetToken = uuidv4();
            const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

            // Store the reset token and expiration in the database
            await connection.execute(
                'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
                [resetToken, resetTokenExpires, user.id]
            );

            // Send password reset email
            try {
                await sendPasswordResetEmail(user.email, user.name, resetToken);
            } catch (emailError) {
                console.error('Error sending password reset email:', emailError);
                // Don't fail the request if email sending fails, but log the error
            }
        }

        connection.release();

        // Always return the same response for security reasons
        return NextResponse.json({
            message: 'If an account exists with this email, we\'ve sent password reset instructions.'
        });
    } catch (error) {
        console.error('Error during password reset request:', error);
        return NextResponse.json({ error: 'Password reset request failed' }, { status: 500 });
    }
}
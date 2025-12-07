import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { sendResendVerificationEmail } from '@/lib/email-service';
import { v4 as uuidv4 } from 'uuid';

// POST register
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const { name, email, mobile_number, password, role = 'customer' } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Check if email already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
            connection.release();
            return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
        }

        // Create new user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const verificationToken = uuidv4();

        const [result] = await connection.execute(
            `INSERT INTO users (id, name, email, mobile_number, password, role, email_verification_token, email_verification_sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [userId, name, email, mobile_number || null, password, role, verificationToken]
        );

        connection.release();

        // Send verification email
        try {
            await sendResendVerificationEmail({
                to: email,
                name: name,
                verificationToken: verificationToken
            });
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // We don't return an error here because we still want to register the user
            // even if email sending fails
        }

        return NextResponse.json({
            success: true,
            message: 'Account created successfully. Please check your email to verify your account.',
            user: {
                id: userId,
                name,
                email,
                role
            }
        });
    } catch (error) {
        console.error('Error during registration:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
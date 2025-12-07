import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET verify email
export async function GET(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        // Find user with matching verification token
        const [rows]: any = await connection.execute(
            'SELECT id, email, email_verification_token, email_verification_sent_at FROM users WHERE email_verification_token = ?',
            [token]
        );

        if (Array.isArray(rows) && rows.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
        }

        const user = rows[0];

        // Check if token has expired (24 hours)
        const tokenSentAt = new Date(user.email_verification_sent_at);
        const now = new Date();
        const hoursDiff = Math.abs(now.getTime() - tokenSentAt.getTime()) / 36e5;

        if (hoursDiff > 24) {
            connection.release();
            return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 });
        }

        // Update user as verified
        await connection.execute(
            'UPDATE users SET email_verified = TRUE, email_verified_at = NOW(), email_verification_token = NULL, email_verification_sent_at = NULL WHERE id = ?',
            [user.id]
        );

        connection.release();

        // Return success response with HTML page
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Email Verified</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    background-color: #f5f5f5;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    padding: 2rem;
                    text-align: center;
                    max-width: 400px;
                }
                .success-icon {
                    color: #10b981;
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                h1 {
                    color: #333;
                    margin-bottom: 1rem;
                }
                p {
                    color: #666;
                    margin-bottom: 1.5rem;
                }
                .login-link {
                    display: inline-block;
                    background-color: #0070f3;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: 500;
                }
                .login-link:hover {
                    background-color: #0051a2;
                }
                .note {
                    font-size: 0.875rem;
                    color: #999;
                    margin-top: 1.5rem;
                }
            </style>
            <script>
                // Auto-redirect to the main application after 3 seconds
                setTimeout(function() {
                    window.location.href = "/";
                }, 3000);
            </script>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✓</div>
                <h1>Email Verified Successfully!</h1>
                <p>Your email address has been verified. You can now log in to your account.</p>
                <a href="/" class="login-link">Go to Login</a>
                <p class="note">This is an automated message. Please do not reply to this email.</p>
            </div>
        </body>
        </html>
        `;

        return new NextResponse(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
            },
        });
    } catch (error) {
        console.error('Error during email verification:', error);
        return NextResponse.json({ error: 'Email verification failed' }, { status: 500 });
    }
}
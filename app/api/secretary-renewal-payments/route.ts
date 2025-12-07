import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { safeJsonParse } from '@/lib/utils';

// GET all secretary renewal payments
export async function GET(request: NextRequest) {
    try {
        console.log('🚨 API CALL DETECTED - GET /api/secretary-renewal-payments called at:', new Date().toISOString());

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const connection = await pool.getConnection();

        // First, check if the table exists
        try {
            await connection.execute('SELECT 1 FROM secretary_renewal_payments LIMIT 1');
        } catch (tableError: any) {
            console.log('Table does not exist or is not accessible, returning empty array');
            connection.release();
            return NextResponse.json([]);
        }

        // Get all secretary renewal payments with registration details
        // Updated to match the actual table structure
        const query = `
            SELECT 
                srp.*,
                r.company_name,
                r.company_name_english,
                r.contact_person_name,
                r.contact_person_email
            FROM secretary_renewal_payments srp
            LEFT JOIN registrations r ON srp.registration_id COLLATE utf8mb4_unicode_ci = r.id COLLATE utf8mb4_unicode_ci
            ORDER BY srp.created_at DESC
        `;

        const [rows] = await connection.execute(query);
        connection.release();

        // Convert snake_case to camelCase for frontend compatibility
        const convertedRows = rows.map((row: any) => ({
            id: row.id,
            registrationId: row.registration_id,
            amount: row.amount,
            paymentReceipt: (() => {
                if (!row.payment_receipt) return null;
                if (typeof row.payment_receipt === 'string') {
                    return safeJsonParse(row.payment_receipt);
                }
                // MySQL JSON columns may already be parsed by the driver
                if (typeof row.payment_receipt === 'object') {
                    return row.payment_receipt;
                }
                return null;
            })(),
            status: row.status,
            approvedBy: row.approved_by,
            rejectedBy: row.rejected_by,
            approvedAt: row.approved_at,
            rejectedAt: row.rejected_at,
            companyName: row.company_name_english,
            companyNameEnglish: row.company_name_english,
            contactPersonName: row.contact_person_name,
            contactPersonEmail: row.contact_person_email,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        return NextResponse.json(convertedRows);
    } catch (error: any) {
        console.error('Error fetching secretary renewal payments:', error);
        return NextResponse.json({ error: 'Failed to fetch secretary renewal payments', details: error.message }, { status: 500 });
    }
}

// POST new secretary renewal payment
export async function POST(request: NextRequest) {
    try {
        console.log('🚨 API CALL DETECTED - POST /api/secretary-renewal-payments called at:', new Date().toISOString());

        if (!pool) {
            console.error('❌ Database pool not available');
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        console.log('📥 Received secretary renewal payment data:', JSON.stringify(body, null, 2));

        // Validate required fields
        if (!body.registrationId || !body.amount) {
            console.warn('⚠️ Missing required fields:', { registrationId: body.registrationId, amount: body.amount });
            return NextResponse.json({ error: 'Registration ID and amount are required' }, { status: 400 });
        }

        // Validate payment receipt if provided
        if (body.paymentReceipt && !body.paymentReceipt.url) {
            console.warn('⚠️ Payment receipt provided but missing URL');
        }

        const connection = await pool.getConnection();
        console.log('🔗 Database connection established');

        // Insert new secretary renewal payment
        // Updated to match the actual table structure
        console.log('📝 Creating payment record for registration:', body.registrationId);

        const [result]: any = await connection.execute(
            `INSERT INTO secretary_renewal_payments (
                registration_id, amount, payment_receipt, status
            ) VALUES (?, ?, ?, ?)`,
            [
                body.registrationId,
                body.amount,
                JSON.stringify(body.paymentReceipt) || null, // Store full payment receipt as JSON
                'pending'
            ]
        );

        connection.release();
        console.log('✅ Database connection released');

        console.log('✅ Secretary renewal payment created successfully with ID:', result.insertId);
        return NextResponse.json({
            success: true,
            id: result.insertId,
            message: 'Secretary renewal payment created successfully'
        });
    } catch (error: any) {
        console.error('❌ Error creating secretary renewal payment:', error);
        return NextResponse.json({
            error: 'Failed to create secretary renewal payment',
            details: error.message,
            code: error.code
        }, { status: 500 });
    }
}
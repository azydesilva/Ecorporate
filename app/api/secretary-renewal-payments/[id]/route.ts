import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET secretary renewal payment by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('🚨 API CALL DETECTED - GET /api/secretary-renewal-payments/[id] called at:', new Date().toISOString());

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const connection = await pool.getConnection();

        // First, check if the table exists
        try {
            await connection.execute('SELECT 1 FROM secretary_renewal_payments LIMIT 1');
        } catch (tableError: any) {
            console.log('Table does not exist or is not accessible');
            connection.release();
            return NextResponse.json({ error: 'Secretary renewal payments table not available' }, { status: 503 });
        }

        // Get secretary renewal payment with registration details
        // Updated to match the actual table structure
        const query = `
            SELECT 
                srp.*,
                r.company_name,
                r.company_name_english,
                r.contact_person_name,
                r.contact_person_email
            FROM secretary_renewal_payments srp
            LEFT JOIN registrations r ON srp.company_id = r.id
            WHERE srp.id = ? AND srp.type = 'secretary-renewal'
        `;

        const [rows] = await connection.execute(query, [id]);
        connection.release();

        if (Array.isArray(rows) && rows.length === 0) {
            return NextResponse.json({ error: 'Secretary renewal payment not found' }, { status: 404 });
        }

        const row = rows[0];

        // Convert snake_case to camelCase for frontend compatibility
        const convertedRow = {
            id: row.id,
            registrationId: row.company_id,
            amount: row.amount,
            paymentReceipt: row.receipt_url ? { url: row.receipt_url } : null,
            status: row.status,
            approvedBy: row.reviewed_by,
            rejectedBy: row.reviewed_by,
            approvedAt: row.reviewed_at,
            rejectedAt: row.reviewed_at,
            companyName: row.company_name,
            companyNameEnglish: row.company_name_english,
            contactPersonName: row.contact_person_name,
            contactPersonEmail: row.contact_person_email,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        return NextResponse.json(convertedRow);
    } catch (error: any) {
        console.error('Error fetching secretary renewal payment:', error);
        return NextResponse.json({ error: 'Failed to fetch secretary renewal payment', details: error.message }, { status: 500 });
    }
}

// PUT update secretary renewal payment
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('🚨 API CALL DETECTED - PUT /api/secretary-renewal-payments/[id] called at:', new Date().toISOString());

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const body = await request.json();

        const connection = await pool.getConnection();

        // Build the update query dynamically based on provided fields
        // Updated to match the actual table structure
        const fields: string[] = [];
        const values: any[] = [];

        if (body.amount !== undefined) {
            fields.push('amount = ?');
            values.push(body.amount);
        }
        if (body.paymentReceipt !== undefined) {
            fields.push('receipt_url = ?');
            values.push(body.paymentReceipt?.url || null);
        }
        if (body.status !== undefined) {
            fields.push('status = ?');
            values.push(body.status);
        }
        if (body.approvedBy !== undefined) {
            fields.push('reviewed_by = ?');
            values.push(body.approvedBy);
        }
        if (body.rejectedBy !== undefined) {
            fields.push('reviewed_by = ?');
            values.push(body.rejectedBy);
        }
        if (body.approvedAt !== undefined) {
            fields.push('reviewed_at = ?');
            values.push(body.approvedAt);
        }
        if (body.rejectedAt !== undefined) {
            fields.push('reviewed_at = ?');
            values.push(body.rejectedAt);
        }

        // Always update the updated_at timestamp
        fields.push('updated_at = CURRENT_TIMESTAMP');

        // Add the payment ID to the values array for the WHERE clause
        values.push(id);

        if (fields.length === 1) {
            // Only the updated_at field was added, no actual updates
            connection.release();
            return NextResponse.json({ success: true, message: 'No fields to update' });
        }

        const query = `UPDATE secretary_renewal_payments SET ${fields.join(', ')} WHERE id = ? AND type = 'secretary-renewal'`;
        const [result]: any = await connection.execute(query, values);
        connection.release();

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Secretary renewal payment not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Secretary renewal payment updated successfully' });
    } catch (error: any) {
        console.error('Error updating secretary renewal payment:', error);
        return NextResponse.json({ error: 'Failed to update secretary renewal payment', details: error.message }, { status: 500 });
    }
}

// DELETE secretary renewal payment
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('🚨 API CALL DETECTED - DELETE /api/secretary-renewal-payments/[id] called at:', new Date().toISOString());

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const connection = await pool.getConnection();

        const [result]: any = await connection.execute(
            'DELETE FROM secretary_renewal_payments WHERE id = ? AND type = "secretary-renewal"',
            [id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Secretary renewal payment not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Secretary renewal payment deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting secretary renewal payment:', error);
        return NextResponse.json({ error: 'Failed to delete secretary renewal payment', details: error.message }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET all bank details
export async function GET() {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM bank_details WHERE is_active = TRUE ORDER BY bank_name ASC');
        connection.release();

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching bank details:', error);
        return NextResponse.json({ error: 'Failed to fetch bank details' }, { status: 500 });
    }
}

// POST new bank detail
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const connection = await pool.getConnection();

        const [result] = await connection.execute(
            `INSERT INTO bank_details (
        id, bank_name, account_name, account_number, branch, swift_code, additional_instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                body.id,
                body.bankName,
                body.accountName,
                body.accountNumber,
                body.branch,
                body.swiftCode,
                body.additionalInstructions
            ]
        );

        connection.release();
        return NextResponse.json({ success: true, id: body.id });
    } catch (error) {
        console.error('Error creating bank detail:', error);
        return NextResponse.json({ error: 'Failed to create bank detail' }, { status: 500 });
    }
}

// PUT update all bank details (replace all bank details)
export async function PUT(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const bankDetails = body.bankDetails || [];
        const connection = await pool.getConnection();

        // First, deactivate all existing bank details
        await connection.execute('UPDATE bank_details SET is_active = FALSE');

        // Then insert/update the new bank details
        for (const bank of bankDetails) {
            await connection.execute(
                `INSERT INTO bank_details (
          id, bank_name, account_name, account_number, branch, swift_code, additional_instructions, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE
          bank_name = VALUES(bank_name),
          account_name = VALUES(account_name),
          account_number = VALUES(account_number),
          branch = VALUES(branch),
          swift_code = VALUES(swift_code),
          additional_instructions = VALUES(additional_instructions),
          is_active = TRUE,
          updated_at = CURRENT_TIMESTAMP`,
                [
                    bank.id,
                    bank.bank_name,
                    bank.account_name,
                    bank.account_number,
                    bank.branch,
                    bank.swift_code,
                    bank.additional_instructions
                ]
            );
        }

        connection.release();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating bank details:', error);
        return NextResponse.json({ error: 'Failed to update bank details' }, { status: 500 });
    }
} 
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET all packages
export async function GET() {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM packages WHERE is_active = TRUE ORDER BY price ASC');
        connection.release();

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching packages:', error);
        return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }
}

// POST new package
export async function POST(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const connection = await pool.getConnection();

        const [result] = await connection.execute(
            `INSERT INTO packages (
        id, name, description, price, advance_amount, balance_amount, features
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                body.id || null,
                body.name || null,
                body.description || null,
                body.price || null,
                body.advanceAmount || null,
                body.balanceAmount || null,
                JSON.stringify(body.features || [])
            ]
        );

        connection.release();
        return NextResponse.json({ success: true, id: body.id });
    } catch (error) {
        console.error('Error creating package:', error);
        return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
    }
}

// PUT update all packages (replace all packages)
export async function PUT(request: NextRequest) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        const packages = body.packages || [];
        const connection = await pool.getConnection();

        // First, deactivate all existing packages
        await connection.execute('UPDATE packages SET is_active = FALSE');

        // Then insert/update the new packages
        for (const pkg of packages) {
            await connection.execute(
                `INSERT INTO packages (
          id, name, description, price, advance_amount, balance_amount, features, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          price = VALUES(price),
          advance_amount = VALUES(advance_amount),
          balance_amount = VALUES(balance_amount),
          features = VALUES(features),
          is_active = TRUE,
          updated_at = CURRENT_TIMESTAMP`,
                [
                    pkg.id || null,
                    pkg.name || null,
                    pkg.description || null,
                    pkg.price || null,
                    pkg.advanceAmount || null,
                    pkg.balanceAmount || null,
                    JSON.stringify(pkg.features || [])
                ]
            );
        }

        connection.release();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating packages:', error);
        return NextResponse.json({ error: 'Failed to update packages' }, { status: 500 });
    }
} 
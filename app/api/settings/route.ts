export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// GET settings
export async function GET() {
    let connection: any;
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM settings LIMIT 1');

        if (!Array.isArray(rows) || rows.length === 0) {
            // Return default settings if none exist (snake_case keys for consistency)
            return NextResponse.json({
                id: 'settings-001',
                title: 'E CORPORATE',
                description: 'CENTRAL COURT (PRIVATE) LIMITED.',
                logo_url: null,
                favicon_url: null,
                primary_color: '#000000',
                secondary_color: '#ffffff',
                secretary_renew_fee: 0.00,
                additional_fees: null
            });
        }

        const row: any = rows[0] || {};

        // Safely handle additional_fees which may already be an object or a JSON string
        let parsedAdditionalFees: any = null;
        const additionalFeesRaw: any = row.additional_fees;
        if (additionalFeesRaw !== undefined && additionalFeesRaw !== null) {
            if (typeof additionalFeesRaw === 'string') {
                const trimmed = additionalFeesRaw.trim();
                if (trimmed.length > 0) {
                    try {
                        parsedAdditionalFees = JSON.parse(trimmed);
                    } catch {
                        // If it isn't valid JSON, return the raw string instead of throwing
                        parsedAdditionalFees = additionalFeesRaw;
                    }
                }
            } else if (typeof additionalFeesRaw === 'object') {
                parsedAdditionalFees = additionalFeesRaw;
            }
        }

        // Normalize keys to snake_case expected by frontend conversion code
        const normalized = {
            id: row.id ?? 'settings-001',
            title: row.title ?? 'E CORPORATE',
            description: row.description ?? 'CENTRAL COURT (PRIVATE) LIMITED.',
            logo_url: row.logo_url ?? null,
            favicon_url: row.favicon_url ?? null,
            primary_color: row.primary_color ?? '#000000',
            secondary_color: row.secondary_color ?? '#ffffff',
            secretary_renew_fee: row.secretary_renew_fee ?? 0.00,
            additional_fees: parsedAdditionalFees,
            updated_at: row.updated_at ?? null,
            created_at: row.created_at ?? null,
        };

        return NextResponse.json(normalized);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    } finally {
        try { connection?.release?.(); } catch { }
    }
}

// PUT update settings
export async function PUT(request: NextRequest) {
    try {
        console.log('📝 PUT /api/settings called');
        
        if (!pool) {
            console.error('❌ Database not available');
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        // Safely parse JSON body; handle empty or non-JSON bodies gracefully
        let body: any = {};
        try {
            const text = await request.text();
            body = text ? JSON.parse(text) : {};
            console.log('📝 Request body:', body);
        } catch (e) {
            console.error('❌ Error parsing request body:', e);
            // If parsing fails, treat as empty object instead of throwing
            body = {};
        }
        const connection = await pool.getConnection();
        console.log('🔗 Database connection established');

        // Check if settings exist
        const [existing] = await connection.execute('SELECT id FROM settings LIMIT 1');
        console.log('🔍 Existing settings:', existing);

        if (Array.isArray(existing) && existing.length === 0) {
            console.log('📝 Creating new settings record');
            // Create new settings
            await connection.execute(
                `INSERT INTO settings (
          id, title, description, logo_url, favicon_url, primary_color, secondary_color, secretary_renew_fee, additional_fees
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    'settings-001',
                    body.title || 'E CORPORATE',
                    body.description || 'CENTRAL COURT (PRIVATE) LIMITED.',
                    body.logo_url || null,
                    body.favicon_url || null,
                    body.primary_color || '#000000',
                    body.secondary_color || '#ffffff',
                    body.secretary_renew_fee || 0.00,
                    body.additional_fees ? JSON.stringify(body.additional_fees) : null
                ]
            );
        } else {
            console.log('📝 Updating existing settings record');
            // Update existing settings
            const updateResult = await connection.execute(
                `UPDATE settings SET 
          title = ?, description = ?, logo_url = ?, favicon_url = ?,
          primary_color = ?, secondary_color = ?, secretary_renew_fee = ?, additional_fees = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
                [
                    body.title || 'E CORPORATE',
                    body.description || 'CENTRAL COURT (PRIVATE) LIMITED.',
                    body.logo_url || null,
                    body.favicon_url || null,
                    body.primary_color || '#000000',
                    body.secondary_color || '#ffffff',
                    body.secretary_renew_fee || 0.00,
                    body.additional_fees ? JSON.stringify(body.additional_fees) : null,
                    existing[0].id  // Use the actual ID from the existing record
                ]
            );
            console.log('📝 Update result:', updateResult);
        }

        connection.release();
        console.log('✅ Settings updated successfully');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

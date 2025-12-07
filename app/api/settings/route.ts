import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { sanitizeInput, sanitizeNumericInput } from '@/lib/security-utils';

async function getConnection() {
    if (!pool) {
        throw new Error('Database connection pool not initialized');
    }
    return await pool.getConnection();
}

export async function GET() {
    try {
        console.log('📝 GET /api/settings called');
        const connection = await getConnection();
        
        const [rows] = await connection.execute('SELECT * FROM settings LIMIT 1');
        connection.release();
        
        console.log('🔍 Settings rows:', rows);
        
        if (Array.isArray(rows) && rows.length > 0) {
            const settings = rows[0];
            return NextResponse.json(settings);
        } else {
            return NextResponse.json({});
        }
    } catch (error) {
        console.error('❌ Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

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

        // Sanitize all input fields to prevent XSS
        const sanitizedBody: any = {};
        for (const [key, value] of Object.entries(body)) {
            if (typeof value === 'string') {
                sanitizedBody[key] = sanitizeInput(value);
            } else if (typeof value === 'number') {
                sanitizedBody[key] = value; // Numbers are safe
            } else {
                // For other types, convert to string and sanitize
                sanitizedBody[key] = sanitizeInput(String(value));
            }
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
                `INSERT INTO settings (title, description, logo, favicon, primary_color, secondary_color, accent_color, background_color, text_color, sidebar_color, header_color, footer_color, button_primary_color, button_secondary_color, card_color, border_color, success_color, warning_color, error_color, info_color, font_family, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    sanitizedBody.title || '',
                    sanitizedBody.description || '',
                    sanitizedBody.logo || '',
                    sanitizedBody.favicon || '',
                    sanitizedBody.primaryColor || '#3b82f6',
                    sanitizedBody.secondaryColor || '#64748b',
                    sanitizedBody.accentColor || '#10b981',
                    sanitizedBody.backgroundColor || '#ffffff',
                    sanitizedBody.textColor || '#000000',
                    sanitizedBody.sidebarColor || '#f8fafc',
                    sanitizedBody.headerColor || '#ffffff',
                    sanitizedBody.footerColor || '#f1f5f9',
                    sanitizedBody.buttonPrimaryColor || '#3b82f6',
                    sanitizedBody.buttonSecondaryColor || '#64748b',
                    sanitizedBody.cardColor || '#ffffff',
                    sanitizedBody.borderColor || '#e2e8f0',
                    sanitizedBody.successColor || '#10b981',
                    sanitizedBody.warningColor || '#f59e0b',
                    sanitizedBody.errorColor || '#ef4444',
                    sanitizedBody.infoColor || '#3b82f6',
                    sanitizedBody.fontFamily || 'Inter, sans-serif'
                ]
            );
        } else {
            console.log('📝 Updating existing settings record');
            // Update existing settings
            await connection.execute(
                `UPDATE settings SET 
                    title = ?, 
                    description = ?, 
                    logo = ?, 
                    favicon = ?, 
                    primary_color = ?, 
                    secondary_color = ?, 
                    accent_color = ?, 
                    background_color = ?, 
                    text_color = ?, 
                    sidebar_color = ?, 
                    header_color = ?, 
                    footer_color = ?, 
                    button_primary_color = ?, 
                    button_secondary_color = ?, 
                    card_color = ?, 
                    border_color = ?, 
                    success_color = ?, 
                    warning_color = ?, 
                    error_color = ?, 
                    info_color = ?, 
                    font_family = ?,
                    updated_at = NOW()
                WHERE id = ?`,
                [
                    sanitizedBody.title || '',
                    sanitizedBody.description || '',
                    sanitizedBody.logo || '',
                    sanitizedBody.favicon || '',
                    sanitizedBody.primaryColor || '#3b82f6',
                    sanitizedBody.secondaryColor || '#64748b',
                    sanitizedBody.accentColor || '#10b981',
                    sanitizedBody.backgroundColor || '#ffffff',
                    sanitizedBody.textColor || '#000000',
                    sanitizedBody.sidebarColor || '#f8fafc',
                    sanitizedBody.headerColor || '#ffffff',
                    sanitizedBody.footerColor || '#f1f5f9',
                    sanitizedBody.buttonPrimaryColor || '#3b82f6',
                    sanitizedBody.buttonSecondaryColor || '#64748b',
                    sanitizedBody.cardColor || '#ffffff',
                    sanitizedBody.borderColor || '#e2e8f0',
                    sanitizedBody.successColor || '#10b981',
                    sanitizedBody.warningColor || '#f59e0b',
                    sanitizedBody.errorColor || '#ef4444',
                    sanitizedBody.infoColor || '#3b82f6',
                    sanitizedBody.fontFamily || 'Inter, sans-serif',
                    existing[0].id
                ]
            );
        }

        connection.release();
        console.log('✅ Settings saved successfully');

        return NextResponse.json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
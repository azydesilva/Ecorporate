import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'banana_db',
}

// GET - Retrieve about settings
export async function GET() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig)

        const [rows] = await connection.execute(
            'SELECT * FROM about_settings ORDER BY updated_at DESC LIMIT 1'
        )

        if (rows.length === 0) {
            // Return default settings if none exist
            return NextResponse.json({
                title: "About Our Company",
                companyInformation: "Welcome to our company incorporation service. We provide comprehensive support for business registration and incorporation processes.",
                updatedAt: new Date().toISOString()
            })
        }

        const aboutSettings = rows[0] as any
        return NextResponse.json({
            title: aboutSettings.title,
            companyInformation: aboutSettings.company_information,
            updatedAt: aboutSettings.updated_at
        })
    } catch (error) {
        console.error('Error fetching about settings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch about settings' },
            { status: 500 }
        )
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

// POST - Save about settings
export async function POST(request: NextRequest) {
    let connection;
    try {
        const body = await request.json()
        const { title, companyInformation } = body

        if (!title || !companyInformation) {
            return NextResponse.json(
                { error: 'Title and company information are required' },
                { status: 400 }
            )
        }

        connection = await mysql.createConnection(dbConfig)

        // Check if about settings already exist
        const [existingRows] = await connection.execute(
            'SELECT id FROM about_settings LIMIT 1'
        )

        const aboutSettings = {
            title: title.trim(),
            companyInformation: companyInformation.trim(),
            updatedAt: new Date().toISOString()
        }

        if (existingRows.length > 0) {
            // Update existing record
            await connection.execute(
                'UPDATE about_settings SET title = ?, company_information = ?, updated_at = NOW() WHERE id = ?',
                [aboutSettings.title, aboutSettings.companyInformation, (existingRows[0] as any).id]
            )
        } else {
            // Insert new record
            await connection.execute(
                'INSERT INTO about_settings (id, title, company_information) VALUES (?, ?, ?)',
                ['about-001', aboutSettings.title, aboutSettings.companyInformation]
            )
        }

        return NextResponse.json(aboutSettings)
    } catch (error) {
        console.error('Error saving about settings:', error)
        return NextResponse.json(
            { error: 'Failed to save about settings' },
            { status: 500 }
        )
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

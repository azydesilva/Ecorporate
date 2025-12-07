export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        // In Next.js 15 App Router, dynamic route params are async-accessible
        const resolvedParams = await params
        const filePath = resolvedParams.path.join('/')

        if (!filePath) {
            return NextResponse.json(
                { error: 'File path is required' },
                { status: 400 }
            )
        }

        // Construct the full path to the file in the public/uploads directory
        const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath)

        // Check if file exists
        if (!existsSync(fullPath)) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            )
        }

        // Read the file
        const fileBuffer = await readFile(fullPath)

        // Determine content type based on file extension
        const ext = path.extname(fullPath).toLowerCase()
        let contentType = 'application/octet-stream'

        switch (ext) {
            case '.pdf':
                contentType = 'application/pdf'
                break
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg'
                break
            case '.png':
                contentType = 'image/png'
                break
            case '.gif':
                contentType = 'image/gif'
                break
            case '.webp':
                contentType = 'image/webp'
                break
            case '.doc':
                contentType = 'application/msword'
                break
            case '.docx':
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                break
            case '.xls':
                contentType = 'application/vnd.ms-excel'
                break
            case '.xlsx':
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                break
            case '.txt':
                contentType = 'text/plain'
                break
        }

        // Return the file with appropriate headers
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${path.basename(fullPath)}"`,
                'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            },
        })

    } catch (error) {
        console.error('File serving error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

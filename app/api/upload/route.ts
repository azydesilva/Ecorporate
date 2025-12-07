export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { fileStorage, FileMetadata } from '@/lib/file-storage'
import { sanitizeInput } from '@/lib/security-utils'

// Configure for large file uploads
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '100mb',
        },
        responseLimit: false,
    },
}

export async function POST(request: NextRequest) {
    try {
        // Parse the request as form data with increased size limit
        const formData = await request.formData()
        const file = formData.get('file') as File
        const uploadedBy = formData.get('uploadedBy') as string
        const saveToPublic = formData.get('saveToPublic') as string | null
        const publicBaseName = formData.get('publicBaseName') as string | null

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        console.log(`📁 Upload API - Processing file: ${file.name}, size: ${file.size} bytes`)

        // Convert File to Buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Sanitize input values
        const sanitizedUploadedBy = uploadedBy ? sanitizeInput(uploadedBy) : undefined
        const sanitizedSaveToPublic = saveToPublic ? sanitizeInput(saveToPublic) : null
        const sanitizedPublicBaseName = publicBaseName ? sanitizeInput(publicBaseName) : null

        // Create a mock multer file object
        const multerFile: Express.Multer.File = {
            fieldname: 'file',
            originalname: file.name,
            encoding: '7bit',
            mimetype: file.type,
            size: file.size,
            buffer: buffer,
            destination: '',
            filename: '',
            path: '',
            stream: {} as any
        }

        // Save file using our file storage service
        let result
        if (sanitizedSaveToPublic === 'true' && sanitizedPublicBaseName) {
            result = await fileStorage.saveFileToPublicRoot(multerFile, sanitizedPublicBaseName)
        } else {
            result = await fileStorage.saveFile(multerFile, sanitizedUploadedBy)
        }

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            )
        }

        console.log(`✅ Upload API - File uploaded successfully: ${file.name}`)

        return NextResponse.json({
            success: true,
            file: result.file
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const filePath = searchParams.get('path')

        if (!filePath) {
            return NextResponse.json(
                { error: 'File path is required' },
                { status: 400 }
            )
        }

        // Sanitize file path to prevent directory traversal
        const sanitizedFilePath = sanitizeInput(filePath)
        const fileInfo = await fileStorage.getFileInfo(sanitizedFilePath)

        if (!fileInfo) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            file: fileInfo
        })

    } catch (error) {
        console.error('File info error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const filePath = searchParams.get('path')
        const publicPath = searchParams.get('publicPath')

        if (!filePath && !publicPath) {
            return NextResponse.json(
                { error: 'File path is required' },
                { status: 400 }
            )
        }

        // Sanitize paths to prevent directory traversal
        let resolvedPath = filePath as string
        if (!resolvedPath && publicPath) {
            // Resolve to absolute path inside public directory
            const normalized = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath
            resolvedPath = require('path').join(process.cwd(), 'public', normalized)
        }

        // Sanitize the resolved path
        const sanitizedPath = sanitizeInput(resolvedPath)
        const deleted = await fileStorage.deleteFile(sanitizedPath)

        if (!deleted) {
            return NextResponse.json(
                { error: 'File not found or could not be deleted' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully'
        })

    } catch (error) {
        console.error('Delete error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
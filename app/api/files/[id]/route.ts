import { NextRequest, NextResponse } from 'next/server'
import { fileStorage } from '@/lib/file-storage'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: fileId } = await params

        if (!fileId) {
            return NextResponse.json(
                { error: 'File ID is required' },
                { status: 400 }
            )
        }

        const fileInfo = await fileStorage.getFileById(fileId)

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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: fileId } = await params

        if (!fileId) {
            return NextResponse.json(
                { error: 'File ID is required' },
                { status: 400 }
            )
        }

        const fileInfo = await fileStorage.getFileById(fileId)

        if (!fileInfo) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            )
        }

        const deleted = await fileStorage.deleteFile(fileInfo.filePath)

        if (!deleted) {
            return NextResponse.json(
                { error: 'Failed to delete file' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully'
        })

    } catch (error) {
        console.error('Delete file error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 
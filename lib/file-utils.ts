import { fileUploadClient } from './file-upload-client'
import { FileMetadata } from './file-storage'

export interface FileReference {
    id: string
    name: string
    type: string
    size: number
    url: string
    uploadedAt?: string
    [key: string]: any // Additional metadata
}

export class FileUtils {
    /**
     * Load a file by its ID from the server
     */
    static async loadFileById(fileId: string): Promise<FileMetadata | null> {
        try {
            const result = await fileUploadClient.getFileById(fileId)
            if (result.success && result.file) {
                return result.file
            }
            return null
        } catch (error) {
            console.error('Error loading file by ID:', error)
            return null
        }
    }

    /**
     * Load multiple files by their IDs
     */
    static async loadFilesByIds(fileIds: string[]): Promise<FileMetadata[]> {
        const files: FileMetadata[] = []

        for (const fileId of fileIds) {
            const file = await this.loadFileById(fileId)
            if (file) {
                files.push(file)
            }
        }

        return files
    }

    /**
     * Convert a file reference (stored in localStorage) to a full file object
     */
    static async loadFileFromReference(fileRef: FileReference): Promise<FileMetadata | null> {
        if (fileRef.id) {
            return await this.loadFileById(fileRef.id)
        }
        return null
    }

    /**
     * Load multiple files from references
     */
    static async loadFilesFromReferences(fileRefs: FileReference[]): Promise<FileMetadata[]> {
        const files: FileMetadata[] = []

        for (const fileRef of fileRefs) {
            const file = await this.loadFileFromReference(fileRef)
            if (file) {
                files.push(file)
            }
        }

        return files
    }

    /**
     * Create a file reference object (for storing in localStorage)
     */
    static createFileReference(file: FileMetadata): FileReference {
        return {
            id: file.id,
            name: file.originalName,
            type: file.fileType,
            size: file.fileSize,
            url: file.url,
            uploadedAt: file.uploadedAt
        }
    }

    /**
     * Delete a file by its ID
     */
    static async deleteFileById(fileId: string): Promise<boolean> {
        try {
            const result = await fileUploadClient.deleteFileById(fileId)
            return result.success
        } catch (error) {
            console.error('Error deleting file by ID:', error)
            return false
        }
    }

    /**
     * Check if a file reference is valid (has required fields)
     */
    static isValidFileReference(fileRef: any): fileRef is FileReference {
        return fileRef &&
            typeof fileRef.id === 'string' &&
            typeof fileRef.name === 'string' &&
            typeof fileRef.url === 'string'
    }

    /**
     * Get file extension from filename
     */
    static getFileExtension(filename: string): string {
        return filename.split('.').pop()?.toLowerCase() || ''
    }

    /**
     * Check if file is an image
     */
    static isImageFile(fileRef: FileReference): boolean {
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        return imageTypes.includes(fileRef.type)
    }

    /**
     * Check if file is a document
     */
    static isDocumentFile(fileRef: FileReference): boolean {
        const documentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
        return documentTypes.includes(fileRef.type)
    }

    /**
     * Format file size for display
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes'

        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
} 
import { writeFile, readFile, unlink, mkdir, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface FileMetadata {
    id: string
    originalName: string
    fileName: string
    filePath: string
    fileType: string
    fileSize: number
    uploadedAt: string
    uploadedBy?: string
    category: 'images' | 'documents' | 'temp'
    url: string
}

export interface FileUploadResult {
    success: boolean
    file?: FileMetadata
    error?: string
}

export class FileStorageService {
    private uploadsDir: string
    // Removed maxFileSize limit to allow unlimited uploads
    private allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    private allowedDocumentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    constructor() {
        this.uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        // Automatically initialize directory structure on service creation
        this.initializeDirectoryStructure()
    }

    private async initializeDirectoryStructure() {
        try {
            console.log('📁 Initializing file storage directory structure...')

            // Create main uploads directory
            await this.ensureDirectoryExists(this.uploadsDir)

            // Create all required subdirectories
            const subdirectories = ['images', 'documents', 'temp']
            for (const subdir of subdirectories) {
                const subdirPath = path.join(this.uploadsDir, subdir)
                await this.ensureDirectoryExists(subdirPath)
                console.log(`✅ Created directory: ${subdirPath}`)
            }

            // Create .gitkeep files to ensure directories are tracked in git
            for (const subdir of subdirectories) {
                const gitkeepPath = path.join(this.uploadsDir, subdir, '.gitkeep')
                if (!existsSync(gitkeepPath)) {
                    await writeFile(gitkeepPath, '# This file ensures the directory is tracked in git\n')
                    console.log(`✅ Created .gitkeep in: ${subdir}`)
                }
            }

            console.log('✅ File storage directory structure initialized successfully')
        } catch (error) {
            console.error('❌ Error initializing directory structure:', error)
        }
    }

    private generateFileId(): string {
        return crypto.randomBytes(16).toString('hex')
    }

    private getFileExtension(filename: string): string {
        return path.extname(filename).toLowerCase()
    }

    private getCategory(fileType: string): 'images' | 'documents' | 'temp' {
        if (this.allowedImageTypes.includes(fileType)) {
            return 'images'
        }
        if (this.allowedDocumentTypes.includes(fileType)) {
            return 'documents'
        }
        return 'temp'
    }

    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        if (!existsSync(dirPath)) {
            await mkdir(dirPath, { recursive: true })
        }
    }

    private validateFile(file: any): string | null {
        // Removed file size validation to allow unlimited uploads
        const allowedTypes = [...this.allowedImageTypes, ...this.allowedDocumentTypes]
        if (!allowedTypes.includes(file.mimetype)) {
            return `File type ${file.mimetype} is not allowed`
        }

        return null
    }

    async saveFile(file: any, uploadedBy?: string): Promise<FileUploadResult> {
        try {
            console.log(`📁 Saving file: ${file.originalname}, size: ${file.size} bytes, type: ${file.mimetype}`);

            // Ensure directory structure exists before saving
            await this.initializeDirectoryStructure()

            // Validate file
            const validationError = this.validateFile(file)
            if (validationError) {
                console.warn(`⚠️ File validation failed: ${validationError}`);
                return { success: false, error: validationError }
            }

            // Generate unique file ID and determine category
            const fileId = this.generateFileId()
            const category = this.getCategory(file.mimetype)
            const extension = this.getFileExtension(file.originalname)
            const fileName = `${fileId}${extension}`

            console.log(`📂 File will be saved to category: ${category}, filename: ${fileName}`);

            // Create directory path
            const categoryDir = path.join(this.uploadsDir, category)
            await this.ensureDirectoryExists(categoryDir)

            // Save file
            const filePath = path.join(categoryDir, fileName)
            await writeFile(filePath, file.buffer)
            console.log(`💾 File written to disk: ${filePath}`);

            // Create metadata with environment-aware URL
            const fileMetadata: FileMetadata = {
                id: fileId,
                originalName: file.originalname,
                fileName: fileName,
                filePath: filePath,
                fileType: file.mimetype,
                fileSize: file.size,
                uploadedAt: new Date().toISOString(),
                uploadedBy: uploadedBy,
                category: category,
                url: this.getFileUrl(path.join(category, fileName))
            }

            console.log(`✅ File saved successfully: ${file.originalname} -> ${filePath}`);
            return { success: true, file: fileMetadata }
        } catch (error) {
            console.error('❌ Error saving file:', error);
            return { success: false, error: 'Failed to save file' }
        }
    }

    // Save image file directly to public/uploads/images with a fixed base name (e.g., logo, favicon)
    async saveFileToPublicRoot(file: any, baseName: string): Promise<FileUploadResult> {
        try {
            // Ensure directory structure exists before saving (for consistency/logging)
            await this.initializeDirectoryStructure()

            // Validate as image
            if (!this.allowedImageTypes.includes(file.mimetype)) {
                return { success: false, error: `File type ${file.mimetype} is not allowed for public images` }
            }

            // Determine extension from original name (fallback to png)
            let ext = this.getFileExtension(file.originalname)
            if (!ext) {
                ext = '.png'
            }

            const fileName = `${baseName}${ext}`
            const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images')
            await this.ensureDirectoryExists(publicUploadsDir)

            const filePath = path.join(publicUploadsDir, fileName)
            await writeFile(filePath, file.buffer)

            const fileMetadata: FileMetadata = {
                id: baseName,
                originalName: file.originalname,
                fileName: fileName,
                filePath: filePath,
                fileType: file.mimetype,
                fileSize: file.size,
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'admin',
                category: 'images',
                url: this.getFileUrl(path.join('images', fileName))
            }

            console.log(`✅ Public file saved: ${file.originalname} -> ${filePath}`)
            return { success: true, file: fileMetadata }
        } catch (error) {
            console.error('Error saving public file:', error)
            return { success: false, error: 'Failed to save file to public' }
        }
    }

    async saveBase64File(base64Data: string, originalName: string, uploadedBy?: string): Promise<FileUploadResult> {
        try {
            // Extract mime type and data from base64
            const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
            if (!matches) {
                return { success: false, error: 'Invalid base64 data format' }
            }

            const mimeType = matches[1]
            const buffer = Buffer.from(matches[2], 'base64')

            // Create a mock file object
            const mockFile: any = {
                fieldname: 'file',
                originalname: originalName,
                encoding: '7bit',
                mimetype: mimeType,
                size: buffer.length,
                buffer: buffer,
                destination: '',
                filename: '',
                path: ''
            }

            return await this.saveFile(mockFile, uploadedBy)
        } catch (error) {
            console.error('Error saving base64 file:', error)
            return { success: false, error: 'Failed to save base64 file' }
        }
    }

    // Method to get file info by ID
    async getFileById(fileId: string): Promise<FileMetadata | null> {
        try {
            // Search in all categories
            const categories = ['images', 'documents', 'temp']

            for (const category of categories) {
                const categoryDir = path.join(this.uploadsDir, category)
                if (existsSync(categoryDir)) {
                    const files = await readdir(categoryDir)
                    for (const file of files) {
                        if (file.startsWith(fileId)) {
                            const filePath = path.join(categoryDir, file)
                            return await this.getFileInfo(filePath)
                        }
                    }
                }
            }

            return null
        } catch (error) {
            console.error('Error getting file by ID:', error)
            return null
        }
    }

    // Method to list all files
    async listFiles(category?: 'images' | 'documents' | 'temp'): Promise<FileMetadata[]> {
        try {
            const files: FileMetadata[] = []
            const categories = category ? [category] : ['images', 'documents', 'temp']

            for (const cat of categories) {
                const categoryDir = path.join(this.uploadsDir, cat)
                if (existsSync(categoryDir)) {
                    const fileList = await readdir(categoryDir)
                    for (const file of fileList) {
                        const filePath = path.join(categoryDir, file)
                        const fileInfo = await this.getFileInfo(filePath)
                        if (fileInfo) {
                            files.push(fileInfo)
                        }
                    }
                }
            }

            return files
        } catch (error) {
            console.error('Error listing files:', error)
            return []
        }
    }

    async deleteFile(filePath: string): Promise<boolean> {
        try {
            if (existsSync(filePath)) {
                await unlink(filePath)
                return true
            }
            return false
        } catch (error) {
            console.error('Error deleting file:', error)
            return false
        }
    }

    async getFileInfo(filePath: string): Promise<FileMetadata | null> {
        try {
            if (!existsSync(filePath)) {
                return null
            }

            const stats = await readFile(filePath)
            const fileName = path.basename(filePath)
            const category = path.basename(path.dirname(filePath)) as 'images' | 'documents' | 'temp'

            return {
                id: path.parse(fileName).name,
                originalName: fileName,
                fileName: fileName,
                filePath: filePath,
                fileType: 'application/octet-stream', // Default type
                fileSize: stats.length,
                uploadedAt: new Date().toISOString(),
                category: category,
                url: this.getFileUrl(path.join(category, fileName))
            }
        } catch (error) {
            console.error('Error getting file info:', error)
            return null
        }
    }

    getFileUrl(filePath: string): string {
        // In development, serve directly from public/uploads
        // In production, use the API route for better reliability
        if (process.env.NODE_ENV === 'development') {
            return `/uploads/${filePath}`
        } else {
            return `/api/uploads/${filePath}`
        }
    }
}

// Export singleton instance
export const fileStorage = new FileStorageService() 
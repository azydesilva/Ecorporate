import { fileStorage } from './file-storage'
import { fileUploadClient } from './file-upload-client'

export async function testFileStorage() {
    console.log('🧪 Testing file storage system...')

    try {
        // Test 1: Create a test file
        const testData = 'Hello, this is a test file!'
        const testBuffer = Buffer.from(testData, 'utf-8')

        const mockFile: any = {
            fieldname: 'test',
            originalname: 'test.txt',
            encoding: '7bit',
            mimetype: 'text/plain',
            size: testBuffer.length,
            buffer: testBuffer,
            destination: '',
            filename: '',
            path: ''
        }

        // Test server-side file storage
        console.log('📁 Testing server-side file storage...')
        const serverResult = await fileStorage.saveFile(mockFile, 'test-user')

        if (serverResult.success && serverResult.file) {
            console.log('✅ Server-side file storage works')
            console.log('   File saved:', serverResult.file.url)

            // Test file info retrieval
            const fileInfo = await fileStorage.getFileInfo(serverResult.file.filePath)
            if (fileInfo) {
                console.log('✅ File info retrieval works')
            }

            // Test file deletion
            const deleted = await fileStorage.deleteFile(serverResult.file.filePath)
            if (deleted) {
                console.log('✅ File deletion works')
            }
        } else {
            console.log('❌ Server-side file storage failed:', serverResult.error)
        }

        // Test 2: Test base64 file storage
        console.log('📄 Testing base64 file storage...')
        const base64Data = 'data:text/plain;base64,SGVsbG8sIHRoaXMgaXMgYSBiYXNlNjQgdGVzdCBmaWxlIQ=='
        const base64Result = await fileStorage.saveBase64File(base64Data, 'test-base64.txt', 'test-user')

        if (base64Result.success && base64Result.file) {
            console.log('✅ Base64 file storage works')
            console.log('   File saved:', base64Result.file.url)

            // Clean up
            await fileStorage.deleteFile(base64Result.file.filePath)
        } else {
            console.log('❌ Base64 file storage failed:', base64Result.error)
        }

        console.log('🎉 File storage system test completed!')

    } catch (error) {
        console.error('❌ Test failed:', error)
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testFileStorage().catch(console.error)
} 
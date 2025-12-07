import { fileUploadClient } from './file-upload-client'
import { FileMetadata } from './file-storage'

export interface MigrationResult {
    success: boolean
    migratedFiles: number
    errors: string[]
    newFileData: Record<string, FileMetadata>
}

export class FileStorageMigration {
    static async migrateLocalStorageFiles(
        localStorageData: any,
        uploadedBy?: string
    ): Promise<MigrationResult> {
        const result: MigrationResult = {
            success: true,
            migratedFiles: 0,
            errors: [],
            newFileData: {}
        }

        try {
            // Helper function to migrate a single file
            const migrateFile = async (fileData: any, key: string): Promise<void> => {
                if (!fileData || !fileData.data) {
                    return
                }

                try {
                    // Upload the base64 file
                    const uploadResult = await fileUploadClient.uploadBase64File(
                        fileData.data,
                        fileData.name || 'unknown-file',
                        uploadedBy
                    )

                    if (uploadResult.success && uploadResult.file) {
                        result.migratedFiles++
                        result.newFileData[key] = uploadResult.file
                    } else {
                        result.errors.push(`Failed to migrate file ${fileData.name}: ${uploadResult.error}`)
                    }
                } catch (error) {
                    result.errors.push(`Error migrating file ${fileData.name}: ${error}`)
                }
            }

            // Migrate registration documents
            if (localStorageData.registrations) {
                for (const registration of localStorageData.registrations) {
                    // Migrate company documents
                    if (registration.companyDocuments) {
                        for (const [docType, docData] of Object.entries(registration.companyDocuments)) {
                            if (docData && typeof docData === 'object' && 'data' in docData) {
                                await migrateFile(docData, `registration_${registration._id}_company_${docType}`)
                            }
                        }
                    }

                    // Migrate customer documents
                    if (registration.customerDocuments) {
                        for (const [docType, docData] of Object.entries(registration.customerDocuments)) {
                            if (docData && typeof docData === 'object' && 'data' in docData) {
                                await migrateFile(docData, `registration_${registration._id}_customer_${docType}`)
                            }
                        }
                    }

                    // Migrate balance payment receipt
                    if (registration.balancePaymentReceipt && registration.balancePaymentReceipt.data) {
                        await migrateFile(
                            registration.balancePaymentReceipt,
                            `registration_${registration._id}_payment_receipt`
                        )
                    }

                    // Migrate initial payment receipt
                    if (registration.initialPaymentReceipt && registration.initialPaymentReceipt.data) {
                        await migrateFile(
                            registration.initialPaymentReceipt,
                            `registration_${registration._id}_initial_payment`
                        )
                    }
                }
            }

            // Migrate settings (logos, etc.)
            if (localStorageData.settings) {
                const settings = localStorageData.settings
                if (settings.logo && settings.logo.startsWith('data:')) {
                    await migrateFile(
                        { data: settings.logo, name: 'company-logo.png' },
                        'settings_logo'
                    )
                }
                if (settings.favicon && settings.favicon.startsWith('data:')) {
                    await migrateFile(
                        { data: settings.favicon, name: 'favicon.ico' },
                        'settings_favicon'
                    )
                }
            }

            // Migrate admin documents
            if (localStorageData.adminDocuments) {
                for (const [docType, docData] of Object.entries(localStorageData.adminDocuments)) {
                    if (docData && typeof docData === 'object' && 'data' in docData) {
                        await migrateFile(docData, `admin_${docType}`)
                    }
                }
            }

        } catch (error) {
            result.success = false
            result.errors.push(`Migration failed: ${error}`)
        }

        return result
    }

    static async updateLocalStorageWithNewFileData(
        localStorageData: any,
        newFileData: Record<string, FileMetadata>
    ): Promise<any> {
        const updatedData = { ...localStorageData }

        try {
            // Update registration documents - only store file references, not file data
            if (updatedData.registrations) {
                for (const registration of updatedData.registrations) {
                    // Update company documents
                    if (registration.companyDocuments) {
                        for (const [docType, docData] of Object.entries(registration.companyDocuments)) {
                            const key = `registration_${registration._id}_company_${docType}`
                            if (newFileData[key]) {
                                registration.companyDocuments[docType] = {
                                    name: (docData as any)?.name || '',
                                    type: (docData as any)?.type || '',
                                    size: (docData as any)?.size || 0,
                                    url: newFileData[key].url,
                                    id: newFileData[key].id,
                                    uploadedAt: newFileData[key].uploadedAt,
                                    // Remove file data to save space
                                    data: undefined,
                                    filePath: undefined
                                }
                            }
                        }
                    }

                    // Update customer documents
                    if (registration.customerDocuments) {
                        for (const [docType, docData] of Object.entries(registration.customerDocuments)) {
                            const key = `registration_${registration._id}_customer_${docType}`
                            if (newFileData[key]) {
                                registration.customerDocuments[docType] = {
                                    name: (docData as any)?.name || '',
                                    type: (docData as any)?.type || '',
                                    size: (docData as any)?.size || 0,
                                    url: newFileData[key].url,
                                    id: newFileData[key].id,
                                    uploadedAt: newFileData[key].uploadedAt,
                                    signedByCustomer: (docData as any)?.signedByCustomer || false,
                                    submittedAt: (docData as any)?.submittedAt || new Date().toISOString(),
                                    // Remove file data to save space
                                    data: undefined,
                                    filePath: undefined
                                }
                            }
                        }
                    }

                    // Update payment receipts
                    const paymentKey = `registration_${registration._id}_payment_receipt`
                    if (newFileData[paymentKey] && registration.balancePaymentReceipt) {
                        registration.balancePaymentReceipt = {
                            name: registration.balancePaymentReceipt.name || '',
                            type: registration.balancePaymentReceipt.type || '',
                            size: registration.balancePaymentReceipt.size || 0,
                            url: newFileData[paymentKey].url,
                            id: newFileData[paymentKey].id,
                            submittedAt: registration.balancePaymentReceipt.submittedAt || new Date().toISOString(),
                            status: registration.balancePaymentReceipt.status || 'pending',
                            companyName: registration.balancePaymentReceipt.companyName || '',
                            selectedPackage: registration.balancePaymentReceipt.selectedPackage || '',
                            // Remove file data to save space
                            data: undefined,
                            filePath: undefined
                        }
                    }

                    const initialPaymentKey = `registration_${registration._id}_initial_payment`
                    if (newFileData[initialPaymentKey] && registration.initialPaymentReceipt) {
                        registration.initialPaymentReceipt = {
                            name: registration.initialPaymentReceipt.name || '',
                            type: registration.initialPaymentReceipt.type || '',
                            size: registration.initialPaymentReceipt.size || 0,
                            url: newFileData[initialPaymentKey].url,
                            id: newFileData[initialPaymentKey].id,
                            submittedAt: registration.initialPaymentReceipt.submittedAt || new Date().toISOString(),
                            // Remove file data to save space
                            data: undefined,
                            filePath: undefined
                        }
                    }
                }
            }

            // Update settings - only store URLs, not file data
            if (updatedData.settings) {
                if (newFileData.settings_logo) {
                    updatedData.settings.logo = newFileData.settings_logo.url
                }
                if (newFileData.settings_favicon) {
                    updatedData.settings.favicon = newFileData.settings_favicon.url
                }
            }

            // Update admin documents
            if (updatedData.adminDocuments) {
                for (const [docType, docData] of Object.entries(updatedData.adminDocuments)) {
                    const key = `admin_${docType}`
                    if (newFileData[key]) {
                        updatedData.adminDocuments[docType] = {
                            name: (docData as any)?.name || '',
                            type: (docData as any)?.type || '',
                            size: (docData as any)?.size || 0,
                            url: newFileData[key].url,
                            id: newFileData[key].id,
                            uploadedAt: newFileData[key].uploadedAt,
                            // Remove file data to save space
                            data: undefined,
                            filePath: undefined
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error updating localStorage data:', error)
        }

        return updatedData
    }
} 
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2, Download, ArrowLeft, LogOut, FileText, Eye, Upload, Plus, X, RefreshCw, Trash2, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { LocalStorageService } from "@/lib/database-service"
import AccessSharingDialog from "@/components/admin/AccessSharingDialog"
import { fileUploadClient } from "@/lib/file-upload-client"

type IncorporationCertificatePageProps = {
  companyId: string
  navigateTo: (page: string) => void
  onLogout: () => void
}

export default function IncorporationCertificatePage({
  companyId,
  navigateTo,
  onLogout,
}: IncorporationCertificatePageProps) {
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<any>(null)
  const [showMoreDetails, setShowMoreDetails] = useState(false)

  // New state variables for corporate records
  const [resolutionsDialogOpen, setResolutionsDialogOpen] = useState(false)
  const [resolutionTitle, setResolutionTitle] = useState("")
  const [resolutionDescription, setResolutionDescription] = useState("")
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [isSignRequired, setIsSignRequired] = useState(true) // Default to signature required
  // Access sharing dialog state
  const [isAccessSharingDialogOpen, setIsAccessSharingDialogOpen] = useState(false)
  // Filter toggle for submitted corporate records view
  const [corporateRecordsView, setCorporateRecordsView] = useState<'customer' | 'admin'>('customer')

  // Customer signed resolution upload state
  const [customerSignedResolutionFile, setCustomerSignedResolutionFile] = useState<File | null>(null)
  const [currentCustomerResolutionIndex, setCurrentCustomerResolutionIndex] = useState<number | null>(null)
  const [uploadingCustomerSignedResolution, setUploadingCustomerSignedResolution] = useState(false)

  useEffect(() => {
    // Load company data from database
    const loadCompanyData = async () => {
      try {
        console.log('🔍 Loading company data for customer view:', companyId)
        const registration = await LocalStorageService.getRegistrationById(companyId)
        if (registration) {
          // Check if the company card is expired
          const isExpired = registration.isExpired || (registration.expireDate && new Date(registration.expireDate) < new Date());

          if (isExpired) {
            alert('This company card has expired. Please contact admin for renewal.');
            navigateTo('customerDashboard');
            return;
          }

          console.log('✅ Company data loaded from database:', registration)
          console.log('📄 Incorporation Certificate:', registration.incorporationCertificate)
          console.log('📁 Step 4 Additional Documents:', registration.step4FinalAdditionalDoc)
          setCompany(registration)
        } else {
          console.log('⚠️ Company not found in database, trying localStorage fallback')
          // Fallback to localStorage
          const savedRegistrations = localStorage.getItem("registrations")
          if (savedRegistrations) {
            const registrations = JSON.parse(savedRegistrations)
            const fallbackRegistration = registrations.find((reg: any) => reg._id === companyId)
            if (fallbackRegistration) {
              console.log('✅ Company found in localStorage fallback')
              console.log('📄 Incorporation Certificate (fallback):', fallbackRegistration.incorporationCertificate)
              console.log('📁 Step 4 Additional Documents (fallback):', fallbackRegistration.step4FinalAdditionalDoc)
              setCompany(fallbackRegistration)
            } else {
              setCompany(null)
            }
          } else {
            setCompany(null)
          }
        }
      } catch (error) {
        console.error('❌ Error loading company data:', error)
        setCompany(null)
      } finally {
        setLoading(false)
      }
    }

    loadCompanyData()

    // Listen for registration updates (when admin submits documents)
    const handleRegistrationUpdate = async (event: any) => {
      if (event.detail?.companyId === companyId) {
        console.log('🔄 Registration update received, reloading data...')
        await loadCompanyData()
      }
    }

    window.addEventListener("registration-updated", handleRegistrationUpdate)

    return () => {
      window.removeEventListener("registration-updated", handleRegistrationUpdate)
    }
  }, [companyId])

  const handleViewDocument = (document: any) => {
    setViewingDocument(document)
    setViewDialogOpen(true)
  }

  // Handle file selection for corporate records
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setResolutionFiles(prev => [...prev, ...files])
    }
  }

  // Remove a selected file
  const removeFile = (index: number) => {
    setResolutionFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Handle form submission for corporate records
  const handleSubmitResolutions = async () => {
    if (!resolutionTitle.trim()) {
      setUploadError("Please enter a title for the board resolution")
      return
    }

    if (resolutionFiles.length === 0) {
      setUploadError("Please select at least one document to upload")
      return
    }

    setUploading(true)
    setUploadError("")

    try {
      // Upload files to file storage
      const uploadedFiles = []
      for (const file of resolutionFiles) {
        const uploadResult = await fileUploadClient.uploadFile(file, `resolutions_${companyId}`)

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload file")
        }

        uploadedFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          url: uploadResult.file?.url,
          id: uploadResult.file?.id,
          uploadedAt: uploadResult.file?.uploadedAt
        })
      }

      // Prepare the resolutions data
      const resolutionData = {
        title: resolutionTitle,
        description: resolutionDescription,
        documents: uploadedFiles,
        signRequired: isSignRequired, // Add the signature required flag
        uploadedAt: new Date().toISOString()
      }

      // Get current resolutions from company data
      const currentResolutions = company.resolutions_docs || []

      // Add new resolution to the list
      const updatedResolutions = [...currentResolutions, resolutionData]

      // Update company data in the database
      const updatedCompany = {
        ...company,
        resolutions_docs: updatedResolutions
      }

      // Save to database
      const response = await fetch(`/api/registrations/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCompany)
      })

      if (!response.ok) {
        throw new Error('Failed to save corporate records')
      }

      // Update local state
      setCompany(updatedCompany)

      // Dispatch event to notify admin UI
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            companyId: companyId,
            type: "board-resolutions-submitted"
          }
        })
      )

      // Reset form
      setResolutionTitle("")
      setResolutionDescription("")
      setResolutionFiles([])
      setIsSignRequired(true) // Reset to default
      setResolutionsDialogOpen(false)

      // Show success message (you might want to add a toast notification here)
      console.log("Corporate records submitted successfully")
    } catch (error) {
      console.error("Error submitting corporate records:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to submit corporate records")
    } finally {
      setUploading(false)
    }
  }

  // Handle delete corporate record (UI only)
  const handleDeleteCorporateRecord = async (resolutionIndex: number) => {
    if (!window.confirm("Are you sure you want to delete this corporate record? This action cannot be undone.")) {
      return
    }

    try {
      // Get current resolutions
      const currentResolutions = company.resolutions_docs || []

      if (resolutionIndex < 0 || resolutionIndex >= currentResolutions.length) {
        alert("Record not found.")
        return
      }

      const resolutionToDelete = currentResolutions[resolutionIndex]

      // Delete files from file storage
      console.log('🗑️ Deleting files from file storage...')
      try {
        const { fileUploadClient } = await import('@/lib/file-upload-client')

        if (Array.isArray(resolutionToDelete.documents)) {
          for (const doc of resolutionToDelete.documents) {
            if (doc?.id) {
              const deleteResult = await fileUploadClient.deleteFileById(doc.id)
              if (deleteResult.success) {
                console.log(`✅ File deleted from storage: ${doc.name}`)
              } else {
                console.warn(`⚠️ Failed to delete file from storage: ${doc.name}`, deleteResult.error)
              }
            } else if (doc?.filePath) {
              const deleteResult = await fileUploadClient.deleteFile(doc.filePath)
              if (deleteResult.success) {
                console.log(`✅ File deleted from storage: ${doc.name}`)
              } else {
                console.warn(`⚠️ Failed to delete file from storage: ${doc.name}`, deleteResult.error)
              }
            }
          }
        }

        if (Array.isArray(resolutionToDelete.signedDocuments)) {
          for (const doc of resolutionToDelete.signedDocuments) {
            if (doc?.id) {
              const deleteResult = await fileUploadClient.deleteFileById(doc.id)
              if (deleteResult.success) {
                console.log(`✅ Signed file deleted from storage: ${doc.name}`)
              } else {
                console.warn(`⚠️ Failed to delete signed file from storage: ${doc.name}`, deleteResult.error)
              }
            } else if (doc?.filePath) {
              const deleteResult = await fileUploadClient.deleteFile(doc.filePath)
              if (deleteResult.success) {
                console.log(`✅ Signed file deleted from storage: ${doc.name}`)
              } else {
                console.warn(`⚠️ Failed to delete signed file from storage: ${doc.name}`, deleteResult.error)
              }
            }
          }
        }
      } catch (fileError) {
        console.warn('⚠️ Error deleting files from storage:', fileError)
        // Continue with database deletion even if file deletion fails
      }

      // Remove the resolution at the specified index
      const updatedResolutions = currentResolutions.filter((_: any, index: number) => index !== resolutionIndex)

      // Update company data in the database
      const updatedCompany = {
        ...company,
        resolutions_docs: updatedResolutions
      }

      // Save to database
      const response = await fetch(`/api/registrations/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCompany)
      })

      if (!response.ok) {
        throw new Error('Failed to delete corporate record')
      }

      // Update local state
      setCompany(updatedCompany)

      // Dispatch event to notify admin UI
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            companyId: companyId,
            type: "corporate-record-deleted"
          }
        })
      )

      console.log("Corporate record deleted successfully")
    } catch (error) {
      console.error("Error deleting corporate record:", error)
      alert("Failed to delete corporate record. Please try again.")
    }
  }

  // Handle customer signed resolution file change
  const handleCustomerSignedResolutionFileChange = (event: React.ChangeEvent<HTMLInputElement>, resolutionIndex: number) => {
    const file = event.target.files?.[0];
    if (file) {
      setCustomerSignedResolutionFile(file);
      setCurrentCustomerResolutionIndex(resolutionIndex);
    }
  }

  // Handle customer signed resolution submission
  const handleSubmitCustomerSignedResolution = async (resolutionIndex: number) => {
    if (!customerSignedResolutionFile || !companyId) {
      console.error('❌ Missing file or company ID');
      return;
    }

    setUploadingCustomerSignedResolution(true);

    try {
      // Upload file to file storage
      const { fileUploadClient } = await import('@/lib/file-upload-client')
      const uploadResult = await fileUploadClient.uploadFile(customerSignedResolutionFile, `customer_signed_resolution_${companyId}`)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload file")
      }

      const uploadedFile = {
        name: customerSignedResolutionFile.name,
        type: customerSignedResolutionFile.type,
        size: customerSignedResolutionFile.size,
        url: uploadResult.file?.url,
        filePath: uploadResult.file?.filePath,
        id: uploadResult.file?.id,
        uploadedAt: uploadResult.file?.uploadedAt,
        uploadedBy: "customer",
        signedByCustomer: true,
        submittedAt: new Date().toISOString()
      }

      // Get current admin resolutions
      const currentAdminResolutions = company.admin_resolution_doc || []

      // Find the resolution to update
      if (resolutionIndex < 0 || resolutionIndex >= currentAdminResolutions.length) {
        throw new Error('Resolution not found')
      }

      // Update the specific resolution with the signed document
      const updatedAdminResolutions = [...currentAdminResolutions]
      updatedAdminResolutions[resolutionIndex] = {
        ...updatedAdminResolutions[resolutionIndex],
        signedDocuments: [...(updatedAdminResolutions[resolutionIndex].signedDocuments || []), uploadedFile]
      }

      // Update company data in the database
      const updatedCompany = {
        ...company,
        admin_resolution_doc: updatedAdminResolutions
      }

      // Save to database
      const response = await fetch(`/api/registrations/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCompany)
      })

      if (!response.ok) {
        throw new Error('Failed to save signed resolution')
      }

      // Update local state
      setCompany(updatedCompany)
      setCustomerSignedResolutionFile(null)
      setCurrentCustomerResolutionIndex(null)

      // Dispatch event to notify admin UI
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            companyId: companyId,
            type: "customer-signed-resolution-submitted"
          }
        })
      )

      console.log("✅ Customer signed resolution submitted successfully")
    } catch (error) {
      console.error("❌ Error submitting customer signed resolution:", error)
      alert("Failed to upload signed document. Please try again.")
    } finally {
      setUploadingCustomerSignedResolution(false)
    }
  }

  // Handle customer signed document deletion from specific resolution
  const handleDeleteCustomerSignedDocument = async (resolutionIndex: number, documentIndex: number) => {
    if (!window.confirm("Are you sure you want to delete this signed document? This action cannot be undone.")) {
      return
    }

    try {
      // Get current admin resolutions
      const currentAdminResolutions = company.admin_resolution_doc || []

      if (resolutionIndex < 0 || resolutionIndex >= currentAdminResolutions.length) {
        alert("Resolution not found.")
        return
      }

      const currentResolution = currentAdminResolutions[resolutionIndex]
      const currentSignedDocuments = currentResolution.signedDocuments || []

      if (documentIndex < 0 || documentIndex >= currentSignedDocuments.length) {
        alert("Signed document not found.")
        return
      }

      const documentToDelete = currentSignedDocuments[documentIndex]

      // Delete file from file storage
      console.log('🗑️ Deleting signed document from file storage...')
      try {
        const { fileUploadClient } = await import('@/lib/file-upload-client')

        if (documentToDelete.id) {
          const deleteResult = await fileUploadClient.deleteFileById(documentToDelete.id)
          if (deleteResult.success) {
            console.log(`✅ Signed document file deleted from storage: ${documentToDelete.name}`)
          } else {
            console.warn(`⚠️ Failed to delete signed document file from storage: ${documentToDelete.name}`, deleteResult.error)
          }
        } else if (documentToDelete.filePath) {
          const deleteResult = await fileUploadClient.deleteFile(documentToDelete.filePath)
          if (deleteResult.success) {
            console.log(`✅ Signed document file deleted from storage: ${documentToDelete.name}`)
          } else {
            console.warn(`⚠️ Failed to delete signed document file from storage: ${documentToDelete.name}`, deleteResult.error)
          }
        }
      } catch (fileError) {
        console.warn('⚠️ Error deleting signed document file from storage:', fileError)
        // Continue with database deletion even if file deletion fails
      }

      // Remove document from signed documents array
      const updatedSignedDocuments = currentSignedDocuments.filter((_: any, index: number) => index !== documentIndex)

      // Update the specific resolution
      const updatedAdminResolutions = [...currentAdminResolutions]
      updatedAdminResolutions[resolutionIndex] = {
        ...currentResolution,
        signedDocuments: updatedSignedDocuments
      }

      // Update company data in the database
      const updatedCompany = {
        ...company,
        admin_resolution_doc: updatedAdminResolutions
      }

      // Save to database
      const response = await fetch(`/api/registrations/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCompany)
      })

      if (!response.ok) {
        throw new Error('Failed to delete signed document')
      }

      // Update local state
      setCompany((prev: any) => {
        const updated = {
          ...prev,
          admin_resolution_doc: updatedAdminResolutions
        };
        return updated;
      });

      // Dispatch event to notify admin UI
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            companyId: companyId,
            type: "customer-signed-document-deleted"
          }
        })
      )

      console.log("Customer signed document deleted successfully")
    } catch (error) {
      console.error("Error deleting customer signed document:", error)
      alert("Failed to delete signed document. Please try again.")
    }
  }

  // Handle customer signed resolution deletion (re-added)
  const handleDeleteCustomerSignedResolution = async () => {
    if (!window.confirm("Are you sure you want to delete your signed document? This action cannot be undone.")) {
      return
    }

    try {
      // Delete file from file storage if it exists
      if (company.signed_customer_resolution?.id) {
        const { fileUploadClient } = await import('@/lib/file-upload-client')
        const deleteResult = fileUploadClient.deleteFileById
          ? await fileUploadClient.deleteFileById(company.signed_customer_resolution.id)
          : await fileUploadClient.deleteFile(company.signed_customer_resolution.id)
        if (!deleteResult?.success) {
          console.warn('Failed to delete file from storage:', deleteResult?.error)
        }
      } else if (company.signed_customer_resolution?.filePath) {
        const { fileUploadClient } = await import('@/lib/file-upload-client')
        const deleteResult = await fileUploadClient.deleteFile(company.signed_customer_resolution.filePath)
        if (!deleteResult?.success) {
          console.warn('Failed to delete file from storage:', deleteResult?.error)
        }
      }

      // Update company data in the database
      const updatedCompany = {
        ...company,
        signed_customer_resolution: null
      }

      // Save to database
      const response = await fetch(`/api/registrations/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCompany)
      })

      if (!response.ok) {
        throw new Error('Failed to delete signed resolution')
      }

      // Update local state
      setCompany(updatedCompany)

      // Dispatch event to notify admin UI
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            companyId: companyId,
            type: "customer-signed-resolution-deleted"
          }
        })
      )

      console.log("Customer signed resolution deleted successfully")
    } catch (error) {
      console.error("Error deleting customer signed resolution:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to delete signed resolution")
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!company) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">Company not found</p>
          <Button onClick={() => navigateTo("customerDashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateTo("customerDashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Company Documents</h1>
        </div>
        <div>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => setIsAccessSharingDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Access
          </Button>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Company Details Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Company Details Summary</CardTitle>
            <CardDescription>Review your company registration information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Name and Business Address on same line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Company Name</h3>
                <p className="text-sm">
                  {company.companyNameEnglish || company.companyName || "Not provided"}
                </p>
              </div>

              {(company.businessAddressNumber || company.businessAddressStreet || company.businessAddressCity) && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Business Address</h3>
                  <p className="text-sm">
                    {[company.businessAddressNumber, company.businessAddressStreet, company.businessAddressCity]
                      .filter(Boolean)
                      .join(", ") || "Not provided"}
                  </p>
                </div>
              )}
            </div>

            {/* Directors and Shareholders on same line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Directors */}
              {company.directors && company.directors.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Directors</h3>
                  <div className="grid grid-cols-1 gap-1">
                    {company.directors.map((director: any, index: number) => (
                      <p key={index} className="text-sm">
                        {director.fullName || `Director ${index + 1}`}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Shareholders */}
              {company.shareholders && company.shareholders.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Shareholders</h3>
                  <div className="grid grid-cols-1 gap-1">
                    {company.shareholders.map((shareholder: any, index: number) => (
                      <p key={index} className="text-sm">
                        {shareholder.fullName || `Shareholder ${index + 1}`}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Show More Button */}
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="w-full sm:w-auto"
              >
                {showMoreDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More Details
                  </>
                )}
              </Button>
            </div>

            {/* Expanded Details Section */}
            {showMoreDetails && (
              <div className="mt-6 pt-6 border-t space-y-4">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-800">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.companyNameSinhala && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Company Name (Sinhala)</h4>
                        <p className="text-sm">{company.companyNameSinhala}</p>
                      </div>
                    )}
                    {company.companyNameTamil && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Company Name (Tamil)</h4>
                        <p className="text-sm">{company.companyNameTamil}</p>
                      </div>
                    )}
                    {company.companyEntity && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Company Entity</h4>
                        <p className="text-sm">{company.companyEntity}</p>
                      </div>
                    )}
                    {company.businessObjectives && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Business Objectives</h4>
                        <p className="text-sm break-words">{company.businessObjectives}</p>
                      </div>
                    )}
                    {company.sharePrice && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Outstanding Shares</h4>
                        <p className="text-sm">{company.sharePrice}</p>
                      </div>
                    )}
                    {company.companyActivities && (
                      <div className="space-y-1 md:col-span-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Company Activities</h4>
                        <p className="text-sm break-words">{company.companyActivities}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-800">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.businessAddressNumber && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Street Number</h4>
                        <p className="text-sm">{company.businessAddressNumber}</p>
                      </div>
                    )}
                    {company.businessAddressStreet && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Street Name</h4>
                        <p className="text-sm">{company.businessAddressStreet}</p>
                      </div>
                    )}
                    {company.businessAddressCity && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">City</h4>
                        <p className="text-sm">{company.businessAddressCity}</p>
                      </div>
                    )}
                    {company.businessAddressPostalCode && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Postal Code</h4>
                        <p className="text-sm">{company.businessAddressPostalCode}</p>
                      </div>
                    )}
                    {company.province && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Province</h4>
                        <p className="text-sm">{company.province}</p>
                      </div>
                    )}
                    {company.district && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">District</h4>
                        <p className="text-sm">{company.district}</p>
                      </div>
                    )}
                    {company.divisionalSecretariat && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Divisional Secretariat</h4>
                        <p className="text-sm">{company.divisionalSecretariat}</p>
                      </div>
                    )}
                    {company.gramaNiladhari && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Grama Niladhari Division</h4>
                        <p className="text-sm">{company.gramaNiladhari}</p>
                      </div>
                    )}
                    {company.registeredAddress && (
                      <div className="space-y-1 md:col-span-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Registered Address</h4>
                        <p className="text-sm break-words">{company.registeredAddress}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-800">Company Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.businessEmail && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Company Email</h4>
                        <p className="text-sm">{company.businessEmail}</p>
                      </div>
                    )}
                    {company.businessContactNumber && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Company Contact Number</h4>
                        <p className="text-sm">{company.businessContactNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Directors Information */}
                {company.directors && company.directors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-gray-800">Directors Details</h3>
                    <div className="space-y-4">
                      {company.directors.map((director: any, index: number) => (
                        <div key={index} className="p-3 border rounded-md bg-gray-50">
                          <h4 className="font-medium text-sm mb-2">{director.fullName || `Director ${index + 1}`}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {director.nicNumber && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">NIC Number:</span>
                                <p>{director.nicNumber}</p>
                              </div>
                            )}
                            {director.dateOfBirth && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Date of Birth:</span>
                                <p>{new Date(director.dateOfBirth).toLocaleDateString()}</p>
                              </div>
                            )}
                            {director.address && (
                              <div className="md:col-span-2">
                                <span className="text-xs font-medium text-muted-foreground">Address:</span>
                                <p>{director.address}</p>
                              </div>
                            )}
                            {director.occupation && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Occupation:</span>
                                <p>{director.occupation}</p>
                              </div>
                            )}
                            {director.contactNumber && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Contact Number:</span>
                                <p>{director.contactNumber}</p>
                              </div>
                            )}
                            {director.emailAddress && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Email:</span>
                                <p>{director.emailAddress}</p>
                              </div>
                            )}
                            
                            {/* Director Address Information */}
                            {(director.fullAddress || director.localPostalCode || director.province || director.district || director.divisionalSecretariat || director.foreignAddress || director.city || director.stateRegionProvince || director.foreignPostalCode) && (
                              <div className="md:col-span-2 mt-2 pt-2 border-t">
                                <h5 className="text-xs font-medium text-muted-foreground mb-1">Address Information:</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                  {director.fullAddress && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Full Address:</span>
                                      <p>{director.fullAddress}</p>
                                    </div>
                                  )}
                                  {director.localPostalCode && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Postal Code:</span>
                                      <p>{director.localPostalCode}</p>
                                    </div>
                                  )}
                                  {director.province && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Province:</span>
                                      <p>{director.province}</p>
                                    </div>
                                  )}
                                  {director.district && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">District:</span>
                                      <p>{director.district}</p>
                                    </div>
                                  )}
                                  {director.divisionalSecretariat && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Divisional Secretariat:</span>
                                      <p>{director.divisionalSecretariat}</p>
                                    </div>
                                  )}
                                  {director.foreignAddress && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Foreign Address:</span>
                                      <p>{director.foreignAddress}</p>
                                    </div>
                                  )}
                                  {director.city && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">City:</span>
                                      <p>{director.city}</p>
                                    </div>
                                  )}
                                  {director.stateRegionProvince && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">State/Region/Province:</span>
                                      <p>{director.stateRegionProvince}</p>
                                    </div>
                                  )}
                                  {director.foreignPostalCode && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Foreign Postal Code:</span>
                                      <p>{director.foreignPostalCode}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shareholders Information */}
                {company.shareholders && company.shareholders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-gray-800">Shareholders Details</h3>
                    <div className="space-y-4">
                      {company.shareholders.map((shareholder: any, index: number) => (
                        <div key={index} className="p-3 border rounded-md bg-gray-50">
                          <h4 className="font-medium text-sm mb-2">
                            {shareholder.type === "legal-entity" 
                              ? (shareholder.companyName || `Legal Entity ${index + 1}`)
                              : (shareholder.fullName || `Shareholder ${index + 1}`)}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {shareholder.type && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Type:</span>
                                <p>{shareholder.type === "legal-entity" ? "Legal Entity" : "Natural Person"}</p>
                              </div>
                            )}
                            {shareholder.residency && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Residency:</span>
                                <p>{shareholder.residency === "sri-lankan" ? "Sri Lankan" : "Foreign"}</p>
                              </div>
                            )}
                            {shareholder.entityType && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Entity Type:</span>
                                <p>{shareholder.entityType}</p>
                              </div>
                            )}
                            {shareholder.nicNumber && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">NIC Number:</span>
                                <p>{shareholder.nicNumber}</p>
                              </div>
                            )}
                            {shareholder.registrationNumber && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Registration Number:</span>
                                <p>{shareholder.registrationNumber}</p>
                              </div>
                            )}
                            {shareholder.sharePercentage && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Share Percentage:</span>
                                <p>{shareholder.sharePercentage}%</p>
                              </div>
                            )}
                            {shareholder.shares && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Shares:</span>
                                <p>{shareholder.shares}</p>
                              </div>
                            )}
                            {shareholder.email && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Email:</span>
                                <p>{shareholder.email}</p>
                              </div>
                            )}
                            {shareholder.contactNumber && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Contact Number:</span>
                                <p>{shareholder.contactNumber}</p>
                              </div>
                            )}
                            {shareholder.isDirector !== undefined && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Is Director:</span>
                                <p>{shareholder.isDirector ? "Yes" : "No"}</p>
                              </div>
                            )}
                            
                            {/* Shareholder Address Information */}
                            {(shareholder.fullAddress || shareholder.postalCode || shareholder.province || shareholder.district || shareholder.divisionalSecretariat || shareholder.city || shareholder.stateRegionProvince || shareholder.foreignAddress) && (
                              <div className="md:col-span-2 mt-2 pt-2 border-t">
                                <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                  {shareholder.type === "legal-entity" 
                                    ? "Legal Entity Address Information" 
                                    : (shareholder.residency === "foreign" 
                                      ? "Foreign Shareholder Address Information" 
                                      : "Shareholder Address Information")}
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                  {shareholder.fullAddress && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Full Address:</span>
                                      <p>{shareholder.fullAddress}</p>
                                    </div>
                                  )}
                                  {shareholder.postalCode && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Postal Code:</span>
                                      <p>{shareholder.postalCode}</p>
                                    </div>
                                  )}
                                  {shareholder.province && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Province:</span>
                                      <p>{shareholder.province}</p>
                                    </div>
                                  )}
                                  {shareholder.district && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">District:</span>
                                      <p>{shareholder.district}</p>
                                    </div>
                                  )}
                                  {shareholder.divisionalSecretariat && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Divisional Secretariat:</span>
                                      <p>{shareholder.divisionalSecretariat}</p>
                                    </div>
                                  )}
                                  {shareholder.city && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">City:</span>
                                      <p>{shareholder.city}</p>
                                    </div>
                                  )}
                                  {shareholder.stateRegionProvince && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">State/Region/Province:</span>
                                      <p>{shareholder.stateRegionProvince}</p>
                                    </div>
                                  )}
                                  {shareholder.foreignAddress && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Foreign Address:</span>
                                      <p>{shareholder.foreignAddress}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Beneficiary Owners if available */}
                            {shareholder.beneficiaryOwners && shareholder.beneficiaryOwners.length > 0 && (
                              <div className="md:col-span-2 mt-2 pt-2 border-t">
                                <h5 className="text-xs font-medium text-muted-foreground mb-2">Beneficiary Owner(s):</h5>
                                <div className="space-y-2">
                                  {shareholder.beneficiaryOwners.map((beneficiary: any, bIndex: number) => (
                                    <div key={bIndex} className="text-xs p-2 bg-white rounded border border-gray-200">
                                      <p className="font-medium">
                                        {beneficiary.firstName} {beneficiary.lastName}
                                      </p>
                                      {beneficiary.type === "local" ? (
                                        <>
                                          {beneficiary.nicNumber && <p>NIC: {beneficiary.nicNumber}</p>}
                                          {beneficiary.address && <p>Address: {beneficiary.address}</p>}
                                          {beneficiary.contactNumber && <p>Contact: {beneficiary.contactNumber}</p>}
                                          {beneficiary.emailAddress && <p>Email: {beneficiary.emailAddress}</p>}
                                          {beneficiary.province && <p>Province: {beneficiary.province}</p>}
                                          {beneficiary.district && <p>District: {beneficiary.district}</p>}
                                          {beneficiary.divisionalSecretariat && <p>Divisional Secretariat: {beneficiary.divisionalSecretariat}</p>}
                                          {beneficiary.postalCode && <p>Postal Code: {beneficiary.postalCode}</p>}
                                        </>
                                      ) : (
                                        <>
                                          {beneficiary.passportNo && <p>Passport: {beneficiary.passportNo}</p>}
                                          {beneficiary.country && <p>Country: {beneficiary.country}</p>}
                                          {beneficiary.foreignAddress && <p>Address: {beneficiary.foreignAddress}</p>}
                                          {beneficiary.city && <p>City: {beneficiary.city}</p>}
                                          {beneficiary.stateRegionProvince && <p>State/Region: {beneficiary.stateRegionProvince}</p>}
                                          {beneficiary.postalCode && <p>Postal Code: {beneficiary.postalCode}</p>}
                                          {beneficiary.contactNumber && <p>Contact: {beneficiary.contactNumber}</p>}
                                          {beneficiary.emailAddress && <p>Email: {beneficiary.emailAddress}</p>}
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="text-xl font-semibold">Company Registration Complete</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Your company {company.companyNameEnglish}
              {(company.companyEntity || company.company_entity) ? ` (${company.companyEntity || company.company_entity})` : ''} has been successfully registered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700 text-sm">Incorporation has been approved by the Registrar of Companies.</AlertTitle>
              <AlertDescription className="text-green-700 text-sm">
                Certificate of Incorporation Issued – Company Registration Officially Completed under the Companies Act, No. 07 of 2007
              </AlertDescription>
            </Alert>


          </CardContent>
        </Card>

        {/* Modern Incorporation Certificate & Documents Card */}
        <Card className="w-full border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-3 text-center px-3 sm:px-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 text-center">Incorporation Certificate & Documents</CardTitle>
              <CardDescription className="text-xs text-muted-foreground text-center mt-1 px-2">
                Access your official documents
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 space-y-4">
            {/* Incorporation Certificate Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="flex items-start sm:items-center justify-between mb-3 gap-2">
                <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">Incorporation Certificate</h4>
                    <p className="text-xs text-muted-foreground">Official registration document</p>
                  </div>
                </div>
                {company.incorporationCertificate && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium hidden sm:inline">Available</span>
                  </div>
                )}
              </div>

              {company.incorporationCertificate ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 break-words sm:truncate text-sm leading-tight">{company.incorporationCertificate.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                        {company.incorporationCertificate.size && typeof company.incorporationCertificate.size === 'number'
                          ? `${(company.incorporationCertificate.size / 1024).toFixed(1)} KB`
                          : "Document"}
                      </p>
                      {/* Display upload timestamp if available */}
                      {company.incorporationCertificate.uploadedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploaded: {new Date(company.incorporationCertificate.uploadedAt).toLocaleDateString()} at {new Date(company.incorporationCertificate.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      size="default"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                      onClick={() => handleViewDocument(company.incorporationCertificate)}
                    >
                      <Eye className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> View
                    </Button>
                    <Button
                      size="default"
                      className="bg-primary hover:bg-primary/90 text-white flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                      onClick={() => {
                        if (company.incorporationCertificate.url) {
                          const link = window.document.createElement("a")
                          link.href = company.incorporationCertificate.url
                          link.download = company.incorporationCertificate.name
                          window.document.body.appendChild(link)
                          link.click()
                          window.document.body.removeChild(link)
                        }
                      }}
                    >
                      <Download className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border border-dashed border-gray-200 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">Certificate not available yet</p>
                  <p className="text-xs">Our team is processing your incorporation certificate</p>
                </div>
              )}
            </div>

            {/* Step 4 Additional Documents Section */}
            {company.step4FinalAdditionalDoc && company.step4FinalAdditionalDoc.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                <div className="flex items-start sm:items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">Step 4 Additional Documents</h4>
                    <p className="text-xs text-muted-foreground">Additional documents provided by the administrator</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {company.step4FinalAdditionalDoc.map((doc: any, index: number) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 break-words sm:truncate text-sm leading-tight" title={doc.title || doc.name}>
                            {doc.title || doc.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 sm:mt-0 break-words sm:truncate">
                            {doc.size && typeof doc.size === 'number' ? `${(doc.size / 1024).toFixed(1)} KB` : "Document"} • {doc.type || "File"}
                          </p>
                          {/* Display upload timestamp if available */}
                          {doc.uploadedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()} at {new Date(doc.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          size="default"
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> View
                        </Button>
                        <Button
                          size="default"
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                          onClick={() => {
                            if (doc.url) {
                              const link = window.document.createElement("a")
                              link.href = doc.url
                              link.download = doc.name
                              window.document.body.appendChild(link)
                              link.click()
                              window.document.body.removeChild(link)
                            } else if (doc.data) {
                              const blob = new Blob([doc.data], { type: doc.type || "application/octet-stream" })
                              const url = URL.createObjectURL(blob)
                              const link = window.document.createElement("a")
                              link.href = url
                              link.download = doc.name
                              window.document.body.appendChild(link)
                              link.click()
                              window.document.body.removeChild(link)
                              URL.revokeObjectURL(url)
                            }
                          }}
                        >
                          <Download className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Step 4 Additional Documents Message */}
            {(!company.step4FinalAdditionalDoc || company.step4FinalAdditionalDoc.length === 0) && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                <div className="flex items-start sm:items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">Step 4 Additional Documents</h4>
                    <p className="text-xs text-muted-foreground">Additional documents provided by the administrator</p>
                  </div>
                </div>

                <div className="text-center py-3 sm:py-4 text-muted-foreground border border-dashed border-gray-200 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">No additional documents</p>
                  <p className="text-xs px-2">Additional documents will appear here when available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {viewingDocument?.title || viewingDocument?.name || "Document Viewer"}
              </DialogTitle>
              <DialogDescription>
                {viewingDocument?.type || "Document"} • {viewingDocument?.size && typeof viewingDocument.size === 'number' ? `${(viewingDocument.size / 1024).toFixed(1)} KB` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {viewingDocument && (
                <div className="border rounded-md p-2 bg-muted/20">
                  {viewingDocument.type?.startsWith("image/") ? (
                    <img
                      src={viewingDocument.url || (viewingDocument.data ? URL.createObjectURL(new Blob([viewingDocument.data], { type: viewingDocument.type })) : "/placeholder.svg")}
                      alt={viewingDocument.name}
                      className="max-w-full h-auto mx-auto"
                      style={{ maxHeight: "60vh" }}
                    />
                  ) : viewingDocument.type === "application/pdf" ? (
                    <div className="aspect-video">
                      <iframe
                        src={viewingDocument.url || (viewingDocument.data ? URL.createObjectURL(new Blob([viewingDocument.data], { type: viewingDocument.type })) : "")}
                        className="w-full h-full"
                        title="PDF Viewer"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">This file type cannot be previewed in the browser.</p>
                      <Button
                        onClick={() => {
                          if (viewingDocument.url) {
                            const link = window.document.createElement("a")
                            link.href = viewingDocument.url
                            link.download = viewingDocument.name
                            window.document.body.appendChild(link)
                            link.click()
                            window.document.body.removeChild(link)
                          } else if (viewingDocument.data) {
                            const blob = new Blob([viewingDocument.data], { type: viewingDocument.type || "application/octet-stream" })
                            const url = URL.createObjectURL(blob)
                            const link = window.document.createElement("a")
                            link.href = url
                            link.download = viewingDocument.name
                            window.document.body.appendChild(link)
                            link.click()
                            window.document.body.removeChild(link)
                            URL.revokeObjectURL(url)
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" /> Download to View
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Submit Corporate Records Card */}
        <Card className="w-full border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-3 text-center px-3 sm:px-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 text-center">Secretary Records Exchange</CardTitle>
              <CardDescription className="text-xs text-muted-foreground text-center mt-1 px-2">
                Submit your secretary records and related documents
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">


              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 break-words sm:truncate text-sm leading-tight">
                      Submit Secretary Records and Documents
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                      Upload your secretary records and any supporting documents
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto h-8 px-4"
                  onClick={() => setResolutionsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Documents
                </Button>
              </div>
            </div>

            {/* Display submitted resolutions */}
            {((company.resolutions_docs && company.resolutions_docs.length > 0) || (company.admin_resolution_doc && company.admin_resolution_doc.length > 0)) && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                  <h4 className="font-medium text-gray-800 text-sm">Submitted Secretary Records</h4>
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                    <Button
                      variant={corporateRecordsView === 'customer' ? 'default' : 'outline'}
                      size="sm"
                      className="h-9 sm:h-7 px-3 w-full sm:w-auto"
                      onClick={() => setCorporateRecordsView('customer')}
                    >
                      Your Submissions
                    </Button>
                    <Button
                      variant={corporateRecordsView === 'admin' ? 'default' : 'outline'}
                      size="sm"
                      className="h-9 sm:h-7 px-3 w-full sm:w-auto"
                      onClick={() => setCorporateRecordsView('admin')}
                    >
                      Secretary Submissions
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {corporateRecordsView === 'customer' ? (
                    // Customer submissions from resolutions_docs
                    (company.resolutions_docs || [])
                      .map((resolution: any, originalIndex: number) => ({ resolution, originalIndex }))
                      .sort((a: any, b: any) => new Date(b.resolution.uploadedAt).getTime() - new Date(a.resolution.uploadedAt).getTime())
                      .map(({ resolution, originalIndex }: any) => (
                        <div key={originalIndex} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-md hover:bg-gray-50 transition-colors">
                          <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full">
                                  <p className="font-medium text-gray-800 break-words sm:truncate text-sm leading-tight">
                                    {resolution.title}
                                  </p>
                                  {resolution.submittedBy === "admin" ? (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium w-fit sm:w-auto">
                                      Submitted by Secretary
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium w-fit sm:w-auto">
                                      Submitted by You
                                    </span>
                                  )}
                                  {/* Signature required badge intentionally hidden for your submissions */}
                                </div>
                              </div>
                              {resolution.description && (
                                <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                                  {resolution.description}
                                </p>
                              )}

                              {/* Message for customer about waiting for admin signed document */}
                              {resolution.signRequired && resolution.submittedBy !== "admin" && (!resolution.signedDocuments || resolution.signedDocuments.length === 0 || !resolution.signedDocuments.some((doc: any) => doc.uploadedBy === "admin")) && (
                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                    <p className="text-xs text-amber-700 font-medium">
                                      Waiting for secretary to submit signed document
                                    </p>
                                  </div>
                                </div>
                              )}

                              <p className="text-xs text-muted-foreground mt-1">
                                Submitted: {new Date(resolution.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            {/* Original documents */}
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                              {resolution.documents && resolution.documents.map((doc: any, docIndex: number) => (
                                <Button
                                  key={docIndex}
                                  size="default"
                                  variant="outline"
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  <Eye className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> View
                                </Button>
                              ))}
                              {resolution.submittedBy === "admin" && resolution.documents && resolution.documents.length > 0 && (
                                <Button
                                  size="default"
                                  variant="outline"
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                                  onClick={() => {
                                    const first = resolution.documents[0]
                                    if (first?.url) {
                                      const link = window.document.createElement("a")
                                      link.href = first.url
                                      link.download = first.name || "document"
                                      window.document.body.appendChild(link)
                                      link.click()
                                      window.document.body.removeChild(link)
                                    } else if (first?.data) {
                                      const blob = new Blob([first.data], { type: first.type || "application/octet-stream" })
                                      const url = URL.createObjectURL(blob)
                                      const link = window.document.createElement("a")
                                      link.href = url
                                      link.download = first.name || "document"
                                      window.document.body.appendChild(link)
                                      link.click()
                                      window.document.body.removeChild(link)
                                      URL.revokeObjectURL(url)
                                    }
                                  }}
                                >
                                  <Download className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> Download
                                </Button>
                              )}
                              {resolution.submittedBy !== "admin" && (
                                <Button
                                  size="default"
                                  variant="outline"
                                  className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                                  onClick={() => handleDeleteCorporateRecord(originalIndex)}
                                >
                                  <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> Delete
                                </Button>
                              )}
                            </div>

                            {/* Signed documents section */}
                            {resolution.signRequired && resolution.signedDocuments && resolution.signedDocuments.length > 0 && (
                              <div className="mt-2 border-t pt-2 w-full">
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">Signed Documents:</h4>
                                <div className="flex flex-col gap-2 w-full">
                                  {resolution.signedDocuments.map((doc: any, docIndex: number) => (
                                    <div key={docIndex} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-green-600" />
                                        <div>
                                          <p className="text-sm font-medium">{doc.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ""} • {doc.uploadedBy === "admin" ? "Signed by Secretary" : "Signed by You"}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 px-2">
                                              <Eye className="h-3.5 w-3.5 mr-1" />
                                              <span className="text-xs">View</span>
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-3xl">
                                            <DialogHeader>
                                              <DialogTitle>
                                                {doc.uploadedBy === "admin" ? "Secretary Signed Document" : "Your Signed Document"} - {doc.name}
                                              </DialogTitle>
                                            </DialogHeader>
                                            <div className="mt-4">
                                              <div className="flex items-center justify-between mb-4">
                                                <div>
                                                  <p className="text-sm font-medium">
                                                    <FileText className="h-4 w-4 inline mr-1" />
                                                    {doc.name}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">
                                                    {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : ""} • {doc.type || "Unknown type"}
                                                  </p>
                                                  {doc.uploadedBy === "admin" ? (
                                                    <p className="text-xs text-green-600 font-medium mt-1">
                                                      ✓ Signed by Secretary
                                                    </p>
                                                  ) : (
                                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                                      ✓ Signed by You
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="border rounded-md p-2 bg-muted/20">
                                                {doc.type?.startsWith("image/") ? (
                                                  <img
                                                    src={doc.url || "/placeholder.svg"}
                                                    alt={doc.name}
                                                    className="max-w-full h-auto mx-auto"
                                                    style={{ maxHeight: "70vh" }}
                                                  />
                                                ) : doc.type === "application/pdf" ? (
                                                  <div className="aspect-video">
                                                    <iframe
                                                      src={doc.url || ""}
                                                      className="w-full h-full"
                                                      title="PDF Viewer"
                                                    ></iframe>
                                                  </div>
                                                ) : (
                                                  <div className="p-8 text-center">
                                                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                    <p>This file type cannot be previewed. Please download to view.</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2"
                                          onClick={() => {
                                            if (doc.url) {
                                              const link = document.createElement('a')
                                              link.href = doc.url
                                              link.download = doc.name || 'signed-document'
                                              window.document.body.appendChild(link)
                                              link.click()
                                              window.document.body.removeChild(link)
                                            } else if (doc.data) {
                                              const blob = new Blob([doc.data], { type: doc.type || "application/octet-stream" })
                                              const url = URL.createObjectURL(blob)
                                              const link = window.document.createElement("a")
                                              link.href = url
                                              link.download = doc.name || "signed-document"
                                              window.document.body.appendChild(link)
                                              link.click()
                                              window.document.body.removeChild(link)
                                              URL.revokeObjectURL(url)
                                            }
                                          }}
                                          title="Download signed document"
                                        >
                                          <Download className="h-3.5 w-3.5 mr-1" />
                                          <span className="text-xs">Download</span>
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    // Admin submissions from admin_resolution_doc
                    (company.admin_resolution_doc || [])
                      .map((resolution: any, originalIndex: number) => ({ resolution, originalIndex }))
                      .sort((a: any, b: any) => new Date(b.resolution.uploadedAt).getTime() - new Date(a.resolution.uploadedAt).getTime())
                      .map(({ resolution, originalIndex }: any) => (
                        <div key={originalIndex} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-md hover:bg-gray-50 transition-colors">
                          <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                              <FileText className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full">
                                  <p className="font-medium text-gray-800 break-words sm:truncate text-sm leading-tight">
                                    {resolution.title}
                                  </p>
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium w-fit sm:w-auto">
                                    Submitted by Secretary
                                  </span>
                                  {resolution.signRequired && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium w-fit sm:w-auto">
                                      Signature Required
                                    </span>
                                  )}
                                </div>
                              </div>
                              {resolution.description && (
                                <p className="text-xs text-gray-600 mt-1 break-words">
                                  {resolution.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Submitted on {new Date(resolution.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            {/* Original documents */}
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                              {resolution.documents && resolution.documents.map((doc: any, docIndex: number) => (
                                <Button
                                  key={docIndex}
                                  size="default"
                                  variant="outline"
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  <Eye className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> View
                                </Button>
                              ))}
                              {resolution.documents && resolution.documents.length > 0 && (
                                <Button
                                  size="default"
                                  variant="outline"
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                                  onClick={() => {
                                    const first = resolution.documents[0]
                                    if (first?.url) {
                                      const link = window.document.createElement("a")
                                      link.href = first.url
                                      link.download = first.name || "document"
                                      window.document.body.appendChild(link)
                                      link.click()
                                      window.document.body.removeChild(link)
                                    } else if (first?.data) {
                                      const blob = new Blob([first.data], { type: first.type || "application/octet-stream" })
                                      const url = URL.createObjectURL(blob)
                                      const link = window.document.createElement("a")
                                      link.href = url
                                      link.download = first.name || "document"
                                      window.document.body.appendChild(link)
                                      link.click()
                                      window.document.body.removeChild(link)
                                      URL.revokeObjectURL(url)
                                    }
                                  }}
                                >
                                  <Download className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> Download
                                </Button>
                              )}
                            </div>

                            {/* Signed documents section */}
                            {resolution.signRequired && resolution.signedDocuments && resolution.signedDocuments.length > 0 && (
                              <div className="mt-2 border-t pt-2 w-full">
                                <div className="flex flex-col gap-2 w-full">
                                  {resolution.signedDocuments.map((doc: any, docIndex: number) => (
                                    <div key={docIndex} className="flex flex-col sm:flex-row gap-2 w-full">
                                      <Button
                                        size="default"
                                        variant="outline"
                                        className="border-blue-200 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                                        onClick={() => {
                                          setViewingDocument(doc)
                                          setViewDialogOpen(true)
                                        }}
                                      >
                                        <Eye className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> View
                                      </Button>
                                      <Button
                                        size="default"
                                        variant="outline"
                                        className="border-red-200 text-red-700 hover:bg-red-50 flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1"
                                        onClick={() => handleDeleteCustomerSignedDocument(originalIndex, docIndex)}
                                      >
                                        <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" /> Delete
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Upload signed document section for admin submissions */}
                            {resolution.signRequired && (!resolution.signedDocuments || resolution.signedDocuments.length === 0) && (
                              <div className="mt-2 border-t pt-2 w-full">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="text-sm font-medium text-blue-800">Submit Signed Document</h4>
                                        <p className="text-xs text-blue-700 mt-1">Upload the signed version of this secretary record</p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <input
                                        type="file"
                                        id={`secretary-signed-resolution-${originalIndex}`}
                                        className="hidden"
                                        onChange={(e) => handleCustomerSignedResolutionFileChange(e, originalIndex)}
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      />
                                      <label
                                        htmlFor={`secretary-signed-resolution-${originalIndex}`}
                                        className="flex flex-col sm:flex-row items-center justify-center text-center gap-1 sm:gap-2 w-full px-3 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                                      >
                                        <Upload className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600" />
                                        <span className="text-sm text-blue-700 font-medium">Choose Signed Document</span>
                                      </label>
                                    </div>

                                    {/* Selected file display */}
                                    {currentCustomerResolutionIndex === originalIndex && customerSignedResolutionFile && (
                                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-white rounded border border-blue-200">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-blue-500" />
                                          <div>
                                            <p className="text-sm font-medium">{customerSignedResolutionFile.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {(customerSignedResolutionFile.size / 1024).toFixed(1)} KB
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setCustomerSignedResolutionFile(null);
                                              setCurrentCustomerResolutionIndex(null);
                                            }}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700"
                                            disabled={uploadingCustomerSignedResolution}
                                            onClick={() => handleSubmitCustomerSignedResolution(originalIndex)}
                                          >
                                            {uploadingCustomerSignedResolution ? (
                                              <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Uploading...
                                              </>
                                            ) : (
                                              'Submit Signed Document'
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      ))
                  )}
                  {corporateRecordsView === 'admin' && (!company.admin_resolution_doc || company.admin_resolution_doc.length === 0) && (
                    <div className="text-center py-6 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No secretary records submitted by admin yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Corporate Records Dialog */}
        <Dialog open={resolutionsDialogOpen} onOpenChange={setResolutionsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submit Secretary Records
              </DialogTitle>
              <DialogDescription>
                Add a title, description, and upload documents for your secretary records
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {uploadError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="Enter resolution title"
                  value={resolutionTitle}
                  onChange={(e) => setResolutionTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Enter resolution description (optional)"
                  value={resolutionDescription}
                  onChange={(e) => setResolutionDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Documents *</label>
                <div className="border-2 border-dashed rounded-md p-4">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="resolution-files"
                  />
                  <label
                    htmlFor="resolution-files"
                    className="flex flex-col items-center justify-center gap-2 py-4 cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop documents
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('resolution-files')?.click();
                      }}
                    >
                      Select Files
                    </Button>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Secretary Signature Required</label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sign-required"
                    checked={isSignRequired}
                    onCheckedChange={setIsSignRequired}
                  />
                  <label htmlFor="sign-required" className="text-sm text-muted-foreground">
                    Require signature on this document
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, admin will be able to upload signed documents for this resolution
                </p>

                {resolutionFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-medium">Selected Documents:</p>
                    <div className="space-y-2">
                      {resolutionFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setResolutionsDialogOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitResolutions}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Resolutions
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
      {/* Access Sharing Dialog for customer to request access */}
      <AccessSharingDialog
        isOpen={isAccessSharingDialogOpen}
        onOpenChange={setIsAccessSharingDialogOpen}
        companyId={companyId}
        initialSharedEmails={company?.sharedWithEmails || []}
        isAdmin={false}
      />
    </div>
  )
}
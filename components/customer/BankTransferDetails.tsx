"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Copy, AlertCircle, CheckCircle2, Upload, RefreshCw, Eye, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type BankTransferDetailsProps = {
  bankDetails: {
    bankName: string
    accountName: string
    accountNumber: string
    branchName: string
    swiftCode?: string
    additionalInstructions?: string
  }
  onFileUpload: (file: File) => void
  uploadedFile: any | null
  existingReceipt?: any
  isUploading?: boolean
  uploadProgress?: number
}

export default function BankTransferDetails({ bankDetails, onFileUpload, uploadedFile, existingReceipt, isUploading: externalIsUploading, uploadProgress: externalUploadProgress }: BankTransferDetailsProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  // Use external upload state if provided, otherwise use internal state
  const isCurrentlyUploading = externalIsUploading !== undefined ? externalIsUploading : isUploading;
  const currentUploadProgress = externalUploadProgress !== undefined ? externalUploadProgress : uploadProgress;

  // Store interval reference to prevent conflicts during simultaneous uploads
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
        return;
      }
    } catch (error) {
      console.log('Modern clipboard API failed, trying fallback method');
    }

    // Fallback method using document.execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
      } else {
        // If both methods fail, show the text in an alert as last resort
        alert(`Copy failed. Here's the text: ${text}`);
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      // Last resort: show text in alert
      alert(`Copy failed. Here's the text: ${text}`);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setFileError('Please select an image (JPG, PNG) or PDF file')
        return
      }

      // Removed file size validation to allow unlimited uploads

      setIsUploading(true)
      setUploadProgress(0)

      // Clear any existing interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) {
            return prev + 10
          }
          clearInterval(progressInterval);
          progressIntervalRef.current = null;
          return prev
        })
      }, 200)

      // Store the interval reference
      progressIntervalRef.current = progressInterval;

      try {
        // Call the parent's onFileUpload function
        onFileUpload(file)
        setUploadProgress(100)
      } finally {
        // Clear the interval if it still exists
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
        }, 500)
      }
    }
  }

  // Check if bank details are empty or not set
  const isBankDetailsEmpty =
    !bankDetails ||
    !bankDetails.bankName ||
    !bankDetails.accountNumber ||
    !bankDetails.branchName ||
    !bankDetails.accountName

  if (isBankDetailsEmpty) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Bank Details Not Set</AlertTitle>
        <AlertDescription>
          The administrator has not set up bank transfer details yet. Please contact support or choose another payment
          method.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border border-[#130252]/20 shadow-sm">
      <CardHeader className="bg-[#130252]/5 py-3 px-4">
        <CardTitle className="text-base sm:text-lg">Bank Transfer Details</CardTitle>
        <CardDescription className="text-xs">Use these details for your bank transfer payment</CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 space-y-3">
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-2 text-sm">
          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground">Bank Name</p>
            <div className="flex items-center p-2 bg-muted/30 rounded-md">
              <p className="font-medium truncate mr-1 flex-1">{bankDetails.bankName}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankDetails.bankName, "bankName")}
                className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Copy bank name"
              >
                {copied === "bankName" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground">Branch</p>
            <div className="flex items-center p-2 bg-muted/30 rounded-md">
              <p className="font-medium truncate mr-1 flex-1">{bankDetails.branchName}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankDetails.branchName, "branchName")}
                className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Copy branch name"
              >
                {copied === "branchName" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground">Account Name</p>
            <div className="flex items-center p-2 bg-muted/30 rounded-md">
              <p className="font-medium truncate mr-1 flex-1">{bankDetails.accountName}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankDetails.accountName, "accountName")}
                className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Copy account name"
              >
                {copied === "accountName" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground">Account Number</p>
            <div className="flex items-center p-2 bg-muted/30 rounded-md">
              <p className="font-medium truncate mr-1 flex-1">{bankDetails.accountNumber}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankDetails.accountNumber, "accountNumber")}
                className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Copy account number"
              >
                {copied === "accountNumber" ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {bankDetails.swiftCode && (
            <div className="relative sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">SWIFT Code</p>
              <div className="flex items-center p-2 bg-muted/30 rounded-md">
                <p className="font-medium truncate mr-1 flex-1">{bankDetails.swiftCode}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.swiftCode || "", "swiftCode")}
                  className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2"
                  aria-label="Copy swift code"
                >
                  {copied === "swiftCode" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {bankDetails.additionalInstructions && (
          <div className="text-sm">
            <p className="text-xs font-medium text-muted-foreground">Additional Instructions</p>
            <div className="p-2 bg-muted/30 rounded-md text-xs">
              <p>{bankDetails.additionalInstructions}</p>
            </div>
          </div>
        )}

        <Alert className="py-2 px-3 bg-yellow-50 border-yellow-200 text-xs">
          <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5" />
          <div>
            <AlertTitle className="text-yellow-700 text-xs font-medium">Important</AlertTitle>
            <AlertDescription className="text-yellow-700 text-xs">
              Include your company name as payment reference. Upload receipt below.
            </AlertDescription>
          </div>
        </Alert>

        {/* Existing uploaded receipt display */}
        {existingReceipt && (
          <div className="border rounded-md p-2 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-medium truncate">Current uploaded receipt: {existingReceipt.name}</p>
                {existingReceipt.uploadedAt && (
                  <p className="text-muted-foreground">Uploaded at: {new Date(existingReceipt.uploadedAt).toLocaleString()}</p>
                )}
                {existingReceipt.status && (
                  <p className="text-muted-foreground">Status: {existingReceipt.status}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {existingReceipt.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsViewerOpen(true)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById("payment-receipt")?.click()}
                  disabled={isCurrentlyUploading}
                >
                  {isCurrentlyUploading ? 'Replacing...' : 'Replace'}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Document Viewer Modal */}
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent className="w-[95vw] max-w-3xl">
            <DialogHeader>
              <DialogTitle>Receipt Viewer</DialogTitle>
            </DialogHeader>
            {existingReceipt?.url ? (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm">
                    <p className="font-medium truncate">
                      <FileText className="h-4 w-4 inline mr-1" />
                      {existingReceipt.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {existingReceipt.size && typeof existingReceipt.size === 'number' ? `${(existingReceipt.size / 1024).toFixed(2)} KB` : ""}
                      {existingReceipt.type ? ` • ${existingReceipt.type}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = existingReceipt.url
                      a.download = existingReceipt.name || 'receipt'
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                    }}
                  >
                    Download
                  </Button>
                </div>
                <div className="border rounded-md p-2 bg-muted/20">
                  {existingReceipt.type?.startsWith("image/") ? (
                    <img
                      src={existingReceipt.url}
                      alt={existingReceipt.name}
                      className="max-w-full h-auto mx-auto"
                      style={{ maxHeight: "70vh" }}
                    />
                  ) : existingReceipt.type === "application/pdf" ? (
                    <div className="aspect-video">
                      <iframe src={existingReceipt.url} className="w-full h-full" title="Receipt PDF Viewer"></iframe>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p>This file type cannot be previewed. Please download to view.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="pt-0 pb-3 px-2 sm:px-4">
        <div className="w-full">
          <div className="space-y-2">
            <Label htmlFor="payment-receipt" className="text-xs font-medium">
              Upload Payment Receipt
            </Label>
            <div className="border border-dashed rounded-md p-2 text-center">
              <Input
                type="file"
                className="hidden"
                id="payment-receipt"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
                disabled={isCurrentlyUploading}
              />
              <Label
                htmlFor="payment-receipt"
                className={`flex flex-col items-center justify-center gap-1 py-2 ${isCurrentlyUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                {isCurrentlyUploading ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <p className="text-xs text-muted-foreground">
                  {isCurrentlyUploading
                    ? "Uploading..."
                    : uploadedFile?.name || existingReceipt?.name || "Upload receipt (JPEG, PNG, PDF)"
                  }
                </p>

                {/* Progress Bar */}
                {isCurrentlyUploading && (
                  <div className="w-full max-w-xs">
                    <Progress value={currentUploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(currentUploadProgress)}% complete
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs mt-1"
                  disabled={isCurrentlyUploading}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById("payment-receipt")?.click()
                  }}
                >
                  {isUploading ? "Uploading..." : "Select File"}
                </Button>
              </Label>
            </div>
            {fileError && <p className="text-xs font-medium text-destructive mt-1">{fileError}</p>}
            {uploadedFile && (
              <div className="mt-1 flex items-center text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Receipt uploaded successfully
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

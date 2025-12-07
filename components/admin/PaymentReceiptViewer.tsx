"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, Download, FileText, ImageIcon } from "lucide-react"

type PaymentReceiptViewerProps = {
  receipt: {
    name: string
    type: string
    size: number
    url: string
  } | null
}

export default function PaymentReceiptViewer({ receipt }: PaymentReceiptViewerProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!receipt) {
    return <span className="text-muted-foreground">No receipt uploaded</span>
  }

  const isImage = receipt.type.startsWith("image/")
  const isPdf = receipt.type === "application/pdf"

  const handleDownload = () => {
    const link = window.document.createElement("a")
    link.href = receipt.url
    link.download = receipt.name
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            <Eye className="h-4 w-4 mr-1" /> View Receipt
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">
                  {isImage ? (
                    <ImageIcon className="h-4 w-4 inline mr-1" />
                  ) : (
                    <FileText className="h-4 w-4 inline mr-1" />
                  )}
                  {receipt.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {typeof receipt.size === 'number' ? (receipt.size / 1024).toFixed(2) : "0.00"} KB • {receipt.type}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </div>

            <div className="border rounded-md p-2 bg-muted/20">
              {isImage ? (
                <img
                  src={receipt.url || "/placeholder.svg"}
                  alt="Payment Receipt"
                  className="max-w-full h-auto mx-auto"
                  style={{ maxHeight: "70vh" }}
                />
              ) : isPdf ? (
                <div className="aspect-video">
                  <iframe src={receipt.url} className="w-full h-full" title="PDF Viewer"></iframe>
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
    </div>
  )
}

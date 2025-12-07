"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, Building, X } from "lucide-react"
import { LocalStorageService } from "@/lib/database-service"

interface AboutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface AboutData {
    title: string
    companyInformation: string
    updatedAt?: string
}

export default function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
    const [aboutData, setAboutData] = useState<AboutData>({
        title: "About Our Company",
        companyInformation: "Welcome to our company incorporation service. We provide comprehensive support for business registration and incorporation processes."
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            loadAboutData()
        }
    }, [open])

    const loadAboutData = async () => {
        try {
            setLoading(true)
            const data = await LocalStorageService.getAboutSettings()
            setAboutData(data)
        } catch (error) {
            console.error('Error loading about data:', error)
            // Keep default data if loading fails
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        {aboutData.title}
                    </DialogTitle>
                    <DialogDescription>
                        Company information and details
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {aboutData.title}
                                        </h3>
                                        {aboutData.updatedAt && (
                                            <p className="text-sm text-gray-500">
                                                Last updated: {new Date(aboutData.updatedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="prose prose-sm max-w-none">
                                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {aboutData.companyInformation}
                                    </div>
                                </div>
                            </div>

                        </>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="gap-2"
                    >
                        <X className="h-4 w-4" />
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

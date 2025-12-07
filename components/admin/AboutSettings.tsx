"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save, Info, Building } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AboutSettingsData {
    title: string
    companyInformation: string
}

export default function AboutSettings() {
    const [aboutData, setAboutData] = useState<AboutSettingsData>({
        title: "",
        companyInformation: ""
    })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Load existing about settings
    useEffect(() => {
        const loadAboutSettings = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/about')
                if (response.ok) {
                    const data = await response.json()
                    setAboutData(data)
                } else {
                    // If no data exists, use defaults
                    setAboutData({
                        title: "About Our Company",
                        companyInformation: "Welcome to our company incorporation service. We provide comprehensive support for business registration and incorporation processes."
                    })
                }
            } catch (error) {
                console.error('Error loading about settings:', error)
                toast({
                    title: "Error",
                    description: "Failed to load about settings",
                    variant: "destructive"
                })
            } finally {
                setLoading(false)
            }
        }

        loadAboutSettings()
    }, [])

    const handleSave = async () => {
        try {
            setSaving(true)
            const response = await fetch('/api/about', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(aboutData),
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "About settings saved successfully",
                })
            } else {
                throw new Error('Failed to save about settings')
            }
        } catch (error) {
            console.error('Error saving about settings:', error)
            toast({
                title: "Error",
                description: "Failed to save about settings",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleInputChange = (field: keyof AboutSettingsData, value: string) => {
        setAboutData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        About Settings
                    </CardTitle>
                    <CardDescription>
                        Configure the company information that will be displayed to customers in the About section
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={aboutData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Enter the title for the About section"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="companyInformation">Company Information</Label>
                        <Textarea
                            id="companyInformation"
                            value={aboutData.companyInformation}
                            onChange={(e) => handleInputChange('companyInformation', e.target.value)}
                            placeholder="Enter detailed company information that will be shown to customers"
                            className="w-full min-h-[200px]"
                            rows={8}
                        />
                        <p className="text-sm text-muted-foreground">
                            This information will be displayed to customers when they click on the About option in their profile menu.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="gap-2"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {saving ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

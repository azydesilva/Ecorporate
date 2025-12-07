"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, Building2, Globe, User, Building } from "lucide-react"
import { settingsStorage } from "@/lib/local-storage"
import { LocalStorageService } from "@/lib/database-service"

// Helper function to adjust color brightness
const adjustColorBrightness = (color: string, amount: number): string => {
    const usePound = color[0] === '#'
    const col = usePound ? color.slice(1) : color

    const num = parseInt(col, 16)
    let r = (num >> 16) + amount
    let g = (num >> 8 & 0x00FF) + amount
    let b = (num & 0x0000FF) + amount

    r = r > 255 ? 255 : r < 0 ? 0 : r
    g = g > 255 ? 255 : g < 0 ? 0 : g
    b = b > 255 ? 255 : b < 0 ? 0 : b

    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0')
}

type Fees = {
    directors: {
        local: number
        foreign: number
    }
    shareholders: {
        localNaturalPerson: number
        localLegalEntity: number
        foreignNaturalPerson: number
        foreignLegalEntity: number
    }
}

export default function DirectorsShareholderCharges() {
    const [fees, setFees] = useState<Fees>({
        directors: { local: 0, foreign: 0 },
        shareholders: {
            localNaturalPerson: 0,
            localLegalEntity: 0,
            foreignNaturalPerson: 0,
            foreignLegalEntity: 0,
        },
    })
    const [saving, setSaving] = useState(false)
    const [primaryColor, setPrimaryColor] = useState('#2563eb')

    useEffect(() => {
        const load = async () => {
            try {
                // Load primary color from settings
                const settings = await settingsStorage.getSettingsWithFallback()
                if (settings?.primaryColor) {
                    setPrimaryColor(settings.primaryColor)
                }

                // Try to load from database first
                const current = await LocalStorageService.getSettings()
                const existing = current?.additional_fees as any

                if (existing) {
                    setFees({
                        directors: {
                            local: Number(existing.directors?.local) || 0,
                            foreign: Number(existing.directors?.foreign) || 0,
                        },
                        shareholders: {
                            localNaturalPerson: Number(existing.shareholders?.localNaturalPerson) || 0,
                            localLegalEntity: Number(existing.shareholders?.localLegalEntity) || 0,
                            foreignNaturalPerson: Number(existing.shareholders?.foreignNaturalPerson) || 0,
                            foreignLegalEntity: Number(existing.shareholders?.foreignLegalEntity) || 0,
                        },
                    })
                } else {
                    // Fallback to localStorage if database doesn't have the data
                    const localSettings = settingsStorage.getSettings()
                    const localExisting = localSettings?.additionalFees as any

                    if (localExisting) {
                        setFees({
                            directors: {
                                local: Number(localExisting.directors?.local) || 0,
                                foreign: Number(localExisting.directors?.foreign) || 0,
                            },
                            shareholders: {
                                localNaturalPerson: Number(localExisting.shareholders?.localNaturalPerson) || 0,
                                localLegalEntity: Number(localExisting.shareholders?.localLegalEntity) || 0,
                                foreignNaturalPerson: Number(localExisting.shareholders?.foreignNaturalPerson) || 0,
                                foreignLegalEntity: Number(localExisting.shareholders?.foreignLegalEntity) || 0,
                            },
                        })
                    }
                }
            } catch (error) {
                console.error('Error loading additional fees:', error)
            }
        }
        load()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            // Get current settings to preserve existing values
            const currentSettings = await LocalStorageService.getSettings()

            // Save to database with all existing settings plus updated additional_fees
            await LocalStorageService.saveSettings({
                title: currentSettings?.title || 'E CORPORATE',
                description: currentSettings?.description || 'CENTRAL COURT (PRIVATE) LIMITED.',
                logo_url: currentSettings?.logo_url || null,
                favicon_url: currentSettings?.favicon_url || null,
                primary_color: currentSettings?.primary_color || '#2563eb',
                secondary_color: currentSettings?.secondary_color || '#ffffff',
                additional_fees: {
                    directors: { local: fees.directors.local, foreign: fees.directors.foreign },
                    shareholders: {
                        localNaturalPerson: fees.shareholders.localNaturalPerson,
                        localLegalEntity: fees.shareholders.localLegalEntity,
                        foreignNaturalPerson: fees.shareholders.foreignNaturalPerson,
                        foreignLegalEntity: fees.shareholders.foreignLegalEntity,
                    },
                },
            })

            // Also update localStorage for immediate access
            settingsStorage.updateSettings({
                additionalFees: fees,
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Directors & Shareholder Charges</CardTitle>
                    <CardDescription>Configure fees for directors and shareholders (charged per director/shareholder)</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Directors Section - Left Column */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <h3 className="text-base font-semibold">Directors Charges</h3>
                            </div>
                            <p className="text-sm text-gray-600">Fees charged per director</p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    <Building2 className="h-4 w-4 text-green-600" />
                                    <div className="flex-1">
                                        <Label htmlFor="fee-director-local" className="text-sm font-medium text-gray-700">
                                            Local Directors
                                        </Label>
                                        <p className="text-xs text-gray-500">Sri Lankan residents</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">LKR</span>
                                        <Input
                                            id="fee-director-local"
                                            type="number"
                                            min={0}
                                            step="100"
                                            className="w-24 text-right"
                                            value={fees.directors.local}
                                            onChange={(e) => setFees((f) => ({ ...f, directors: { ...f.directors, local: Number(e.target.value) || 0 } }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    <Globe className="h-4 w-4 text-orange-600" />
                                    <div className="flex-1">
                                        <Label htmlFor="fee-director-foreign" className="text-sm font-medium text-gray-700">
                                            Foreign Directors
                                        </Label>
                                        <p className="text-xs text-gray-500">Non-Sri Lankan residents</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">LKR</span>
                                        <Input
                                            id="fee-director-foreign"
                                            type="number"
                                            min={0}
                                            step="100"
                                            className="w-24 text-right"
                                            value={fees.directors.foreign}
                                            onChange={(e) => setFees((f) => ({ ...f, directors: { ...f.directors, foreign: Number(e.target.value) || 0 } }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shareholders Section - Right Column */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-green-600" />
                                <h3 className="text-base font-semibold">Shareholders Charges</h3>
                            </div>
                            <p className="text-sm text-gray-600">Fees charged per shareholder</p>
                            <div className="space-y-3">
                                {/* Local Shareholders */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-green-600" />
                                        <Badge variant="secondary" className="text-xs">Local Shareholders</Badge>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg ml-6">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <div className="flex-1">
                                            <Label htmlFor="fee-sh-local-natural" className="text-sm font-medium text-gray-700">
                                                Natural Person
                                            </Label>
                                            <p className="text-xs text-gray-500">Individual shareholders</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">LKR</span>
                                            <Input
                                                id="fee-sh-local-natural"
                                                type="number"
                                                min={0}
                                                step="100"
                                                className="w-24 text-right"
                                                value={fees.shareholders.localNaturalPerson}
                                                onChange={(e) => setFees((f) => ({ ...f, shareholders: { ...f.shareholders, localNaturalPerson: Number(e.target.value) || 0 } }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg ml-6">
                                        <Building className="h-4 w-4 text-purple-600" />
                                        <div className="flex-1">
                                            <Label htmlFor="fee-sh-local-entity" className="text-sm font-medium text-gray-700">
                                                Legal Entity/Firm
                                            </Label>
                                            <p className="text-xs text-gray-500">Corporate shareholders</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">LKR</span>
                                            <Input
                                                id="fee-sh-local-entity"
                                                type="number"
                                                min={0}
                                                step="100"
                                                className="w-24 text-right"
                                                value={fees.shareholders.localLegalEntity}
                                                onChange={(e) => setFees((f) => ({ ...f, shareholders: { ...f.shareholders, localLegalEntity: Number(e.target.value) || 0 } }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Foreign Shareholders */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-orange-600" />
                                        <Badge variant="outline" className="text-xs">Foreign Shareholders</Badge>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg ml-6">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <div className="flex-1">
                                            <Label htmlFor="fee-sh-foreign-natural" className="text-sm font-medium text-gray-700">
                                                Natural Person
                                            </Label>
                                            <p className="text-xs text-gray-500">Individual shareholders</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">LKR</span>
                                            <Input
                                                id="fee-sh-foreign-natural"
                                                type="number"
                                                min={0}
                                                step="100"
                                                className="w-24 text-right"
                                                value={fees.shareholders.foreignNaturalPerson}
                                                onChange={(e) => setFees((f) => ({ ...f, shareholders: { ...f.shareholders, foreignNaturalPerson: Number(e.target.value) || 0 } }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg ml-6">
                                        <Building className="h-4 w-4 text-purple-600" />
                                        <div className="flex-1">
                                            <Label htmlFor="fee-sh-foreign-entity" className="text-sm font-medium text-gray-700">
                                                Legal Entity/Firm
                                            </Label>
                                            <p className="text-xs text-gray-500">Corporate shareholders</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">LKR</span>
                                            <Input
                                                id="fee-sh-foreign-entity"
                                                type="number"
                                                min={0}
                                                step="100"
                                                className="w-24 text-right"
                                                value={fees.shareholders.foreignLegalEntity}
                                                onChange={(e) => setFees((f) => ({ ...f, shareholders: { ...f.shareholders, foreignLegalEntity: Number(e.target.value) || 0 } }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-2 text-white"
                            style={{
                                backgroundColor: primaryColor,
                                borderColor: primaryColor,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = adjustColorBrightness(primaryColor, -20)
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = primaryColor
                            }}
                        >
                            {saving ? "Saving..." : "Save Charges"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react"

type AvailabilityResult = {
    status: 'available' | 'unavailable' | 'unknown' | null
    message: string
    companyName?: string
    phoneticallySimilar?: boolean
}

export default function CompanyNameChecker() {
    const [companyName, setCompanyName] = useState("")
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
    const [availabilityResult, setAvailabilityResult] = useState<AvailabilityResult>({
        status: null,
        message: ''
    })

    // Function to check company name availability using the real API
    const checkCompanyNameAvailability = async () => {
        if (!companyName || companyName.length < 2) {
            setAvailabilityResult({ status: null, message: '' })
            return
        }

        setIsCheckingAvailability(true)
        setAvailabilityResult({ status: null, message: '' })

        try {
            const response = await fetch('/api/company-name-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ companyName }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to check company name availability')
            }

            setAvailabilityResult({
                status: data.status,
                message: data.message,
                companyName: data.companyName,
                phoneticallySimilar: data.phoneticallySimilar || false,
            })
        } catch (err: any) {
            console.error('Error checking company name availability:', err)
            setAvailabilityResult({
                status: null,
                message: 'Unable to check availability at this time. Please try again.'
            })
        } finally {
            setIsCheckingAvailability(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setCompanyName(value)
        // Clear previous result when typing
        if (availabilityResult.status) {
            setAvailabilityResult({ status: null, message: '' })
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            checkCompanyNameAvailability()
        }
    }

    return (
        <div className="space-y-4 p-6 bg-background/95 backdrop-blur-sm rounded-lg border-0 shadow-2xl w-full">
            <h3 className="text-lg font-semibold text-center">Company Name Checker</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
                Check if your desired company name is available before registering
            </p>

            <div className="flex gap-2 w-full">
                <Input
                    placeholder="Enter company name to check availability"
                    value={companyName}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                />
                <Button
                    className="bg-primary hover:bg-primary/90"
                    size="icon"
                    onClick={checkCompanyNameAvailability}
                    disabled={isCheckingAvailability || !companyName || companyName.length < 2}
                >
                    {isCheckingAvailability ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Display availability result */}
            {availabilityResult.status && availabilityResult.status !== 'unknown' && (
                <div className={`mt-2 p-3 rounded-md border ${availabilityResult.status === 'available'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-start">
                        {availabilityResult.status === 'available' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        )}
                        <div>
                            <h4 className={`font-medium ${availabilityResult.status === 'available'
                                    ? 'text-green-800'
                                    : 'text-red-800'
                                }`}>
                                {availabilityResult.companyName}
                            </h4>
                            <p className={`text-sm ${availabilityResult.status === 'available'
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                }`}>
                                Status: {availabilityResult.status}
                            </p>
                            <p className={`text-sm mt-1 ${availabilityResult.status === 'available'
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                }`}>
                                {availabilityResult.message}
                            </p>
                            {availabilityResult.status === 'unavailable' && (
                                <p className="text-sm text-red-700 mt-1">
                                    Please change the company name and try again.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
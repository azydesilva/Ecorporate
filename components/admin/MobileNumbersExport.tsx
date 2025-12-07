"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database-service"
import { Download } from "lucide-react"

export default function MobileNumbersExport() {
  const [mobileNumbers, setMobileNumbers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchMobileNumbers = async () => {
      try {
        setLoading(true)
        // Fetch all registrations
        const registrations = await DatabaseService.getRegistrations()
        
        const numbers: string[] = []
        
        // Extract shareholder contact numbers
        registrations.forEach((registration: any) => {
          if (registration.shareholders && Array.isArray(registration.shareholders)) {
            registration.shareholders.forEach((shareholder: any) => {
              if (shareholder.contactNumber && typeof shareholder.contactNumber === 'string') {
                // Clean the number (remove spaces, dashes, etc.)
                const cleanNumber = shareholder.contactNumber.replace(/\D/g, '')
                if (cleanNumber && !numbers.includes(cleanNumber)) {
                  numbers.push(cleanNumber)
                }
              }
            })
          }
          
          // Extract director contact numbers
          if (registration.directors && Array.isArray(registration.directors)) {
            registration.directors.forEach((director: any) => {
              if (director.contactNumber && typeof director.contactNumber === 'string') {
                // Clean the number (remove spaces, dashes, etc.)
                const cleanNumber = director.contactNumber.replace(/\D/g, '')
                if (cleanNumber && !numbers.includes(cleanNumber)) {
                  numbers.push(cleanNumber)
                }
              }
            })
          }
        })
        
        setMobileNumbers(numbers)
      } catch (error) {
        console.error("Error fetching mobile numbers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMobileNumbers()
  }, [])

  const handleExport = () => {
    try {
      setExporting(true)

      // Plain text with one number per line (only .txt supported)
      const content = mobileNumbers.join('\n')
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mobile-numbers-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting mobile numbers:", error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mobile Numbers Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">Total Mobile Numbers</h3>
              <p className="text-sm text-gray-500">Unique contact numbers from shareholders and directors</p>
            </div>
            <div className="text-2xl font-bold text-primary">
              {loading ? '...' : mobileNumbers.length}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleExport} 
              disabled={loading || mobileNumbers.length === 0 || exporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export Numbers (.txt)'}
            </Button>
          </div>
          
          {loading && (
            <div className="text-center py-4">
              <p>Loading mobile numbers...</p>
            </div>
          )}
          
          {!loading && mobileNumbers.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>No mobile numbers found in the database.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
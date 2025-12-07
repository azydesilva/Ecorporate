"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
    Building2,
    Calendar,
    Clock,
    RefreshCw,
    Search,
    AlertCircle,
    CheckCircle,
    User,
    Mail,
    Phone,
    ArrowLeft,
    FileText,
    Check,
    X,
} from "lucide-react"
import { LocalStorageService } from "@/lib/database-service"
import PaymentReceiptViewer from "./PaymentReceiptViewer"

type SecretaryRenewPageProps = {
    navigateTo: (page: string, id?: string) => void
    user?: any
}

type SecretaryRenewalPayment = {
    id: string
    registrationId: string
    amount: number
    paymentReceipt: any
    status: 'pending' | 'approved' | 'rejected'
    companyName: string
    companyNameEnglish: string
    contactPersonName: string
    contactPersonEmail: string
    createdAt: string
}

export default function SecretaryRenewPage({ navigateTo, user }: SecretaryRenewPageProps) {
    const { toast } = useToast()
    const [expiredRegistrations, setExpiredRegistrations] = useState<any[]>([])
    const [renewalPayments, setRenewalPayments] = useState<SecretaryRenewalPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null)

    useEffect(() => {
        loadExpiredRegistrations()
        loadRenewalPayments()
    }, [])

    const loadExpiredRegistrations = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading expired registrations...');

            let registrations = [];

            // Check if the method exists
            if (typeof LocalStorageService.getRegistrations !== 'function') {
                console.error('❌ LocalStorageService.getRegistrations is not a function');
                console.log('Available methods:', Object.getOwnPropertyNames(LocalStorageService));

                // Fallback: Direct API call
                console.log('🔄 Using fallback: Direct API call');
                const response = await fetch('/api/registrations');
                if (!response.ok) {
                    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
                }
                registrations = await response.json();
                console.log('📊 Loaded registrations via API:', registrations.length);
            } else {
                registrations = await LocalStorageService.getRegistrations();
                console.log('📊 Loaded registrations via LocalStorageService:', registrations.length);
            }

            // Filter for expired registrations
            const expired = registrations.filter((reg: any) => {
                const isExpired = reg.isExpired || (reg.expireDate && new Date(reg.expireDate) < new Date());
                return isExpired && reg.status === 'completed';
            });

            console.log('🔍 Found expired registrations:', expired.length);
            setExpiredRegistrations(expired);
        } catch (error) {
            console.error('❌ Error loading expired registrations:', error);
            toast({
                title: "Error",
                description: "Failed to load expired registrations. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadRenewalPayments = async () => {
        try {
            console.log('🔄 Loading secretary renewal payments...')
            const response = await fetch('/api/secretary-renewal-payments')

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`)
            }

            const payments = await response.json()
            console.log('📊 Loaded secretary renewal payments:', payments.length)
            setRenewalPayments(payments)
        } catch (error) {
            console.error('Error loading secretary renewal payments:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            toast({
                title: "Error",
                description: `Failed to load renewal payments: ${errorMessage}`,
                variant: "destructive",
            })
        }
    }


    const handleApprovePayment = async (paymentId: string, registrationId: string) => {
        setIsProcessingPayment(paymentId)
        try {
            const response = await fetch(`/api/secretary-renewal-payments/${paymentId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    approvedBy: user?.id,
                    newExpireDays: 365
                })
            })

            if (!response.ok) {
                throw new Error('Failed to approve payment')
            }

            toast({
                title: "Success",
                description: "Payment approved and registration renewed!",
            })

            // Dispatch event to notify customer dashboard of renewal approval
            window.dispatchEvent(
                new CustomEvent("registration-updated", {
                    detail: {
                        type: "secretary-renewal-approved",
                        registrationId: registrationId,
                        paymentId: paymentId
                    }
                })
            )

            // Reload payments and registrations
            await loadRenewalPayments()
            await loadExpiredRegistrations()
        } catch (error) {
            console.error('Error approving payment:', error)
            toast({
                title: "Error",
                description: "Failed to approve payment. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsProcessingPayment(null)
        }
    }

    const handleRejectPayment = async (paymentId: string) => {
        setIsProcessingPayment(paymentId)
        try {
            const response = await fetch(`/api/secretary-renewal-payments/${paymentId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rejectedBy: user?.id
                })
            })

            if (!response.ok) {
                throw new Error('Failed to reject payment')
            }

            toast({
                title: "Success",
                description: "Payment rejected!",
            })

            // Reload payments
            await loadRenewalPayments()
        } catch (error) {
            console.error('Error rejecting payment:', error)
            toast({
                title: "Error",
                description: "Failed to reject payment. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsProcessingPayment(null)
        }
    }

    // Combine expired registrations with their renewal payments
    const combinedData = expiredRegistrations.map((registration) => {
        // Find the most recent payment for this registration
        const paymentsForRegistration = renewalPayments
            .filter(p => p.registrationId === registration._id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        const mostRecentPayment = paymentsForRegistration[0] || null

        return {
            ...registration,
            renewalPayment: mostRecentPayment
        }
    }).filter((item) => {
        // Simple logic: Show all expired registrations based on database expiration date
        // If there's a pending payment, show it for approval
        // If there's a rejected payment, show it for retry
        // If there's an approved payment but registration is still expired, show as normal expired card

        if (!item.renewalPayment) {
            return true; // Show expired registrations without any payment
        }

        // If there's a payment, only hide if it's approved AND the registration is not expired
        if (item.renewalPayment.status === 'approved') {
            // Check if the registration is still actually expired
            const isCurrentlyExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
            // Only hide if approved and not expired
            return isCurrentlyExpired; // Show if still expired (will display as normal expired card)
        }

        // Show pending and rejected payments
        return true;
    })

    const filteredData = combinedData.filter((item) => {
        const query = searchQuery.toLowerCase()
        const companyName = (item.companyNameEnglish || "").toLowerCase()
        const contactName = (item.contactPersonName || "").toLowerCase()
        const email = (item.contactPersonEmail || "").toLowerCase()

        return companyName.includes(query) || contactName.includes(query) || email.includes(query)
    })

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
            case 'approved':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
            case 'rejected':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8">
                <div className="flex justify-center items-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-3">
                <h1 className="text-2xl font-bold">Secretary Renew</h1>
            </div>

            {/* Search and Stats */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search by company name, contact, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Badge variant="outline" className="px-3 py-1 w-full sm:w-auto text-center">
                        {filteredData.length} Expired Cards
                    </Badge>
                    <Button onClick={() => { loadExpiredRegistrations(); loadRenewalPayments(); }} variant="outline" size="sm" className="w-full sm:w-auto">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Combined Cards */}
            {filteredData.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Expired Cards</h3>
                        <p className="text-muted-foreground text-center">
                            {searchQuery ? "No expired cards match your search criteria." : "All company cards are currently active."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredData.map((item) => (
                        <Card key={item._id} className={`group hover:shadow-md transition-all duration-300 shadow-sm ${(() => {
                            // If registration is expired, always use red styling (expired card)
                            const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                            if (isExpired) {
                                return 'border-red-200 bg-red-50/30 hover:border-red-300/50'
                            }

                            // If not expired, use payment status colors
                            return item.renewalPayment
                                ? item.renewalPayment.status === 'pending'
                                    ? 'border-yellow-200 bg-yellow-50/30 hover:border-yellow-300/50'
                                    : item.renewalPayment.status === 'approved'
                                        ? 'border-green-200 bg-green-50/30 hover:border-green-300/50'
                                        : 'border-red-200 bg-red-50/30 hover:border-red-300/50'
                                : 'border-red-200 bg-red-50/30 hover:border-red-300/50'
                        })()}`}>
                            <CardContent className="p-4">
                                {/* Company Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(() => {
                                                // If registration is expired, always use red styling
                                                const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                                if (isExpired) {
                                                    return 'bg-red-100'
                                                }

                                                // If not expired, use payment status colors
                                                return item.renewalPayment
                                                    ? item.renewalPayment.status === 'pending'
                                                        ? 'bg-yellow-100'
                                                        : item.renewalPayment.status === 'approved'
                                                            ? 'bg-green-100'
                                                            : 'bg-red-100'
                                                    : 'bg-red-100'
                                            })()}`}>
                                                <Building2 className={`h-4 w-4 ${(() => {
                                                    // If registration is expired, always use red styling
                                                    const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                                    if (isExpired) {
                                                        return 'text-red-600'
                                                    }

                                                    // If not expired, use payment status colors
                                                    return item.renewalPayment
                                                        ? item.renewalPayment.status === 'pending'
                                                            ? 'text-yellow-600'
                                                            : item.renewalPayment.status === 'approved'
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                        : 'text-red-600'
                                                })()}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-semibold truncate text-sm ${(() => {
                                                    // If registration is expired, always use red styling
                                                    const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                                    if (isExpired) {
                                                        return 'text-red-900'
                                                    }

                                                    // If not expired, use payment status colors
                                                    return item.renewalPayment
                                                        ? item.renewalPayment.status === 'pending'
                                                            ? 'text-yellow-900'
                                                            : item.renewalPayment.status === 'approved'
                                                                ? 'text-green-900'
                                                                : 'text-red-900'
                                                        : 'text-red-900'
                                                })()}`}>
                                                    {item.companyNameEnglish || "Unnamed Company"}
                                                </h3>
                                                <p className={`text-xs truncate ${(() => {
                                                    // If registration is expired, always use red styling
                                                    const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                                    if (isExpired) {
                                                        return 'text-red-700'
                                                    }

                                                    // If not expired, use payment status colors
                                                    return item.renewalPayment
                                                        ? item.renewalPayment.status === 'pending'
                                                            ? 'text-yellow-700'
                                                            : item.renewalPayment.status === 'approved'
                                                                ? 'text-green-700'
                                                                : 'text-red-700'
                                                        : 'text-red-700'
                                                })()}`}>
                                                    {item.contactPersonName || "Unknown Contact"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {(() => {
                                            // If registration is expired, always show "Expired" badge
                                            const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                            if (isExpired) {
                                                return <Badge variant="destructive" className="text-xs">Expired</Badge>
                                            }

                                            // If not expired, show payment status
                                            return item.renewalPayment ? (
                                                getStatusBadge(item.renewalPayment.status)
                                            ) : (
                                                <Badge variant="destructive" className="text-xs">Expired</Badge>
                                            )
                                        })()}
                                    </div>
                                </div>

                                {/* Company Details */}
                                <div className={`space-y-2 mb-3 rounded-lg p-2 ${(() => {
                                    // If registration is expired, always use red styling
                                    const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                    if (isExpired) {
                                        return 'bg-red-100/50'
                                    }

                                    // If not expired, use payment status colors
                                    return item.renewalPayment
                                        ? item.renewalPayment.status === 'pending'
                                            ? 'bg-yellow-100/50'
                                            : item.renewalPayment.status === 'approved'
                                                ? 'bg-green-100/50'
                                                : 'bg-red-100/50'
                                        : 'bg-red-100/50'
                                })()}`}>
                                    <div className={`flex items-center gap-2 text-xs ${(() => {
                                        // If registration is expired, always use red styling
                                        const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                        if (isExpired) {
                                            return 'text-red-700'
                                        }

                                        // If not expired, use payment status colors
                                        return item.renewalPayment
                                            ? item.renewalPayment.status === 'pending'
                                                ? 'text-yellow-700'
                                                : item.renewalPayment.status === 'approved'
                                                    ? 'text-green-700'
                                                    : 'text-red-700'
                                            : 'text-red-700'
                                    })()}`}>
                                        <User className={`h-3 w-3 ${(() => {
                                            // If registration is expired, always use red styling
                                            const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                            if (isExpired) {
                                                return 'text-red-500'
                                            }

                                            // If not expired, use payment status colors
                                            return item.renewalPayment
                                                ? item.renewalPayment.status === 'pending'
                                                    ? 'text-yellow-500'
                                                    : item.renewalPayment.status === 'approved'
                                                        ? 'text-green-500'
                                                        : 'text-red-500'
                                                : 'text-red-500'
                                        })()}`} />
                                        <span className="truncate">
                                            {item.contactPersonName || "Contact not specified"}
                                        </span>
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${(() => {
                                        // If registration is expired, always use red styling
                                        const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                        if (isExpired) {
                                            return 'text-red-700'
                                        }

                                        // If not expired, use payment status colors
                                        return item.renewalPayment
                                            ? item.renewalPayment.status === 'pending'
                                                ? 'text-yellow-700'
                                                : item.renewalPayment.status === 'approved'
                                                    ? 'text-green-700'
                                                    : 'text-red-700'
                                            : 'text-red-700'
                                    })()}`}>
                                        <Mail className={`h-3 w-3 ${(() => {
                                            // If registration is expired, always use red styling
                                            const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                            if (isExpired) {
                                                return 'text-red-500'
                                            }

                                            // If not expired, use payment status colors
                                            return item.renewalPayment
                                                ? item.renewalPayment.status === 'pending'
                                                    ? 'text-yellow-500'
                                                    : item.renewalPayment.status === 'approved'
                                                        ? 'text-green-500'
                                                        : 'text-red-500'
                                                : 'text-red-500'
                                        })()}`} />
                                        <span className="truncate">
                                            {item.contactPersonEmail || "Email not specified"}
                                        </span>
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${(() => {
                                        // If registration is expired, always use red styling
                                        const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                        if (isExpired) {
                                            return 'text-red-700'
                                        }

                                        // If not expired, use payment status colors
                                        return item.renewalPayment
                                            ? item.renewalPayment.status === 'pending'
                                                ? 'text-yellow-700'
                                                : item.renewalPayment.status === 'approved'
                                                    ? 'text-green-700'
                                                    : 'text-red-700'
                                            : 'text-red-700'
                                    })()}`}>
                                        <Calendar className={`h-3 w-3 ${(() => {
                                            // If registration is expired, always use red styling
                                            const isExpired = item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())
                                            if (isExpired) {
                                                return 'text-red-500'
                                            }

                                            // If not expired, use payment status colors
                                            return item.renewalPayment
                                                ? item.renewalPayment.status === 'pending'
                                                    ? 'text-yellow-500'
                                                    : item.renewalPayment.status === 'approved'
                                                        ? 'text-green-500'
                                                        : 'text-red-500'
                                                : 'text-red-500'
                                        })()}`} />
                                        <span>
                                            Expired: {formatDate(item.expireDate)}
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Status */}
                                {!item.renewalPayment || (item.renewalPayment.status === 'approved' && (item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date()))) ? (
                                    <div className="text-center py-2">
                                        <div className="text-xs font-medium text-red-800 mb-1">Secretary Practice Expired</div>
                                        <div className="text-xs text-red-600">Awaiting customer payment</div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Payment Details */}
                                        <div className="space-y-2 mb-3 bg-gray-50 rounded-lg p-2">
                                            <div className="flex items-center gap-2 text-xs text-gray-700">
                                                <Clock className="h-3 w-3 text-gray-500" />
                                                <span>
                                                    Submitted: {formatDate(item.renewalPayment.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Payment Receipt */}
                                        {item.renewalPayment.paymentReceipt && (
                                            <div className="mb-3">
                                                <Label className="text-xs font-medium text-gray-700">Payment Receipt</Label>
                                                <div className="mt-1">
                                                    {item.renewalPayment.paymentReceipt.type?.includes('image') ? (
                                                        <img
                                                            src={item.renewalPayment.paymentReceipt.url}
                                                            alt="Payment receipt"
                                                            className="w-full h-40 object-cover rounded border"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded border">
                                                            <FileText className="h-4 w-4 text-gray-500" />
                                                            <span className="text-xs truncate">
                                                                {item.renewalPayment.paymentReceipt.fileName || "receipt.pdf"}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="mt-2">
                                                        <PaymentReceiptViewer
                                                            receipt={{
                                                                name: item.renewalPayment.paymentReceipt.fileName || "receipt.pdf",
                                                                type: item.renewalPayment.paymentReceipt.type || "application/pdf",
                                                                size: item.renewalPayment.paymentReceipt.size || 0,
                                                                url: item.renewalPayment.paymentReceipt.url
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {item.renewalPayment.status === 'pending' && (
                                            <div className="space-y-2">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                                                        Renewal Period: 1 Year
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprovePayment(item.renewalPayment.id, item.renewalPayment.registrationId)}
                                                        disabled={isProcessingPayment === item.renewalPayment.id}
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        {isProcessingPayment === item.renewalPayment.id ? (
                                                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <Check className="h-3 w-3 mr-1" />
                                                        )}
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleRejectPayment(item.renewalPayment.id)}
                                                        disabled={isProcessingPayment === item.renewalPayment.id}
                                                        className="flex-1"
                                                    >
                                                        {isProcessingPayment === item.renewalPayment.id ? (
                                                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <X className="h-3 w-3 mr-1" />
                                                        )}
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Approved Status with Next Expiration Date - only show if registration is not currently expired */}
                                        {item.renewalPayment.status === 'approved' && !(item.isExpired || (item.expireDate && new Date(item.expireDate) < new Date())) && (
                                            <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-2 mb-2">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <span className="text-xs font-medium text-green-800">Payment Approved</span>
                                                    </div>
                                                    <div className="space-y-1 text-xs text-green-700">
                                                        <div>Registration Date: {formatDate(item.registerStartDate || item.createdAt)}</div>
                                                        <div>Next Expires: {(() => {
                                                            const startDate = new Date(item.registerStartDate || item.createdAt)
                                                            const expireDays = item.expireDays || 365
                                                            const nextExpireDate = new Date(startDate)
                                                            nextExpireDate.setDate(nextExpireDate.getDate() + expireDays)
                                                            return formatDate(nextExpireDate.toISOString())
                                                        })()}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Rejected Status */}
                                        {item.renewalPayment.status === 'rejected' && (
                                            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-2 mb-2">
                                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                                        <span className="text-xs font-medium text-red-800">Payment Rejected</span>
                                                    </div>
                                                    <div className="text-xs text-red-700">
                                                        Customer needs to resubmit payment
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
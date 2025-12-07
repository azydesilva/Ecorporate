import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { safeJsonParse } from '@/lib/utils'

export async function GET(request: NextRequest) {
    try {
        console.log('Overview API: Starting data fetch...')

        // Check if database is available
        if (!pool) {
            console.error('Overview API: Database pool not available')
            return NextResponse.json({
                error: 'Database not available',
                message: 'Database connection pool is not initialized. Please check database configuration.',
                fallbackData: {
                    totalCompanies: 0,
                    totalUsers: 0,
                    completedCompanies: 0,
                    pendingCompanies: 0,
                    estimatedRevenue: 0,
                    advancePaymentsApproved: 0,
                    balancePaymentsApproved: 0,
                    monthlyRevenue: 0,
                    paymentProcessing: 0,
                    paymentApproved: 0,
                    paymentRejected: 0,
                    monthlyTrends: [],
                    provinceData: [],
                    districtData: [],
                    divisionalSecretaryData: [],
                    packageData: [],
                    recentActivity: [],
                    verifiedUsers: 0,
                    unverifiedUsers: 0,
                    adminUsers: 0,
                    customerUsers: 0,
                }
            }, { status: 503 })
        }

        // Load all data directly from database
        let registrations = []
        let users = []
        let packages = []

        try {
            const connection = await pool.getConnection()

            // Get registrations with payment data
            const [registrationRows] = await connection.execute('SELECT * FROM registrations ORDER BY created_at DESC')
            registrations = registrationRows.map((row: any) => ({
                _id: row.id,
                id: row.id,
                companyName: row.company_name,
                companyNameEnglish: row.company_name_english,
                contactPersonName: row.contact_person_name,
                contactPersonEmail: row.contact_person_email,
                status: row.status,
                currentStep: row.current_step,
                documentsApproved: row.documents_approved,
                paymentApproved: row.payment_approved,
                selectedPackage: row.selected_package,
                province: row.province,
                district: row.district,
                divisional_secretariat: row.divisional_secretariat,
                paymentReceipt: safeJsonParse(row.payment_receipt),
                balancePaymentReceipt: safeJsonParse(row.balance_payment_receipt),
                additionalFees: safeJsonParse(row.additional_fees),
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }))

            // Get users
            const [userRows] = await connection.execute('SELECT * FROM users ORDER BY created_at DESC')
            users = userRows.map((row: any) => ({
                id: row.id,
                name: row.name,
                email: row.email,
                role: row.role,
                email_verified: row.email_verified
            }))

            // Get packages for mapping IDs to names
            const [packageRows] = await connection.execute('SELECT * FROM packages WHERE is_active = TRUE')
            packages = packageRows.map((row: any) => ({
                id: row.id,
                name: row.name,
                price: row.price,
                advanceAmount: row.advance_amount,
                balanceAmount: row.balance_amount
            }))

            connection.release()
            console.log('Overview API: Loaded from database - registrations:', registrations.length, 'users:', users.length, 'packages:', packages.length)
        } catch (dbError) {
            console.error('Overview API: Database error:', dbError)
            // Use mock data as fallback
            registrations = [
                {
                    _id: '1',
                    companyName: 'Sample Company 1',
                    companyNameEnglish: 'Sample Company 1',
                    status: 'completed',
                    currentStep: 'incorporate',
                    documentsApproved: true,
                    paymentApproved: true,
                    selectedPackage: 'standard-package-id',
                    province: 'Western Province',
                    district: 'Colombo',
                    divisional_secretariat: 'Colombo',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]
            users = [
                { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', email_verified: true }
            ]
            packages = [
                { id: 'standard-package-id', name: 'Standard Package', price: 50000, advanceAmount: 30000, balanceAmount: 20000 }
            ]
            console.log('Overview API: Using fallback data')
        }

        // Calculate comprehensive analytics
        const analytics = {
            // Basic counts
            totalCompanies: registrations.length,
            totalUsers: users.length,

            // Company status breakdown
            completedCompanies: registrations.filter(r =>
                r.status === 'completed' || r.documentsApproved || r.currentStep === 'incorporate'
            ).length,
            pendingCompanies: registrations.filter(r =>
                r.status !== 'completed' && !r.documentsApproved && r.currentStep !== 'incorporate'
            ).length,

            // Payment analytics
            paymentProcessing: registrations.filter(r =>
                r.status === 'payment-processing' || r.currentStep === 'contact-details'
            ).length,
            paymentApproved: registrations.filter(r => r.paymentApproved).length,
            paymentRejected: registrations.filter(r => r.status === 'payment-rejected').length,

            // Step breakdown
            contactDetails: registrations.filter(r => r.currentStep === 'contact-details').length,
            companyDetails: registrations.filter(r => r.currentStep === 'company-details').length,
            documentation: registrations.filter(r => r.currentStep === 'documentation').length,
            incorporation: registrations.filter(r => r.currentStep === 'incorporate').length,

            // Location analytics
            provinceData: generateLocationData(registrations, 'province'),
            districtData: generateLocationData(registrations, 'district'),
            divisionalSecretaryData: generateLocationData(registrations, 'divisional_secretariat'),

            // Package analytics
            packageData: generatePackageData(registrations, packages),

            // Monthly trends (last 12 months)
            monthlyTrends: generateMonthlyTrends(registrations),

            // Recent activity
            recentActivity: generateRecentActivity(registrations),

            // Revenue estimates (based on approved payments)
            estimatedRevenue: calculateEstimatedRevenue(registrations, packages),
            advancePaymentsApproved: calculateAdvancePayments(registrations, packages),
            balancePaymentsApproved: calculateBalancePayments(registrations, packages),
            monthlyRevenue: calculateMonthlyRevenue(registrations, packages),

            // User analytics
            verifiedUsers: users.filter(u => u.email_verified).length,
            unverifiedUsers: users.filter(u => !u.email_verified).length,
            adminUsers: users.filter(u => u.role === 'admin').length,
            customerUsers: users.filter(u => u.role === 'customer').length,
        }

        console.log('Overview API: Analytics calculated successfully')
        return NextResponse.json(analytics)
    } catch (error) {
        console.error('Overview API: Error fetching overview analytics:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch overview analytics',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

function generateLocationData(registrations: any[], field: string) {
    const data: { [key: string]: number } = {}

    registrations.forEach(r => {
        const value = r[field]
        // Only include registrations that have actual location data (not null, undefined, or empty)
        if (value && value.trim() !== '') {
            data[value] = (data[value] || 0) + 1
        }
    })

    return Object.entries(data)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15) // Top 15 locations
}

function generatePackageData(registrations: any[], packages: any[]) {
    const data: { [key: string]: number } = {}

    // Create a map of package ID to package name for efficient lookup
    const packageMap = new Map()
    packages.forEach(pkg => {
        packageMap.set(pkg.id, pkg.name)
    })

    registrations.forEach(r => {
        const packageId = r.selectedPackage || 'Standard'
        // Get the package name from the map, fallback to packageId if not found
        const packageName = packageMap.get(packageId) || packageId
        data[packageName] = (data[packageName] || 0) + 1
    })

    return Object.entries(data)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
}

function generateMonthlyTrends(registrations: any[]) {
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const currentDate = new Date()
    const trends = []

    // Generate data for last 12 months
    for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthName = months[date.getMonth()]
        const year = date.getFullYear()

        const count = registrations.filter(r => {
            const regDate = new Date(r.createdAt || r.updatedAt)
            return regDate.getMonth() === date.getMonth() &&
                regDate.getFullYear() === date.getFullYear()
        }).length

        trends.push({
            month: `${monthName} ${year}`,
            count,
            date: date.toISOString()
        })
    }

    return trends
}

function generateRecentActivity(registrations: any[]) {
    return registrations
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 10)
        .map(r => ({
            id: r._id,
            companyName: r.companyNameEnglish || r.companyName || 'Unnamed Company',
            customerName: r.customerName || r.contactPersonName || 'Unknown Customer',
            status: r.status || 'payment-processing',
            currentStep: r.currentStep || 'contact-details',
            updatedAt: r.updatedAt || r.createdAt,
            timestamp: new Date(r.updatedAt || r.createdAt).toISOString()
        }))
}

function calculateEstimatedRevenue(registrations: any[], packages: any[]) {
    // Create a map of package ID to package pricing for efficient lookup
    const packageMap = new Map()
    packages.forEach(pkg => {
        packageMap.set(pkg.id, {
            advance: Number(pkg.advanceAmount) || 0,
            balance: Number(pkg.balanceAmount) || 0
        })
    })

    let totalRevenue = 0

    registrations.forEach(registration => {
        const packageId = registration.selectedPackage
        const packagePricing = packageMap.get(packageId) || { advance: 0, balance: 0 }

        // Admin Step 1: Check if advance payment is approved
        if (registration.paymentApproved && registration.paymentReceipt) {
            totalRevenue += packagePricing.advance
        }

        // Admin Step 3: Check if balance payment is approved
        if (registration.balancePaymentReceipt && registration.balancePaymentReceipt.status === 'approved') {
            totalRevenue += packagePricing.balance
        }
    })

    return totalRevenue
}

function calculateAdvancePayments(registrations: any[], packages: any[]) {
    // Create a map of package ID to advance amount
    const packageMap = new Map()
    packages.forEach(pkg => {
        packageMap.set(pkg.id, Number(pkg.advanceAmount) || 0)
    })

    // Admin Step 1: Sum all approved advance payments
    return registrations
        .filter(r => r.paymentApproved && r.paymentReceipt)
        .reduce((total, r) => {
            const packageId = r.selectedPackage
            const advanceAmount = packageMap.get(packageId) || 0
            return total + advanceAmount
        }, 0)
}

function calculateBalancePayments(registrations: any[], packages: any[]) {
    // Create a map of package ID to balance amount
    const packageMap = new Map()
    packages.forEach(pkg => {
        packageMap.set(pkg.id, Number(pkg.balanceAmount) || 0)
    })

    // Admin Step 3: Sum all approved balance payments
    return registrations
        .filter(r => r.balancePaymentReceipt && r.balancePaymentReceipt.status === 'approved')
        .reduce((total, r) => {
            const packageId = r.selectedPackage
            const balanceAmount = packageMap.get(packageId) || 0
            return total + balanceAmount
        }, 0)
}

function calculateMonthlyRevenue(registrations: any[], packages: any[]) {
    // Create a map of package ID to package pricing for efficient lookup
    const packageMap = new Map()
    packages.forEach(pkg => {
        packageMap.set(pkg.id, {
            advance: Number(pkg.advanceAmount) || 0,
            balance: Number(pkg.balanceAmount) || 0
        })
    })

    // Get current month and year
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    let monthlyRevenue = 0

    registrations.forEach(registration => {
        const packageId = registration.selectedPackage
        const packagePricing = packageMap.get(packageId) || { advance: 0, balance: 0 }

        // Check if advance payment was approved in current month
        if (registration.paymentApproved && registration.paymentReceipt) {
            const paymentDate = new Date(registration.updatedAt || registration.createdAt)
            if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
                monthlyRevenue += packagePricing.advance
            }
        }

        // Check if balance payment was approved in current month
        if (registration.balancePaymentReceipt && registration.balancePaymentReceipt.status === 'approved') {
            const balanceDate = new Date(registration.updatedAt || registration.createdAt)
            if (balanceDate.getMonth() === currentMonth && balanceDate.getFullYear() === currentYear) {
                monthlyRevenue += packagePricing.balance
            }
        }
    })

    return monthlyRevenue
}

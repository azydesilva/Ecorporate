"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    BarChart3,
    Building,
    Users,
    Banknote,
    TrendingUp,
    TrendingDown,
    Clock,
    AlertCircle,
    RefreshCw,
    MapPin,
    Calendar,
    PieChart,
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart,
} from "recharts"
import { LocalStorageService } from "@/lib/database-service"

interface OverviewStats {
    totalCompanies: number
    completedCompanies: number
    pendingCompanies: number
    totalUsers: number
    estimatedRevenue: number
    advancePaymentsApproved: number
    balancePaymentsApproved: number
    monthlyRevenue: number
    paymentProcessing: number
    paymentApproved: number
    paymentRejected: number
    monthlyTrends: Array<{ month: string; count: number; date: string }>
    provinceData: Array<{ name: string; count: number }>
    districtData: Array<{ name: string; count: number }>
    divisionalSecretaryData: Array<{ name: string; count: number }>
    packageData: Array<{ name: string; count: number }>
    recentActivity: Array<{
        id: string;
        companyName: string;
        customerName: string;
        status: string;
        currentStep: string;
        timestamp: string
    }>
    verifiedUsers: number
    unverifiedUsers: number
    adminUsers: number
    customerUsers: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function OverviewDashboard() {
    const [stats, setStats] = useState<OverviewStats>({
        totalCompanies: 0,
        completedCompanies: 0,
        pendingCompanies: 0,
        totalUsers: 0,
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
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [dataSource, setDataSource] = useState<'api' | 'fallback' | 'mock'>('api')

    const loadOverviewData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch analytics data from API
            const response = await fetch('/api/overview')
            const responseData = await response.json()

            if (!response.ok) {
                // If API returns fallback data, use it
                if (responseData.fallbackData) {
                    console.log('Overview Dashboard: Using fallback data from API')
                    setStats(responseData.fallbackData)
                    setDataSource('mock')
                    return
                }
                throw new Error(responseData.details || responseData.message || `HTTP ${response.status}: ${response.statusText}`)
            }

            console.log('Overview Dashboard: Received analytics data:', responseData)
            console.log('Overview Dashboard: District data:', responseData.districtData)
            setStats(responseData)
            setDataSource('api')
        } catch (error) {
            console.error('Error loading overview data:', error)
            setError(error instanceof Error ? error.message : 'Failed to load overview data')
            // Fallback to local data if API fails
            console.log('Overview Dashboard: Falling back to local data...')
            await loadFallbackData()
        } finally {
            setLoading(false)
        }
    }

    const loadFallbackData = async () => {
        try {
            console.log('Loading fallback data...')

            // Try to load registrations and users data as fallback
            let registrations = []
            let users = []

            try {
                registrations = await LocalStorageService.getRegistrations()
                console.log('Fallback: Loaded registrations:', registrations.length)
            } catch (regError) {
                console.error('Fallback: Error loading registrations:', regError)
                // Use mock data if everything fails
                registrations = [
                    {
                        _id: '1',
                        companyName: 'Sample Company 1',
                        companyNameEnglish: 'Sample Company 1',
                        status: 'completed',
                        currentStep: 'incorporate',
                        documentsApproved: true,
                        paymentApproved: true,
                        selectedPackage: 'Standard',
                        province: 'Western Province',
                        district: 'Colombo',
                        divisional_secretariat: 'Colombo',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    {
                        _id: '2',
                        companyName: 'Sample Company 2',
                        companyNameEnglish: 'Sample Company 2',
                        status: 'payment-processing',
                        currentStep: 'contact-details',
                        documentsApproved: false,
                        paymentApproved: false,
                        selectedPackage: 'Premium',
                        province: 'Central Province',
                        district: 'Kandy',
                        divisional_secretariat: 'Kandy',
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        updatedAt: new Date(Date.now() - 86400000).toISOString()
                    }
                ]
            }

            try {
                users = await LocalStorageService.getUsers()
                console.log('Fallback: Loaded users:', users.length)
            } catch (userError) {
                console.error('Fallback: Error loading users:', userError)
                // Use mock user data
                users = [
                    { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', email_verified: true },
                    { id: '2', name: 'Customer User', email: 'customer@example.com', role: 'customer', email_verified: true }
                ]
            }

            // Calculate basic stats
            const totalCompanies = registrations.length
            const completedCompanies = registrations.filter(r =>
                r.status === 'completed' || r.documentsApproved || r.currentStep === 'incorporate'
            ).length
            const pendingCompanies = totalCompanies - completedCompanies
            const totalUsers = users.length

            // Calculate payment stats
            const estimatedRevenue = completedCompanies * 50000 // Assuming 50k per registration
            const paymentProcessing = registrations.filter(r =>
                r.status === 'payment-processing' || r.currentStep === 'contact-details'
            ).length
            const paymentApproved = registrations.filter(r => r.paymentApproved).length
            const paymentRejected = registrations.filter(r => r.status === 'payment-rejected').length

            // Generate monthly registration data (last 6 months)
            const monthlyTrends = generateMonthlyData(registrations)

            // Generate location-based data
            const provinceData = generateProvinceData(registrations)
            const districtData = generateDistrictData(registrations)
            const divisionalSecretaryData = generateDivisionalSecretaryData(registrations)

            // Generate package breakdown
            const packageData = generatePackageBreakdown(registrations)

            // Generate recent activity
            const recentActivity = generateRecentActivity(registrations)

            // Calculate monthly revenue from current month's registrations
            const currentMonth = new Date().getMonth()
            const currentYear = new Date().getFullYear()
            const monthlyRevenue = registrations
                .filter(r => {
                    const date = new Date(r.createdAt || r.updatedAt)
                    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
                })
                .length * 50000 // Estimate based on completed registrations

            const fallbackStats = {
                totalCompanies,
                completedCompanies,
                pendingCompanies,
                totalUsers,
                estimatedRevenue,
                advancePaymentsApproved: estimatedRevenue * 0.6, // Estimate 60% advance payments
                balancePaymentsApproved: estimatedRevenue * 0.4, // Estimate 40% balance payments
                monthlyRevenue,
                paymentProcessing,
                paymentApproved,
                paymentRejected,
                monthlyTrends,
                provinceData,
                districtData,
                divisionalSecretaryData,
                packageData,
                recentActivity,
                verifiedUsers: users.filter((u: any) => u.email_verified).length,
                unverifiedUsers: users.filter((u: any) => !u.email_verified).length,
                adminUsers: users.filter((u: any) => u.role === 'admin').length,
                customerUsers: users.filter((u: any) => u.role === 'customer').length,
            }

            console.log('Fallback stats calculated:', fallbackStats)
            console.log('Fallback Dashboard: District data:', fallbackStats.districtData)
            setStats(fallbackStats)
            setDataSource('fallback')
        } catch (error) {
            console.error('Error loading fallback data:', error)
            // Set minimal mock data as last resort
            setStats({
                totalCompanies: 0,
                completedCompanies: 0,
                pendingCompanies: 0,
                totalUsers: 0,
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
            })
            setDataSource('mock')
        }
    }

    const generateMonthlyData = (registrations: any[]) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        const currentMonth = new Date().getMonth()

        return months.map((month, index) => {
            const monthIndex = (currentMonth - 5 + index + 12) % 12
            const count = registrations.filter(r => {
                const date = new Date(r.createdAt || r.updatedAt)
                return date.getMonth() === monthIndex
            }).length
            const date = new Date(new Date().getFullYear(), monthIndex, 1).toISOString()
            return { month, count, date }
        })
    }

    const generateProvinceData = (registrations: any[]) => {
        const provinceCount: { [key: string]: number } = {}

        registrations.forEach(r => {
            const province = r.province || 'Unknown'
            provinceCount[province] = (provinceCount[province] || 0) + 1
        })

        return Object.entries(provinceCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
    }

    const generateDistrictData = (registrations: any[]) => {
        const districtCount: { [key: string]: number } = {}

        registrations.forEach(r => {
            const district = r.district || 'Unknown'
            districtCount[district] = (districtCount[district] || 0) + 1
        })

        const result = Object.entries(districtCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        console.log('generateDistrictData result:', result)
        return result
    }

    const generateDivisionalSecretaryData = (registrations: any[]) => {
        const dsCount: { [key: string]: number } = {}

        registrations.forEach(r => {
            const ds = r.divisional_secretariat || 'Unknown'
            dsCount[ds] = (dsCount[ds] || 0) + 1
        })

        return Object.entries(dsCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
    }


    const generatePackageBreakdown = (registrations: any[]) => {
        const packageCount: { [key: string]: number } = {}

        registrations.forEach(r => {
            const pkg = r.selectedPackage || 'Standard'
            packageCount[pkg] = (packageCount[pkg] || 0) + 1
        })

        // Sort packages by count (most popular first) and return top packages
        return Object.entries(packageCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10) // Show top 10 packages
    }

    const generateRecentActivity = (registrations: any[]) => {
        return registrations
            .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
            .slice(0, 5)
            .map(r => ({
                id: r._id,
                companyName: r.companyNameEnglish || r.companyName || 'Unnamed Company',
                customerName: r.contactPersonName || r.contact_person_name || '',
                status: r.status || 'updated',
                currentStep: r.currentStep || r.current_step || '',
                timestamp: new Date(r.updatedAt || r.createdAt).toISOString()
            }))
    }

    useEffect(() => {
        loadOverviewData()

        // Listen for packages-updated event to refresh data in real-time
        const handlePackagesUpdated = () => {
            console.log('Packages updated, refreshing overview data...')
            loadOverviewData()
        }

        window.addEventListener('packages-updated', handlePackagesUpdated)

        // Cleanup listener on unmount
        return () => {
            window.removeEventListener('packages-updated', handlePackagesUpdated)
        }
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 whitespace-nowrap truncate">Dashboard Overview</h1>
                        <p className="text-gray-600 mt-1">Complete analytics and insights for your business</p>
                        {dataSource !== 'api' && (
                            <div className="mt-2">
                                <Badge variant={dataSource === 'fallback' ? 'secondary' : 'destructive'} className="text-xs">
                                    {dataSource === 'fallback' ? 'Using Local Data' : 'Using Mock Data'}
                                </Badge>
                            </div>
                        )}
                    </div>
                    <Button onClick={loadOverviewData} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Retry
                    </Button>
                </div>

                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
                                <p className="text-red-700 mt-1">{error}</p>
                                <p className="text-red-600 text-sm mt-2">
                                    The system is using fallback data. Some features may be limited.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col items-start gap-3">
                <div className="min-w-0 flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 whitespace-nowrap truncate">Dashboard Overview</h1>
                    <p className="text-gray-600 mt-1">Complete analytics and insights for your business</p>
                    {dataSource !== 'api' && (
                        <div className="mt-2">
                            <Badge variant={dataSource === 'fallback' ? 'secondary' : 'destructive'} className="text-xs">
                                {dataSource === 'fallback' ? 'Using Local Data' : 'Using Mock Data'}
                            </Badge>
                        </div>
                    )}
                </div>
                <Button onClick={loadOverviewData} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh Data
                </Button>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    LKR {stats.estimatedRevenue.toLocaleString()}
                                </p>
                                <div className="text-sm text-gray-500 mt-1 space-y-1">
                                    <div>Advance: LKR {stats.advancePaymentsApproved.toLocaleString()}</div>
                                    <div>Balance: LKR {stats.balancePaymentsApproved.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Banknote className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    LKR {stats.monthlyRevenue.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {stats.completedCompanies} completed
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.customerUsers}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Registered customers
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>


            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Registrations Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Monthly Registrations
                        </CardTitle>
                        <CardDescription>Company registrations over the last 12 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.monthlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* District-wise Registration Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Registration Districts
                        </CardTitle>
                        <CardDescription>Distribution of registrations by district</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.districtData && stats.districtData.length > 0 ? (
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                <div className="w-full md:w-1/2">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={stats.districtData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={90}
                                                fill="#8884d8"
                                                dataKey="count"
                                            >
                                                {stats.districtData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full md:w-1/2 space-y-2">
                                    {stats.districtData.map((district, index) => (
                                        <div key={district.name} className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {district.name}
                                            </span>
                                            <span className="text-sm text-gray-500 ml-auto">
                                                {district.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-gray-500">
                                <div className="text-center">
                                    <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-sm">No district data available</p>
                                    <p className="text-xs text-gray-400 mt-1">District information will appear here once registrations are added</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Location Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Province Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Top Provinces
                        </CardTitle>
                        <CardDescription>Company registrations by province</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.provinceData.slice(0, 5).map((province, index) => (
                                <div key={province.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium">{province.name}</span>
                                    </div>
                                    <Badge variant="secondary">{province.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* District Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Top Districts
                        </CardTitle>
                        <CardDescription>Company registrations by district</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.districtData.slice(0, 5).map((district, index) => (
                                <div key={district.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium">{district.name}</span>
                                    </div>
                                    <Badge variant="secondary">{district.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Divisional Secretary Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Top Divisional Secretariats
                        </CardTitle>
                        <CardDescription>Company registrations by divisional secretariat</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.divisionalSecretaryData.slice(0, 5).map((ds, index) => (
                                <div key={ds.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium">{ds.name}</span>
                                    </div>
                                    <Badge variant="secondary">{ds.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Package Breakdown and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Package Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Top Packages
                        </CardTitle>
                        <CardDescription>Most popular registration packages</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.packageData.slice(0, 5).map((pkg, index) => (
                                <div key={pkg.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium">{pkg.name}</span>
                                    </div>
                                    <Badge variant="secondary">{pkg.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest company registration updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Building className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {activity.companyName}
                                        </p>
                                        <p className="text-xs text-gray-500">{activity.customerName}</p>
                                        <p className="text-xs text-gray-400">{activity.status}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(activity.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

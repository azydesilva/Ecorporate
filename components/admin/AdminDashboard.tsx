"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Eye,
  RefreshCw,
  LogOut,
  FileText,
  CheckCircle,
  Building,
  Users,
  SettingsIcon,
  User,
  Briefcase,
  ShieldAlert,
  Shield,
  Search,
  X,
  Mail,
  Clock,
  Phone,
  Trash2,
  MessageSquare,
  Pin,
  PinOff,
  BarChart3,
  Calendar,
  BookOpen,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import BankDetailsSettings from "./BankDetailsSettings"
import UserManagement from "./UserManagement"
import MessageManagement from "./MessageManagement"
import OverviewDashboard from "./OverviewDashboard"
import AboutSettings from "./AboutSettings"
import SecretaryRenewPage from "./SecretaryRenewPage"

import { isAdmin, changeUserPassword, updateUser, getUserById } from "@/lib/auth-utils"
import CustomizationSettings from "./CustomizationSettings"
import PaymentSettings from "./PaymentSettings"
import ChangePasswordForm from "../user/ChangePasswordForm"
import ChangeEmailForm from "../user/ChangeEmailForm"
import { settingsStorage } from "@/lib/local-storage"
import { LocalStorageService } from "@/lib/database-service"
import { Menu } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import AdminSidebarContent from "./AdminSidebarContent"

// Helper function to format time ago
const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
  }

  return date.toLocaleDateString()
}

// AccountSettingsTabs helper component (must be after export default)
function AccountSettingsTabs({ user }: { user: any }) {
  const [tab, setTab] = useState("email");
  return (
    <div>
      <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden w-fit bg-white">
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'email' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
          onClick={() => setTab('email')}
        >
          Change Email
        </button>
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r-0 border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'password' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
          onClick={() => setTab('password')}
        >
          Change Password
        </button>
      </div>
      {tab === "email" && (
        <div>
          <h3 className="text-lg font-medium mb-4">Change Email</h3>
          <ChangeEmailForm
            currentEmail={user.email}
            onSubmit={async (newEmail: string) => {
              try {
                // Get the current user data to include password
                const currentUser = await getUserById(user.id);
                if (!currentUser) {
                  console.error('Current user not found');
                  return false;
                }

                const updatedUser = await updateUser(user.id, {
                  name: user.name,
                  email: newEmail,
                  role: user.role,
                  password: currentUser.password // Include the current password
                });
                if (updatedUser) {
                  // Update localStorage with the new user data
                  localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                  // Dispatch a custom event to notify the parent component
                  window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));
                  return true;
                }
                return false;
              } catch (error) {
                console.error('Error updating email:', error);
                return false;
              }
            }}
          />
        </div>
      )}
      {tab === "password" && (
        <div>
          <h3 className="text-lg font-medium mb-4">Change Password</h3>
          <ChangePasswordForm
            onSubmit={async (currentPassword: string, newPassword: string) => {
              try {
                const success = await changeUserPassword(user.id, currentPassword, newPassword);
                return success;
              } catch (error) {
                console.error('Error changing password:', error);
                return false;
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

type AdminDashboardProps = {
  user: any
  navigateTo: (page: string, id?: string) => void
  onLogout: () => void
  bankDetails: any
  onUpdateBankDetails: (data: any) => Promise<any>
  registrations?: any[]
}

export default function AdminDashboard({
  user,
  navigateTo,
  onLogout,
  bankDetails,
  onUpdateBankDetails,
  registrations = [],
}: AdminDashboardProps) {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("companies")
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [viewStep, setViewStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [logo, setLogo] = useState<string | null>(null)
  const [sidebarColor, setSidebarColor] = useState<string>("")
  const [sidebarTextColor, setSidebarTextColor] = useState<string>("")
  const [appTitle, setAppTitle] = useState<string>('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false) // Add this state
  const [companyToDelete, setCompanyToDelete] = useState<any>(null) // Add this state
  const [pinningId, setPinningId] = useState<string | null>(null) // Add this state for pin/unpin loading
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Helper to determine if a color is dark
  function isColorDark(hex: string) {
    if (!hex) return false;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    // Perceived brightness formula
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 128;
  }

  // Check if user is admin
  const userIsAdmin = isAdmin(user)

  // Load logo and sidebar color from settings
  useEffect(() => {
    const updateLogoAndSidebarColor = () => {
      const settings = settingsStorage.getSettings()
      setLogo(settings?.logo || null)
      setAppTitle(settings?.title || '')
      // If admin enabled color switch, use primary color, else use default
      const color = settings?.changeNavbarColor ? settings?.primaryColor || "#2563eb" : ""
      setSidebarColor(color)
      setSidebarTextColor(isColorDark(color) ? "#fff" : "")
    }

    updateLogoAndSidebarColor()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'appSettings') {
        updateLogoAndSidebarColor()
      }
    }

    const handleLocalChange = () => {
      updateLogoAndSidebarColor()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('storage-updated', handleLocalChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('storage-updated', handleLocalChange)
    }
  }, [])

  // Check for tab navigation from header
  useEffect(() => {
    const savedTab = sessionStorage.getItem('adminDashboardTab')
    if (savedTab) {
      setActiveTab(savedTab)
      sessionStorage.removeItem('adminDashboardTab')
    }
  }, [])

  // Update filtered companies whenever search query, status filter, or companies change
  useEffect(() => {
    const searchLower = searchQuery.toLowerCase().trim()

    let filtered = companies

    // Apply status filter first
    if (statusFilter !== "all") {
      filtered = filtered.filter((company) => {
        const currentStep = company.currentStep || ""
        const status = company.status || ""

        switch (statusFilter) {
          case "pinned":
            // Handle both boolean true and numeric 1 from database
            return company.pinned === true || company.pinned === 1 || company.pinned === "1"
          case "booked":
            // Handle both boolean true and numeric 1 from database
            return company.companyDetailsLocked === true || company.companyDetailsLocked === 1 || company.companyDetailsLocked === "1"
          case "step1":
            return status === "payment-processing" || status === "payment-rejected"
          case "step2":
            return status === "documentation-processing" && !company.detailsApproved
          case "step3":
            return status === "incorporation-processing" || status === "documents-published" || (status === "documentation-processing" && company.detailsApproved)
          case "step4":
            return status === "documents-submitted" || status === "completed" || company.documentsApproved
          case "pending-reservation":
            return status === "documentation-processing" &&
              !company.detailsApproved &&
              !(company.companyDetailsLocked === true ||
                company.companyDetailsLocked === 1 ||
                company.companyDetailsLocked === "1")
          case "secretary":
            // Show companies with secretary records that haven't been noted yet, 
            // or have new records submitted after the last noted timestamp
            if (!company.resolutions_docs || company.resolutions_docs.length === 0) {
              return false;
            }

            // If never noted, show it
            if (!company.secretaryRecordsNotedAt) {
              return true;
            }

            // Check if there are any records newer than the last noted timestamp
            const lastNotedTime = new Date(company.secretaryRecordsNotedAt);
            return company.resolutions_docs.some((doc: any) => {
              const docTime = new Date(doc.uploadedAt || doc.createdAt || doc.timestamp);
              return docTime > lastNotedTime;
            });
          default:
            return true
        }
      })
    }

    // Apply search filter
    if (searchLower) {
      filtered = filtered.filter((company) => {
        const companyName = (company.companyNameEnglish || company.companyName || "").toLowerCase()
        const contactName = (company.customerName || company.contactPersonName || "").toLowerCase()
        const contactEmail = (company.contactPersonEmail || "").toLowerCase()
        const userName = (company.userName || "").toLowerCase()
        const userEmail = (company.userEmail || "").toLowerCase()
        const status = (company.status || "").toLowerCase()

        return companyName.includes(searchLower) ||
          contactName.includes(searchLower) ||
          contactEmail.includes(searchLower) ||
          userName.includes(searchLower) ||
          userEmail.includes(searchLower) ||
          status.includes(searchLower)
      })
    }

    console.log('Filter applied:', {
      statusFilter,
      totalCompanies: companies.length,
      filteredCount: filtered.length,
      pinnedCompanies: companies.filter(c => c.pinned === true || c.pinned === 1 || c.pinned === "1").length,
      bookedCompanies: companies.filter(c => c.companyDetailsLocked === true || c.companyDetailsLocked === 1 || c.companyDetailsLocked === "1").length,
      samplePinnedData: companies.slice(0, 3).map(c => ({ id: c._id, pinned: c.pinned, type: typeof c.pinned })),
      sampleBookedData: companies.slice(0, 3).map(c => ({ id: c._id, companyDetailsLocked: c.companyDetailsLocked, type: typeof c.companyDetailsLocked }))
    })
    setFilteredCompanies(filtered)
  }, [searchQuery, statusFilter, companies])

  useEffect(() => {
    // Load companies data
    const loadCompanies = async () => {
      try {
        setLoading(true)

        // First try to load from database
        let databaseRegistrations = []
        try {
          databaseRegistrations = await LocalStorageService.getRegistrations()
          console.log('Loaded registrations from database:', databaseRegistrations.length)
        } catch (dbError) {
          console.warn('Database unavailable, using fallback:', dbError)
        }

        // Use database registrations if available, otherwise use props
        let allRegistrations = databaseRegistrations.length > 0 ? databaseRegistrations : registrations

        // Sort registrations: pinned first, then by updatedAt date (newest first)
        const sortedRegistrations = [...allRegistrations].sort((a, b) => {
          // First, sort by pinned status (pinned items first)
          const aPinned = a.pinned || false
          const bPinned = b.pinned || false

          if (aPinned && !bPinned) return -1 // a comes first
          if (!aPinned && bPinned) return 1  // b comes first

          // If both have same pinned status, sort by date (newest first)
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
          return dateB - dateA // Descending order (newest first)
        })

        setCompanies(sortedRegistrations)
        console.log('Admin dashboard loaded companies:', sortedRegistrations.length)
        console.log('Sample company data:', sortedRegistrations.slice(0, 2).map(c => ({ id: c._id, pinned: c.pinned, pinnedType: typeof c.pinned })))
      } catch (error) {
        console.error('Error loading companies:', error)
        setCompanies([])
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()

    // Listen for registration updates
    const handleRegistrationUpdate = () => {
      console.log('Registration update detected, refreshing companies...')
      loadCompanies()
    }

    window.addEventListener('registration-updated', handleRegistrationUpdate)

    return () => {
      window.removeEventListener('registration-updated', handleRegistrationUpdate)
    }
  }, [registrations])

  // Update default tab and enforce access control
  useEffect(() => {
    if (!userIsAdmin && (activeTab === "settings" || activeTab === "users")) {
      setActiveTab("companies")
    }
  }, [activeTab, userIsAdmin])

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payment-processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5 h-5">
            Payment
          </Badge>
        )
      case "payment-rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs px-2 py-0.5 h-5">
            Rejected
          </Badge>
        )
      case "documentation-processing":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-0.5 h-5">
            Docs
          </Badge>
        )
      case "incorporation-processing":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs px-2 py-0.5 h-5">
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5 h-5">
            Incorporated
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5 h-5">
            Payment
          </Badge>
        )
    }
  }

  // Refresh companies data
  const refreshCompanies = async () => {
    try {
      setLoading(true)
      const databaseRegistrations = await LocalStorageService.getRegistrations()
      const sortedRegistrations = [...databaseRegistrations].sort((a, b) => {
        // First, sort by pinned status (pinned items first)
        const aPinned = a.pinned || false
        const bPinned = b.pinned || false

        if (aPinned && !bPinned) return -1 // a comes first
        if (!aPinned && bPinned) return 1  // b comes first

        // If both have same pinned status, sort by date (newest first)
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return dateB - dateA
      })
      setCompanies(sortedRegistrations)
      console.log('Refreshed companies:', sortedRegistrations.length)
    } catch (error) {
      console.error('Error refreshing companies:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get role badge for header
  const getRoleBadge = () => {
    if (user.role === "admin") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
          <ShieldAlert className="h-3 w-3" /> Admin
        </Badge>
      )
    }
    return null
  }

  // Add delete company function
  const deleteCompany = async (companyId: string) => {
    if (!companyId) return;

    // Set deleting state
    setDeletingId(companyId);

    try {
      const response = await fetch(`/api/registrations/${companyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete company registration');
      }

      // Remove the company from the local state
      setCompanies(prev => prev.filter(company => company._id !== companyId));
      setFilteredCompanies(prev => prev.filter(company => company._id !== companyId));

      console.log(`Company registration ${companyId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting company registration:', error);
      alert('Failed to delete company registration. Please try again.');
    } finally {
      // Reset deleting state
      setDeletingId(null);
      // Close dialog
      setShowDeleteDialog(false);
      setCompanyToDelete(null);
    }
  }

  // Add pin/unpin company function
  const togglePinCompany = async (companyId: string, currentPinnedStatus: boolean) => {
    if (!companyId) {
      console.error('togglePinCompany: No company ID provided');
      alert('Error: No company ID provided');
      return;
    }

    // Set pinning state
    setPinningId(companyId);

    try {
      const newPinnedStatus = !currentPinnedStatus;
      await LocalStorageService.togglePinnedStatus(companyId, newPinnedStatus);

      // Update the company in the local state
      setCompanies(prev => prev.map(company =>
        (company._id || company.id) === companyId
          ? { ...company, pinned: newPinnedStatus }
          : company
      ));
      setFilteredCompanies(prev => prev.map(company =>
        (company._id || company.id) === companyId
          ? { ...company, pinned: newPinnedStatus }
          : company
      ));

      console.log(`Company registration ${companyId} ${newPinnedStatus ? 'pinned' : 'unpinned'} successfully`);
    } catch (error) {
      console.error('Error toggling pin status:', error);
      alert('Failed to toggle pin status. Please try again.');
    } finally {
      // Reset pinning state
      setPinningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Top Bar */}
      <div className="md:hidden border-b bg-background overflow-x-auto">
        <div className="h-14 px-4 flex items-center justify-between min-w-max whitespace-nowrap">
          <button
            aria-label="Open menu"
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center justify-center min-w-0">
            {logo ? (
              <div className="flex items-center gap-2 truncate">
                <img src={logo} alt="Logo" className="h-6 w-auto object-contain" />
                {/* Removed appTitle display in mobile view as requested */}
              </div>
            ) : (
              <div className="w-6 h-6"></div>
            )}
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <AdminSidebarContent
            logo={logo}
            sidebarColor={sidebarColor}
            sidebarTextColor={sidebarTextColor}
            activeTab={activeTab}
            setActiveTab={(t) => { setActiveTab(t); }}
            user={user}
            userIsAdmin={userIsAdmin}
            onLogout={() => { onLogout(); setMobileMenuOpen(false); }}
            onNavigateToDashboard={() => navigateTo('adminDashboard')}
            onAfterNavigate={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Fixed Sidebar (desktop) */}
        <div
          className={`w-64 border-r flex-col fixed left-0 h-full overflow-y-auto hidden md:flex ${!sidebarColor ? 'bg-background text-foreground' : ''}`}
          style={{
            top: '0px',
            height: '100vh',
            background: sidebarColor || undefined,
            color: sidebarTextColor || undefined,
            transition: 'background 0.3s, color 0.3s',
          }}
        >
          <AdminSidebarContent
            logo={logo}
            sidebarColor={sidebarColor}
            sidebarTextColor={sidebarTextColor}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            userIsAdmin={userIsAdmin}
            onLogout={onLogout}
            onNavigateToDashboard={() => navigateTo('adminDashboard')}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto md:ml-64" style={{ height: '100vh' }}>
          <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <OverviewDashboard />
            )}

            {/* Companies Tab */}
            {activeTab === "companies" && (
              <>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : companies.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">Company Registrations</CardTitle>
                          <CardDescription>Manage all company registrations</CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshCompanies}
                          disabled={loading}
                          className="gap-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                      <div className="mt-4 flex items-center space-x-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-input rounded-md bg-background/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-input placeholder:text-muted-foreground/70 shadow-sm transition-colors"
                          />
                          {searchQuery && (
                            <div className="absolute inset-y-0 right-0 flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setSearchQuery("")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {filteredCompanies.length > 0 && companies.length > filteredCompanies.length && (
                          <div className="flex items-center px-3 py-1.5 text-xs text-muted-foreground bg-muted rounded-md">
                            <span>Found </span>
                            <span className="font-medium px-1">{filteredCompanies.length}</span>
                            <span>of </span>
                            <span className="font-medium px-1">{companies.length}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Status Filter Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6 md:grid-cols-none md:flex md:flex-row md:items-stretch md:gap-3 md:overflow-x-auto md:whitespace-nowrap">
                        {[
                          { key: "all", label: "All", count: companies.length },
                          { key: "pinned", label: "Pinned", count: companies.filter(c => c.pinned === true || c.pinned === 1 || c.pinned === "1").length },
                          { key: "booked", label: "Booked", count: companies.filter(c => c.companyDetailsLocked === true || c.companyDetailsLocked === 1 || c.companyDetailsLocked === "1").length },
                          { key: "step1", label: "Payment", count: companies.filter(c => c.status === "payment-processing" || c.status === "payment-rejected").length },
                          {
                            key: "pending-reservation",
                            label: "Pending for Reservation",
                            count: companies.filter(c =>
                              c.status === "documentation-processing" &&
                              !c.detailsApproved &&
                              !(c.companyDetailsLocked === true ||
                                c.companyDetailsLocked === 1 ||
                                c.companyDetailsLocked === "1")
                            ).length
                          },
                          { key: "step2", label: "Details", count: companies.filter(c => c.status === "documentation-processing" && !c.detailsApproved).length },
                          { key: "step3", label: "Documents", count: companies.filter(c => c.status === "incorporation-processing" || c.status === "documents-published" || (c.status === "documentation-processing" && c.detailsApproved)).length },
                          { key: "step4", label: "Final", count: companies.filter(c => c.status === "documents-submitted" || c.status === "completed" || c.documentsApproved).length },
                          {
                            key: "secretary", label: "Secretary Records", count: companies.filter(c => {
                              // Count companies with secretary records that haven't been noted yet, 
                              // or have new records submitted after the last noted timestamp
                              if (!c.resolutions_docs || c.resolutions_docs.length === 0) {
                                return false;
                              }

                              // If never noted, count it
                              if (!c.secretaryRecordsNotedAt) {
                                return true;
                              }

                              // Check if there are any records newer than the last noted timestamp
                              const lastNotedTime = new Date(c.secretaryRecordsNotedAt);
                              return c.resolutions_docs.some((doc: any) => {
                                const docTime = new Date(doc.uploadedAt || doc.createdAt || doc.timestamp);
                                return docTime > lastNotedTime;
                              });
                            }).length
                          }
                        ].map((filter) => (
                          <button
                            key={filter.key}
                            onClick={() => setStatusFilter(filter.key)}
                            className={`w-full md:w-auto md:shrink-0 px-3 py-2.5 sm:py-2 rounded-lg border transition-all duration-200 inline-flex items-center justify-between gap-2 text-sm sm:text-[0.95rem] ${filter.key === "secretary" ? "col-span-2 sm:col-span-3 md:col-span-1" : ""} ${statusFilter === filter.key
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-primary/5"
                              }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {filter.key === "pinned" && (
                                <Pin className="h-4 w-4 flex-shrink-0" />
                              )}
                              {filter.key === "booked" && (
                                <BookOpen className="h-4 w-4 flex-shrink-0" />
                              )}
                              {filter.key === "pending-reservation" && (
                                <Clock className="h-4 w-4 flex-shrink-0" />
                              )}
                              {filter.key === "secretary" && (
                                <FileText className="h-4 w-4 flex-shrink-0" />
                              )}
                              <span className="font-medium truncate">{filter.label}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${statusFilter === filter.key
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-gray-100 text-gray-600"
                              }`}>
                              {filter.count}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredCompanies.map((company: any, index: number) => (
                          <Card key={company._id || `company-${index}`} className="group hover:shadow-md transition-all duration-300 border border-gray-200 shadow-sm bg-white hover:border-primary/20">
                            <CardContent className="p-4">
                              {/* Company Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                      <Building className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="mb-0.5">
                                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${company.companyEntity
                                          ? 'text-primary bg-primary/10'
                                          : 'text-gray-500 bg-gray-100'
                                          }`}>
                                          {company.companyEntity || 'Entity Not Set'}
                                        </span>
                                      </div>
                                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                                        {company.companyNameEnglish || "Unnamed Company"}
                                      </h3>
                                      <p className="text-xs text-gray-600 truncate">
                                        {company.customerName || company.contactPersonName || "Unknown Customer"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  {getStatusBadge(company.status || "payment-processing")}
                                </div>
                              </div>

                              {/* Company Details */}
                              <div className="space-y-2 mb-3 bg-gray-50 rounded-lg p-2">
                                <div className="flex items-center gap-2 text-xs text-gray-700">
                                  <User className="h-3 w-3 text-gray-500" />
                                  <span className="truncate">
                                    {company.customerName || company.contactPersonName || "Customer not specified"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-700">
                                  <Mail className="h-3 w-3 text-gray-500" />
                                  <span className="truncate">
                                    {company.contactPersonEmail || "Email not specified"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-700">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  <span>
                                    {company.updatedAt || company.createdAt ? formatTimeAgo(new Date(company.updatedAt || company.createdAt)) : "Recently"}
                                  </span>
                                </div>
                                {/* Registered and Expired Dates as Badges */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-[10px] font-medium">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      Reg: {company.registerStartDate
                                        ? new Date(company.registerStartDate).toLocaleDateString()
                                        : 'Not Set'
                                      }
                                    </span>
                                  </div>
                                  <div className={`inline-flex items-center gap-1 px-2 py-1 border rounded-md text-[10px] font-medium ${company.expireDate
                                    ? (company.isExpired
                                      ? 'bg-red-100 text-red-700 border-red-300'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                    )
                                    : 'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}>
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      Exp: {company.expireDate
                                        ? new Date(company.expireDate).toLocaleDateString()
                                        : 'Not Set'
                                      }
                                    </span>
                                    {company.expireDate && company.isExpired && (
                                      <span className="ml-1 px-1 py-0.5 bg-red-200 text-red-800 rounded text-[9px] font-bold">
                                        EXPIRED
                                      </span>
                                    )}
                                  </div>
                                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-medium">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      Sec: {company.secretaryPeriodYear ? `${company.secretaryPeriodYear} ${company.secretaryPeriodYear === '1' || company.secretaryPeriodYear === 1 ? 'Year' : 'Years'}` : 'Not Set'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Registration Flow Indicator */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-gray-700">Registration Progress</span>
                                  <span className="text-xs text-gray-500">
                                    {(() => {
                                      const currentStep = company.currentStep || 'payment-processing';
                                      const status = company.status || 'payment-processing';

                                      // If status is completed, show 100%
                                      if (status === 'completed') {
                                        return '100%';
                                      }

                                      // Calculate progress based on completed steps
                                      // When currentStep is "company-details", step 1 is completed (25%)
                                      // When currentStep is "documentation", step 2 is completed (50%)
                                      // When currentStep is "incorporate", step 3 is completed (75%)
                                      const completedStepsMap: { [key: string]: number } = {
                                        'contact-details': 0,  // No steps completed yet
                                        'company-details': 1,  // Step 1 completed (25%)
                                        'documentation': 2,    // Step 2 completed (50%)
                                        'incorporate': 3       // Step 3 completed (75%)
                                      };
                                      const completedSteps = completedStepsMap[currentStep] || 0;
                                      const percentage = Math.round((completedSteps / 4) * 100);
                                      return `${percentage}%`;
                                    })()}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 relative">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${(() => {
                                        const currentStep = company.currentStep || 'payment-processing';
                                        const status = company.status || 'payment-processing';

                                        // If status is completed, show 100%
                                        if (status === 'completed') {
                                          return '100%';
                                        }

                                        // Calculate progress based on completed steps
                                        const completedStepsMap: { [key: string]: number } = {
                                          'contact-details': 0,  // No steps completed yet
                                          'company-details': 1,  // Step 1 completed (25%)
                                          'documentation': 2,    // Step 2 completed (50%)
                                          'incorporate': 3       // Step 3 completed (75%)
                                        };
                                        const completedSteps = completedStepsMap[currentStep] || 0;
                                        // Calculate width based on actual percentage (no alignment needed since steps are removed)
                                        return (completedSteps / 4) * 100;
                                      })()}%`
                                    }}
                                  ></div>
                                </div>

                              </div>

                              {/* Action Buttons */}
                              <div className="flex justify-between items-center mt-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Set the company to delete and show dialog
                                      setCompanyToDelete(company);
                                      setShowDeleteDialog(true);
                                    }}
                                    disabled={deletingId === company._id}
                                  >
                                    {deletingId === company._id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-8 w-8 p-0 ${company.pinned
                                      ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                      }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const companyId = company._id || company.id;
                                      if (!companyId) {
                                        console.error('No company ID found:', company);
                                        alert('Error: No company ID found');
                                        return;
                                      }
                                      togglePinCompany(companyId, company.pinned || false);
                                    }}
                                    disabled={pinningId === (company._id || company.id)}
                                    title={company.pinned ? "Unpin this registration" : "Pin this registration"}
                                  >
                                    {pinningId === (company._id || company.id) ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : company.pinned ? (
                                      <Pin className="h-4 w-4" />
                                    ) : (
                                      <PinOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  {statusFilter === "secretary" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 text-xs px-3 py-1 h-8"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const response = await fetch(`/api/registrations/${company._id}/noted`, {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({ noted: true }),
                                          });

                                          if (response.ok) {
                                            const result = await response.json();
                                            // Update the company in the local state
                                            setCompanies(prevCompanies =>
                                              prevCompanies.map(c =>
                                                c._id === company._id ? {
                                                  ...c,
                                                  noted: true,
                                                  secretaryRecordsNotedAt: result.secretaryRecordsNotedAt
                                                } : c
                                              )
                                            );
                                            console.log('✅ Company marked as noted:', company._id);
                                          } else {
                                            console.error('❌ Failed to mark company as noted');
                                          }
                                        } catch (error) {
                                          console.error('❌ Error marking company as noted:', error);
                                        }
                                      }}
                                    >
                                      Noted
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigateTo("companyDetails", company._id || `company-${index}`)}
                                    className="gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 text-xs px-3 py-1 h-8"
                                  >
                                    <Eye className="h-3 w-3" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Building className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Companies Registered</h3>
                      <p className="text-gray-500 text-center max-w-md mb-8">
                        There are no company registrations yet. Companies will appear here once they start the registration process.
                      </p>

                      {/* Search Component */}
                      <div className="w-full max-w-md">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                              onClick={() => setSearchQuery("")}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Search functionality will be available when companies are registered
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Users Tab */}
            {activeTab === "users" && userIsAdmin && (
              <UserManagement currentUser={user} />
            )}

            {/* Messages Tab */}
            {activeTab === "messages" && userIsAdmin && (
              <MessageManagement currentUser={user} />
            )}

            {/* Secretary Renew Tab */}
            {activeTab === "secretary-renew" && userIsAdmin && (
              <SecretaryRenewPage navigateTo={navigateTo} user={user} />
            )}

            {/* Account Settings Tab with Sub-Tabs */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Account Settings</CardTitle>
                    <CardDescription>Manage your account information and security settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AccountSettingsTabs user={user} />
                  </CardContent>
                </Card>
              </div>
            )}


            {/* Settings Tab - Now shows Customization directly */}
            {activeTab === "settings" && userIsAdmin && (
              <CustomizationSettings />
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && userIsAdmin && (
              <PaymentSettings />
            )}

            {/* About Tab */}
            {activeTab === "about" && userIsAdmin && (
              <AboutSettings />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the registration for{" "}
                    <span className="font-semibold">
                      {companyToDelete?.companyNameEnglish || companyToDelete?.companyName || "this company"}
                    </span>{" "}
                    and remove all associated data and files.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => companyToDelete && deleteCompany(companyToDelete._id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}

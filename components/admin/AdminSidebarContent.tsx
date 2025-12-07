"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Briefcase, Building, FileText, LogOut, MessageSquare, RefreshCw, SettingsIcon, User } from "lucide-react"

type AdminSidebarContentProps = {
    logo: string | null
    sidebarColor: string
    sidebarTextColor: string
    activeTab: string
    setActiveTab: (tab: string) => void
    user: any
    userIsAdmin: boolean
    onLogout: () => void
    onNavigateToDashboard?: () => void
    onAfterNavigate?: () => void
}

export default function AdminSidebarContent({
    logo,
    sidebarColor,
    sidebarTextColor,
    activeTab,
    setActiveTab,
    user,
    userIsAdmin,
    onLogout,
    onNavigateToDashboard,
    onAfterNavigate,
}: AdminSidebarContentProps) {
    return (
        <div className={`h-full flex flex-col ${!sidebarColor ? 'bg-background text-foreground' : ''}`} style={{ background: sidebarColor || undefined, color: sidebarTextColor || undefined }}>
            {/* Logo Section - Separated */}
            {logo && (
                <div
                    className="border-b px-6 py-4 flex justify-center"
                    style={{ background: sidebarColor || '#fff' }}
                >
                    <img
                        src={logo}
                        alt="Application Logo"
                        className="h-8 w-auto max-w-[200px] object-contain cursor-pointer"
                        onClick={() => {
                            onNavigateToDashboard && onNavigateToDashboard();
                            setActiveTab('companies');
                            onAfterNavigate && onAfterNavigate();
                        }}
                    />
                </div>
            )}

            {/* Navigation Menu Section - Separated */}
            <div className="flex-1 px-3 py-4">
                <nav className="space-y-1">
                    <Button
                        variant={activeTab === "overview" ? "secondary" : "ghost"}
                        className={`w-full justify-start transition-colors ${activeTab === "overview" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                        style={activeTab === "overview" ? undefined : { backgroundColor: undefined }}
                        onClick={() => { setActiveTab("overview"); onAfterNavigate && onAfterNavigate(); }}
                    >
                        <BarChart3 className="h-4 w-4 mr-2" /> Overview
                    </Button>

                    <Button
                        variant={activeTab === "companies" ? "secondary" : "ghost"}
                        className={`w-full justify-start transition-colors ${activeTab === "companies" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                        style={activeTab === "companies" ? undefined : { backgroundColor: undefined }}
                        onClick={() => { setActiveTab("companies"); onAfterNavigate && onAfterNavigate(); }}
                    >
                        <Building className="h-4 w-4 mr-2" /> Companies
                    </Button>

                    {userIsAdmin && (
                        <>
                            <Button
                                variant={activeTab === "users" ? "secondary" : "ghost"}
                                className={`w-full justify-start transition-colors ${activeTab === "users" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                                style={activeTab === "users" ? undefined : { backgroundColor: undefined }}
                                onClick={() => { setActiveTab("users"); onAfterNavigate && onAfterNavigate(); }}
                            >
                                <User className="h-4 w-4 mr-2" /> User Management
                            </Button>

                            <Button
                                variant={activeTab === "messages" ? "secondary" : "ghost"}
                                className={`w-full justify-start transition-colors ${activeTab === "messages" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                                style={activeTab === "messages" ? undefined : { backgroundColor: undefined }}
                                onClick={() => { setActiveTab("messages"); onAfterNavigate && onAfterNavigate(); }}
                            >
                                <MessageSquare className="h-4 w-4 mr-2" /> Messages
                            </Button>

                            <Button
                                variant={activeTab === "secretary-renew" ? "secondary" : "ghost"}
                                className={`w-full justify-start transition-colors ${activeTab === "secretary-renew" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                                style={activeTab === "secretary-renew" ? undefined : { backgroundColor: undefined }}
                                onClick={() => { setActiveTab("secretary-renew"); onAfterNavigate && onAfterNavigate(); }}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" /> Secretary Renew
                            </Button>

                            <Button
                                variant={activeTab === "account" ? "secondary" : "ghost"}
                                className={`w-full justify-start transition-colors ${activeTab === "account" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                                style={activeTab === "account" ? undefined : { backgroundColor: undefined }}
                                onClick={() => { setActiveTab("account"); onAfterNavigate && onAfterNavigate(); }}
                            >
                                <User className="h-4 w-4 mr-2" /> Account Settings
                            </Button>

                            <Button
                                variant={activeTab === "settings" ? "secondary" : "ghost"}
                                className={`w-full justify-start transition-colors ${activeTab === "settings" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                                style={activeTab === "settings" ? undefined : { backgroundColor: undefined }}
                                onClick={() => { setActiveTab("settings"); onAfterNavigate && onAfterNavigate(); }}
                            >
                                <SettingsIcon className="h-4 w-4 mr-2" /> Settings
                            </Button>

                            <Button
                                variant={activeTab === "payments" ? "secondary" : "ghost"}
                                className={`w-full justify-start transition-colors ${activeTab === "payments" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                                style={activeTab === "payments" ? undefined : { backgroundColor: undefined }}
                                onClick={() => { setActiveTab("payments"); onAfterNavigate && onAfterNavigate(); }}
                            >
                                <Briefcase className="h-4 w-4 mr-2" /> Payments
                            </Button>

                            <Button
                                variant={activeTab === "about" ? "secondary" : "ghost"}
                                className={`w-full justify-start transition-colors ${activeTab === "about" ? '' : 'hover:bg-white hover:bg-opacity-60'}`}
                                style={activeTab === "about" ? undefined : { backgroundColor: undefined }}
                                onClick={() => { setActiveTab("about"); onAfterNavigate && onAfterNavigate(); }}
                            >
                                <FileText className="h-4 w-4 mr-2" /> About
                            </Button>
                        </>
                    )}
                </nav>
            </div>

            {/* Admin Footer */}
            <div className={`border-t ${!sidebarColor ? 'border-gray-300 bg-gray-50' : ''} px-2 py-2 mt-auto flex items-center justify-between gap-2`}>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-primary uppercase">
                    {user?.name ? user.name[0] : 'A'}
                </div>
                <div className="flex flex-col flex-1 min-w-0 ml-2 overflow-hidden">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{user?.name || 'Admin'}</span>
                    <span className="text-[10px] text-gray-400 truncate">{user?.email || ''}</span>
                </div>
                <button
                    title="Logout"
                    onClick={onLogout}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors ml-2"
                    style={sidebarColor ? { background: '#fff', color: '#e53e3e', border: '1.5px solid #e53e3e' } : {}}
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}



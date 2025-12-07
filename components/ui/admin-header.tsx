'use client';

interface AdminHeaderProps {
    user?: any;
    navigateTo?: (page: string, companyId?: string, tab?: string) => void;
    onLogout?: () => void;
}

export function AdminHeader({ user, navigateTo, onLogout }: AdminHeaderProps) {
    // Only show header if user is logged in
    if (!user) {
        return null;
    }

    return (
        <header className="bg-white border-b border-gray-200 h-16">
            <div className="h-full flex items-center">
                <div className="flex items-center justify-end w-full">
                    {/* Header content removed - logo and profile icon removed as requested */}
                </div>
            </div>
        </header>
    );
}

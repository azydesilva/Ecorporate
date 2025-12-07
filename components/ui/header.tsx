'use client';

import { useEffect, useState } from 'react';
import { settingsStorage } from '@/lib/local-storage';

interface HeaderProps {
    user?: any;
    navigateTo?: (page: string) => void;
    onLogout?: () => void;
    centerLogo?: boolean;
}

export function Header({ user, navigateTo, onLogout, centerLogo = false }: HeaderProps) {
    const [logo, setLogo] = useState<string | null>(null);
    const [navbarColor, setNavbarColor] = useState<string | null>(null);

    useEffect(() => {
        const updateHeaderSettings = async () => {
            try {
                // Use the enhanced settings storage with database fallback
                const settings = await settingsStorage.getSettingsWithFallback();

                setLogo(settings?.logo || null);
                if (settings?.changeNavbarColor && settings?.primaryColor) {
                    setNavbarColor(settings.primaryColor);
                } else {
                    setNavbarColor(null);
                }
            } catch (error) {
                console.error('Error loading header settings:', error);
                // Fallback to localStorage only
                const settings = settingsStorage.getSettings();
                setLogo(settings?.logo || null);
                if (settings?.changeNavbarColor && settings?.primaryColor) {
                    setNavbarColor(settings.primaryColor);
                } else {
                    setNavbarColor(null);
                }
            }
        };

        // Update on mount
        updateHeaderSettings();

        // Listen for storage changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'appSettings') {
                updateHeaderSettings();
            }
        };

        // Listen for local storage updates from our app
        const handleLocalChange = () => {
            updateHeaderSettings();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('storage-updated', handleLocalChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('storage-updated', handleLocalChange);
        };
    }, []);


    // Always show header - we now have a default logo
    // The header will be shown on all pages including login/signup

    return (
        <>
            <header
                className="border-b border-gray-200 py-3 min-h-[64px]"
                style={navbarColor ? { backgroundColor: navbarColor } : { backgroundColor: '#fff' }}
            >
                <div className="container mx-auto h-full px-4 sm:px-6 lg:px-8">
                    <div className={`flex items-center h-full ${centerLogo ? 'justify-center' : 'justify-between'}`}>
                        {/* Logo Section */}
                        <div className="flex items-center">
                            {logo && (
                                <img
                                    src={logo}
                                    alt="Application Logo"
                                    className="h-8 w-auto max-w-[200px] object-contain cursor-pointer"
                                    onClick={() => {
                                        if (navigateTo) {
                                            if (!user) {
                                                navigateTo('login');
                                            } else if (user?.role === "admin") {
                                                if (typeof window !== 'undefined') {
                                                    sessionStorage.setItem('adminDashboardTab', 'companies');
                                                }
                                                navigateTo('adminDashboard');
                                            } else {
                                                navigateTo('customerDashboard');
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>

                        {/* User Navigation Section - Only show if not centering logo */}
                        {!centerLogo && user && (
                            <div className="relative flex gap-3 items-center">
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}

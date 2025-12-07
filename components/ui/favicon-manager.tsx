'use client';

import { useEffect } from 'react';
import { LocalStorageService } from '@/lib/database-service';

export function FaviconManager() {
    useEffect(() => {
        // Make sure we're in the browser
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }

        // Function to update favicon
        const updateFavicon = (faviconUrl?: string) => {
            // Remove existing favicon links
            const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
            existingLinks.forEach(link => link.remove());

            if (faviconUrl) {
                // Add new favicon link
                const link = document.createElement('link');
                link.rel = 'icon';
                link.type = 'image/x-icon';
                link.href = faviconUrl;
                document.head.appendChild(link);
            }
        };

        // Additional function to ensure title is correct
        const ensureCorrectTitle = async () => {
            if (window.__checkingTitle) return;

            try {
                const settings = await LocalStorageService.getSettings();
                if (settings?.title && document.title !== settings.title) {
                    document.title = settings.title;
                }
            } catch (error) {
                console.error('Error ensuring correct title:', error);
            }
        };

        // Small delay to ensure we don't interfere with hydration
        const timer = setTimeout(async () => {
            // Apply favicon and ensure title from settings on mount
            try {
                const settings = await LocalStorageService.getSettings();
                const faviconUrl = settings?.favicon_url || settings?.favicon;
                if (faviconUrl) {
                    updateFavicon(faviconUrl);
                }

                // Ensure title is correctly set
                await ensureCorrectTitle();
            } catch (e) {
                console.error('Error initializing favicon manager:', e);
            }
        }, 0);

        // Listen for settings updates
        const handleSettingsUpdate = async () => {
            try {
                const updatedSettings = await LocalStorageService.getSettings();
                const faviconUrl = updatedSettings?.favicon_url || updatedSettings?.favicon;
                updateFavicon(faviconUrl);
                await ensureCorrectTitle();
            } catch (error) {
                console.error('Error handling settings update:', error);
            }
        };

        // Listen for storage events (for cross-tab updates)
        window.addEventListener('storage-updated', handleSettingsUpdate);
        window.addEventListener('storage', handleSettingsUpdate);

        return () => {
            clearTimeout(timer);
            if (typeof window !== 'undefined') {
                window.removeEventListener('storage-updated', handleSettingsUpdate);
                window.removeEventListener('storage', handleSettingsUpdate);
            }
        };
    }, []);

    return null; // This component doesn't render anything
}

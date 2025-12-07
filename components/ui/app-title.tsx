'use client';

import { useEffect, useState } from 'react';
import { LocalStorageService } from '@/lib/database-service';

// Add TypeScript interface for window object to include our custom properties
declare global {
    interface Window {
        __initialTitleSet?: string | null;
        __checkingTitle?: boolean;
    }
}

export function AppTitle() {
    // Use empty string as initial state to avoid hydration mismatch
    const [title, setTitle] = useState('');

    // Set initial title from window in useEffect (client-side only)
    useEffect(() => {
        // Get initial title from window if available
        if (typeof window !== 'undefined' && window.__initialTitleSet) {
            setTitle(window.__initialTitleSet);
        }
    }, []);

    // A more reliable way to update the document title
    const updateDocumentTitle = (newTitle: string) => {
        // Skip update if title is already correct to prevent unnecessary re-renders
        if (document.title === newTitle) return;

        setTitle(newTitle);
        document.title = newTitle;

        // Update metadata for Next.js
        const metaTags = document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"], meta[name="title"]');
        metaTags.forEach(tag => {
            tag.setAttribute('content', newTitle);
        });

        // Update social image to admin logo if available in local settings
        try {
            const localSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
            if (localSettings && localSettings.logo) {
                const imgTags = document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"], meta[name="image"]');
                imgTags.forEach(tag => {
                    tag.setAttribute('content', localSettings.logo);
                });
            }
        } catch { }
    };

    useEffect(() => {
        // Load title from settings
        const loadTitle = async () => {
            try {
                // Check if we're in a browser environment
                if (typeof window === 'undefined' || !window.localStorage) {
                    return;
                }

                // Skip if we're already checking the title in the script
                if (window.__checkingTitle) return;

                const settings = await LocalStorageService.getSettings();
                if (settings?.title) {
                    // Only update if different to avoid unnecessary re-renders
                    if (document.title !== settings.title) {
                        updateDocumentTitle(settings.title);
                    }
                }
            } catch (error) {
                console.error('Error loading title from settings:', error);
                // No default title fallback - only admin should set it
            }
        };

        // Always load title from database to ensure it's up to date
        // But only if we don't have a title set from the script
        if (!window.__initialTitleSet || window.__initialTitleSet === 'E CORPORATE') {
            loadTitle();
        }

        // Add event listeners
        const handleStorageEvent = () => loadTitle();

        if (typeof window !== 'undefined') {
            // Standard events
            window.addEventListener('storage', handleStorageEvent);
            window.addEventListener('storage-updated', handleStorageEvent);

            // Custom title update event
            window.addEventListener('title-updated', (e: any) => {
                if (e.detail?.title) {
                    updateDocumentTitle(e.detail.title);
                } else {
                    loadTitle();
                }
            });
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('storage', handleStorageEvent);
                window.removeEventListener('storage-updated', handleStorageEvent);
            }
        };
    }, []);

    // Add visual indicator in dev mode that this component is active
    if (process.env.NODE_ENV === 'development') {
        return <div style={{ display: 'none' }} data-title-manager={title}></div>;
    }

    return null;
}

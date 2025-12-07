'use client';

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Image, RefreshCw } from "lucide-react";
import { LocalStorageService } from "@/lib/database-service";
import { fileUploadClient } from "@/lib/file-upload-client";
import { settingsStorage } from "@/lib/local-storage";
import { Progress } from "@/components/ui/progress";
import MobileNumbersExport from "./MobileNumbersExport";

export default function CustomizationSettings() {
    // Function to apply primary color to navbar
    const applyNavbarColor = (color: string) => {
        const navbar = document.querySelector('header');
        if (navbar) {
            navbar.classList.remove('bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-primary', 'bg-secondary', 'bg-neutral', 'bg-slate-50', 'bg-slate-100', 'bg-slate-200');
            (navbar as HTMLElement).style.backgroundColor = color;
        }
    };
    const [title, setTitle] = useState('');
    const [savedTitle, setSavedTitle] = useState('');
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);
    const [logo, setLogo] = useState('');
    const [savedLogo, setSavedLogo] = useState('');
    const [logoPreview, setLogoPreview] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#2563eb'); // blue-600
    const [savedPrimaryColor, setSavedPrimaryColor] = useState('#2563eb'); // blue-600
    const [previewColor, setPreviewColor] = useState<string | null>(null);
    const [favicon, setFavicon] = useState('');
    const [savedFavicon, setSavedFavicon] = useState('');
    const [faviconPreview, setFaviconPreview] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
    const [logoUploadProgress, setLogoUploadProgress] = useState(0);
    const [faviconUploadProgress, setFaviconUploadProgress] = useState(0);

    // Store interval references to prevent conflicts during simultaneous uploads
    const logoProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const faviconProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Tab state - added 'mobile' tab
    const [tab, setTab] = useState<'title' | 'logo' | 'color' | 'mobile'>('title');

    // Cleanup intervals on component unmount
    useEffect(() => {
        return () => {
            if (logoProgressIntervalRef.current) {
                clearInterval(logoProgressIntervalRef.current);
            }
            if (faviconProgressIntervalRef.current) {
                clearInterval(faviconProgressIntervalRef.current);
            }
        };
    }, []);

    // Load saved settings on mount (client-side only)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const loadSettings = async () => {
            try {
                // Use the enhanced settings storage with database fallback
                const settings = await settingsStorage.getSettingsWithFallback();

                if (settings?.title) {
                    setTitle(settings.title);
                    setSavedTitle(settings.title);
                }
                if (settings?.logo) {
                    setLogo(settings.logo);
                    setSavedLogo(settings.logo);
                    setLogoPreview(settings.logo);
                }
                if (settings?.primaryColor) {
                    setPrimaryColor(settings.primaryColor);
                    setSavedPrimaryColor(settings.primaryColor);
                }
                if (settings?.favicon) {
                    setFavicon(settings.favicon);
                    setSavedFavicon(settings.favicon);
                    setFaviconPreview(settings.favicon);
                }

                // Apply favicon immediately if available
                if (settings?.favicon) {
                    applyFavicon(settings.favicon);
                }

                // Apply primary color immediately if available
                if (settings?.primaryColor) {
                    applyPrimaryColor(settings.primaryColor);
                    applyNavbarColor(settings.primaryColor);
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };

        loadSettings();
    }, []);

    // Function to apply favicon
    const applyFavicon = (faviconUrl: string) => {
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

    // Function to convert hex to RGB
    const hexToRGB = (hex: string) => {
        // Remove the # if present
        hex = hex.replace('#', '');

        // Parse the hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return { r, g, b };
    };

    // Function to convert hex to HSL
    const hexToHSL = (hex: string) => {
        const rgb = hexToRGB(hex);
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    };

    // Function to apply primary color
    const applyPrimaryColor = (color: string) => {
        const rgb = hexToRGB(color);
        const hsl = hexToHSL(color);

        // Update root CSS variables for shadcn/ui
        document.documentElement.style.setProperty('--primary', hsl.h.toString());
        document.documentElement.style.setProperty('--primary-foreground', isLightColor(rgb) ? '240 10% 3.9%' : '0 0% 98%');

        // Set primary colors for the application
        document.documentElement.style.setProperty('--primary-default', color);
        document.documentElement.style.setProperty('--primary-hover', `hsl(${hsl.h} ${hsl.s}% ${Math.max(0, hsl.l - 10)}%)`);
        document.documentElement.style.setProperty('--primary-active', `hsl(${hsl.h} ${hsl.s}% ${Math.max(0, hsl.l - 15)}%)`);

        // Update component-specific variables
        const vars = {
            '--primary': hsl.h.toString(),
            '--primary-saturation': hsl.s + '%',
            '--primary-lightness': hsl.l + '%',
            '--primary-hue': hsl.h.toString(),
            '--ring': color,
        };

        // Apply all CSS variables
        Object.entries(vars).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });

        // Force update on pseudo-classes
        const style = document.createElement('style');
        style.textContent = `
            .btn-primary, 
            .bg-primary,
            [data-theme] .btn-primary,
            [data-theme] .bg-primary {
                background-color: var(--primary-default);
            }
            .btn-primary:hover,
            .bg-primary:hover {
                background-color: var(--primary-hover);
            }
            .btn-primary:active,
            .bg-primary:active {
                background-color: var(--primary-active);
            }
            .text-primary {
                color: var(--primary-default);
            }
        `;

        // Remove any existing dynamic style and add the new one
        const existingStyle = document.getElementById('dynamic-primary-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        style.id = 'dynamic-primary-styles';
        document.head.appendChild(style);
    };

    // Function to determine if a color is light or dark
    const isLightColor = (rgb: { r: number, g: number, b: number }) => {
        // Calculate relative luminance using WCAG formula
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return luminance > 0.5;
    };

    // Apply primary color and navbar color when it changes
    useEffect(() => {
        const colorToApply = previewColor ?? primaryColor;
        if (colorToApply) {
            applyPrimaryColor(colorToApply);
            applyNavbarColor(colorToApply);
            // Update localStorage with previewColor for sidebar instant preview
            if (typeof window !== 'undefined') {
                try {
                    const settings = window.localStorage.getItem('settings');
                    let parsed: any = {};
                    if (settings) {
                        parsed = JSON.parse(settings);
                    }
                    parsed.primaryColor = colorToApply;
                    window.localStorage.setItem('settings', JSON.stringify(parsed));
                    window.dispatchEvent(new Event('storage-updated'));
                } catch { }
            }
        }
        // Restore localStorage to saved color when preview ends
        if (!previewColor && typeof window !== 'undefined') {
            try {
                const settings = window.localStorage.getItem('settings');
                let parsed: any = {};
                if (settings) {
                    parsed = JSON.parse(settings);
                }
                parsed.primaryColor = primaryColor;
                window.localStorage.setItem('settings', JSON.stringify(parsed));
                window.dispatchEvent(new Event('storage-updated'));
            } catch { }
        }
    }, [primaryColor, previewColor]);

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Removed file size validation to allow unlimited uploads

            setIsUploadingLogo(true);
            setLogoUploadProgress(0);

            // Clear any existing interval
            if (logoProgressIntervalRef.current) {
                clearInterval(logoProgressIntervalRef.current);
            }

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setLogoUploadProgress(prev => {
                    if (prev < 90) {
                        return prev + 10;
                    }
                    clearInterval(progressInterval);
                    logoProgressIntervalRef.current = null;
                    return prev;
                });
            }, 200);

            // Store the interval reference
            logoProgressIntervalRef.current = progressInterval;

            try {
                const uploadResult = await fileUploadClient.uploadFile(file, 'admin', { saveToPublic: 'true', publicBaseName: 'logo' });

                // Clear interval and complete progress
                if (logoProgressIntervalRef.current) {
                    clearInterval(logoProgressIntervalRef.current);
                    logoProgressIntervalRef.current = null;
                }
                setLogoUploadProgress(100);

                if (uploadResult.success && uploadResult.file) {
                    const versionedUrl = `${uploadResult.file.url}?v=${Date.now()}`;
                    setLogo(versionedUrl);
                    setLogoPreview(versionedUrl);

                    // Persist immediately so production reflects without pressing Save
                    try {
                        await LocalStorageService.saveSettings({
                            title: savedTitle || title,
                            description: 'CENTRAL COURT (PRIVATE) LIMITED.',
                            logo_url: versionedUrl,
                            primary_color: savedPrimaryColor || primaryColor,
                            favicon_url: savedFavicon || favicon,
                            secondary_color: '#ffffff'
                        })
                        settingsStorage.saveSettings({
                            title: savedTitle || title,
                            logo: versionedUrl,
                            primaryColor: savedPrimaryColor || primaryColor,
                            favicon: savedFavicon || favicon
                        })
                        window.dispatchEvent(new Event('storage-updated'))
                    } catch (e) {
                        console.error('Error persisting logo setting:', e)
                    }
                } else {
                    alert('Failed to upload logo: ' + uploadResult.error);
                }
            } catch (error) {
                console.error('Error uploading logo:', error);
                alert('Error uploading logo');
            } finally {
                // Clear the interval if it still exists
                if (logoProgressIntervalRef.current) {
                    clearInterval(logoProgressIntervalRef.current);
                    logoProgressIntervalRef.current = null;
                }
                setTimeout(() => {
                    setIsUploadingLogo(false);
                    setLogoUploadProgress(0);
                }, 500);
            }
        }
    };

    const handleRemoveLogo = async () => {
        try {
            // Attempt to delete the current public logo file
            if (savedLogo) {
                const url = new URL(savedLogo, window.location.origin)
                const publicPath = url.pathname // e.g., /uploads/logo.png
                await fetch(`/api/upload?publicPath=${encodeURIComponent(publicPath)}`, { method: 'DELETE' })
            } else {
                // Fallback: try default names
                await fetch(`/api/upload?publicPath=${encodeURIComponent('/uploads/images/logo.png')}`, { method: 'DELETE' })
                await fetch(`/api/upload?publicPath=${encodeURIComponent('/uploads/images/logo.jpg')}`, { method: 'DELETE' })
                await fetch(`/api/upload?publicPath=${encodeURIComponent('/uploads/images/logo.jpeg')}`, { method: 'DELETE' })
                await fetch(`/api/upload?publicPath=${encodeURIComponent('/uploads/images/logo.webp')}`, { method: 'DELETE' })
            }

            // Clear from database
            await LocalStorageService.saveSettings({
                title: savedTitle || title,
                description: 'CENTRAL COURT (PRIVATE) LIMITED.',
                logo_url: null,
                primary_color: savedPrimaryColor || primaryColor,
                favicon_url: savedFavicon || favicon,
                secondary_color: '#ffffff'
            })

            // Clear local state & localStorage settings
            setLogo('')
            setLogoPreview('')
            setSavedLogo('')
            settingsStorage.saveSettings({
                title: savedTitle || title,
                logo: null,
                primaryColor: savedPrimaryColor || primaryColor,
                favicon: savedFavicon || favicon
            })
            window.dispatchEvent(new Event('storage-updated'))
        } finally {
            // Clear the file input
            const fileInput = document.getElementById('logo-upload') as HTMLInputElement
            if (fileInput) {
                fileInput.value = ''
            }
        }
    };

    const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Removed file size validation to allow unlimited uploads

            setIsUploadingFavicon(true);
            setFaviconUploadProgress(0);

            // Clear any existing interval
            if (faviconProgressIntervalRef.current) {
                clearInterval(faviconProgressIntervalRef.current);
            }

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setFaviconUploadProgress(prev => {
                    if (prev < 90) {
                        return prev + 10;
                    }
                    clearInterval(progressInterval);
                    faviconProgressIntervalRef.current = null;
                    return prev;
                });
            }, 200);

            // Store the interval reference
            faviconProgressIntervalRef.current = progressInterval;

            try {
                const uploadResult = await fileUploadClient.uploadFile(file, 'admin', { saveToPublic: 'true', publicBaseName: 'favicon' });

                // Clear interval and complete progress
                if (faviconProgressIntervalRef.current) {
                    clearInterval(faviconProgressIntervalRef.current);
                    faviconProgressIntervalRef.current = null;
                }
                setFaviconUploadProgress(100);

                if (uploadResult.success && uploadResult.file) {
                    // Add cache-busting to favicon URL
                    const versionedFavicon = `${uploadResult.file.url}?v=${Date.now()}`
                    setFavicon(versionedFavicon);
                    setFaviconPreview(versionedFavicon);
                    // Apply favicon immediately for preview
                    applyFavicon(versionedFavicon);

                    // Persist immediately so production reflects without pressing Save
                    try {
                        await LocalStorageService.saveSettings({
                            title: savedTitle || title,
                            description: 'CENTRAL COURT (PRIVATE) LIMITED.',
                            logo_url: savedLogo || logo,
                            primary_color: savedPrimaryColor || primaryColor,
                            favicon_url: versionedFavicon,
                            secondary_color: '#ffffff'
                        })
                        settingsStorage.saveSettings({
                            title: savedTitle || title,
                            logo: savedLogo || logo,
                            primaryColor: savedPrimaryColor || primaryColor,
                            favicon: versionedFavicon
                        })
                        setFavicon(versionedFavicon)
                        setFaviconPreview(versionedFavicon)
                        applyFavicon(versionedFavicon)
                        window.dispatchEvent(new Event('storage-updated'))
                    } catch (e) {
                        console.error('Error persisting favicon setting:', e)
                    }
                } else {
                    alert('Failed to upload favicon: ' + uploadResult.error);
                }
            } catch (error) {
                console.error('Error uploading favicon:', error);
                alert('Error uploading favicon');
            } finally {
                // Clear the interval if it still exists
                if (faviconProgressIntervalRef.current) {
                    clearInterval(faviconProgressIntervalRef.current);
                    faviconProgressIntervalRef.current = null;
                }
                setTimeout(() => {
                    setIsUploadingFavicon(false);
                    setFaviconUploadProgress(0);
                }, 500);
            }
        }
    };

    const handleRemoveFavicon = async () => {
        try {
            // Attempt to delete the current public favicon file
            if (savedFavicon) {
                const url = new URL(savedFavicon, window.location.origin)
                const publicPath = url.pathname // e.g., /uploads/favicon.png
                await fetch(`/api/upload?publicPath=${encodeURIComponent(publicPath)}`, { method: 'DELETE' })
            } else {
                // Fallback common favicon names
                await fetch(`/api/upload?publicPath=${encodeURIComponent('/uploads/images/favicon.png')}`, { method: 'DELETE' })
                await fetch(`/api/upload?publicPath=${encodeURIComponent('/uploads/images/favicon.ico')}`, { method: 'DELETE' })
                await fetch(`/api/upload?publicPath=${encodeURIComponent('/uploads/images/favicon.jpg')}`, { method: 'DELETE' })
                await fetch(`/api/upload?publicPath=${encodeURIComponent('/uploads/images/favicon.webp')}`, { method: 'DELETE' })
            }

            // Remove from DOM
            const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
            existingLinks.forEach(link => link.remove())

            // Clear from database
            await LocalStorageService.saveSettings({
                title: savedTitle || title,
                description: 'CENTRAL COURT (PRIVATE) LIMITED.',
                logo_url: savedLogo || logo,
                primary_color: savedPrimaryColor || primaryColor,
                favicon_url: null,
                secondary_color: '#ffffff'
            })

            // Clear local state & localStorage settings
            setFavicon('')
            setFaviconPreview('')
            setSavedFavicon('')
            settingsStorage.saveSettings({
                title: savedTitle || title,
                logo: savedLogo || logo,
                primaryColor: savedPrimaryColor || primaryColor,
                favicon: null
            })
            window.dispatchEvent(new Event('storage-updated'))
        } finally {
            // Clear the file input
            const fileInput = document.getElementById('favicon-upload') as HTMLInputElement
            if (fileInput) {
                fileInput.value = ''
            }
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const finalTitle = title;
            document.title = finalTitle;
            const metaTags = document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]');
            metaTags.forEach(tag => {
                tag.setAttribute('content', finalTitle);
            });
            if (typeof window !== 'undefined') {
                window.__initialTitleSet = finalTitle;
            }
            // On save, persist previewColor if set
            const colorToSave = previewColor ?? primaryColor;

            // Save to database with all required fields
            await LocalStorageService.saveSettings({
                title: finalTitle,
                description: 'CENTRAL COURT (PRIVATE) LIMITED.',
                logo_url: logo || null,
                primary_color: colorToSave || '#000000',
                favicon_url: favicon || null,
                secondary_color: '#ffffff'
            });

            // Save to localStorage settings using settingsStorage
            settingsStorage.saveSettings({
                title: finalTitle,
                logo: logo || null,
                primaryColor: colorToSave || '#000000',
                favicon: favicon || null
            });

            setSavedTitle(finalTitle);
            setSavedLogo(logo);
            setSavedPrimaryColor(colorToSave);
            setSavedFavicon(favicon);
            if (favicon) {
                applyFavicon(favicon);
            }
            if (colorToSave) {
                applyPrimaryColor(colorToSave);
                applyNavbarColor(colorToSave);
            }
            setPreviewColor(null);
            window.dispatchEvent(new Event('storage-updated'));
            window.dispatchEvent(new CustomEvent('title-updated', {
                detail: { title: finalTitle }
            }));
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = title !== savedTitle || logo !== savedLogo || primaryColor !== savedPrimaryColor || favicon !== savedFavicon;

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-xl">Settings</CardTitle>
                <CardDescription>Manage application title, logo and colour</CardDescription>
                {/* Responsive tab selector: buttons on md+, select on small screens */}
                <div className="mb-6 mt-4">
                    <div className="hidden md:flex border border-gray-200 rounded-lg overflow-hidden w-fit bg-white">
                        <button
                            className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'title' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
                            onClick={() => setTab('title')}
                        >
                            Application Title
                        </button>
                        <button
                            className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'logo' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
                            onClick={() => setTab('logo')}
                        >
                            Logo & Favicon
                        </button>
                        <button
                            className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'color' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
                            onClick={() => setTab('color')}
                        >
                            Primary Color
                        </button>
                        <button
                            className={`px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r-0 border-gray-200 first:rounded-l-lg last:rounded-r-lg ${tab === 'mobile' ? 'bg-gray-100 text-black' : 'bg-white text-gray-600 hover:text-black'}`}
                            onClick={() => setTab('mobile')}
                        >
                            Mobile Numbers
                        </button>
                    </div>

                    {/* Mobile: compact select */}
                    <div className="md:hidden">
                        <label htmlFor="settings-tab-select" className="sr-only">Select settings tab</label>
                        <select
                            id="settings-tab-select"
                            value={tab}
                            onChange={(e) => setTab(e.target.value as any)}
                            className="w-full border border-gray-200 rounded-md p-2 bg-white text-sm"
                        >
                            <option value="title">Application Title</option>
                            <option value="logo">Logo & Favicon</option>
                            <option value="color">Primary Color</option>
                            <option value="mobile">Mobile Numbers</option>
                        </select>
                    </div>
                </div>
            </CardHeader>
            {tab === 'title' && (
                <>
                    <CardHeader>
                        <CardTitle>Application Title</CardTitle>
                        <CardDescription>
                            Set the title that will be displayed throughout the application
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="app-title">Title</Label>
                            <Input
                                id="app-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter application title"
                                className="max-w-md"
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                This will be displayed as the application title throughout the site. This field is required.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={() => handleSave()}
                            disabled={title === savedTitle || isSaving || !title.trim()}
                            className="w-auto px-6"
                        >
                            {isSaving ? 'Saving...' : title !== savedTitle && title.trim() ? 'Save Title' : !title.trim() ? 'Title Required' : 'Saved'}
                        </Button>
                    </CardFooter>
                </>
            )}
            {tab === 'logo' && (
                <>
                    <CardHeader>
                        <CardTitle>Application Logo & Favicon</CardTitle>
                        <CardDescription>
                            Upload a logo for the application header, a white logo for dark backgrounds, and a favicon for the browser tab
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            <Label>Application Logo</Label>
                            <div className="space-y-3">
                                {logoPreview ? (
                                    <div className="relative inline-block">
                                        <div className="border rounded-lg p-3 bg-gray-50">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="max-h-16 max-w-32 object-contain"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                            onClick={handleRemoveLogo}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                                        <div className="text-center">
                                            {isUploadingLogo ? (
                                                <RefreshCw className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
                                            ) : (
                                                <Image className="mx-auto h-8 w-8 text-gray-400" />
                                            )}
                                            <div className="mt-2">
                                                <Label htmlFor="logo-upload" className={`${isUploadingLogo ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                                    <div className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
                                                        {isUploadingLogo ? (
                                                            <>
                                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="h-3 w-3" />
                                                                Upload Logo
                                                            </>
                                                        )}
                                                    </div>
                                                </Label>
                                                <input
                                                    id="logo-upload"
                                                    name="logo-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*"
                                                    disabled={isUploadingLogo}
                                                    onChange={handleLogoUpload}
                                                />

                                                {/* Progress Bar */}
                                                {isUploadingLogo && (
                                                    <div className="mt-2 w-full max-w-xs mx-auto">
                                                        <Progress value={logoUploadProgress} className="h-2" />
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {Math.round(logoUploadProgress)}% complete
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Upload a logo that will appear in the application header
                                </p>
                            </div>
                        </div>

                        {/* Favicon Upload */}
                        <div className="space-y-2">
                            <Label>Favicon</Label>
                            <div className="space-y-3">
                                {faviconPreview ? (
                                    <div className="relative inline-block">
                                        <div className="border rounded-lg p-2 bg-gray-50">
                                            <img
                                                src={faviconPreview}
                                                alt="Favicon preview"
                                                className="w-6 h-6 object-contain"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                            onClick={handleRemoveFavicon}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                                        <div className="text-center">
                                            {isUploadingFavicon ? (
                                                <RefreshCw className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
                                            ) : (
                                                <Image className="mx-auto h-8 w-8 text-gray-400" />
                                            )}
                                            <div className="mt-2">
                                                <Label htmlFor="favicon-upload" className={`${isUploadingFavicon ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                                    <div className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
                                                        {isUploadingFavicon ? (
                                                            <>
                                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="h-3 w-3" />
                                                                Upload Favicon
                                                            </>
                                                        )}
                                                    </div>
                                                </Label>
                                                <input
                                                    id="favicon-upload"
                                                    name="favicon-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*"
                                                    disabled={isUploadingFavicon}
                                                    onChange={handleFaviconUpload}
                                                />

                                                {/* Progress Bar */}
                                                {isUploadingFavicon && (
                                                    <div className="mt-2 w-full max-w-xs mx-auto">
                                                        <Progress value={faviconUploadProgress} className="h-2" />
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {Math.round(faviconUploadProgress)}% complete
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Upload a favicon that will appear in the browser tab
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={() => handleSave()}
                            disabled={(logo === savedLogo && favicon === savedFavicon) || isSaving}
                            className="w-auto px-6"
                        >
                            {isSaving ? 'Saving...' : (logo !== savedLogo || favicon !== savedFavicon) ? 'Save Changes' : 'Saved'}
                        </Button>
                    </CardFooter>
                </>
            )}
            {tab === 'color' && (
                <>
                    <CardHeader>
                        <CardTitle>Primary Color</CardTitle>
                        <CardDescription>
                            Choose a primary color for buttons, links, and other accent elements
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <Label htmlFor="primary-color">Color Selection</Label>
                            <div className="space-y-3">
                                <div className="grid grid-cols-10 gap-2 max-w-sm">
                                    {[
                                        '#0f172a', '#1d4ed8', '#7c3aed', '#059669', '#dc2626',
                                        '#ea580c', '#84cc16', '#6d28d9', '#be185d', '#0891b2'
                                    ].map((color) => (
                                        <button
                                            key={color}
                                            onMouseEnter={() => setPreviewColor(color)}
                                            onMouseLeave={() => setPreviewColor(null)}
                                            onFocus={() => setPreviewColor(color)}
                                            onBlur={() => setPreviewColor(null)}
                                            onClick={() => setPrimaryColor(color)}
                                            className={`w-6 h-6 rounded-md transition-all ${primaryColor === color
                                                ? 'ring-2 ring-offset-1 ring-black scale-110'
                                                : 'hover:scale-110'
                                                }`}
                                            style={{ backgroundColor: color }}
                                            type="button"
                                            aria-label={`Select color ${color}`}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 max-w-md">
                                    <div className="relative">
                                        <div
                                            className="w-8 h-8 rounded-md cursor-pointer overflow-hidden transition-all hover:scale-105 ring-2 ring-offset-1 ring-offset-background ring-primary"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            <input
                                                type="color"
                                                value={previewColor ?? primaryColor}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    setPreviewColor(e.target.value);
                                                    setPrimaryColor(e.target.value);
                                                }}
                                                onBlur={() => setPreviewColor(null)}
                                                className="opacity-0 w-full h-full cursor-pointer"
                                                title="Choose custom color"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Choose a primary color for buttons, links, and other accent elements
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={() => handleSave()}
                            disabled={primaryColor === savedPrimaryColor || isSaving}
                            className="w-auto px-6"
                        >
                            {isSaving ? 'Saving...' : primaryColor !== savedPrimaryColor ? 'Save Color' : 'Saved'}
                        </Button>
                    </CardFooter>
                </>
            )}
            {tab === 'mobile' && (
                <MobileNumbersExport />
            )}
        </Card>
    );
}

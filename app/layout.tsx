import type React from "react"
import type { Metadata } from "next"
import { AppTitle } from "@/components/ui/app-title"
import { FaviconManager } from "@/components/ui/favicon-manager"
import { ColorTheme } from "@/components/ui/color-theme"
import { ColorInitializer } from "@/components/ui/color-initializer"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import ServiceWorkerUpdater from "@/components/ServiceWorkerUpdater"

export const metadata: Metadata = {
  title: "", // No default title - set by admin only
  description: "E Corporate Dashboard by CENTRAL COURT (PRIVATE) LIMITED | Sri Lanka’s first all-in-one digital platform for company registration, secretarial services, compliance, and corporate governance. Manage your business 24/7 with ease, security, and legal compliance.",
  generator: "CENTRAL COURT",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="title" content="" />
        <meta property="og:title" content="" />
        <meta name="twitter:title" content="" />
        <meta name="image" content="" />
        <meta property="og:image" content="" />
        <meta name="twitter:image" content="" />
        <script
          id="init-client-settings"
          dangerouslySetInnerHTML={{
            __html: `
              // Use defer attribute to ensure this runs after hydration
              document.addEventListener('DOMContentLoaded', function() {
                try {
                  if (typeof window !== 'undefined') {
                    // Prevent flashing by setting a flag to indicate we're checking storage
                    window.__checkingTitle = true;
                    
                    // Try to get settings from localStorage first (fallback)
                    const localSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
                    if (localSettings && localSettings.title) {
                      document.title = localSettings.title;
                      
                      // Also update metadata tags early
                      const metaTags = document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"], meta[name="title"]');
                      metaTags.forEach(tag => {
                        tag.setAttribute('content', localSettings.title);
                      });
                      // Update social image if logo present
                      if (localSettings.logo) {
                        const imgTags = document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"], meta[name="image"]');
                        imgTags.forEach(tag => {
                          tag.setAttribute('content', localSettings.logo);
                        });
                      }
                      
                      // Set a flag that the AppTitle component can check
                      window.__initialTitleSet = localSettings.title;
                    } else {
                      // No local settings found; keep existing title without forcing a default
                      window.__initialTitleSet = '';
                    }
                    window.__checkingTitle = false;
                  }
                } catch (e) {
                  window.__checkingTitle = false;
                  // On error, keep the current title as-is
                  window.__initialTitleSet = '';
                }
              });
            `,
          }}
          defer
        />

      </head>
      <body>
        <ColorInitializer />
        {/* Global SW updater prompt */}
        <ServiceWorkerUpdater />
        <AppTitle />
        <FaviconManager />
        <ColorTheme />
        {children}
        <Toaster />
        <footer className="w-full py-3 bg-white text-center text-xs text-gray-700 shadow-sm border-t border-gray-300">
          © 2025 All RIGHTS RESERVED | POWERED BY <span className="font-bold">CENTRAL COURT (PRIVATE) LIMITED.</span>
        </footer>
      </body>
    </html>
  )
}

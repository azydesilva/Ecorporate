"use client"

import { useEffect, useState } from "react"
import { LocalStorageService } from "@/lib/database-service"

export function ColorTheme() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Make sure we're in the browser and component is mounted
    if (typeof window === "undefined" || typeof document === "undefined" || !mounted) {
      return
    }

    // Helper function to convert hex to RGB
    const hexToRGB = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
        : { r: 0, g: 0, b: 0 }
    }

    // Helper function to convert hex to HSL (same as CustomizationSettings)
    const hexToHSL = (hex: string) => {
      const rgb = hexToRGB(hex)
      const r = rgb.r / 255
      const g = rgb.g / 255
      const b = rgb.b / 255

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h,
        s,
        l = (max + min) / 2

      if (max === min) {
        h = s = 0 // achromatic
      } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0)
            break
          case g:
            h = (b - r) / d + 2
            break
          case b:
            h = (r - g) / d + 4
            break
          default:
            h = 0
            break
        }
        h /= 6
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
      }
    }

    // Function to determine if a color is light or dark
    const isLightColor = (rgb: { r: number; g: number; b: number }) => {
      const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
      return luminance > 0.5
    }

    // Function to apply primary color (same logic as CustomizationSettings)
    const applyPrimaryColor = (color: string) => {
      const rgb = hexToRGB(color)
      const hsl = hexToHSL(color)

      // Update root CSS variables for shadcn/ui
      document.documentElement.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`)
      document.documentElement.style.setProperty(
        "--primary-foreground",
        isLightColor(rgb) ? "240 10% 3.9%" : "0 0% 98%",
      )

      // Update ring color to match primary
      document.documentElement.style.setProperty("--ring", `${hsl.h} ${hsl.s}% ${hsl.l}%`)

      // Set primary colors for the application
      document.documentElement.style.setProperty("--primary-default", color)
      document.documentElement.style.setProperty(
        "--primary-hover",
        `hsl(${hsl.h} ${hsl.s}% ${Math.max(0, hsl.l - 10)}%)`,
      )
      document.documentElement.style.setProperty(
        "--primary-active",
        `hsl(${hsl.h} ${hsl.s}% ${Math.max(0, hsl.l - 15)}%)`,
      )

      // Update component-specific variables
      const vars = {
        "--primary-saturation": hsl.s + "%",
        "--primary-lightness": hsl.l + "%",
        "--primary-hue": hsl.h.toString(),
      }

      // Apply all CSS variables
      Object.entries(vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value)
      })

      // Force update on pseudo-classes and custom utilities
      const style = document.createElement("style")
      style.textContent = `
                .btn-primary, 
                .bg-primary,
                [data-theme] .btn-primary,
                [data-theme] .bg-primary {
                    background-color: hsl(var(--primary));
                }
                .btn-primary:hover,
                .bg-primary:hover {
                    background-color: hsl(var(--primary) / 0.9);
                }
                .btn-primary:active,
                .bg-primary:active {
                    background-color: hsl(var(--primary) / 0.8);
                }
                .text-primary {
                    color: hsl(var(--primary));
                }
                .border-primary {
                    border-color: hsl(var(--primary));
                }
                .bg-primary\\/5 {
                    background-color: hsl(var(--primary) / 0.05);
                }
                .bg-primary\\/10 {
                    background-color: hsl(var(--primary) / 0.1);
                }
                .bg-primary\\/20 {
                    background-color: hsl(var(--primary) / 0.2);
                }
                .bg-primary\\/30 {
                    background-color: hsl(var(--primary) / 0.3);
                }
                .bg-primary\\/50 {
                    background-color: hsl(var(--primary) / 0.5);
                }
                .border-primary\\/30 {
                    border-color: hsl(var(--primary) / 0.3);
                }
                .border-primary\\/50 {
                    border-color: hsl(var(--primary) / 0.5);
                }
            `

      // Remove any existing dynamic style and add the new one
      const existingStyle = document.getElementById("dynamic-primary-styles")
      if (existingStyle) {
        existingStyle.remove()
      }
      style.id = "dynamic-primary-styles"
      document.head.appendChild(style)
    }

    // Apply primary color from settings or fallback to #2563eb on mount
    const timer = setTimeout(async () => {
      try {
        // Try to get settings from database first, then fallback to localStorage
        let settings;
        try {
          settings = await LocalStorageService.getSettings()
        } catch (dbError) {
          console.warn('Database unavailable, using localStorage fallback for color theme')
          // Fallback to localStorage
          const localSettings = JSON.parse(localStorage.getItem('appSettings') || '{}')
          settings = { primary_color: localSettings.primaryColor }
        }

        const color = settings?.primary_color || "#2563eb"
        applyPrimaryColor(color)
      } catch (e) {
        console.error("Error initializing color theme:", e)
      }
    }, 100) // Small delay to ensure hydration is complete

    // Listen for settings updates
    const handleSettingsUpdate = async () => {
      try {
        // Try to get settings from database first, then fallback to localStorage
        let updatedSettings;
        try {
          updatedSettings = await LocalStorageService.getSettings()
        } catch (dbError) {
          console.warn('Database unavailable, using localStorage fallback for color theme update')
          // Fallback to localStorage
          const localSettings = JSON.parse(localStorage.getItem('appSettings') || '{}')
          updatedSettings = { primary_color: localSettings.primaryColor }
        }

        const color = updatedSettings?.primary_color || "#2563eb"
        applyPrimaryColor(color)
      } catch (e) {
        console.error("Error updating color theme:", e)
      }
    }

    // Listen for storage events (for cross-tab updates)
    window.addEventListener("storage-updated", handleSettingsUpdate)
    window.addEventListener("storage", handleSettingsUpdate)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("storage-updated", handleSettingsUpdate)
      window.removeEventListener("storage", handleSettingsUpdate)
    }
  }, [mounted])

  return null // This component doesn't render anything
}

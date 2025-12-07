"use client"

import { useEffect, useState } from "react"

export function ColorInitializer() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        // Apply initial color from localStorage
        try {
            const localSettings = JSON.parse(localStorage.getItem('appSettings') || '{}')
            const primaryColor = localSettings.primaryColor || '#2563eb'

            // Convert hex to HSL
            function hexToHSL(hex: string) {
                hex = hex.replace('#', '')
                const r = parseInt(hex.substr(0, 2), 16) / 255
                const g = parseInt(hex.substr(2, 2), 16) / 255
                const b = parseInt(hex.substr(4, 2), 16) / 255

                const max = Math.max(r, g, b)
                const min = Math.min(r, g, b)
                let h, s, l = (max + min) / 2

                if (max === min) {
                    h = s = 0
                } else {
                    const d = max - min
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
                    switch (max) {
                        case r: h = (g - b) / d + (g < b ? 6 : 0); break
                        case g: h = (b - r) / d + 2; break
                        case b: h = (r - g) / d + 4; break
                    }
                    h /= 6
                }

                return {
                    h: Math.round(h * 360),
                    s: Math.round(s * 100),
                    l: Math.round(l * 100)
                }
            }

            const hsl = hexToHSL(primaryColor)
            document.documentElement.style.setProperty('--primary', hsl.h + ' ' + hsl.s + '% ' + hsl.l + '%')
            document.documentElement.style.setProperty('--ring', hsl.h + ' ' + hsl.s + '% ' + hsl.l + '%')

            const isLight = hsl.l > 50
            document.documentElement.style.setProperty('--primary-foreground', isLight ? '240 10% 3.9%' : '0 0% 98%')
        } catch (error) {
            console.error('Error applying initial color:', error)
        }
    }, [mounted])

    return null
} 
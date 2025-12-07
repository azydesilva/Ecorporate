"use client"

import { useEffect, useState } from "react"

export default function ServiceWorkerUpdater() {
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

        let registration: ServiceWorkerRegistration | null = null

        const onNewServiceWorker = (reg: ServiceWorkerRegistration) => {
            if (!reg) return
            if (reg.waiting) {
                setWaitingWorker(reg.waiting)
                setShowPrompt(true)
                return
            }
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing
                if (!newWorker) return
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        setWaitingWorker(reg.waiting)
                        setShowPrompt(true)
                    }
                })
            })
        }

        const register = async () => {
            try {
                registration = await navigator.serviceWorker.register('/sw.js')
                onNewServiceWorker(registration)
                // Periodically check for updates
                const interval = setInterval(() => registration?.update(), 60 * 1000)
                return () => clearInterval(interval)
            } catch (e) {
                // noop
            }
        }

        const cleanupInterval = register()

        // Listen for controllerchange to reload once the new SW has taken control
        const onControllerChange = () => {
            window.location.reload()
        }
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
            if (typeof cleanupInterval === 'function') cleanupInterval()
        }
    }, [])

    const reload = () => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' })
        }
    }

    if (!showPrompt) return null

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-[90%] max-w-sm p-5 text-center">
                <h3 className="text-lg font-semibold mb-2">New version available</h3>
                <p className="text-sm text-muted-foreground mb-4">Reload to get the latest updates.</p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        className="px-4 py-2 rounded-md border text-sm"
                        onClick={() => setShowPrompt(false)}
                    >
                        Later
                    </button>
                    <button
                        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
                        onClick={reload}
                    >
                        Reload
                    </button>
                </div>
            </div>
        </div>
    )
}



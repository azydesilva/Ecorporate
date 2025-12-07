"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, AlertCircle, Clock } from "lucide-react"
import type { Message } from "@/lib/utils"

export default function PublicMessages() {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        loadMessages()
    }, [])

    const loadMessages = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/messages')
            if (response.ok) {
                const data = await response.json()
                // Filter only active messages
                const activeMessages = data.filter((message: Message) => message.is_active)
                setMessages(activeMessages)
            } else {
                setError('Failed to load messages')
            }
        } catch (error) {
            console.error('Error loading messages:', error)
            setError('Failed to load messages')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="mb-6 px-4 md:px-0">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span className="ml-2 text-gray-600">Loading messages...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="mb-6 px-4 md:px-0">
                <Card>
                    <CardContent className="p-6">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (messages.length === 0) {
        return null // Don't show anything if no messages
    }

    return (
        <div className="mb-6 px-4 md:px-0 space-y-4">
            {messages.map((message, index) => (
                <Card
                    key={message.id}
                    className={`relative overflow-hidden transition-all duration-300 hover:shadow-md ${index === 0
                            ? 'bg-gradient-to-r from-primary/5 to-primary/10 border-primary/30 shadow-primary/10'
                            : 'bg-gradient-to-r from-primary/3 to-primary/8 border-primary/20'
                        }`}
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary animate-pulse' : 'bg-primary/70'}`} />
                            <CardTitle className={`text-base font-semibold ${index === 0 ? 'text-primary' : 'text-primary/80'}`}>{message.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className={`text-sm leading-relaxed whitespace-pre-wrap ${index === 0 ? 'text-primary/80' : 'text-primary/70'}`}>
                            {message.content}
                        </CardDescription>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

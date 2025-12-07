"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    MessageSquare,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react"
import type { Message } from "@/lib/utils"

type MessageManagementProps = {
    currentUser: any
}

export default function MessageManagement({ currentUser }: MessageManagementProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        is_active: true
    })

    // Load messages on component mount
    useEffect(() => {
        loadMessages()
    }, [])

    const loadMessages = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/messages')
            if (response.ok) {
                const data = await response.json()
                setMessages(data)
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

    const handleCreateMessage = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            setError('Title and content are required')
            return
        }

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content,
                    created_by: currentUser.id
                }),
            })

            if (response.ok) {
                setSuccess('Message created successfully')
                setFormData({ title: "", content: "", is_active: true })
                setIsCreateDialogOpen(false)
                await loadMessages()
            } else {
                const errorData = await response.json()
                setError(errorData.error || 'Failed to create message')
            }
        } catch (error) {
            console.error('Error creating message:', error)
            setError('Failed to create message')
        }
    }

    const handleEditMessage = (message: Message) => {
        setSelectedMessage(message)
        setFormData({
            title: message.title,
            content: message.content,
            is_active: message.is_active
        })
        setIsEditDialogOpen(true)
    }

    const handleUpdateMessage = async () => {
        if (!selectedMessage || !formData.title.trim() || !formData.content.trim()) {
            setError('Title and content are required')
            return
        }

        try {
            const response = await fetch(`/api/messages/${selectedMessage.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content,
                    is_active: formData.is_active
                }),
            })

            if (response.ok) {
                setSuccess('Message updated successfully')
                setIsEditDialogOpen(false)
                setSelectedMessage(null)
                await loadMessages()
            } else {
                const errorData = await response.json()
                setError(errorData.error || 'Failed to update message')
            }
        } catch (error) {
            console.error('Error updating message:', error)
            setError('Failed to update message')
        }
    }

    const handleDeleteMessage = (message: Message) => {
        setMessageToDelete(message)
        setIsDeleteDialogOpen(true)
    }

    const confirmDeleteMessage = async () => {
        if (!messageToDelete) return

        try {
            const response = await fetch(`/api/messages/${messageToDelete.id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setSuccess('Message deleted successfully')
                await loadMessages()
            } else {
                setError('Failed to delete message')
            }
        } catch (error) {
            console.error('Error deleting message:', error)
            setError('Failed to delete message')
        } finally {
            setIsDeleteDialogOpen(false)
            setMessageToDelete(null)
        }
    }

    const getStatusBadge = (isActive: boolean) => {
        if (isActive) {
            return (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                </Badge>
            )
        } else {
            return (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Inactive
                </Badge>
            )
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

    // Clear messages after 3 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError("")
                setSuccess("")
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [error, success])

    return (
        <div className="w-full py-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Message Management
                            </CardTitle>
                            <CardDescription>Manage public messages for all customers</CardDescription>
                        </div>
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            New Message
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert className="mb-4" variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-4" variant="default">
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Content</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {messages.map((message) => (
                                        <TableRow key={message.id}>
                                            <TableCell className="font-medium whitespace-nowrap">{message.title}</TableCell>
                                            <TableCell className="max-w-[240px] md:max-w-xs truncate">{message.content}</TableCell>
                                            <TableCell className="whitespace-nowrap">{getStatusBadge(message.is_active)}</TableCell>
                                            <TableCell className="whitespace-nowrap">{formatDate(message.created_at)}</TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditMessage(message)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteMessage(message)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {messages.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <MessageSquare className="h-8 w-8 text-gray-400" />
                                                    <p className="text-gray-500">No messages found</p>
                                                    <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Create First Message
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Message Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Message</DialogTitle>
                        <DialogDescription>Create a new public message for all customers</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Enter message title"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Enter message content"
                                rows={6}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="is_active">Active (visible to customers)</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateMessage}>Create Message</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Message Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Message</DialogTitle>
                        <DialogDescription>Update the message details</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Enter message title"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-content">Content</Label>
                            <Textarea
                                id="edit-content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Enter message content"
                                rows={6}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="edit-is_active">Active (visible to customers)</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateMessage}>Update Message</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this message? This action cannot be undone.
                            <br />
                            <br />
                            <strong>Title:</strong> {messageToDelete?.title}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteMessage} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

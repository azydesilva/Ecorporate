"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { X, Trash2 } from "lucide-react"

interface AccessRecord {
  email: string
  status: 'pending' | 'approved' | 'rejected'
  requestedBy?: 'customer' | 'admin'
  requestedAt?: string
  respondedAt?: string | null
  respondedBy?: string | null
}

interface AccessSharingDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  // can be array of strings (legacy) or array of AccessRecord
  initialSharedEmails: any[]
  isAdmin?: boolean
}

export default function AccessSharingDialog({
  isOpen,
  onOpenChange,
  companyId,
  initialSharedEmails,
  isAdmin = false,
}: AccessSharingDialogProps) {
  const { toast } = useToast()

  // Normalize incoming data to AccessRecord[]
  const normalize = (list: any[]): AccessRecord[] => {
    if (!Array.isArray(list)) return []
    return list.map((item) => {
      if (!item) return null
      if (typeof item === 'string') {
        return {
          email: item,
          status: 'approved',
          requestedBy: 'admin',
          requestedAt: new Date().toISOString(),
          respondedAt: new Date().toISOString(),
          respondedBy: 'system',
        } as AccessRecord
      }
      // assume object
      return {
        email: (item.email || item.address || '').toLowerCase(),
        status: item.status || 'pending',
        requestedBy: item.requestedBy || 'customer',
        requestedAt: item.requestedAt || new Date().toISOString(),
        respondedAt: item.respondedAt || null,
        respondedBy: item.respondedBy || null,
      } as AccessRecord
    }).filter(Boolean) as AccessRecord[]
  }

  const [records, setRecords] = useState<AccessRecord[]>(normalize(initialSharedEmails || []))
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    setRecords(normalize(initialSharedEmails || []))
  }, [initialSharedEmails])

  const saveRecords = async (updated: AccessRecord[]) => {
    try {
      const response = await fetch(`/api/registrations/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedWithEmails: updated }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save shared emails: ${response.status} ${response.statusText} - ${errorText}`)
      }

      try {
        const data = await response.json()
        const returned = data?.sharedWithEmails ?? updated
        setRecords(normalize(returned))
      } catch (e) {
        setRecords(updated)
      }

      toast({ title: 'Success', description: 'Access sharing updated successfully' })
      try {
        window.dispatchEvent(new CustomEvent('registration-updated', { detail: { type: 'access-sharing-updated', id: companyId } }))
      } catch (e) {}
    } catch (error) {
      console.error('Error saving shared emails:', error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update access sharing', variant: 'destructive' })
    }
  }

  const handleAdd = async () => {
    const normalized = newEmail.trim().toLowerCase()
    if (!normalized) return
    if (records.some(r => r.email === normalized)) {
      toast({ title: 'Info', description: 'This email is already added' })
      setNewEmail('')
      return
    }
    const newRecord: AccessRecord = {
      email: normalized,
      status: 'pending',
      requestedBy: 'customer',
      requestedAt: new Date().toISOString(),
      respondedAt: null,
      respondedBy: null,
    }
    const updated = [...records, newRecord]
    setRecords(updated)
    setNewEmail('')
    await saveRecords(updated)
  }

  const handleRemove = async (email: string) => {
    const updated = records.filter(r => r.email !== email.toLowerCase())
    setRecords(updated)
    await saveRecords(updated)
  }

  const handleApprove = async (email: string) => {
    const updated = records.map(r => r.email === email ? { ...r, status: 'approved', respondedAt: new Date().toISOString(), respondedBy: 'admin' } : r)
    setRecords(updated)
    await saveRecords(updated)
  }

  const handleReject = async (email: string) => {
    const updated = records.map(r => r.email === email ? { ...r, status: 'rejected', respondedAt: new Date().toISOString(), respondedBy: 'admin' } : r)
    setRecords(updated)
    await saveRecords(updated)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Access Sharing</DialogTitle>
          <DialogDescription>Share this company card with other users by adding their email addresses. Requests added by customers will appear as pending and require admin approval.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
            <Button onClick={handleAdd}>Add</Button>
          </div>

          {records.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Shared with ({records.length}):</p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {records.map((r, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <span className="text-primary font-medium text-xs">{r.email.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{r.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.status === 'pending' ? 'Pending approval' : r.status === 'approved' ? 'Approved' : 'Rejected'}
                          {r.requestedAt ? ` • requested ${new Date(r.requestedAt).toLocaleString()}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && r.status === 'pending' && (
                        <>
                          <Button size="sm" className="h-8 px-2" onClick={() => handleApprove(r.email)}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => handleReject(r.email)}>Reject</Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemove(r.email)} title={`Remove ${r.email} from access sharing`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm">No users have access yet</p>
              <p className="text-xs mt-1">Add email addresses above to request or grant access</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
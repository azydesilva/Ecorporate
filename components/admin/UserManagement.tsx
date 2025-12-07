"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getUsers, deleteUser, updateUser, changeUserRole, isAdmin, type UserRole } from "@/lib/auth-utils"
import type { User } from "@/lib/utils"
import { AlertCircle, CheckCircle, Trash2, UserCog, Shield, ShieldAlert, UserIcon, Mail, MailCheck, MailX, Phone } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type UserManagementProps = {
  currentUser: User
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<UserRole>("customer")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Load users on component mount
  useEffect(() => {
    loadUsers()
  }, [])

  // Update filtered users whenever search query or users change
  useEffect(() => {
    const searchLower = searchQuery.toLowerCase().trim()
    if (!searchLower) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter((user) => {
      const userName = (user.name || "").toLowerCase()
      const userEmail = (user.email || "").toLowerCase()
      const userMobile = (user.mobile_number || "").toLowerCase()
      const userRole = (user.role || "").toLowerCase()

      return userName.includes(searchLower) ||
        userEmail.includes(searchLower) ||
        userMobile.includes(searchLower) ||
        userRole.includes(searchLower)
    })
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const loadUsers = async () => {
    const loadedUsers = await getUsers()
    setUsers(loadedUsers)
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      setError("You cannot delete your own account")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (window.confirm("Are you sure you want to delete this user?")) {
      const success = await deleteUser(userId)

      if (success) {
        setMessage("User deleted successfully")
        await loadUsers() // Reload users
      } else {
        setError("Failed to delete user")
      }

      // Clear messages after 3 seconds
      setTimeout(() => {
        setMessage("")
        setError("")
      }, 3000)
    }
  }

  const handleEditUser = async (user: User) => {
    try {
      // Fetch detailed user information including password
      const response = await fetch(`/api/users/${user.id}`)
      if (response.ok) {
        const userDetails = await response.json()
        setSelectedUser(userDetails)
      } else {
        // Fallback to the user data we already have
        setSelectedUser(user)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      // Fallback to the user data we already have
      setSelectedUser(user)
    }
    setEditRole(user.role as UserRole)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return

    // Check if trying to change own role
    if (selectedUser.id === currentUser.id && editRole !== currentUser.role) {
      setError("You cannot change your own role")
      return
    }

    try {
      console.log('handleSaveEdit called:', { selectedUser, editRole, currentUser });

      // Only update role if it changed
      if (editRole !== selectedUser.role && isAdmin(currentUser)) {
        console.log('Updating user role...');
        await changeUserRole(currentUser.id, selectedUser.id, editRole)
        setMessage("User role updated successfully")
      } else {
        setMessage("No changes made")
      }

      await loadUsers() // Reload users
      setIsEditDialogOpen(false)
    } catch (err: any) {
      console.error('Error in handleSaveEdit:', err);
      setError(err.message || "Failed to update user")
    }

    // Clear messages after 3 seconds
    setTimeout(() => {
      setMessage("")
      setError("")
    }, 3000)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> Admin
          </Badge>
        )
      case "customer":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <UserIcon className="h-3 w-3" /> Customer
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getVerificationBadge = (user: User) => {
    if (user.email_verified) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
          <MailCheck className="h-3 w-3" />
          Verified
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
          <MailX className="h-3 w-3" />
          Pending
        </Badge>
      )
    }
  }

  return (
    <div className="w-full py-6 space-y-6">
      {/* Total Customers Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Customers</h3>
                <p className="text-sm text-gray-600">Registered customers in the system</p>
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-4xl font-bold text-green-600">{users.filter(u => u.role === 'customer').length}</div>
              <div className="text-sm text-gray-500">Active Customers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts in the system</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          </div>


          {/* Results Summary */}
          <div className="mb-4 text-sm text-muted-foreground">
            {searchQuery ? (
              <span>Showing {filteredUsers.length} of {users.length} users matching "{searchQuery}"</span>
            ) : (
              <span>Showing all {users.length} users</span>
            )}
          </div>

          {message && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Success</AlertTitle>
              <AlertDescription className="text-green-700">{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="whitespace-nowrap">{user.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {user.mobile_number ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{user.mobile_number}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getVerificationBadge(user)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        disabled={!isAdmin(currentUser)}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={!isAdmin(currentUser) || user.id === currentUser.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details & Role Management</DialogTitle>
            <DialogDescription>View user information and update user role</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={selectedUser?.name || ""} disabled />
              <p className="text-sm text-muted-foreground">User name cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={selectedUser?.email || ""} disabled />
              <p className="text-sm text-muted-foreground">User email address</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" value={selectedUser?.mobile_number || ""} disabled />
              <p className="text-sm text-muted-foreground">User mobile number</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="text"
                value={selectedUser?.password || ""}
                disabled
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">User password</p>
            </div>

            {isAdmin(currentUser) && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editRole}
                  onValueChange={(value) => setEditRole(value as UserRole)}
                  disabled={selectedUser?.id === currentUser.id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
                {selectedUser?.id === currentUser.id && (
                  <p className="text-sm text-muted-foreground mt-1">You cannot change your own role</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

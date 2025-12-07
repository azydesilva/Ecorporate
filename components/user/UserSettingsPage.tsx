"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Shield, ShieldAlert } from "lucide-react"
import ChangePasswordForm from "./ChangePasswordForm"
import ChangeEmailForm from "./ChangeEmailForm"
import { changeUserPassword, updateUser, validateUserPassword, isAdmin } from "@/lib/auth-utils"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface UserSettingsPageProps {
  user: any
  navigateTo: (page: string) => void
  onLogout: () => void
}

export default function UserSettingsPage({ user, navigateTo, onLogout }: UserSettingsPageProps) {
  const [activeTab, setActiveTab] = useState("account")
  const { toast } = useToast()

  const handleEmailChange = async (newEmail: string) => {
    try {
      // Update the user in database
      const updatedUser = await updateUser(user.id, { email: newEmail })

      if (updatedUser) {
        // Update the current user session
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))

        toast({
          title: "Email updated",
          description: "Your email has been updated successfully.",
        })

        return true
      } else {
        toast({
          title: "Error",
          description: "Failed to update email. Please try again.",
          variant: "destructive",
        })

        return false
      }
    } catch (error) {
      console.error("Error updating email:", error)

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update email. Please try again.",
        variant: "destructive",
      })

      return false
    }
  }

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      // First validate the current password
      const isValidPassword = await validateUserPassword(user.id, currentPassword)
      if (!isValidPassword) {
        toast({
          title: "Error",
          description: "Current password is incorrect.",
          variant: "destructive",
        })

        return false
      }

      // Try to change the password
      const success = await changeUserPassword(user.id, currentPassword, newPassword)

      if (success) {
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully.",
        })

        return true
      } else {
        toast({
          title: "Error",
          description: "Failed to update password. Please try again.",
          variant: "destructive",
        })

        return false
      }
    } catch (error) {
      console.error("Error updating password:", error)

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password. Please try again.",
        variant: "destructive",
      })

      return false
    }
  }

  // Function to get the appropriate role badge
  const getRoleBadge = () => {
    if (isAdmin(user)) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
          <ShieldAlert className="h-3 w-3" /> Administrator
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
          <User className="h-3 w-3" /> Customer
        </Badge>
      )
    }
  }

  // Function to determine which dashboard to return to
  const getDashboardRoute = () => {
    return isAdmin(user) ? "adminDashboard" : "customerDashboard"
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => navigateTo(getDashboardRoute())} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Account Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">
              <User className="h-5 w-5 inline-block mr-2" />
              {user.name}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">{getRoleBadge()}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Update your account information and email address.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">Profile</h3>
                    <p className="text-sm text-muted-foreground">This information is displayed on your profile.</p>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Name</h4>
                      <p className="text-sm text-muted-foreground">{user.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Role</h4>
                      <div className="mt-1">{getRoleBadge()}</div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Email Address</h3>
                    <ChangeEmailForm currentEmail={user.email} onSubmit={handleEmailChange} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Update your password and manage your account security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">Password</h3>
                    <p className="text-sm text-muted-foreground">Update your password to keep your account secure.</p>
                  </div>

                  <ChangePasswordForm onSubmit={handlePasswordChange} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

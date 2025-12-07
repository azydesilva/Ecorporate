"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define the form schema
const usernameFormSchema = z
  .object({
    newUsername: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be at most 30 characters"),
    confirmUsername: z.string().min(3, "Please confirm your username"),
  })
  .refine((data) => data.newUsername === data.confirmUsername, {
    message: "Usernames do not match",
    path: ["confirmUsername"],
  })

type UsernameFormValues = z.infer<typeof usernameFormSchema>

interface ChangeUsernameFormProps {
  currentUsername: string
  onSubmit: (newUsername: string) => Promise<boolean>
}

export default function ChangeUsernameForm({ currentUsername, onSubmit }: ChangeUsernameFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error" | null
    message: string | null
  }>({ type: null, message: null })

  // Initialize the form
  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: {
      newUsername: "",
      confirmUsername: "",
    },
  })

  // Handle form submission
  const handleSubmit = async (values: UsernameFormValues) => {
    // Don't do anything if the username hasn't changed
    if (values.newUsername === currentUsername) {
      form.setError("newUsername", {
        type: "manual",
        message: "New username must be different from current username",
      })
      return
    }

    setIsSubmitting(true)
    setFormStatus({ type: null, message: null })

    try {
      const success = await onSubmit(values.newUsername)

      if (success) {
        setFormStatus({
          type: "success",
          message: "Username updated successfully!",
        })

        // Reset the form on success
        form.reset()
      } else {
        setFormStatus({
          type: "error",
          message: "Failed to update username. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error changing username:", error)

      setFormStatus({
        type: "error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {formStatus.type && (
          <Alert variant={formStatus.type === "error" ? "destructive" : "default"}>
            <AlertDescription className="flex items-center">
              {formStatus.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              {formStatus.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium mb-1">Current Username</p>
          <p className="text-sm text-muted-foreground">{currentUsername}</p>
        </div>

        <FormField
          control={form.control}
          name="newUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your new username" className="max-w-md" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground mt-1">Username must be between 3 and 30 characters.</p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Username</FormLabel>
              <FormControl>
                <Input placeholder="Confirm your new username" className="max-w-md" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-auto px-6">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Username"
          )}
        </Button>
      </form>
    </Form>
  )
}
"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

// Define the form schema
const emailFormSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    confirmEmail: z.string().email("Please enter a valid email address"),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Email addresses do not match",
    path: ["confirmEmail"],
  })

type EmailFormValues = z.infer<typeof emailFormSchema>

interface ChangeEmailFormProps {
  currentEmail: string
  onSubmit: (newEmail: string) => Promise<boolean>
}

export default function ChangeEmailForm({ currentEmail, onSubmit }: ChangeEmailFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize the form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
      confirmEmail: "",
    },
  })

  // Handle form submission
  const handleSubmit = async (values: EmailFormValues) => {
    // Don't do anything if the email hasn't changed
    if (values.email === currentEmail) {
      form.setError("email", {
        type: "manual",
        message: "New email must be different from current email",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const success = await onSubmit(values.email)

      if (success) {
        // Reset the form on success
        form.reset()
      }
    } catch (error) {
      console.error("Error changing email:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="mb-4">
          <p className="text-sm font-medium mb-1">Current Email</p>
          <p className="text-sm text-muted-foreground">{currentEmail}</p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your new email address" className="max-w-md" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Confirm your new email address" className="max-w-md" {...field} />
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
            "Update Email"
          )}
        </Button>
      </form>
    </Form>
  )
}

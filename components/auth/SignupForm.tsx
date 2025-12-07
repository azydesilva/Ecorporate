"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Headphones, Shield, Clock, FileCheck, UserPlus, CheckCircle } from "lucide-react"
import { registerUser, getUsers } from "@/lib/auth-utils"
import { registrationStorage } from "@/lib/utils"

const formSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    mobile_number: z.string()
      .min(10, { message: "Mobile number must be at least 10 digits." })
      .regex(/^\d+$/, { message: "Mobile number must contain only digits (0-9) without spaces or symbols." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine(val => val === true, { message: "You must agree to the Terms & Conditions and Privacy Policy." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignupFormProps = {
  onSignupSuccess: (message: string) => void
  navigateTo: (page: string) => void
}

export default function SignupForm({ onSignupSuccess, navigateTo }: SignupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [emailExists, setEmailExists] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile_number: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  })

  // Watch the email field to check if it exists
  const email = form.watch("email")

  // Check if email exists whenever it changes
  useEffect(() => {
    const checkEmailExists = async () => {
      if (email && email.includes("@")) {
        try {
          const users = await getUsers()
          const exists = users.some((user) => user.email.toLowerCase() === email.toLowerCase())
          setEmailExists(exists)

          if (exists) {
            // We only set this error in state but don't show FormMessage
            form.setError("email", {
              type: "manual",
              message: "", // Empty message to avoid duplicate error text
            })
          } else {
            form.clearErrors("email")
          }
        } catch (error) {
          console.error('Error checking email existence:', error)
        }
      }
    }

    checkEmailExists()
  }, [email, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check again if email exists before submitting
    try {
      const users = await getUsers()
      if (users.some((user) => user.email.toLowerCase() === values.email.toLowerCase())) {
        setEmailExists(true)
        form.setError("email", {
          type: "manual",
          message: "", // Empty message to avoid duplicate error text
        })
        return
      }
    } catch (error) {
      console.error('Error checking email existence:', error)
    }

    setIsSubmitting(true)
    setError("")
    setShowSuccessMessage(false)

    try {
      // Register the new user as a customer
      await registerUser({
        name: values.name,
        email: values.email,
        mobile_number: values.mobile_number,
        password: values.password,
        role: "customer", // Always register as customer
      })

      // Clear any existing registrations in localStorage for new users
      registrationStorage.saveRegistrations([])

      // Show success message
      setShowSuccessMessage(true)
      // onSignupSuccess("Account created successfully. Please check your email to verify your account.")
    } catch (err: any) {
      setError(err.message || "An error occurred during signup. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const features = [
    {
      icon: Headphones,
      title: "Expert Legal & Secretarial Support",
    },
    {
      icon: FileCheck,
      title: "Seamless Compliance",
    },
    {
      icon: Clock,
      title: "Efficiency & Accuracy",
    },
    {
      icon: Shield,
      title: "Confidential & Secure",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-center">
        {/* Introduction Card */}
        <div className="hidden lg:flex lg:justify-center">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-primary text-white">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-white/30 to-white/10 rounded-xl flex items-center justify-center mb-3">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-white">Join Our Platform</CardTitle>
              <CardDescription className="text-sm text-white/80">Start your company registration journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-white/10 border border-white/20"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-white/30 to-white/10 rounded-md flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-white">{feature.title}</h3>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Signup Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:flex lg:justify-center">
          <div className="w-full max-w-md">
            <Card className="shadow-2xl border-0 bg-background/95 backdrop-blur-sm">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
                <CardDescription>Join thousands of successful businesses</CardDescription>
              </CardHeader>
              <CardContent>
                {showSuccessMessage && (
                  <Alert className="mb-6 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">CHECK YOUR EMAIL AND MAKE VERIFY.!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Please check your email to verify your account. You'll need to verify your email before logging in.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {!showSuccessMessage && (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter your email address"
                                className={`h-11 ${emailExists ? "border-red-500" : ""}`}
                                {...field}
                              />
                            </FormControl>
                            {emailExists && (
                              <div className="text-sm text-red-500 mt-1">
                                This email is already registered. Please use a different email or{" "}
                                <Button
                                  variant="link"
                                  className="p-0 h-auto text-red-500 underline"
                                  onClick={() => navigateTo("login")}
                                >
                                  log in
                                </Button>
                              </div>
                            )}
                            {/* Only show FormMessage when email doesn't exist */}
                            {!emailExists && <FormMessage />}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mobile_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="Enter your mobile number"
                                className="h-11"
                                {...field}
                                onChange={(e) => {
                                  // Remove any non-digit characters
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a strong password"
                                  className="h-11 pr-10"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  tabIndex={-1}
                                  onClick={() => setShowPassword((v) => !v)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormDescription>Password must be at least 8 characters long.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="agreeToTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                By creating an account. I confirm that I have read and agree to the{" "}
                                <a href="https://corporate.lk/terms-&-conditions" target="_blank" rel="noopener noreferrer" className="text-primary">
                                  Terms & Conditions
                                </a>{" "}
                                and{" "}
                                <a href="https://corporate.lk/privacy" target="_blank" rel="noopener noreferrer" className="text-primary">
                                  Privacy Policy
                                </a>.
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium"
                        disabled={isSubmitting || emailExists || !form.watch("agreeToTerms")}
                      >
                        {isSubmitting ? "Creating account..." : "Create account"}
                      </Button>
                    </form>
                  </Form>
                )}

                {showSuccessMessage && (
                  <div className="text-center">
                    <Button
                      className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium"
                      onClick={() => navigateTo("login")}
                    >
                      Go to Login
                    </Button>
                  </div>
                )}
              </CardContent>
              {!showSuccessMessage && (
                <CardFooter className="flex justify-center">
                  <div className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary hover:text-primary/80"
                      onClick={() => navigateTo("login")}
                    >
                      Log in
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>

            {/* Mobile Features */}
            <div className="lg:hidden mt-6">
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-3 rounded-lg bg-background/80 backdrop-blur-sm border border-primary/10"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded flex items-center justify-center">
                      <feature.icon className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs text-foreground truncate">{feature.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
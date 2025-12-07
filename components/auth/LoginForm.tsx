"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Headphones, Shield, Clock, FileCheck, Mail } from "lucide-react"
import { authenticateUser } from "@/lib/auth-utils"
import type { User } from "@/lib/utils"
import CompanyNameSearchBox from "@/components/CompanyNameSearchBox"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
})

type LoginFormProps = {
  onLoginSuccess: (userData: User) => Promise<void>
  navigateTo: (page: string) => void
  message?: string
}

export default function LoginForm({ onLoginSuccess, navigateTo, message }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showEmailVerificationMessage, setShowEmailVerificationMessage] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    setError("")
    setShowEmailVerificationMessage(false)

    try {
      // Authenticate the user
      const user = await authenticateUser(values.email, values.password)

      if (!user) {
        throw new Error("Invalid email or password. Please try again.")
      }

      // Login successful
      await onLoginSuccess(user)
    } catch (err: any) {
      // Check if the error is related to email verification
      if (err.message && err.message.includes('verify your email')) {
        setShowEmailVerificationMessage(true)
      } else {
        setError(err.message || "Invalid email or password. Please try again.")
      }
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
      <div className="w-full max-w-5xl">
        {/* Company Name Checker - Full width to match the cards below */}
        <div className="w-full mb-8">
          <CompanyNameSearchBox />
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          {/* Introduction Card */}
          <div className="hidden lg:flex lg:justify-center">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-primary text-white">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-white/30 to-white/10 rounded-xl flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white">Welcome to Our E Corporate Dashboard</CardTitle>
                <CardDescription className="text-sm text-white/80">The Future of  Secretarial Services in Sri Lanka
                </CardDescription>
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

          {/* Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:flex lg:justify-center">
            <div className="w-full max-w-md">
              <Card className="shadow-2xl border-0 bg-background/95 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  {message && (
                    <Alert className="mb-6 bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-700">Success</AlertTitle>
                      <AlertDescription className="text-green-700">{message}</AlertDescription>
                    </Alert>
                  )}

                  {showEmailVerificationMessage && (
                    <Alert className="mb-6 bg-blue-50 border-blue-200">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <AlertTitle className="text-blue-700">Email Verification Required</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        Please check your email and click the verification link to activate your account.
                        Didn't receive the email? Check your spam folder or{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-blue-700 underline"
                          onClick={() => navigateTo("signup")}
                        >
                          create a new account
                        </Button>
                        .
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

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" className="h-11" {...field} />
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
                                  placeholder="Enter your password"
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Logging in..." : "Log in"}
                      </Button>
                    </form>
                  </Form>

                  {/* Forgot Password Link */}
                  <div className="mt-4 text-center">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary hover:text-primary/80 text-sm"
                      onClick={() => navigateTo("forgotPassword")}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <div className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary hover:text-primary/80"
                      onClick={() => navigateTo("signup")}
                    >
                      Sign up
                    </Button>
                  </div>
                </CardFooter>
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
    </div>
  )
}
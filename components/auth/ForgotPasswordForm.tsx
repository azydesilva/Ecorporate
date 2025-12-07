"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Headphones, Shield, Clock, FileCheck, Mail } from "lucide-react"

const formSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
})

type ForgotPasswordFormProps = {
    navigateTo: (page: string) => void
    onPasswordResetRequested: (email: string) => void
}

export default function ForgotPasswordForm({ navigateTo, onPasswordResetRequested }: ForgotPasswordFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [countdown, setCountdown] = useState(5) // 5 second countdown

    // Handle countdown when password reset request is successful
    useEffect(() => {
        let countdownTimer: NodeJS.Timeout;

        if (successMessage && countdown > 0) {
            countdownTimer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (successMessage && countdown === 0) {
            // Redirect to login page after countdown
            window.location.href = '/';
        }

        return () => {
            if (countdownTimer) clearTimeout(countdownTimer);
        };
    }, [successMessage, countdown]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true)
        setError("")
        setSuccessMessage("")

        try {
            // Call the API to request password reset
            const response = await fetch('/api/auth/request-password-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: values.email }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "An error occurred. Please try again.");
            }

            setSuccessMessage(result.message || "If an account exists with this email, we've sent password reset instructions. Please check your email and follow the link to reset your password.");
            onPasswordResetRequested(values.email);
        } catch (err: any) {
            setError(err.message || "An error occurred. Please try again.");
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
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-xl font-bold text-white">Password Reset</CardTitle>
                            <CardDescription className="text-sm text-white/80">Securely reset your account password</CardDescription>
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

                {/* Password Reset Form */}
                <div className="w-full max-w-md mx-auto lg:mx-0 lg:flex lg:justify-center">
                    <div className="w-full max-w-md">
                        <Card className="shadow-2xl border-0 bg-background/95 backdrop-blur-sm">
                            <CardHeader className="space-y-1 text-center">
                                <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
                                <CardDescription>Enter your email address and we'll send you instructions to reset your password</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {successMessage && (
                                    <Alert className="mb-6 bg-green-50 border-green-200">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <AlertTitle className="text-green-700">Success</AlertTitle>
                                        <AlertDescription className="text-green-700">
                                            {successMessage}
                                            {countdown > 0 && (
                                                <p className="mt-2">Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
                                            )}
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
                                                    <FormLabel>Email Address</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="Enter your email address"
                                                            className="h-11"
                                                            {...field}
                                                        />
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
                                            {isSubmitting ? "Sending..." : "Send Reset Instructions"}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                            <CardFooter className="flex justify-center">
                                <div className="text-sm text-muted-foreground">
                                    Remember your password?{" "}
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto text-primary hover:text-primary/80"
                                        onClick={() => navigateTo("login")}
                                    >
                                        Back to login
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
    )
}
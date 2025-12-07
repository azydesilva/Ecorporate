"use client"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react"
import type { PackagePlan } from "../../admin/PackagesManager"
import BankTransferDetails from "../BankTransferDetails"
import { LocalStorageService, DatabaseService } from "@/lib/database-service"

const formSchema = z.object({
  companyEntity: z.string().optional(),
  companyNameEnglish: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters." })
    .transform((val) => val.toUpperCase()),
  companyNameSinhala: z
    .string()
    .transform((val) => val.toUpperCase())
    .optional(),
  contactPersonName: z
    .string()
    .min(2, { message: "Contact person's name must be at least 2 characters." })
    .transform((val) => val.toUpperCase()),
  contactPersonEmail: z
    .string()
    .email({ message: "Please enter a valid email address." })
  ,
  contactPersonPhone: z
    .string()
    .min(10, { message: "Please enter a valid phone number." })
    .transform((val) => val.toUpperCase()),
  selectedPackage: z.string({ required_error: "Please select a package." }),
  paymentMethod: z.string({ required_error: "Please select a payment method." }),
})


type Package = PackagePlan;


type ContactDetailsProps = {
  companyData: any;
  bankDetails: Array<any>;
  packages?: Record<string, Package>;
  onComplete: (data: any) => void;
  user?: any;
};

export default function ContactDetailsStep({ companyData, bankDetails, packages = {}, onComplete, user }: ContactDetailsProps) {

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState<string>("");

  // Company name availability checker states
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{
    status: 'available' | 'unavailable' | 'unknown' | null;
    message: string;
    companyName?: string;
    phoneticallySimilar?: boolean;
  }>({ status: null, message: '' });

  const [availablePackages, setAvailablePackages] = useState<Record<string, Package>>({});
  const bankDetailsRef = useRef<HTMLDivElement>(null);

  // Set selectedBankId when bankDetails change
  useEffect(() => {
    if (Array.isArray(bankDetails) && bankDetails.length > 0) {
      setSelectedBankId(bankDetails[0].id);
    }
  }, [bankDetails]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyEntity: companyData.companyEntity || "(PVT) LTD",
      companyNameEnglish: companyData.companyNameEnglish || companyData.companyName || "",
      companyNameSinhala: companyData.companyNameSinhala || "",
      contactPersonName: companyData.contactPersonName || "",
      contactPersonEmail: companyData.contactPersonEmail || "",
      contactPersonPhone: companyData.contactPersonPhone || "",
      selectedPackage: companyData.selectedPackage || "",
      paymentMethod: companyData.paymentMethod || "bankTransfer",
    },
  })

  // Always load all admin packages from database and listen for real-time updates
  useEffect(() => {
    const loadPackages = async () => {
      try {
        console.log('📦 ContactDetailsStep - Loading packages from database...');
        const pkgsArr: PackagePlan[] = await LocalStorageService.getPackages();
        console.log('📦 ContactDetailsStep - Loaded packages:', pkgsArr);
        const pkgsObj: Record<string, Package> = {};
        pkgsArr.forEach(pkg => {
          pkgsObj[pkg.id] = pkg;
        });
        setAvailablePackages(pkgsObj);

        // Set the first package as default if no package is selected
        if (pkgsArr.length > 0 && !form.getValues("selectedPackage")) {
          form.setValue("selectedPackage", pkgsArr[0].id);
        }
      } catch (error) {
        console.error('Error loading packages:', error);
        setAvailablePackages({});
      }
    };

    const handleCustomUpdate = async () => {
      // Reload packages from API to get the latest data
      console.log('📦 ContactDetailsStep - Packages updated event received, reloading from API...');
      await loadPackages();
    };

    window.addEventListener('packages-updated', handleCustomUpdate as EventListener);
    loadPackages();

    return () => {
      window.removeEventListener('packages-updated', handleCustomUpdate as EventListener);
    };
  }, [form]);

  const getPackagePrice = (packageId: string): number => {
    if (availablePackages && availablePackages[packageId]) {
      return availablePackages[packageId].price;
    }
    return 0;
  }

  const getPackageTitle = (packageId: string): string => {
    if (availablePackages && availablePackages[packageId]) {
      return availablePackages[packageId].name;
    }
    return "";
  }

  const handleFileUpload = (file: File) => {
    setPaymentReceipt(file)
  }

  // Function to check company name availability using the real API
  const checkCompanyNameAvailability = async (companyName: string) => {
    if (!companyName || companyName.length < 2) {
      setAvailabilityResult({ status: null, message: '' });
      return;
    }

    setIsCheckingAvailability(true);
    setAvailabilityResult({ status: null, message: '' });

    try {
      const response = await fetch('/api/company-name-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check company name availability');
      }

      setAvailabilityResult({
        status: data.status,
        message: data.message,
        companyName: data.companyName,
        phoneticallySimilar: data.phoneticallySimilar || false,
      });
    } catch (err: any) {
      console.error('Error checking company name availability:', err);
      setAvailabilityResult({
        status: null,
        message: 'Unable to check availability at this time. Please try again.'
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null)

    if (values.paymentMethod === "bankTransfer" && !showBankDetails) {
      setShowBankDetails(true)
      // Scroll to bank details section after a short delay to ensure it's rendered
      setTimeout(() => {
        bankDetailsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 100)
      return
    }

    if (values.paymentMethod === "bankTransfer" && showBankDetails && !paymentReceipt) {
      setError("Please upload your payment receipt before proceeding")
      return
    }

    setIsSubmitting(true)
    try {
      // Generate unique ID for the registration with better uniqueness
      const timestamp = Date.now()
      const randomPart = Math.random().toString(36).substr(2, 9)
      const registrationId = `reg_${timestamp}_${randomPart}_${Math.random().toString(36).substr(2, 5)}`

      // Handle payment receipt upload if present
      let paymentReceiptData = null
      if (paymentReceipt) {
        try {
          // Upload payment receipt to server using file storage
          const { fileUploadClient } = await import('@/lib/file-upload-client')
          const uploadResult = await fileUploadClient.uploadFile(paymentReceipt, registrationId)

          if (uploadResult.success && uploadResult.file) {
            paymentReceiptData = {
              name: paymentReceipt.name,
              type: paymentReceipt.type,
              size: paymentReceipt.size,
              url: uploadResult.file.url,
              id: uploadResult.file.id,
              uploadedAt: uploadResult.file.uploadedAt
            }
          }
        } catch (uploadError) {
          console.error('Error uploading payment receipt:', uploadError)
          // Continue without payment receipt if upload fails
        }
      }

      // Get the selected package name from the package ID
      const selectedPackageName = availablePackages[values.selectedPackage]?.name || values.selectedPackage
      console.log('📦 Package Selection:', {
        packageId: values.selectedPackage,
        packageName: selectedPackageName,
        availablePackages: Object.keys(availablePackages)
      })

      // Create registration data for MySQL database
      const registrationData = {
        id: registrationId,
        userId: user?.id || 'default_user',
        companyEntity: values.companyEntity,
        companyNameEnglish: values.companyNameEnglish,
        companyNameSinhala: values.companyNameSinhala,
        companyName: values.companyNameEnglish, // For backward compatibility
        contactPersonName: values.contactPersonName,
        contactPersonEmail: values.contactPersonEmail,
        contactPersonPhone: values.contactPersonPhone,
        selectedPackage: values.selectedPackage, // Save package ID
        paymentMethod: values.paymentMethod,
        currentStep: 'company-details', // Next step
        status: 'payment-processing',
        paymentReceipt: paymentReceiptData
      }

      // Save to MySQL database
      try {
        console.log('📝 ContactDetailsStep - Sending registration data to database:', JSON.stringify(registrationData, null, 2))
        await DatabaseService.createRegistration(registrationData)
        console.log('✅ Registration saved to MySQL database:', registrationId)
      } catch (dbError) {
        console.error('❌ Error saving to MySQL database:', dbError)
        // Fallback to localStorage if database fails
        await LocalStorageService.saveRegistration(registrationData)
        console.log('📦 Registration saved to localStorage as fallback')
      }

      // Also save to localStorage for immediate access
      await LocalStorageService.saveRegistration({
        ...registrationData,
        userId: user?.id || 'default_user'
      })

      // Show success message
      setPaymentSuccess(true)

      // Dispatch registration update event for admin dashboard
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-saved",
            registrationId: registrationId,
            registration: registrationData
          },
        })
      )

      // Wait 2 seconds to show success message before proceeding
      setTimeout(() => {
        onComplete({
          ...values,
          selectedPackage: values.selectedPackage, // Use package ID
          _id: registrationId, // Add the generated ID
          paymentReceipt: paymentReceiptData,
          currentStep: 'company-details', // Explicitly set next step
        })
      }, 2000)
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("An error occurred while submitting the form. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
            <CardDescription>Please provide the contact details for your company registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {paymentSuccess && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700">Payment Received</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your payment has been received. Proceeding to the next step...
                </AlertDescription>
              </Alert>
            )}

            {/* Select Company Entity Field */}
            <FormField
              control={form.control}
              name="companyEntity"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Select Company Entity</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue="(PVT) LTD"
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="(PVT) LTD" id="entity-pvt" />
                        <Label htmlFor="entity-pvt">(PVT) LTD</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="(PRIVATE) LIMITED" id="entity-private" />
                        <Label htmlFor="entity-private">(PRIVATE) LIMITED</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Public Limited" id="entity-public" />
                        <Label htmlFor="entity-public">Public Limited</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Overseas" id="entity-overseas" />
                        <Label htmlFor="entity-overseas">Overseas</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="offshore" id="entity-offshore" />
                        <Label htmlFor="entity-offshore">Offshore</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unlimited" id="entity-unlimited" />
                        <Label htmlFor="entity-unlimited">Unlimited</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Gurantee LTD (Under Selection 32)" id="entity-guarantee-ltd" />
                        <Label htmlFor="entity-guarantee-ltd">Gurantee LTD (Under Selection 32)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Gurantee Limited (Under Selection 32)" id="entity-guarantee-limited" />
                        <Label htmlFor="entity-guarantee-limited">Gurantee Limited (Under Selection 32)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Gurantee Under Selection 34" id="entity-guarantee-selection34" />
                        <Label htmlFor="entity-guarantee-selection34">Gurantee Under Selection 34</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Name Availability Checker - Placed after company entity and before company name fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Name Checker | Registar of Company Directory</h3>
              <div className="flex gap-2 w-full">
                <Input
                  placeholder="Check company name availability"
                  value={form.watch("companyNameEnglish") || ""}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    form.setValue("companyNameEnglish", value);
                    // Clear previous result when typing
                    if (availabilityResult.status) {
                      setAvailabilityResult({ status: null, message: '' });
                    }
                  }}
                />
                <Button
                  type="button"
                  className="bg-primary hover:bg-primary/90"
                  size="icon"
                  onClick={() => checkCompanyNameAvailability(form.watch("companyNameEnglish") || "")}
                  disabled={isCheckingAvailability || !form.watch("companyNameEnglish") || (form.watch("companyNameEnglish") || "").length < 2}
                >
                  {isCheckingAvailability ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Display availability result */}
              {availabilityResult.status && availabilityResult.status !== 'unknown' && (
                <div className={`mt-2 p-3 rounded-md border ${availabilityResult.status === 'available'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                  }`}>
                  <div className="flex items-start">
                    {availabilityResult.status === 'available' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className={`font-medium ${availabilityResult.status === 'available'
                          ? 'text-green-800'
                          : 'text-red-800'
                        }`}>
                        {availabilityResult.companyName}
                      </h4>
                      <p className={`text-sm ${availabilityResult.status === 'available'
                          ? 'text-green-700'
                          : 'text-red-700'
                        }`}>
                        Status: {availabilityResult.status}
                      </p>
                      <p className={`text-sm mt-1 ${availabilityResult.status === 'available'
                          ? 'text-green-700'
                          : 'text-red-700'
                        }`}>
                        {availabilityResult.message}
                      </p>
                      {availabilityResult.status === 'unavailable' && (
                        <p className="text-sm text-red-700 mt-1">
                          Please change the company name and try again.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Company Name Section - both fields on same line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyNameEnglish"
                render={({ field }) => {
                  const selectedEntity = form.watch("companyEntity");
                  const showSuffix = selectedEntity === "(PVT) LTD" || selectedEntity === "(PRIVATE) LIMITED" || selectedEntity === "Public Limited" || selectedEntity === "Overseas" || selectedEntity === "offshore" || selectedEntity === "unlimited" || selectedEntity === "Gurantee LTD (Under Selection 32)" || selectedEntity === "Gurantee Limited (Under Selection 32)" || selectedEntity === "Gurantee Under Selection 34";
                  return (
                    <FormItem>
                      <FormLabel>Company Name (English)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter company name in English"
                            {...field}
                            value={(field.value as string) || ""}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                          {showSuffix && (
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                              {selectedEntity}
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="companyNameSinhala"
                render={({ field }) => {
                  const selectedEntity = form.watch("companyEntity");
                  const showSuffix = selectedEntity === "(PVT) LTD" || selectedEntity === "(PRIVATE) LIMITED" || selectedEntity === "Public Limited" || selectedEntity === "Overseas" || selectedEntity === "offshore" || selectedEntity === "unlimited" || selectedEntity === "Gurantee LTD (Under Selection 32)" || selectedEntity === "Gurantee Limited (Under Selection 32)" || selectedEntity === "Gurantee Under Selection 34";
                  return (
                    <FormItem>
                      <FormLabel>Company Name (සිංහල​)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter company name in Sinhala"
                            {...field}
                            value={(field.value as string) || ""}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                          {showSuffix && (
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                              {selectedEntity}
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="contactPersonName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person's Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter contact person's name"
                      {...field}
                      value={(field.value as string) || ""}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPersonEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person's Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      {...field}
                      value={(field.value as string) || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPersonPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person's Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter phone number"
                      {...field}
                      value={(field.value as string) || ""}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="selectedPackage"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-xl font-bold text-center block">Choose Your Package</FormLabel>
                    <Card className="border border-amber-200 bg-amber-50">
                      <CardContent className="p-4">
                        <p className="text-sm text-amber-900 text-center">
                          For a comprehensive breakdown of inclusions, exclusions, and applicable charges, please refer to our
                          {' '}<a
                            href="https://corporate.lk/plans"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold underline underline-offset-2 text-amber-900 hover:text-amber-700"
                          >
                            Table of Fees
                          </a>
                        </p>
                      </CardContent>
                    </Card>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mx-auto">
                        {Object.entries(availablePackages).length > 0 ? (
                          Object.entries(availablePackages).map(([packageId, packageData]: [string, Package]) => (
                            <div
                              key={packageId}
                              className={`relative cursor-pointer rounded-full overflow-hidden border transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5
                                ${field.value === packageId
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-200 hover:border-gray-300"}`}
                              onClick={() => field.onChange(packageId)}
                            >
                              {/* Dark blue half-round background */}
                              {/* Background shape removed */}
                              {/* Selected bullet indicator */}
                              <div
                                aria-hidden
                                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border ${field.value === packageId ? 'bg-primary border-primary ring-2 ring-primary/20' : 'bg-white border-gray-300'}`}
                              />
                              <div className="p-3 text-center flex flex-col items-center justify-center h-full gap-1">
                                {/* Package Title */}
                                <h3 className={`text-sm font-semibold tracking-tight mb-1 ${field.value === packageId ? "text-primary" : "text-gray-900"}`}>
                                  {packageData.name}
                                </h3>

                                {/* Type (prices hidden) */}
                                <div className="mb-1 flex items-center justify-center">
                                  <span className={`px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary`}>
                                    {packageData.type === "one-time" ? "One-time payment" : "Advance + Balance"}
                                  </span>
                                </div>

                                {/* Actions removed */}

                                {/* Selection indicator removed */}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full">
                            <Alert className="w-full max-w-md mx-auto">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>No Packages Available</AlertTitle>
                              <AlertDescription>
                                Please contact support for assistance with registration packages.
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    {/* Pricing note removed as prices are hidden */}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bankTransfer" id="bankTransfer" />
                          <Label htmlFor="bankTransfer">Bank Transfer</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>Bank transfer details will be provided after submission.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showBankDetails && (
              <div ref={bankDetailsRef} className="mt-8">
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-700">Payment Information</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    {(() => {
                      const pkg = availablePackages[form.watch("selectedPackage")];
                      if (!pkg) return null;
                      if (pkg.type === "advance-balance") {
                        return (
                          <>
                            Please transfer <b>Rs. {pkg.advanceAmount?.toLocaleString()}</b> as the advance payment for the <b>{pkg.name}</b> package to the bank account below.
                          </>
                        );
                      } else {
                        return (
                          <>
                            Please transfer <b>Rs. {pkg.price?.toLocaleString()}</b> for the <b>{pkg.name}</b> package to the bank account below.
                          </>
                        );
                      }
                    })()}
                  </AlertDescription>
                </Alert>
                {/* Show all available banks as selectable cards */}
                {Array.isArray(bankDetails) && bankDetails.length > 1 && (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bankDetails.map((bank: any) => (
                      <Card
                        key={bank.id}
                        className={`cursor-pointer border-2 ${selectedBankId === bank.id ? "border-primary" : "border-gray-200"}`}
                        onClick={() => setSelectedBankId(bank.id)}
                      >
                        <CardHeader>
                          <CardTitle className="text-base">{bank.bankName}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
                <BankTransferDetails
                  bankDetails={Array.isArray(bankDetails) && bankDetails.length > 1 ? bankDetails.find((b: any) => b.id === selectedBankId) : bankDetails[0]}
                  onFileUpload={handleFileUpload}
                  uploadedFile={paymentReceipt}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            {showBankDetails && !paymentReceipt && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-700">Payment Receipt Required</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Please upload your payment receipt to continue to the next step.
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                paymentSuccess ||
                (showBankDetails && !paymentReceipt)
              }
            >
              {isSubmitting
                ? "Submitting..."
                : paymentSuccess
                  ? "Proceeding..."
                  : showBankDetails
                    ? "Continue to Next Step"
                    : "Proceed to Payment"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
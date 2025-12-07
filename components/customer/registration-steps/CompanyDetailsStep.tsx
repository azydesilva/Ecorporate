"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusCircle, Trash2, Upload, FileText, User, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { settingsStorage } from "@/lib/local-storage"
import { LocalStorageService, DatabaseService } from "@/lib/database-service"
import { fileUploadClient } from "@/lib/file-upload-client"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import adminData from "@/lib/sri-lanka-admin-data.json"

// Removed MAX_FILE_SIZE limit to allow unlimited uploads
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]

// Beneficiary Owners Section Component
const BeneficiaryOwnersSection = ({ shareholderIndex, form, adminData }: { shareholderIndex: number, form: any, adminData: any }) => {
  const [beneficiaryType, setBeneficiaryType] = useState<"local" | "foreign">("local");
  const beneficiaryFields = form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners`) || [];

  const addBeneficiaryOwner = (type: "local" | "foreign") => {
    const currentBeneficiaries = form.getValues(`shareholders.${shareholderIndex}.beneficiaryOwners`) || [];

    // Initialize first beneficiary if none exists
    if (currentBeneficiaries.length === 0) {
      const firstBeneficiary = {
        type: "local", // Default to local for the first one
        // Local fields
        nicNumber: "",
        firstName: "",
        lastName: "",
        province: "",
        district: "",
        divisionalSecretariat: "",
        address: "",
        postalCode: "",
        contactNumber: "",
        emailAddress: "",
        // Foreign fields
        passportNo: "",
        country: "",
        foreignAddress: "",
        city: "",
        stateRegionProvince: "",
      };
      form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners`, [firstBeneficiary]);
      return;
    }

    // Add additional beneficiary
    const newBeneficiary = {
      type: type,
      // Local fields
      nicNumber: "",
      firstName: "",
      lastName: "",
      province: "",
      district: "",
      divisionalSecretariat: "",
      address: "",
      postalCode: "",
      contactNumber: "",
      emailAddress: "",
      // Foreign fields
      passportNo: "",
      country: "",
      foreignAddress: "",
      city: "",
      stateRegionProvince: "",
    };
    form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners`, [...currentBeneficiaries, newBeneficiary]);
  };

  const removeBeneficiaryOwner = (beneficiaryIndex: number) => {
    const currentBeneficiaries = form.getValues(`shareholders.${shareholderIndex}.beneficiaryOwners`) || [];

    // If removing the first beneficiary (index 0), just clear the fields but keep the structure
    if (beneficiaryIndex === 0) {
      const clearedBeneficiary = {
        type: "local",
        // Clear all fields
        nicNumber: "",
        firstName: "",
        lastName: "",
        province: "",
        district: "",
        divisionalSecretariat: "",
        address: "",
        postalCode: "",
        contactNumber: "",
        emailAddress: "",
        passportNo: "",
        country: "",
        foreignAddress: "",
        city: "",
        stateRegionProvince: "",
      };
      form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners`, [clearedBeneficiary]);
    } else {
      // For additional beneficiaries, remove them normally
      currentBeneficiaries.splice(beneficiaryIndex, 1);
      form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners`, currentBeneficiaries);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h4 className="text-sm font-medium">Details of Beneficiary Owner(s)</h4>
        <div className="flex items-center gap-4">
          {/* Toggle Button */}
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant={beneficiaryType === "local" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setBeneficiaryType("local");
                // Clear foreign beneficiary fields when switching to local
                const currentBeneficiaries = form.getValues(`shareholders.${shareholderIndex}.beneficiaryOwners`) || [];
                const clearedBeneficiaries = currentBeneficiaries.map((beneficiary: any) => ({
                  ...beneficiary,
                  type: "local",
                  // Clear foreign beneficiary fields
                  passportNo: "",
                  country: "",
                  foreignAddress: "",
                  city: "",
                  stateRegionProvince: ""
                }));
                form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners`, clearedBeneficiaries, { shouldValidate: false });
              }}
            >
              Local Beneficiary
            </Button>
            <Button
              type="button"
              variant={beneficiaryType === "foreign" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setBeneficiaryType("foreign");
                // Clear local beneficiary fields when switching to foreign
                const currentBeneficiaries = form.getValues(`shareholders.${shareholderIndex}.beneficiaryOwners`) || [];
                const clearedBeneficiaries = currentBeneficiaries.map((beneficiary: any) => ({
                  ...beneficiary,
                  type: "foreign",
                  // Clear local beneficiary fields
                  nicNumber: "",
                  firstName: "",
                  lastName: "",
                  province: "",
                  district: "",
                  divisionalSecretariat: "",
                  address: "",
                  postalCode: "",
                  contactNumber: "",
                  emailAddress: ""
                }));
                form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners`, clearedBeneficiaries, { shouldValidate: false });
              }}
            >
              Foreign Beneficiary
            </Button>
          </div>
          {/* Add Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addBeneficiaryOwner("local")}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add More Local Beneficiary
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addBeneficiaryOwner("foreign")}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add More Foreign Beneficiary
            </Button>
          </div>
        </div>
      </div>

      {/* Conditional Beneficiary fields based on toggle selection */}
      <Card className="border-dashed border-2">
        <CardHeader className="pb-2 flex flex-row justify-between items-center">
          <CardTitle className="text-sm">
            {beneficiaryType === "local" ? "Local" : "Foreign"} Beneficiary Person (Default)
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeBeneficiaryOwner(0)}
            className="h-8 w-8 p-0"
            aria-label="Clear Beneficiary Owner"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {beneficiaryType === "local" ? (
            <>
              {/* Local Beneficiary Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.nicNumber`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIC No</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter NIC number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.firstName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.lastName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <h5 className="text-sm font-medium">Local Address</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.province`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Province</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners.0.district`, "");
                              form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners.0.divisionalSecretariat`, "");
                            }}
                            value={field.value || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a province" />
                            </SelectTrigger>
                            <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              {adminData.provinces?.map((province: any) => (
                                <SelectItem key={province.id} value={province.name}>
                                  {province.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.district`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners.0.divisionalSecretariat`, "");
                            }}
                            value={field.value || ""}
                            disabled={!form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.0.province`)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a district" />
                            </SelectTrigger>
                            <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              {(() => {
                                const selectedProvince = form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.0.province`);
                                const province = adminData.provinces?.find((p: any) => p.name === selectedProvince);
                                return province?.districts?.map((district: any) => (
                                  <SelectItem key={district.id} value={district.name}>
                                    {district.name}
                                  </SelectItem>
                                )) || [];
                              })()}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.divisionalSecretariat`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Divisional Secretariat</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                            disabled={!form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.0.district`)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a divisional secretariat" />
                            </SelectTrigger>
                            <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              {(() => {
                                const selectedProvince = form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.0.province`);
                                const selectedDistrict = form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.0.district`);
                                const province = adminData.provinces?.find((p: any) => p.name === selectedProvince);
                                const district = province?.districts?.find((d: any) => d.name === selectedDistrict);
                                return district?.divisionalSecretariats?.map((secretariat: string, index: number) => (
                                  <SelectItem key={`secretariat-${index}-${secretariat}`} value={secretariat}>
                                    {secretariat}
                                  </SelectItem>
                                )) || [];
                              })()}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.address`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.postalCode`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter postal code" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.contactNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact number" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.emailAddress`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </>
          ) : (
            <>
              {/* Foreign Beneficiary Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.passportNo`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport No</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter passport number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.firstName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.lastName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.country`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          {((adminData as any).countries || []).map((country: any) => (
                            <SelectItem key={country.id} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Foreign Address Section */}
              <div className="space-y-4">
                <h5 className="text-sm font-medium">Foreign Address</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.foreignAddress`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter address" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.city`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.stateRegionProvince`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Region/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state/region/province" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.postalCode`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter postal code" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.contactNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact number" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`shareholders.${shareholderIndex}.beneficiaryOwners.0.emailAddress`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Additional Beneficiary Owners */}
      {beneficiaryFields.filter((_: any, index: number) => index > 0).map((beneficiary: any, filteredIndex: number) => {
        const actualIndex = filteredIndex + 1; // Map filtered index to actual index
        return (
          <Card key={`beneficiary-${shareholderIndex}-${actualIndex}`} className="border-dashed border-2">
            <CardHeader className="pb-2 flex flex-row justify-between items-center">
              <CardTitle className="text-sm">
                Beneficiary Owner {actualIndex + 1} - {beneficiary.type === "local" ? "Local" : "Foreign"} Person
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeBeneficiaryOwner(actualIndex)}
                className="h-8 w-8 p-0"
                aria-label="Remove Beneficiary Owner"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {beneficiary.type === "local" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.nicNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIC No</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter NIC number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.firstName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.lastName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">Local Address</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.province`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.district`, "");
                                  form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.divisionalSecretariat`, "");
                                }}
                                value={field.value || ""}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a province" />
                                </SelectTrigger>
                                <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                  {adminData.provinces?.map((province: any) => (
                                    <SelectItem key={province.id} value={province.name}>
                                      {province.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.district`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>District</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue(`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.divisionalSecretariat`, "");
                                }}
                                value={field.value || ""}
                                disabled={!form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.province`)}
                                key={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.district.${form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.province`)}`}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a district" />
                                </SelectTrigger>
                                <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                  {(adminData.provinces
                                    ?.find((p: any) => p.name === form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.province`))
                                    ?.districts || []).map((district: any) => (
                                      <SelectItem key={district.id} value={district.name}>
                                        {district.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.divisionalSecretariat`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Divisional Secretariat</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                                disabled={!form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.district`)}
                                key={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.divisionalSecretariat.${form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.district`)}`}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a divisional secretariat" />
                                </SelectTrigger>
                                <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                  {(adminData.provinces
                                    ?.find((p: any) => p.name === form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.province`))
                                    ?.districts.find((d: any) => d.name === form.watch(`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.district`))
                                    ?.divisionalSecretariats || []).map((secretariat: string, index: number) => (
                                      <SelectItem key={`beneficiary-secretariat-${index}-${secretariat}`} value={secretariat}>
                                        {secretariat}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.address`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter address" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.postalCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter postal code" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.contactNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter contact number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.emailAddress`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email address" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.passportNo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passport No</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter passport number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.firstName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.lastName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.country`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {((adminData as any).countries || []).map((country: any, index: number) => (
                                  <SelectItem key={`country-${index}-${country.name || country}`} value={country.name || country}>
                                    {country.name || country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Foreign Address Section */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">Foreign Address</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.foreignAddress`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter address" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.city`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter city" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.stateRegionProvince`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Region/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter state/region/province" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.postalCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter postal code" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.contactNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter contact number" {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`shareholders.${shareholderIndex}.beneficiaryOwners.${actualIndex}.emailAddress`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter email address" {...field} value={field.value || ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const fileSchema = z
  .array(
    z.object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
      url: z.string(),
    }),
  )
  .optional()
  .default([])

// Beneficiary Owner schema
const beneficiaryOwnerSchema = z.object({
  type: z.enum(["local", "foreign"]),
  // Local beneficiary fields
  nicNumber: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  divisionalSecretariat: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  contactNumber: z.string().optional(),
  emailAddress: z.string().optional(),
  // Foreign beneficiary fields
  passportNo: z.string().optional(),
  country: z.string().optional(),
  foreignAddress: z.string().optional(),
  city: z.string().optional(),
  stateRegionProvince: z.string().optional(),
}).refine(() => true, {
  message: "Validation disabled - all beneficiary fields are optional"
});

// Shareholder schema with required fields - Enhanced for all 4 combinations
const shareholderSchema = z.object({
  type: z.string().optional(),
  residency: z.string().optional(),
  // Natural Person fields
  fullName: z.string().optional(),
  nicNumber: z.string().optional(),
  // Legal Entity fields
  companyRegistrationNumber: z.string().optional(),
  companyName: z.string().optional(),
  // Contact fields
  email: z.string().optional(),
  contactNumber: z.string().optional(),
  // Sri Lankan address fields
  province: z.string().optional(),
  district: z.string().optional(),
  divisionalSecretariat: z.string().optional(),
  fullAddress: z.string().optional(),
  postalCode: z.string().optional(),
  // Foreign address fields
  foreignAddress: z.string().optional(),
  city: z.string().optional(),
  stateRegionProvince: z.string().optional(),
  // Foreign person fields
  passportNo: z.string().optional(),
  passportIssuedCountry: z.string().optional(),
  country: z.string().optional(),
  // Documents and other fields
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
  })).optional(),
  isDirector: z.boolean().optional(),
  shares: z.string().optional(),
  // Beneficiary owners for legal entities
  beneficiaryOwners: z.array(beneficiaryOwnerSchema).optional(),
}).refine(() => true, {
  message: "Validation disabled - all fields are optional"
})

const directorSchema = z.object({
  residency: z.string().optional(),
  // Local person fields
  fullName: z.string().optional(),
  nicNumber: z.string().optional(),
  // Foreign person fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  passportNo: z.string().optional(),
  passportIssuedCountry: z.string().optional(),
  country: z.string().optional(),
  // Foreign address fields
  city: z.string().optional(),
  stateRegionProvince: z.string().optional(),
  foreignAddress: z.string().optional(),
  foreignPostalCode: z.string().optional(),
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
  })).optional(),
  email: z.string().optional(),
  contactNumber: z.string().optional(),
  fromShareholder: z.boolean().optional(),
  shareholderIndex: z.number().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  divisionalSecretariat: z.string().optional(),
  fullAddress: z.string().optional(),
  localPostalCode: z.string().optional(),
})

const shareholderDirectorSchema = z.object({
  residency: z.string().optional(),
  // Local person fields
  fullName: z.string().optional(),
  nicNumber: z.string().optional(),
  // Foreign person fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  passportNo: z.string().optional(),
  passportIssuedCountry: z.string().optional(),
  country: z.string().optional(),
  // Foreign address fields
  foreignAddress: z.string().optional(),
  foreignPostalCode: z.string().optional(),
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
  })).optional(),
  email: z.string().optional(),
  contactNumber: z.string().optional(),
  fromShareholder: z.boolean().optional(),
  shareholderIndex: z.number().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  divisionalSecretariat: z.string().optional(),
  fullAddress: z.string().optional(),
  localPostalCode: z.string().optional(),
})

const companySchema = z.object({
  name: z.string().optional(),
  registrationNumber: z.string().optional(),
  incorporationDate: z.string().optional(),
  businessType: z.string().optional(),
  businessNature: z.string().optional(),
  businessAddress: z.string().optional(),
  postalCode: z.string().optional(),
  email: z.string().optional(),
  contactNumber: z.string().optional(),
  directors: z.array(directorSchema).optional(),
  shareholders: z.array(shareholderSchema).optional(),
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
  })).optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  divisionalSecretariat: z.string().optional(),
  fullAddress: z.string().optional(),
})

export const schema = z.object({
  company: companySchema,
  files: fileSchema,
})

// Form schema with required fields for customer step 2
const formSchema = z.object({
  companyNameEnglish: z.string().optional(),
  companyNameSinhala: z.string().optional(),
  companyEntity: z.string().optional(),
  isForeignOwned: z.string().optional(),
  businessAddressNumber: z.string().optional(),
  businessAddressStreet: z.string().optional(),
  businessAddressCity: z.string().optional(),
  postalCode: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  divisionalSecretariat: z.string().optional(),
  sharePrice: z.string().optional(),
  numberOfShareholders: z.string().optional(),
  shareholders: z.array(shareholderSchema).optional(),
  makeSimpleBooksSecretary: z.string().optional(),
  numberOfDirectors: z.string().optional(),
  directors: z.array(z.union([directorSchema, shareholderDirectorSchema])).optional(),
  gramaNiladhari: z.string().optional(),
  companyActivities: z.string().optional(),
  businessEmail: z.string().optional(),
  businessContactNumber: z.string().optional(),
  companySecretary: z.boolean().optional(),
  noSecretary: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      dateOfBirth: z.string().optional(),
      designation: z.string().optional(),
      occupation: z.string().optional(),
      nicNumber: z.string().optional(),
      address: z
        .object({
          line1: z.string().optional(),
          province: z.string().optional(),
          district: z.string().optional(),
          divisionalSecretariat: z.string().optional(),
          postalCode: z.string().optional(),
        })
        .optional(),
      email: z.string().optional(),
      contactNumber: z.string().optional(),
      registrationNo: z.string().optional(),
      nicAttachment: fileSchema.optional(),
    })
    .optional(),
})

type CompanyDetailsProps = {
  companyData: any
  onComplete: (data: any) => void
  isResubmission?: boolean
}

// Helper to normalize companyData to match formSchema
function normalizeCompanyData(companyData: any): z.infer<typeof formSchema> {
  // Normalize shareholders
  const shareholders = (companyData.shareholders || []).map((s: any) => ({
    ...s,
    type: s.type || 'natural-person',
    residency: s.residency || 'sri-lankan',
    fullName: s.fullName || '',
    nicNumber: s.nicNumber || '',
    email: s.email || '',
    contactNumber: s.contactNumber || '',
    // Remove % symbol from shares for form display (form expects numeric value)
    shares: s.shares ? s.shares.toString().replace('%', '') : '',
    isDirector: typeof s.isDirector === 'boolean' ? s.isDirector : false,
    documents: Array.isArray(s.documents) ? s.documents : [],
    // Sri Lankan address fields
    province: s.province || '',
    district: s.district || '',
    divisionalSecretariat: s.divisionalSecretariat || '',
    fullAddress: s.fullAddress || '',
    postalCode: s.postalCode || '',
    // Legal Entity fields
    companyRegistrationNumber: s.companyRegistrationNumber || '',
    companyName: s.companyName || '',
    // Foreign address fields
    foreignAddress: s.foreignAddress || '',
    city: s.city || '',
    stateRegionProvince: s.stateRegionProvince || '',
    // Foreign person fields
    passportNo: s.passportNo || '',
    passportIssuedCountry: s.passportIssuedCountry || '',
    country: s.country || '',
    // Beneficiary owners
    beneficiaryOwners: s.beneficiaryOwners || [],
  }))
  // Normalize directors
  const directors = (companyData.directors || []).map((d: any) => ({
    ...d,
    residency: d.residency || 'sri-lankan',
    fullName: d.fullName || '',
    nicNumber: d.nicNumber || '',
    // Ensure foreign-person identity fields are controlled
    firstName: d.firstName || '',
    lastName: d.lastName || '',
    passportNo: d.passportNo || '',
    passportIssuedCountry: d.passportIssuedCountry || '',
    country: d.country || '',
    email: d.email || '',
    contactNumber: d.contactNumber || '',
    fromShareholder: typeof d.fromShareholder === 'boolean' ? d.fromShareholder : false,
    documents: Array.isArray(d.documents) ? d.documents : [],
    shareholderIndex: typeof d.shareholderIndex === 'number' ? d.shareholderIndex : undefined,
    // Location fields for director
    province: d.province || '',
    district: d.district || '',
    divisionalSecretariat: d.divisionalSecretariat || '',
    fullAddress: d.fullAddress || '',
    localPostalCode: d.localPostalCode || d.postalCode || '', // Support both old and new field names
    // Foreign address fields
    foreignAddress: d.foreignAddress || '',
    foreignPostalCode: d.foreignPostalCode || '', // New separate foreign postal code field
    city: d.city || '',
    stateRegionProvince: d.stateRegionProvince || '',
  }))
  // Default noSecretary object to keep inputs controlled
  const noSecretary = companyData.noSecretary || {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    designation: '',
    occupation: '',
    nicNumber: '',
    address: {
      line1: '',
      province: '',
      district: '',
      divisionalSecretariat: '',
      postalCode: '',
    },
    email: '',
    contactNumber: '',
    registrationNo: '',
    nicAttachment: [],
  }
  return {
    companyNameEnglish: companyData.companyNameEnglish || '',
    companyNameSinhala: companyData.companyNameSinhala || '',
    companyEntity: companyData.companyEntity || '(PVT) LTD',
    isForeignOwned: companyData.isForeignOwned || 'no',
    businessAddressNumber: companyData.businessAddressNumber || '',
    businessAddressStreet: companyData.businessAddressStreet || '',
    businessAddressCity: companyData.businessAddressCity || '',
    postalCode: companyData.postalCode || '',
    province: companyData.province || '',
    district: companyData.district || '',
    divisionalSecretariat: companyData.divisionalSecretariat || '',
    sharePrice: companyData.sharePrice || '100',
    numberOfShareholders: companyData.numberOfShareholders || '1',
    shareholders: shareholders.length > 0 ? shareholders : [{
      type: 'natural-person',
      residency: 'sri-lankan',
      fullName: '',
      nicNumber: '',
      documents: [],
      email: '',
      contactNumber: '',
      shares: '',
      isDirector: false,
      province: '',
      district: '',
      divisionalSecretariat: '',
      fullAddress: '',
      postalCode: '',
    }],
    makeSimpleBooksSecretary: companyData.makeSimpleBooksSecretary || 'yes',
    numberOfDirectors: companyData.numberOfDirectors || '0',
    directors: directors.length > 0 ? directors : [],
    gramaNiladhari: companyData.gramaNiladhari || '',
    companyActivities: companyData.companyActivities || '',
    businessEmail: companyData.businessEmail || '',
    businessContactNumber: companyData.businessContactNumber || '',
    companySecretary: typeof companyData.companySecretary === 'boolean' ? companyData.companySecretary : false,
    noSecretary,
  }
}

// Helper function to ensure field values are always strings
const ensureFieldValue = (value: any): string => {
  return value !== undefined && value !== null ? String(value) : "";
};

export default function CompanyDetailsStep({ companyData, onComplete, isResubmission = false }: CompanyDetailsProps) {
  const { toast } = useToast()
  const [additionalFeesConfig, setAdditionalFeesConfig] = useState<any | null>(null)
  const [isCompanyDetailsLocked, setIsCompanyDetailsLocked] = useState(companyData.companyDetailsLocked || false)
  const [isCompanyDetailsApproved, setIsCompanyDetailsApproved] = useState(companyData.companyDetailsApproved || false)
  const [isCompanyDetailsRejected, setIsCompanyDetailsRejected] = useState(companyData.companyDetailsRejected || false)

  // Listen for lock, approval, and rejection status changes from admin
  useEffect(() => {
    const handleRegistrationUpdate = (event: CustomEvent) => {
      console.log('🔒 CompanyDetailsStep received registration-updated event:', event.detail)
      if (event.detail?.type === "company-details-lock-changed") {
        console.log('🔒 Lock status changed:', event.detail.locked)
        setIsCompanyDetailsLocked(event.detail.locked)
      }
      if (event.detail?.type === "company-details-approved") {
        console.log('✅ Approval status changed:', event.detail.approved)
        setIsCompanyDetailsApproved(event.detail.approved)
        // Reset lock and rejection status when approved
        if (event.detail.approved) {
          setIsCompanyDetailsLocked(false)
          setIsCompanyDetailsRejected(false)
        }
      }
      if (event.detail?.type === "company-details-rejected") {
        console.log('❌ Rejection status changed:', event.detail.rejected)
        console.log('🔓 Lock status changed due to rejection:', event.detail.locked)
        setIsCompanyDetailsRejected(event.detail.rejected)
        setIsCompanyDetailsLocked(event.detail.locked) // Unlock fields when rejected
      }
    }

    window.addEventListener("registration-updated", handleRegistrationUpdate as EventListener)
    return () => {
      window.removeEventListener("registration-updated", handleRegistrationUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    const loadFees = async () => {
      try {
        const dbSettings = await LocalStorageService.getSettings()
        const confDb = (dbSettings as any)?.additional_fees || null
        if (confDb) {
          setAdditionalFeesConfig(confDb)
          return
        }
      } catch { /* ignore */ }
      try {
        const local = settingsStorage.getSettings()
        const confLocal = (local as any)?.additionalFees || null
        if (confLocal) {
          setAdditionalFeesConfig(confLocal)
        }
      } catch { /* ignore */ }
    }
    loadFees()
  }, [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraftSaving, setIsDraftSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [updatingDirectors, setUpdatingDirectors] = useState(false)
  const [appTitle, setAppTitle] = useState('')
  const [uploadingStates, setUploadingStates] = useState<{ [key: string]: boolean }>({})
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  // Cascading dropdown state
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [availableDistricts, setAvailableDistricts] = useState<any[]>([])
  const [availableDivisionalSecretariats, setAvailableDivisionalSecretariats] = useState<string[]>([])

  // Shareholder location dropdown states (indexed by shareholder index)
  const [shareholderProvinces, setShareholderProvinces] = useState<{ [key: number]: string }>({})
  const [shareholderDistricts, setShareholderDistricts] = useState<{ [key: number]: string }>({})
  const [shareholderAvailableDistricts, setShareholderAvailableDistricts] = useState<{ [key: number]: any[] }>({})
  const [shareholderAvailableDivisionalSecretariats, setShareholderAvailableDivisionalSecretariats] = useState<{ [key: number]: string[] }>({})

  // Director location dropdown states (indexed by director index)
  const [directorProvinces, setDirectorProvinces] = useState<{ [key: number]: string }>({})
  const [directorDistricts, setDirectorDistricts] = useState<{ [key: number]: string }>({})
  const [directorAvailableDistricts, setDirectorAvailableDistricts] = useState<{ [key: number]: any[] }>({})
  const [directorAvailableDivisionalSecretariats, setDirectorAvailableDivisionalSecretariats] = useState<{ [key: number]: string[] }>({})

  // Secretary address dependent dropdowns
  const [secSelectedProvince, setSecSelectedProvince] = useState('')
  const [secSelectedDistrict, setSecSelectedDistrict] = useState('')
  const [secAvailableDistricts, setSecAvailableDistricts] = useState<any[]>([])
  const [secAvailableDivisionalSecretariats, setSecAvailableDivisionalSecretariats] = useState<string[]>([])

  // Load app title from settings
  useEffect(() => {
    try {
      const settings = settingsStorage.getSettings()
      setAppTitle(settings?.title || '')
    } catch (error) {
      console.error('Error loading app title:', error)
      setAppTitle('')
    }
  }, [])

  // Use normalized default values with safe string handling
  const normalizedDefaults = normalizeCompanyData(companyData)

  // Ensure all string fields have default empty string values to prevent controlled/uncontrolled warnings
  const ensureStringDefaults = (obj: any): any => {
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(ensureStringDefaults);
      } else {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string' || value === undefined || value === null) {
            result[key] = value || "";
          } else if (typeof value === 'object') {
            result[key] = ensureStringDefaults(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }
    }
    return obj;
  };

  const safeDefaults = ensureStringDefaults(normalizedDefaults);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: safeDefaults,
    mode: "onChange",
  })

  const {
    fields: shareholderFields,
    append: appendShareholder,
    remove: removeShareholder,
  } = useFieldArray({
    control: form.control,
    name: "shareholders",
  })

  const {
    fields: directorFields,
    append: appendDirector,
    remove: removeDirector,
  } = useFieldArray({
    control: form.control,
    name: "directors",
  })

  // Set initialization flag after initial render
  useEffect(() => {
    console.log("✅ CompanyDetailsStep - Component initialized");
    setIsInitialized(true)
  }, [])

  // Initialize location fields from existing data
  useEffect(() => {
    if (companyData.province) {
      // Find province by name (stored value) or fallback to ID for backward compatibility
      const province = adminData.provinces?.find(p => p.name === companyData.province || p.id === companyData.province)
      if (province) {
        setSelectedProvince(province.name) // Use name for internal state
        setAvailableDistricts(province.districts)

        if (companyData.district) {
          // Find district by name (stored value) or fallback to ID for backward compatibility
          const district = province.districts.find(d => d.name === companyData.district || d.id === companyData.district)
          if (district) {
            setSelectedDistrict(district.name) // Use name for internal state
            setAvailableDivisionalSecretariats(district.divisionalSecretariats)
          }
        }
      }
    }
  }, [companyData.province, companyData.district, companyData.divisionalSecretariat])

  // Handle province selection change
  useEffect(() => {
    if (selectedProvince) {
      const province = adminData.provinces?.find(p => p.name === selectedProvince)
      if (province) {
        setAvailableDistricts(province.districts)
        // Don't reset district and divisional secretariat when province changes
        // Only update available options
        const currentDistrict = form.getValues('district')
        if (currentDistrict) {
          const district = province.districts.find(d => d.name === currentDistrict)
          if (district) {
            setSelectedDistrict(currentDistrict)
            setAvailableDivisionalSecretariats(district.divisionalSecretariats)
          } else {
            // If current district doesn't exist in new province, then reset
            setSelectedDistrict('')
            setAvailableDivisionalSecretariats([])
            form.setValue('district', '', { shouldValidate: false })
            form.setValue('divisionalSecretariat', '', { shouldValidate: false })
          }
        } else {
          setSelectedDistrict('')
          setAvailableDivisionalSecretariats([])
        }
      }
    } else {
      setAvailableDistricts([])
      setSelectedDistrict('')
      setAvailableDivisionalSecretariats([])
    }
  }, [selectedProvince, form])

  // Handle district selection change
  useEffect(() => {
    if (selectedDistrict && availableDistricts.length > 0) {
      const district = availableDistricts.find(d => d.name === selectedDistrict)
      if (district) {
        setAvailableDivisionalSecretariats(district.divisionalSecretariats)
        // Don't reset divisional secretariat when district changes
        // Only reset if current divisional secretariat is not available in new district
        const currentDivisionalSecretariat = form.getValues('divisionalSecretariat')
        if (currentDivisionalSecretariat && !district.divisionalSecretariats.includes(currentDivisionalSecretariat)) {
          form.setValue('divisionalSecretariat', '', { shouldValidate: false })
        }
      }
    } else {
      setAvailableDivisionalSecretariats([])
    }
  }, [selectedDistrict, availableDistricts, form])

  // Initialize shareholder location data from existing data
  useEffect(() => {
    if (companyData.shareholders && companyData.shareholders.length > 0) {
      const newShareholderProvinces: { [key: number]: string } = {}
      const newShareholderDistricts: { [key: number]: string } = {}
      const newShareholderAvailableDistricts: { [key: number]: any[] } = {}
      const newShareholderAvailableDivisionalSecretariats: { [key: number]: string[] } = {}

      companyData.shareholders.forEach((shareholder: any, index: number) => {
        if (shareholder.province) {
          const province = adminData.provinces?.find(p => p.name === shareholder.province || p.id === shareholder.province)
          if (province) {
            newShareholderProvinces[index] = province.name
            newShareholderAvailableDistricts[index] = province.districts

            if (shareholder.district) {
              const district = province.districts.find(d => d.name === shareholder.district || d.id === shareholder.district)
              if (district) {
                newShareholderDistricts[index] = district.name
                newShareholderAvailableDivisionalSecretariats[index] = district.divisionalSecretariats
              }
            }
          }
        }
      })

      setShareholderProvinces(newShareholderProvinces)
      setShareholderDistricts(newShareholderDistricts)
      setShareholderAvailableDistricts(newShareholderAvailableDistricts)
      setShareholderAvailableDivisionalSecretariats(newShareholderAvailableDivisionalSecretariats)
    }
  }, [companyData.shareholders])

  // Initialize director location data from existing data
  useEffect(() => {
    if (companyData.directors && companyData.directors.length > 0) {
      const newDirectorProvinces: { [key: number]: string } = {}
      const newDirectorDistricts: { [key: number]: string } = {}
      const newDirectorAvailableDistricts: { [key: number]: any[] } = {}
      const newDirectorAvailableDivisionalSecretariats: { [key: number]: string[] } = {}

      companyData.directors.forEach((director: any, index: number) => {
        if (director.province) {
          const province = adminData.provinces?.find(p => p.name === director.province || p.id === director.province)
          if (province) {
            newDirectorProvinces[index] = province.name
            newDirectorAvailableDistricts[index] = province.districts

            if (director.district) {
              const district = province.districts.find(d => d.name === director.district || d.id === director.district)
              if (district) {
                newDirectorDistricts[index] = district.name
                newDirectorAvailableDivisionalSecretariats[index] = district.divisionalSecretariats
              }
            }
          }
        }
      })

      setDirectorProvinces(newDirectorProvinces)
      setDirectorDistricts(newDirectorDistricts)
      setDirectorAvailableDistricts(newDirectorAvailableDistricts)
      setDirectorAvailableDivisionalSecretariats(newDirectorAvailableDivisionalSecretariats)
    }
  }, [companyData.directors])

  // Initialize secretary selects from existing form values
  useEffect(() => {
    const ns: any = form.getValues('noSecretary')
    const initProvince = ns?.address?.province || ''
    const initDistrict = ns?.address?.district || ''
    if (initProvince) {
      setSecSelectedProvince(initProvince)
      const province = adminData.provinces?.find(p => p.name === initProvince)
      if (province) {
        setSecAvailableDistricts(province.districts || [])
      }
    }
    if (initDistrict) {
      setSecSelectedDistrict(initDistrict)
      const province = adminData.provinces?.find(p => p.name === (ns?.address?.province || initProvince))
      const district = (province?.districts || []).find((d: any) => d.name === initDistrict)
      if (district) {
        setSecAvailableDivisionalSecretariats(district.divisionalSecretariats || [])
      }
    }
  }, [form])

  // Update secretary districts when secretary province changes
  useEffect(() => {
    if (secSelectedProvince) {
      const province = adminData.provinces?.find(p => p.name === secSelectedProvince)
      if (province) {
        setSecAvailableDistricts(province.districts || [])
        // Reset district and DS if province changes
        setSecSelectedDistrict('')
        setSecAvailableDivisionalSecretariats([])
        form.setValue('noSecretary.address.district', '')
        form.setValue('noSecretary.address.divisionalSecretariat', '')
      }
    } else {
      setSecAvailableDistricts([])
      setSecAvailableDivisionalSecretariats([])
    }
  }, [secSelectedProvince, form])

  // Update secretary DS when secretary district changes
  useEffect(() => {
    if (secSelectedDistrict && secAvailableDistricts.length > 0) {
      const district = secAvailableDistricts.find(d => d.name === secSelectedDistrict)
      if (district) {
        setSecAvailableDivisionalSecretariats(district.divisionalSecretariats || [])
        form.setValue('noSecretary.address.divisionalSecretariat', '')
      }
    } else {
      setSecAvailableDivisionalSecretariats([])
    }
  }, [secSelectedDistrict, secAvailableDistricts, form])

  // Update shareholders when number changes
  useEffect(() => {
    if (!isInitialized) return

    const numberOfShareholders = form.watch("numberOfShareholders")
    const currentCount = shareholderFields.length
    const newCount = Number.parseInt(numberOfShareholders || "1", 10)

    if (newCount > currentCount) {
      // Add more shareholders without triggering validation
      for (let i = currentCount; i < newCount; i++) {
        appendShareholder({
          type: "natural-person",
          residency: "sri-lankan",
          fullName: "",
          nicNumber: "",
          documents: [],
          email: "",
          contactNumber: "",
          isDirector: false,
          shares: "",
          province: "",
          district: "",
          divisionalSecretariat: "",
          fullAddress: "",
          postalCode: "",
        })
      }
      // Clear any validation errors for the new shareholders
      setTimeout(() => {
        form.clearErrors(`shareholders.${newCount - 1}`)
      }, 100)
    } else if (newCount < currentCount) {
      // Remove excess shareholders
      for (let i = currentCount - 1; i >= newCount; i--) {
        removeShareholder(i)
      }
    }
  }, [
    form.watch("numberOfShareholders"),
    shareholderFields.length,
    appendShareholder,
    removeShareholder,
    isInitialized,
  ])

  // Update directors when shareholders change
  useEffect(() => {
    if (!isInitialized || updatingDirectors) return

    const updateDirectorsFromShareholders = () => {
      setUpdatingDirectors(true)
      try {
        const shareholders = form.getValues("shareholders") || []
        const currentDirectors = form.getValues("directors") || []

        // Count directors from shareholders
        const directorCount = shareholders.filter((s: any) => s.isDirector).length

        // Update the number of directors field
        form.setValue("numberOfDirectors", directorCount.toString(), { shouldValidate: false })

        // Keep existing non-shareholder directors
        const newDirectors = currentDirectors.filter((director: any) => !director.fromShareholder)

        // Add directors from shareholders
        shareholders.forEach((shareholder: any, index: number) => {
          if (shareholder.isDirector) {
            newDirectors.push({
              residency: shareholder.residency,
              fullName: shareholder.fullName,
              nicNumber: shareholder.nicNumber,
              documents: shareholder.documents || [],
              email: shareholder.email,
              contactNumber: shareholder.contactNumber,
              fromShareholder: true,
              shareholderIndex: index,
              // Copy location data from shareholder
              province: shareholder.province || '',
              district: shareholder.district || '',
              divisionalSecretariat: shareholder.divisionalSecretariat || '',
              fullAddress: shareholder.fullAddress || '',
              postalCode: shareholder.postalCode || '',
            })
          }
        })

        form.setValue("directors", newDirectors, { shouldValidate: false })
      } finally {
        setUpdatingDirectors(false)
      }
    }

    // Create a debounced version of the update function
    const timeoutId = setTimeout(updateDirectorsFromShareholders, 100)
    return () => clearTimeout(timeoutId)
  }, [form.watch("shareholders"), isInitialized, updatingDirectors, form])

  const handleAddDirector = () => {
    const currentCount = directorFields.length
    appendDirector({
      residency: "sri-lankan",
      fullName: "",
      nicNumber: "",
      documents: [],
      email: "",
      contactNumber: "",
      fromShareholder: false,
      province: "",
      district: "",
      divisionalSecretariat: "",
      fullAddress: "",
      postalCode: "",
    })
    // Immediately validate the newly added (manual) director and focus first invalid field
    setTimeout(() => {
      const fieldsToValidate = [
        `directors.${currentCount}.fullName`,
        `directors.${currentCount}.nicNumber`,
        `directors.${currentCount}.documents`,
        `directors.${currentCount}.email`,
        `directors.${currentCount}.contactNumber`,
        `directors.${currentCount}.province`,
        `directors.${currentCount}.district`,
        `directors.${currentCount}.divisionalSecretariat`,
        `directors.${currentCount}.fullAddress`,
        `directors.${currentCount}.postalCode`,
      ] as const
      // Trigger validation for all relevant fields on the new director
      form.trigger(fieldsToValidate as unknown as any, { shouldFocus: true })
    }, 0)
  }

  // Shareholder location dropdown handlers
  const handleShareholderProvinceChange = (shareholderIndex: number, provinceName: string) => {
    const province = adminData.provinces?.find(p => p.name === provinceName)
    if (province) {
      // Update state
      setShareholderProvinces(prev => ({ ...prev, [shareholderIndex]: provinceName }))
      setShareholderAvailableDistricts(prev => ({ ...prev, [shareholderIndex]: province.districts }))

      // Reset dependent fields
      setShareholderDistricts(prev => ({ ...prev, [shareholderIndex]: '' }))
      setShareholderAvailableDivisionalSecretariats(prev => ({ ...prev, [shareholderIndex]: [] }))

      // Update form values
      form.setValue(`shareholders.${shareholderIndex}.province`, provinceName, { shouldValidate: false })
      form.setValue(`shareholders.${shareholderIndex}.district`, '', { shouldValidate: false })
      form.setValue(`shareholders.${shareholderIndex}.divisionalSecretariat`, '', { shouldValidate: false })
    }
  }

  const handleShareholderDistrictChange = (shareholderIndex: number, districtName: string) => {
    const availableDistricts = shareholderAvailableDistricts[shareholderIndex] || []
    const district = availableDistricts.find(d => d.name === districtName)
    if (district) {
      // Update state
      setShareholderDistricts(prev => ({ ...prev, [shareholderIndex]: districtName }))
      setShareholderAvailableDivisionalSecretariats(prev => ({ ...prev, [shareholderIndex]: district.divisionalSecretariats }))

      // Update form values
      form.setValue(`shareholders.${shareholderIndex}.district`, districtName, { shouldValidate: false })
      form.setValue(`shareholders.${shareholderIndex}.divisionalSecretariat`, '', { shouldValidate: false })
    }
  }

  // Director location dropdown handlers
  const handleDirectorProvinceChange = (directorIndex: number, provinceName: string) => {
    const province = adminData.provinces?.find(p => p.name === provinceName)
    if (province) {
      // Update state
      setDirectorProvinces(prev => ({ ...prev, [directorIndex]: provinceName }))
      setDirectorAvailableDistricts(prev => ({ ...prev, [directorIndex]: province.districts }))

      // Reset dependent fields
      setDirectorDistricts(prev => ({ ...prev, [directorIndex]: '' }))
      setDirectorAvailableDivisionalSecretariats(prev => ({ ...prev, [directorIndex]: [] }))

      // Update form values
      form.setValue(`directors.${directorIndex}.province`, provinceName, { shouldValidate: false })
      form.setValue(`directors.${directorIndex}.district`, '', { shouldValidate: false })
      form.setValue(`directors.${directorIndex}.divisionalSecretariat`, '', { shouldValidate: false })
    }
  }

  const handleDirectorDistrictChange = (directorIndex: number, districtName: string) => {
    const availableDistricts = directorAvailableDistricts[directorIndex] || []
    const district = availableDistricts.find(d => d.name === districtName)
    if (district) {
      // Update state
      setDirectorDistricts(prev => ({ ...prev, [directorIndex]: districtName }))
      setDirectorAvailableDivisionalSecretariats(prev => ({ ...prev, [directorIndex]: district.divisionalSecretariats }))

      // Update form values
      form.setValue(`directors.${directorIndex}.district`, districtName, { shouldValidate: false })
      form.setValue(`directors.${directorIndex}.divisionalSecretariat`, '', { shouldValidate: false })
    }
  }

  // Simplified function - no validation required
  const isFormReadyForSubmission = () => {
    return true; // Allow all submissions
  }

  // File upload handler for shareholders and directors

  // Function to highlight directors section
  const highlightDirectorsSection = () => {
    setTimeout(() => {
      // Add highlight effect to the directors section
      const directorsSection = document.querySelector('[data-section="directors"]');
      if (directorsSection) {
        (directorsSection as HTMLElement).style.transition = 'all 0.3s ease';
        (directorsSection as HTMLElement).style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        (directorsSection as HTMLElement).style.borderRadius = '8px';
        (directorsSection as HTMLElement).style.padding = '8px';
        (directorsSection as HTMLElement).style.border = '2px solid rgba(239, 68, 68, 0.3)';

        // Remove highlight after 3 seconds
        setTimeout(() => {
          (directorsSection as HTMLElement).style.backgroundColor = '';
          (directorsSection as HTMLElement).style.borderRadius = '';
          (directorsSection as HTMLElement).style.padding = '';
          (directorsSection as HTMLElement).style.border = '';
        }, 3000);
      }
    }, 100);
  };

  const handleManualSave = async (): Promise<boolean> => {
    console.log("💾 CompanyDetailsStep - Manual save triggered with validation");

    // Ensure form is initialized
    if (!isInitialized) {
      console.log("❌ CompanyDetailsStep - Form not yet initialized, cannot save");
      // Don't block progression entirely; allow continuing with minimal data
      // Proceed without saving to avoid user being stuck
      return true;
    }

    // Validate all form fields before proceeding
    const isValid = await form.trigger(undefined, { shouldFocus: true });
    if (!isValid) {
      console.log("⚠️ CompanyDetailsStep - Form validation failed, but proceeding without blocking");
      console.log("Validation errors:", form.formState.errors);
      // Do not return; continue to attempt saving so user can proceed
    }

    // Get current form values after validation
    const values = form.getValues();

    // Compute additional fees based on settings and counts
    let additionalFees: any = { directors: {}, shareholders: {}, total: 0 }
    try {
      // Load settings from local storage (with DB fallback applied elsewhere)
      const settings = (typeof window !== 'undefined') ? (JSON.parse(localStorage.getItem('appSettings') || '{}')) : {}
      // Prefer DB-loaded config if available, else fall back to localStorage structure
      const conf = (additionalFeesConfig
        ? {
          directors: {
            local: Number((additionalFeesConfig as any)?.directors?.local || 0),
            foreign: Number((additionalFeesConfig as any)?.directors?.foreign || 0),
          },
          shareholders: {
            localNaturalPerson: Number((additionalFeesConfig as any)?.shareholders?.localNaturalPerson || 0),
            localLegalEntity: Number((additionalFeesConfig as any)?.shareholders?.localLegalEntity || 0),
            foreignNaturalPerson: Number((additionalFeesConfig as any)?.shareholders?.foreignNaturalPerson || 0),
            foreignLegalEntity: Number((additionalFeesConfig as any)?.shareholders?.foreignLegalEntity || 0),
          }
        }
        : ((settings && (settings as any).additionalFees) || {})) as any

      // Include ALL directors (both manually added and those originating from shareholders)
      const directors: any[] = (values.directors || [])
      const directorLocal = directors.filter((d) => (d.residency || '').toLowerCase() !== 'foreign').length
      const directorForeign = directors.filter((d) => (d.residency || '').toLowerCase() === 'foreign').length

      // New logic: Charge per director (no free directors)
      const additionalDirectorLocal = directorLocal
      const additionalDirectorForeign = directorForeign

      const shs: any[] = (values.shareholders || [])
      const shLocalNatural = shs.filter((s) => (s.residency || 'sri-lankan') !== 'foreign' && (s.type || 'natural-person') === 'natural-person').length
      const shLocalEntity = shs.filter((s) => (s.residency || 'sri-lankan') !== 'foreign' && (s.type || 'natural-person') !== 'natural-person').length
      const shForeignNatural = shs.filter((s) => (s.residency || '') === 'foreign' && (s.type || 'natural-person') === 'natural-person').length
      const shForeignEntity = shs.filter((s) => (s.residency || '') === 'foreign' && (s.type || 'natural-person') !== 'natural-person').length

      // New logic: Charge per shareholder (no free shareholders)
      const addLocalNatural = shLocalNatural
      const addLocalEntity = shLocalEntity
      const addForeignNatural = shForeignNatural
      const addForeignEntity = shForeignEntity

      const feeDirLocal = Number(conf.directors?.local || 0)
      const feeDirForeign = Number(conf.directors?.foreign || 0)
      const feeShLocalNatural = Number(conf.shareholders?.localNaturalPerson || 0)
      const feeShLocalEntity = Number(conf.shareholders?.localLegalEntity || 0)
      const feeShForeignNatural = Number(conf.shareholders?.foreignNaturalPerson || 0)
      const feeShForeignEntity = Number(conf.shareholders?.foreignLegalEntity || 0)

      const calc = (count: number, unit: number) => (count > 0 && unit > 0 ? count * unit : 0)
      const totalDir = calc(additionalDirectorLocal, feeDirLocal) + calc(additionalDirectorForeign, feeDirForeign)
      const totalSh = calc(addLocalNatural, feeShLocalNatural)
        + calc(addLocalEntity, feeShLocalEntity)
        + calc(addForeignNatural, feeShForeignNatural)
        + calc(addForeignEntity, feeShForeignEntity)

      additionalFees = {
        directors: {
          localCount: additionalDirectorLocal,
          foreignCount: additionalDirectorForeign,
          localFee: feeDirLocal,
          foreignFee: feeDirForeign,
          total: totalDir,
        },
        shareholders: {
          localNaturalCount: addLocalNatural,
          localEntityCount: addLocalEntity,
          foreignNaturalCount: addForeignNatural,
          foreignEntityCount: addForeignEntity,
          localNaturalFee: feeShLocalNatural,
          localEntityFee: feeShLocalEntity,
          foreignNaturalFee: feeShForeignNatural,
          foreignEntityFee: feeShForeignEntity,
          total: totalSh,
        },
        total: totalDir + totalSh,
      }
    } catch { }
    console.log("📝 CompanyDetailsStep - Manual save values:", values);

    setIsSubmitting(true);
    try {
      // Process form values
      const processedValues = {
        ...values,
        shareholders: (values.shareholders || []).map((shareholder: any) => ({
          ...shareholder,
          // Add % symbol to shares value for database storage
          shares: shareholder.shares && !shareholder.shares.includes('%')
            ? `${shareholder.shares}%`
            : shareholder.shares
        })),
        directors: values.directors || [],
      };

      // Get the current registration ID from companyData
      const registrationId = companyData._id || companyData.id || `reg_${Date.now()}`;
      const generatedIdUsed = !(companyData._id || companyData.id);
      if (generatedIdUsed) {
        console.warn("⚠️ CompanyDetailsStep - No registration ID found, using fallback:", registrationId);
      }

      console.log("💾 CompanyDetailsStep - Manual save to registration:", registrationId);

      // Get the current registration from database to preserve existing data
      let currentRegistration;
      try {
        currentRegistration = await LocalStorageService.getRegistrationById(registrationId);
        console.log("📋 CompanyDetailsStep - Current registration data:", currentRegistration);
      } catch (error) {
        console.error("❌ CompanyDetailsStep - Error fetching current registration:", error);
        // Continue with localStorage fallback
        const localStorageRegistrations = JSON.parse(localStorage.getItem("registrations") || "[]");
        currentRegistration = localStorageRegistrations.find((reg: any) => reg._id === registrationId || reg.id === registrationId);
      }

      if (!currentRegistration) {
        console.warn("⚠️ CompanyDetailsStep - Current registration not found, creating a base one");
        currentRegistration = {
          _id: registrationId,
          id: registrationId,
          createdAt: new Date().toISOString(),
          status: 'company-details-processing',
          completedSteps: companyData.completedSteps || [],
          userId: (companyData as any).userId || 'default_user',
        };
      }

      // Compute secretary payload when user selected "no"
      const manualNoSecretaryPayload = processedValues.makeSimpleBooksSecretary === 'no'
        ? (processedValues.noSecretary || normalizeCompanyData({}).noSecretary)
        : null

      // Create updated registration data - Ensure shareholders and directors are properly included
      const updatedRegistrationData = {
        ...currentRegistration,
        ...processedValues, // Spread processed values first to ensure they override currentRegistration
        // Company details
        companyName: processedValues.companyNameEnglish, // Explicitly set companyName to match companyNameEnglish
        companyNameEnglish: processedValues.companyNameEnglish,
        companyNameSinhala: processedValues.companyNameSinhala,
        companyEntity: processedValues.companyEntity,
        isForeignOwned: processedValues.isForeignOwned,
        businessAddressNumber: processedValues.businessAddressNumber,
        businessAddressStreet: processedValues.businessAddressStreet,
        businessAddressCity: processedValues.businessAddressCity,
        postalCode: processedValues.postalCode,
        province: processedValues.province,
        district: processedValues.district,
        divisionalSecretariat: processedValues.divisionalSecretariat,
        sharePrice: processedValues.sharePrice,
        numberOfShareholders: processedValues.numberOfShareholders,
        shareholders: processedValues.shareholders,
        makeSimpleBooksSecretary: processedValues.makeSimpleBooksSecretary,
        numberOfDirectors: processedValues.numberOfDirectors,
        directors: processedValues.directors,
        gramaNiladhari: processedValues.gramaNiladhari,
        companyActivities: processedValues.companyActivities,
        businessEmail: processedValues.businessEmail,
        businessContactNumber: processedValues.businessContactNumber,
        noSecretary: manualNoSecretaryPayload,
        currentStep: 'documentation',
        status: 'documentation-processing',
        updatedAt: new Date().toISOString()
      };

      // Persist additional fees summary for step 3 displays
      (updatedRegistrationData as any).additionalFees = additionalFees

      console.log("💾 CompanyDetailsStep - Manual save data:", JSON.stringify(updatedRegistrationData, null, 2));

      // Save to MySQL database
      try {
        console.log("💾 CompanyDetailsStep - Manual save to MySQL database...");
        console.log("💾 CompanyDetailsStep - Registration ID:", registrationId);
        console.log("💾 CompanyDetailsStep - Files in shareholders:", processedValues.shareholders?.map((s: any) => s.documents?.length || 0));
        console.log("💾 CompanyDetailsStep - Files in directors:", processedValues.directors?.map((d: any) => d.documents?.length || 0));

        await DatabaseService.updateRegistration(registrationId, updatedRegistrationData);
        console.log("✅ CompanyDetailsStep - Manual save to MySQL successful");
        console.log("✅ CompanyDetailsStep - All form data and file references saved to database");
      } catch (dbError) {
        console.error("❌ CompanyDetailsStep - Error manual save to MySQL:", dbError);
        // Fallback to localStorage if database fails
        console.log("📦 CompanyDetailsStep - Manual save fallback to localStorage");
        await LocalStorageService.saveRegistrationLocalOnly(updatedRegistrationData);
      }

      // Also save to localStorage for immediate access (no API calls)
      await LocalStorageService.saveRegistrationLocalOnly(updatedRegistrationData);

      // Dispatch registration update event for real-time updates
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-updated",
            registrationId: registrationId,
            registration: updatedRegistrationData
          },
        })
      );

      console.log("✅ CompanyDetailsStep - Manual save completed successfully");
      console.log("✅ CompanyDetailsStep - Summary:");
      console.log("   📊 MySQL Database: Form data and file references saved");
      console.log("   📁 File Storage: All uploaded files saved to uploads/documents/");
      console.log("   💾 LocalStorage: Backup copy saved locally");
      console.log("   🔄 Event: Registration update event dispatched");

      return true; // Success
    } catch (error) {
      console.error("❌ CompanyDetailsStep - Error during manual save:", error as Error);
      return false; // Failure
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save as Draft function - saves data without validation
  const handleSaveAsDraft = async (): Promise<void> => {
    console.log("💾 CompanyDetailsStep - Save as Draft triggered (no validation)");

    // Ensure form is initialized
    if (!isInitialized) {
      console.log("❌ CompanyDetailsStep - Form not yet initialized, cannot save draft");
      toast({
        title: "Cannot Save Draft",
        description: "Form is not ready yet. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsDraftSaving(true);

    try {
      // Get current form values without validation
      const values = form.getValues();
      console.log("📝 CompanyDetailsStep - Draft save values:", values);

      // Process form values (same as handleManualSave)
      const processedValues = {
        ...values,
        shareholders: (values.shareholders || []).map((shareholder: any) => ({
          ...shareholder,
          // Add % symbol to shares value for database storage
          shares: shareholder.shares && !shareholder.shares.includes('%')
            ? `${shareholder.shares}%`
            : shareholder.shares
        })),
        directors: values.directors || [],
      };

      // Get the current registration ID from companyData
      const registrationId = companyData._id || companyData.id || `reg_${Date.now()}`;
      if (!(companyData._id || companyData.id)) {
        console.warn("⚠️ CompanyDetailsStep - No registration ID found, using fallback:", registrationId);
      }

      console.log("💾 CompanyDetailsStep - Draft save to registration:", registrationId);

      // Get the current registration from database to preserve existing data
      let currentRegistration;
      try {
        currentRegistration = await LocalStorageService.getRegistrationById(registrationId);
        console.log("📋 CompanyDetailsStep - Current registration data for draft:", currentRegistration);
      } catch (error) {
        console.error("❌ CompanyDetailsStep - Error fetching current registration for draft:", error);
        // Continue with localStorage fallback
        const localStorageRegistrations = JSON.parse(localStorage.getItem("registrations") || "[]");
        currentRegistration = localStorageRegistrations.find((reg: any) => reg._id === registrationId || reg.id === registrationId);
      }

      if (!currentRegistration) {
        console.warn("⚠️ CompanyDetailsStep - Current registration not found for draft, creating a base one");
        currentRegistration = {
          _id: registrationId,
          id: registrationId,
          createdAt: new Date().toISOString(),
          status: 'payment-processing', // Same status as normal submission
          completedSteps: companyData.completedSteps || [],
          userId: (companyData as any).userId || 'default_user',
        };
      }

      // Compute additional fees (same logic as handleManualSave)
      let additionalFees: any = { directors: {}, shareholders: {}, total: 0 }
      try {
        const settings = (typeof window !== 'undefined') ? (JSON.parse(localStorage.getItem('appSettings') || '{}')) : {}
        const conf = (additionalFeesConfig
          ? {
            directors: {
              local: Number((additionalFeesConfig as any)?.directors?.local || 0),
              foreign: Number((additionalFeesConfig as any)?.directors?.foreign || 0),
            },
            shareholders: {
              localNaturalPerson: Number((additionalFeesConfig as any)?.shareholders?.localNaturalPerson || 0),
              localLegalEntity: Number((additionalFeesConfig as any)?.shareholders?.localLegalEntity || 0),
              foreignNaturalPerson: Number((additionalFeesConfig as any)?.shareholders?.foreignNaturalPerson || 0),
              foreignLegalEntity: Number((additionalFeesConfig as any)?.shareholders?.foreignLegalEntity || 0),
            }
          }
          : ((settings && (settings as any).additionalFees) || {})) as any

        const directors: any[] = (values.directors || [])
        const directorLocal = directors.filter((d) => (d.residency || '').toLowerCase() !== 'foreign').length
        const directorForeign = directors.filter((d) => (d.residency || '').toLowerCase() === 'foreign').length

        const additionalDirectorLocal = directorLocal
        const additionalDirectorForeign = directorForeign

        const shs: any[] = (values.shareholders || [])
        const shLocalNatural = shs.filter((s) => (s.residency || 'sri-lankan') !== 'foreign' && (s.type || 'natural-person') === 'natural-person').length
        const shLocalEntity = shs.filter((s) => (s.residency || 'sri-lankan') !== 'foreign' && (s.type || 'natural-person') !== 'natural-person').length
        const shForeignNatural = shs.filter((s) => (s.residency || '') === 'foreign' && (s.type || 'natural-person') === 'natural-person').length
        const shForeignEntity = shs.filter((s) => (s.residency || '') === 'foreign' && (s.type || 'natural-person') !== 'natural-person').length

        const addLocalNatural = shLocalNatural
        const addLocalEntity = shLocalEntity
        const addForeignNatural = shForeignNatural
        const addForeignEntity = shForeignEntity

        const feeDirLocal = Number(conf.directors?.local || 0)
        const feeDirForeign = Number(conf.directors?.foreign || 0)
        const feeShLocalNatural = Number(conf.shareholders?.localNaturalPerson || 0)
        const feeShLocalEntity = Number(conf.shareholders?.localLegalEntity || 0)
        const feeShForeignNatural = Number(conf.shareholders?.foreignNaturalPerson || 0)
        const feeShForeignEntity = Number(conf.shareholders?.foreignLegalEntity || 0)

        const calc = (count: number, unit: number) => (count > 0 && unit > 0 ? count * unit : 0)
        const totalDir = calc(additionalDirectorLocal, feeDirLocal) + calc(additionalDirectorForeign, feeDirForeign)
        const totalSh = calc(addLocalNatural, feeShLocalNatural)
          + calc(addLocalEntity, feeShLocalEntity)
          + calc(addForeignNatural, feeShForeignNatural)
          + calc(addForeignEntity, feeShForeignEntity)

        additionalFees = {
          directors: {
            localCount: additionalDirectorLocal,
            foreignCount: additionalDirectorForeign,
            localFee: feeDirLocal,
            foreignFee: feeDirForeign,
            total: totalDir,
          },
          shareholders: {
            localNaturalCount: addLocalNatural,
            localEntityCount: addLocalEntity,
            foreignNaturalCount: addForeignNatural,
            foreignEntityCount: addForeignEntity,
            localNaturalFee: feeShLocalNatural,
            localEntityFee: feeShLocalEntity,
            foreignNaturalFee: feeShForeignNatural,
            foreignEntityFee: feeShForeignEntity,
            total: totalSh,
          },
          total: totalDir + totalSh,
        }
      } catch { }

      // Compute secretary payload when user selected "no"
      const manualNoSecretaryPayload = processedValues.makeSimpleBooksSecretary === 'no'
        ? (processedValues.noSecretary || normalizeCompanyData({}).noSecretary)
        : null

      // Create updated registration data for draft
      const updatedRegistrationData = {
        ...currentRegistration,
        // Company details
        companyName: processedValues.companyNameEnglish, // Explicitly set companyName to match companyNameEnglish
        companyNameEnglish: processedValues.companyNameEnglish,
        companyNameSinhala: processedValues.companyNameSinhala,
        companyEntity: processedValues.companyEntity,
        isForeignOwned: processedValues.isForeignOwned,
        businessAddressNumber: processedValues.businessAddressNumber,
        businessAddressStreet: processedValues.businessAddressStreet,
        businessAddressCity: processedValues.businessAddressCity,
        postalCode: processedValues.postalCode,
        province: processedValues.province,
        district: processedValues.district,
        divisionalSecretariat: processedValues.divisionalSecretariat,
        sharePrice: processedValues.sharePrice,
        numberOfShareholders: processedValues.numberOfShareholders,
        shareholders: processedValues.shareholders,
        makeSimpleBooksSecretary: processedValues.makeSimpleBooksSecretary,
        numberOfDirectors: processedValues.numberOfDirectors,
        directors: processedValues.directors,
        gramaNiladhari: processedValues.gramaNiladhari,
        companyActivities: processedValues.companyActivities,
        businessEmail: processedValues.businessEmail,
        businessPhone: processedValues.businessPhone,
        noSecretary: manualNoSecretaryPayload,
        additionalFees: additionalFees,
        currentStep: 'company-details', // Stay on current step
        status: 'payment-processing', // Same status as normal submission
        lastSavedAt: new Date().toISOString(),
        isDraft: true, // Mark as draft
      };

      // Save to MySQL database
      try {
        console.log('📝 CompanyDetailsStep - Sending draft data to database:', JSON.stringify(updatedRegistrationData, null, 2));
        await DatabaseService.updateRegistration(registrationId, updatedRegistrationData);
        console.log('✅ Draft saved to MySQL database:', registrationId);
      } catch (dbError) {
        console.error('❌ Error saving draft to MySQL database:', dbError);
        // Fallback to localStorage if database fails
        await LocalStorageService.saveRegistration(updatedRegistrationData);
        console.log('📦 Draft saved to localStorage as fallback');
      }

      // Also save to localStorage for immediate access
      await LocalStorageService.saveRegistration(updatedRegistrationData);

      // Show success toast
      toast({
        title: "Draft Saved Successfully",
        description: "Your company details have been saved as draft. You can continue editing and save again.",
      });

      // Dispatch registration update event for admin dashboard
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "draft-saved",
            registrationId: registrationId,
            registration: updatedRegistrationData
          },
        })
      );

      console.log("✅ CompanyDetailsStep - Draft save completed successfully");
    } catch (error) {
      console.error("❌ CompanyDetailsStep - Error during draft save:", error as Error);
      toast({
        title: "Error Saving Draft",
        description: "An error occurred while saving your draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDraftSaving(false);
    }
  };

  // Simple file upload handler - removed registrationId parameter
  const handleFileUpload = async (files: any[], personType: 'shareholder' | 'director', personIndex: number) => {
    try {
      console.log(`📁 CompanyDetailsStep - Uploading files for ${personType} ${personIndex}:`, files);

      const uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type only (removed size validation)
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
          throw new Error(`File type ${file.type} is not supported. Please upload PDF, JPG, or PNG files.`);
        }

        // Upload file to file storage (uploads folder)
        console.log(`📁 CompanyDetailsStep - Uploading file to file storage: ${file.name}`);

        const registrationId = companyData._id || companyData.id;
        console.log(`📁 CompanyDetailsStep - File storage path: uploads/documents/${registrationId}_${personType}_${personIndex}`);

        const uploadResult = await fileUploadClient.uploadFile(file, `${registrationId}_${personType}_${personIndex}`);

        if (uploadResult.success && uploadResult.file) {
          uploadedFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            url: uploadResult.file.url,
            id: uploadResult.file.id,
            uploadedAt: uploadResult.file.uploadedAt
          });
          console.log(`✅ CompanyDetailsStep - File uploaded successfully to file storage: ${file.name}`);
          console.log(`✅ CompanyDetailsStep - File URL: ${uploadResult.file.url}`);
          console.log(`✅ CompanyDetailsStep - File stored in: ${uploadResult.file.filePath}`);
        } else {
          throw new Error(`Failed to upload file ${file.name}: ${uploadResult.error}`);
        }
      }

      console.log(`✅ CompanyDetailsStep - All files uploaded for ${personType} ${personIndex}:`, uploadedFiles);
      return uploadedFiles;

    } catch (error) {
      console.error(`❌ CompanyDetailsStep - Error uploading files for ${personType} ${personIndex}:`, error);
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("🚀 CompanyDetailsStep - Form submission triggered (no validation)");

    if (isSubmitting) {
      return false;
    }

    setIsSubmitting(true);
    try {
      // Process form values (no validation)
      const processedValues = {
        ...values,
        shareholders: (values.shareholders || []).map((shareholder: any) => ({
          ...shareholder,
          // Add % symbol to shares value for database storage
          shares: shareholder.shares && !shareholder.shares.includes('%')
            ? `${shareholder.shares}%`
            : shareholder.shares
        })),
        directors: values.directors || [],
      };

      // Get the current registration ID from companyData
      const registrationId = companyData._id || companyData.id;
      if (!registrationId) {
        console.error("❌ CompanyDetailsStep - No registration ID found in companyData:", companyData);
        throw new Error("Registration ID not found");
      }

      console.log("💾 CompanyDetailsStep - Manual save to registration:", registrationId);

      // Upload all files first (no validation required)
      console.log("📁 CompanyDetailsStep - Processing file uploads for all shareholders and directors");

      // Upload shareholder files
      for (let i = 0; i < (processedValues.shareholders || []).length; i++) {
        const shareholder = processedValues.shareholders[i];
        if (shareholder.documents && shareholder.documents.length > 0) {
          try {
            const uploadedFiles = await handleFileUpload(shareholder.documents, 'shareholder', i);
            processedValues.shareholders[i].documents = uploadedFiles;
          } catch (error) {
            console.error(`❌ Failed to upload files for shareholder ${i}:`, error);
            // Continue with other uploads even if one fails
          }
        }
      }

      // Upload director files
      for (let i = 0; i < (processedValues.directors || []).length; i++) {
        const director = processedValues.directors[i];
        if (!director.fromShareholder && director.documents && director.documents.length > 0) {
          try {
            const uploadedFiles = await handleFileUpload(director.documents, 'director', i);
            processedValues.directors[i].documents = uploadedFiles;
          } catch (error) {
            console.error(`❌ Failed to upload files for director ${i}:`, error);
            // Continue with other uploads even if one fails
          }
        }
      }

      // Normalize noSecretary payload based on toggle
      const noSecretaryPayload = processedValues.makeSimpleBooksSecretary === 'no'
        ? (processedValues.noSecretary || normalizeCompanyData({}).noSecretary)
        : null

      // Save to database - Ensure shareholders and directors are properly included
      const registrationData = {
        ...companyData,
        ...processedValues, // Spread processed values first to ensure they override companyData
        companyName: processedValues.companyNameEnglish, // Explicitly set companyName to match companyNameEnglish
        noSecretary: noSecretaryPayload,
        companyEntity: processedValues.companyEntity,
        shareholders: processedValues.shareholders,
        directors: processedValues.directors,
        currentStep: 'company-details',
        completedSteps: [...(companyData.completedSteps || []), 'company-details'].filter((step, index, arr) => arr.indexOf(step) === index),
        lastUpdated: new Date().toISOString(),
        // Reset rejection status when customer resubmits company details
        companyDetailsRejected: false,
        companyDetailsApproved: false, // Also reset approval status
      };

      console.log('➡️ Saving company secretary data:', {
        makeSimpleBooksSecretary: registrationData.makeSimpleBooksSecretary,
        noSecretary: registrationData.noSecretary
      })

      await DatabaseService.updateRegistration(registrationId, registrationData);
      console.log("✅ CompanyDetailsStep - Registration saved to database successfully");

      // Also save to localStorage as fallback
      await LocalStorageService.saveRegistration({
        ...registrationData,
        userId: 'default_user'
      });
      console.log('📦 Registration saved to localStorage as fallback');

      // Dispatch registration update event for admin dashboard
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-saved",
            registrationId: registrationId,
            registration: registrationData
          },
        })
      );

      console.log("✅ CompanyDetailsStep - Form submitted successfully");
      onComplete(registrationData);

    } catch (error) {
      console.error("❌ CompanyDetailsStep - Error submitting form:", error);
      // Don't show validation errors, just log and continue
    } finally {
      setIsSubmitting(false);
    }
  }

  // Safety check to ensure adminData is loaded and form is initialized
  if (!adminData || !adminData.provinces || !isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-8">

        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle>Company Details {isResubmission && "(Updating)"}</CardTitle>
            <CardDescription>
              {isResubmission
                ? "Update your company details below. You can modify any information as needed."
                : "Please provide the details for your company registration"}
            </CardDescription>
            {isCompanyDetailsApproved ? (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ The company name has been successfully approved by the ROC.
                </p>
              </div>
            ) : isCompanyDetailsLocked ? (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  The company name has been submitted for approval, and the name reservation is pending.
                </p>
              </div>
            ) : isCompanyDetailsRejected ? (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  The company name has been rejected by the ROC. A new company name will be proposed for registration.
                </p>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6">
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
                      disabled={isCompanyDetailsLocked || isCompanyDetailsApproved}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="(PVT) LTD" id="entity-pvt" disabled={isCompanyDetailsLocked || isCompanyDetailsApproved} />
                        <Label htmlFor="entity-pvt" className={isCompanyDetailsLocked || isCompanyDetailsApproved ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}>(PVT) LTD</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="(PRIVATE) LIMITED" id="entity-private" disabled={isCompanyDetailsLocked || isCompanyDetailsApproved} />
                        <Label htmlFor="entity-private" className={isCompanyDetailsLocked || isCompanyDetailsApproved ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}>(PRIVATE) LIMITED</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Public Limited" id="entity-public" disabled={isCompanyDetailsLocked || isCompanyDetailsApproved} />
                        <Label htmlFor="entity-public" className={isCompanyDetailsLocked || isCompanyDetailsApproved ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}>Public Limited</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Overseas" id="entity-overseas" disabled={isCompanyDetailsLocked || isCompanyDetailsApproved} />
                        <Label htmlFor="entity-overseas" className={isCompanyDetailsLocked || isCompanyDetailsApproved ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}>Overseas</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="offshore" id="entity-offshore" disabled={isCompanyDetailsLocked || isCompanyDetailsApproved} />
                        <Label htmlFor="entity-offshore" className={isCompanyDetailsLocked || isCompanyDetailsApproved ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}>Offshore</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unlimited" id="entity-unlimited" disabled={isCompanyDetailsLocked || isCompanyDetailsApproved} />
                        <Label htmlFor="entity-unlimited" className={isCompanyDetailsLocked || isCompanyDetailsApproved ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}>Unlimited</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Gurantee LTD (Under Selection 32)" id="entity-guarantee-ltd" disabled={isCompanyDetailsLocked || isCompanyDetailsApproved} />
                        <Label htmlFor="entity-guarantee-ltd" className={isCompanyDetailsLocked || isCompanyDetailsApproved ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}>Gurantee LTD (Under Selection 32)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Gurantee Limited (Under Selection 32)" id="entity-guarantee-limited" disabled={isCompanyDetailsLocked || isCompanyDetailsApproved} />
                        <Label htmlFor="entity-guarantee-limited" className={isCompanyDetailsLocked || isCompanyDetailsApproved ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}>Gurantee Limited (Under Selection 32)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Gurantee Under Selection 34" id="entity-guarantee-selection34" disabled={isCompanyDetailsLocked || isCompanyDetailsApproved} />
                        <Label htmlFor="entity-guarantee-selection34" className={isCompanyDetailsLocked || isCompanyDetailsApproved ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}>Gurantee Under Selection 34</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className={showSuffix ? "pr-32" : undefined}
                            disabled={isCompanyDetailsLocked || isCompanyDetailsApproved}
                          />
                          {showSuffix && (
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                              {selectedEntity}
                            </span>
                          )}
                        </div>
                      </FormControl>

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
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className={showSuffix ? "pr-32" : undefined}
                            disabled={isCompanyDetailsLocked || isCompanyDetailsApproved}
                          />
                          {showSuffix && (
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                              {selectedEntity}
                            </span>
                          )}
                        </div>
                      </FormControl>

                    </FormItem>
                  );
                }}
              />
            </div>

            {/* General Share Price Field */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="sharePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Number of Shares</FormLabel>
                    <p className="text-sm text-muted-foreground mb-2">Please enter the total number of shares your company initially issued</p>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter total number of shares"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>

                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isForeignOwned"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Is the company a foreign owned company? </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="foreign-yes" />
                        <Label htmlFor="foreign-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="foreign-no" />
                        <Label htmlFor="foreign-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>

                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="makeSimpleBooksSecretary"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Do you want to make {appTitle} your company secretary? </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        // Update the field value
                        field.onChange(value)

                        // Also set the companySecretary field for admin dashboard
                        form.setValue("companySecretary", value === "yes", { shouldValidate: false })

                        // Clear any lingering validation/errors for noSecretary when toggling
                        try {
                          form.clearErrors([
                            'noSecretary.firstName',
                            'noSecretary.lastName',
                            'noSecretary.address.line1',
                            'noSecretary.address.province',
                            'noSecretary.address.district',
                            'noSecretary.address.divisionalSecretariat',
                            'noSecretary.address.postalCode',
                            'noSecretary.email',
                            'noSecretary.contactNumber',
                            'noSecretary.registrationNo',
                          ])
                        } catch { }
                      }}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="secretary-yes" />
                        <Label htmlFor="secretary-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="secretary-no" />
                        <Label htmlFor="secretary-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  {field.value === "yes" && (
                    <FormDescription>
                      {appTitle} can act as your company secretary, handling all secretarial duties and compliance requirements. I accept the{" "}
                      <a
                        href="https://corporate.lk/secretarial-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Secretarial Services Policy
                      </a>
                      .
                    </FormDescription>
                  )}

                </FormItem>
              )}
            />

            {/* No Secretary - Natural Person Details */}
            {form.watch('makeSimpleBooksSecretary') === 'no' && (
              <div className="space-y-6">
                <div className="pt-2">
                  <p>Details of Natural Person Secretary</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="noSecretary.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="noSecretary.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="noSecretary.dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" placeholder="Enter date of birth" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="noSecretary.designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter designation" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="noSecretary.occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter occupation" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="noSecretary.nicNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIC Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter NIC number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="noSecretary.registrationNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secretary Registration No</FormLabel>
                        <FormControl>
                          <Input placeholder="Registration No" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="noSecretary.nicAttachment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIC Attachment</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  // Upload file to file storage
                                  const registrationId = companyData._id || companyData.id;
                                  const uploadResult = await fileUploadClient.uploadFile(
                                    file,
                                    `${registrationId}_secretary_nic`
                                  );
                                  
                                  if (uploadResult.success && uploadResult.file) {
                                    const uploadedFile = {
                                      name: file.name,
                                      type: file.type,
                                      size: file.size,
                                      url: uploadResult.file.url,
                                      id: uploadResult.file.id,
                                      uploadedAt: uploadResult.file.uploadedAt
                                    };
                                    field.onChange([uploadedFile]);
                                  } else {
                                    throw new Error(uploadResult.error || "Failed to upload file");
                                  }
                                } catch (error) {
                                  console.error("Error uploading NIC attachment:", error);
                                  alert(`Error uploading file: ${error instanceof Error ? error.message : "Unknown error"}`);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        {field.value && field.value.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-green-600">File attached: {field.value[0].name}</p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <div className="pb-2">
                    <p>Address Details of Secretary</p>
                  </div>
                  {/* Row 1: Address + Postal Code */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="noSecretary.address.line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Full address" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="noSecretary.address.postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Postal Code" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 2: Province + District + Divisional Secretariat */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="noSecretary.address.province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Province</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                setSecSelectedProvince(value)
                              }}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a province" />
                              </SelectTrigger>
                              <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {adminData.provinces?.map((province) => (
                                  <SelectItem key={province.id} value={province.name}>
                                    {province.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="noSecretary.address.district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                setSecSelectedDistrict(value)
                              }}
                              value={field.value}
                              disabled={!secSelectedProvince || secAvailableDistricts.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={secSelectedProvince ? "Select a district" : "Select province first"} />
                              </SelectTrigger>
                              <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {secAvailableDistricts.map((district) => (
                                  <SelectItem key={district.id} value={district.name}>
                                    {district.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="noSecretary.address.divisionalSecretariat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Divisional Secretariat</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!secSelectedDistrict || secAvailableDivisionalSecretariats.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={secSelectedDistrict ? "Select a divisional secretariat" : "Select district first"} />
                              </SelectTrigger>
                              <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {secAvailableDivisionalSecretariats.map((secretariat, index) => (
                                  <SelectItem key={`sec-secretariat-${index}-${secretariat}`} value={secretariat}>
                                    {secretariat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="noSecretary.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secretary's Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="noSecretary.contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secretary's Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact number" {...field} value={field.value || ""} onChange={(e) => {
                            // Remove any non-digit characters
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            field.onChange(value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Registration No moved to the same row as NIC Number */}
              </div>
            )}

            <FormField
              control={form.control}
              name="companyActivities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Company Activities
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the main business activities of your company"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      rows={4}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide a clear description of your company's primary business activities.
                  </FormDescription>

                </FormItem>
              )}
            />

            {/* Business Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter business email"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>

                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessContactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Contact Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter business contact number"
                        {...field}
                        onChange={(e) => {
                          // Remove any non-digit characters
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>

                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Company Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Business Address Fields - all on same line with different widths */}
            <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
              {/* Business Address Number - Short (2 columns) */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="businessAddressNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address No.</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="No."
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>

                    </FormItem>
                  )}
                />
              </div>

              {/* Business Address Street - Longest (6 columns) */}
              <div className="md:col-span-6">
                <FormField
                  control={form.control}
                  name="businessAddressStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Address Street</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter street"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>

                    </FormItem>
                  )}
                />
              </div>

              {/* Business Address City - Same as Address No (2 columns) */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="businessAddressCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter city"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>

                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Administrative Location fields in a single row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter postal code"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>

                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          setSelectedProvince(value)
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a province" />
                        </SelectTrigger>
                        <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          {adminData.provinces?.map((province) => (
                            <SelectItem key={province.id} value={province.name}>
                              {province.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>

                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          setSelectedDistrict(value)
                        }}
                        value={field.value}
                        disabled={!selectedProvince || availableDistricts.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedProvince ? "Select a district" : "Select province first"} />
                        </SelectTrigger>
                        <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          {availableDistricts.map((district) => (
                            <SelectItem key={district.id} value={district.name}>
                              {district.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>

                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="divisionalSecretariat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Divisional Secretariat</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedDistrict || availableDivisionalSecretariats.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedDistrict ? "Select a divisional secretariat" : "Select district first"} />
                        </SelectTrigger>
                        <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          {availableDivisionalSecretariats.map((secretariat, index) => (
                            <SelectItem key={`shareholder-secretariat-${index}-${secretariat}`} value={secretariat}>
                              {secretariat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>

                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gramaNiladhari"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Grama Niladhari Division
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Grama Niladhari Division"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>

                  </FormItem>
                )}
              />
            </div>

          </CardContent>
        </Card>



        {/* Shares & Shareholder Details */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <CardTitle className="text-lg font-medium">Shareholder Information</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentCount = shareholderFields.length
                  const newCount = currentCount + 1
                  form.setValue("numberOfShareholders", newCount.toString(), { shouldValidate: false })
                  appendShareholder({
                    type: "natural-person",
                    residency: "sri-lankan",
                    fullName: "",
                    nicNumber: "",
                    documents: [],
                    email: "",
                    contactNumber: "",
                    isDirector: false,
                    shares: "",
                    // Sri Lankan address fields
                    province: "",
                    district: "",
                    divisionalSecretariat: "",
                    fullAddress: "",
                    postalCode: "",
                    // Legal Entity fields
                    companyRegistrationNumber: "",
                    companyName: "",
                    // Foreign address fields
                    foreignAddress: "",
                    city: "",
                    stateRegionProvince: "",
                    // Foreign person fields
                    passportNo: "",
                    passportIssuedCountry: "",
                    country: "",
                    // Beneficiary owners
                    beneficiaryOwners: [],
                  })
                  // Clear any validation errors for the new shareholder
                  setTimeout(() => {
                    form.clearErrors(`shareholders.${currentCount}`)
                  }, 100)
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Add More Shareholder
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <h4 className="text-sm font-medium">Current Shareholders:</h4>
                <Badge variant="outline" className="text-sm w-fit sm:w-auto self-end sm:self-auto">
                  Total: {shareholderFields.length}
                </Badge>
              </div>

              {shareholderFields.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {shareholderFields.map((shareholder, idx) => (
                    <div key={idx} className="bg-muted/30 rounded-md px-3 py-1.5 text-sm flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        {(() => {
                          const type = form.watch(`shareholders.${idx}.type`)
                          const fullName = (form.watch(`shareholders.${idx}.fullName`) || "").trim()
                          const companyName = (form.watch(`shareholders.${idx}.companyName`) || "").trim()
                          if (type === "legal-entity") {
                            return companyName || `Legal Entity ${idx + 1}`
                          }
                          return fullName || `Shareholder ${idx + 1}`
                        })()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  No shareholders added yet. Add shareholders to register them.
                </p>
              )}
            </div>

            {/* Shareholder Fee Display */}
            {(() => {
              try {
                const settings = (typeof window !== 'undefined') ? (JSON.parse(localStorage.getItem('appSettings') || '{}')) : {}
                const conf = (additionalFeesConfig
                  ? additionalFeesConfig
                  : ((settings && (settings as any).additionalFees) || {})) as any
                const shs: any[] = (form.watch('shareholders') || [])
                const total = shs.length
                if (total === 0) return null

                const shLocalNatural = shs.filter((s) => (s.residency || 'sri-lankan') !== 'foreign' && (s.type || 'natural-person') === 'natural-person').length
                const shLocalEntity = shs.filter((s) => (s.residency || 'sri-lankan') !== 'foreign' && (s.type || 'natural-person') !== 'natural-person').length
                const shForeignNatural = shs.filter((s) => (s.residency || '') === 'foreign' && (s.type || 'natural-person') === 'natural-person').length
                const shForeignEntity = shs.filter((s) => (s.residency || '') === 'foreign' && (s.type || 'natural-person') !== 'natural-person').length

                // New logic: Charge per shareholder (no free shareholders)
                const localNaturalFee = Number(conf.shareholders?.localNaturalPerson || 0)
                const localEntityFee = Number(conf.shareholders?.localLegalEntity || 0)
                const foreignNaturalFee = Number(conf.shareholders?.foreignNaturalPerson || 0)
                const foreignEntityFee = Number(conf.shareholders?.foreignLegalEntity || 0)

                const fee = (n: number, p: number) => (n > 0 && p > 0 ? n * p : 0)
                const totalFee = fee(shLocalNatural, localNaturalFee) + fee(shLocalEntity, localEntityFee) + fee(shForeignNatural, foreignNaturalFee) + fee(shForeignEntity, foreignEntityFee)

                return (
                  <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    Shareholder fees apply per shareholder.
                    {shLocalNatural > 0 && localNaturalFee > 0 && (
                      <div className="mt-1">Local natural persons: {shLocalNatural} × Rs. {localNaturalFee.toLocaleString()} = Rs. {fee(shLocalNatural, localNaturalFee).toLocaleString()}</div>
                    )}
                    {shLocalEntity > 0 && localEntityFee > 0 && (
                      <div>Local legal entities: {shLocalEntity} × Rs. {localEntityFee.toLocaleString()} = Rs. {fee(shLocalEntity, localEntityFee).toLocaleString()}</div>
                    )}
                    {shForeignNatural > 0 && foreignNaturalFee > 0 && (
                      <div>Foreign natural persons: {shForeignNatural} × Rs. {foreignNaturalFee.toLocaleString()} = Rs. {fee(shForeignNatural, foreignNaturalFee).toLocaleString()}</div>
                    )}
                    {shForeignEntity > 0 && foreignEntityFee > 0 && (
                      <div>Foreign legal entities: {shForeignEntity} × Rs. {foreignEntityFee.toLocaleString()} = Rs. {fee(shForeignEntity, foreignEntityFee).toLocaleString()}</div>
                    )}
                    <div className="mt-1 font-medium">Total shareholder fees: Rs. {totalFee.toLocaleString()}</div>
                  </div>
                )
              } catch { return null }
            })()}

            {/* Shareholder Forms */}
            {shareholderFields.map((field, index) => (
              <Card
                key={field.id}
                className="border-dashed -mx-4 sm:mx-0 sm:border-2"
              >
                <CardHeader className="pb-2 flex flex-row justify-between items-center px-4 sm:px-6">
                  <CardTitle className="text-base">
                    {(() => {
                      const type = form.watch(`shareholders.${index}.type`)
                      const fullName = (form.watch(`shareholders.${index}.fullName`) || "").trim()
                      const companyName = (form.watch(`shareholders.${index}.companyName`) || "").trim()
                      if (type === "legal-entity") {
                        return companyName ? `Legal Entity ${index + 1} - ${companyName}` : `Legal Entity ${index + 1}`
                      }
                      return fullName ? `Shareholder ${index + 1} - ${fullName}` : `Shareholder ${index + 1}`
                    })()}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (shareholderFields.length > 1) {
                        removeShareholder(index)
                        form.setValue("numberOfShareholders", (shareholderFields.length - 1).toString(), { shouldValidate: false })
                      }
                    }}
                    className="h-8 w-8 p-0"
                    disabled={shareholderFields.length === 1}
                    aria-label="Remove Shareholder"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 px-4 sm:px-6">
                  <FormField
                    control={form.control}
                    name={`shareholders.${index}.residency`}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-foreground">Is your shareholder a Sri Lankan Resident or Foreign Resident? </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear any validation errors for this field
                              form.clearErrors(`shareholders.${index}.residency`);
                              // Clear all shareholder fields when residency toggles
                              const fieldsToClear = {
                                // Natural Person
                                fullName: "",
                                nicNumber: "",
                                passportNo: "",
                                passportIssuedCountry: "",
                                country: "",
                                // Legal Entity
                                companyRegistrationNumber: "",
                                companyName: "",
                                // Address (local)
                                province: "",
                                district: "",
                                divisionalSecretariat: "",
                                // Address (common)
                                fullAddress: "",
                                postalCode: "",
                                // Foreign address
                                foreignAddress: "",
                                city: "",
                                stateRegionProvince: "",
                                // Contacts
                                email: "",
                                contactNumber: "",
                              } as const;
                              Object.entries(fieldsToClear).forEach(([k, v]) => {
                                form.setValue(`shareholders.${index}.${k}` as any, v, { shouldValidate: false });
                              });
                              // Clear beneficiary owners, if any
                              form.setValue(`shareholders.${index}.beneficiaryOwners` as any, [], { shouldValidate: false });
                            }}
                            value={field.value || ""}
                            key={`shareholders.${index}.residency.${field.value || ""}`}
                            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sri-lankan" id={`shareholder-residency-sl-${index}`} />
                              <Label htmlFor={`shareholder-residency-sl-${index}`}>Sri Lankan Resident</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="foreign" id={`shareholder-residency-foreign-${index}`} />
                              <Label htmlFor={`shareholder-residency-foreign-${index}`}>Foreign Resident</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>

                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`shareholders.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-foreground">Is this shareholder a person or a company? </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear any validation errors for this field
                              form.clearErrors(`shareholders.${index}.type`);

                              // Clear all shareholder data when switching between natural-person and legal-entity
                              const currentShareholder = form.getValues(`shareholders.${index}`);
                              const fieldsToClear = {
                                // Natural Person fields
                                fullName: "",
                                nicNumber: "",
                                passportNo: "",
                                passportIssuedCountry: "",
                                country: "",
                                // Legal Entity fields
                                companyRegistrationNumber: "",
                                companyName: "",
                                // Address fields
                                province: "",
                                district: "",
                                divisionalSecretariat: "",
                                fullAddress: "",
                                postalCode: "",
                                foreignAddress: "",
                                city: "",
                                stateRegionProvince: "",
                                // Contact fields
                                email: "",
                                contactNumber: "",
                                // Director and shares
                                isDirector: false,
                                shares: "",
                                // Beneficiary owners (only for legal entities)
                                beneficiaryOwners: value === "legal-entity" ? [
                                  {
                                    type: "local",
                                    nicNumber: "",
                                    firstName: "",
                                    lastName: "",
                                    province: "",
                                    district: "",
                                    divisionalSecretariat: "",
                                    address: "",
                                    postalCode: "",
                                    contactNumber: "",
                                    emailAddress: "",
                                    passportNo: "",
                                    country: "",
                                    foreignAddress: "",
                                    city: "",
                                    stateRegionProvince: ""
                                  }
                                ] : [],
                                // Documents
                                documents: []
                              };

                              // Update all fields for this shareholder
                              Object.entries(fieldsToClear).forEach(([fieldName, fieldValue]) => {
                                form.setValue(`shareholders.${index}.${fieldName}`, fieldValue, { shouldValidate: false });
                              });

                              // If switching to Legal Entity, remove this shareholder from directors list
                              if (value === "legal-entity") {
                                const currentDirectors = form.getValues("directors") || [];
                                const filteredDirectors = currentDirectors.filter(
                                  (d: any) => !(d.fromShareholder && d.shareholderIndex === index)
                                );
                                form.setValue("directors", filteredDirectors, { shouldValidate: false });
                                form.setValue("numberOfDirectors", filteredDirectors.length.toString(), {
                                  shouldValidate: false,
                                });
                              }

                              // Clear validation errors for all shareholder fields
                              form.clearErrors(`shareholders.${index}`);
                            }}
                            value={field.value || ""}
                            key={`shareholders.${index}.type.${field.value || ""}`}
                            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="natural-person" id={`shareholder-type-natural-person-${index}`} />
                              <Label htmlFor={`shareholder-type-natural-person-${index}`}>Natural Person</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="legal-entity" id={`shareholder-type-legal-entity-${index}`} />
                              <Label htmlFor={`shareholder-type-legal-entity-${index}`}>Legal Entity(Firm)</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>

                      </FormItem>
                    )}
                  />

                  {/* Conditional Fields Based on Residency and Type */}
                  {(() => {
                    const residency = form.watch(`shareholders.${index}.residency`);
                    const type = form.watch(`shareholders.${index}.type`);

                    // Sri Lankan Resident + Natural Person
                    if (residency === "sri-lankan" && type === "natural-person") {
                      return (
                        <div>
                          {/* Name and NIC fields on same line */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Full Name - Longer (3 columns) */}
                            <div className="md:col-span-3">
                              <FormField
                                control={form.control}
                                name={`shareholders.${index}.fullName`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name According to the NIC</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter full name"
                                        {...field}
                                        onChange={(e) => {
                                          const newName = e.target.value.toUpperCase();
                                          field.onChange(newName);

                                          // Real-time update: If this shareholder is a director, update the director's name
                                          const currentShareholder = form.getValues(`shareholders.${index}`);
                                          if (currentShareholder.isDirector) {
                                            const currentDirectors = form.getValues("directors") || [];
                                            const directorIndex = currentDirectors.findIndex(
                                              (d: any) => d.fromShareholder && d.shareholderIndex === index
                                            );

                                            if (directorIndex !== -1) {
                                              // Update the director's name
                                              form.setValue(`directors.${directorIndex}.fullName`, newName, { shouldValidate: false });
                                            }
                                          }
                                        }}
                                      />
                                    </FormControl>

                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* NIC Number - Shorter (1 column) */}
                            <div className="md:col-span-1">
                              <FormField
                                control={form.control}
                                name={`shareholders.${index}.nicNumber`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>NIC Number</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="NIC"
                                        {...field}
                                        onChange={(e) => {
                                          const newNic = e.target.value.toUpperCase();
                                          field.onChange(newNic);

                                          // Real-time update: If this shareholder is a director, update the director's NIC
                                          const currentShareholder = form.getValues(`shareholders.${index}`);
                                          if (currentShareholder.isDirector) {
                                            const currentDirectors = form.getValues("directors") || [];
                                            const directorIndex = currentDirectors.findIndex(
                                              (d: any) => d.fromShareholder && d.shareholderIndex === index
                                            );

                                            if (directorIndex !== -1) {
                                              form.setValue(`directors.${directorIndex}.nicNumber`, newNic, { shouldValidate: false });
                                            }
                                          }
                                        }}
                                      />
                                    </FormControl>

                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Sri Lankan Resident + Legal Entity
                    if (residency === "sri-lankan" && type === "legal-entity") {
                      return (
                        <div>
                          {/* Company Registration Number and Company Name */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`shareholders.${index}.companyRegistrationNumber`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company Registration Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter company registration number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`shareholders.${index}.companyName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter company name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                        </div>
                      );
                    }

                    // Foreign Resident + Natural Person
                    if (residency === "foreign" && type === "natural-person") {
                      return (
                        <div>
                          {/* Passport and Name fields */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`shareholders.${index}.passportNo`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Passport No</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter passport number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`shareholders.${index}.passportIssuedCountry`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Passport Issued Country</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                      </SelectTrigger>
                                      <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                        {((adminData as any).countries || []).map((country: any, index: number) => (
                                          <SelectItem key={`foreign-country-${index}-${country.name || country}`} value={country.name || country}>
                                            {country.name || country}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`shareholders.${index}.fullName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter full name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Country field on separate line */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={form.control}
                              name={`shareholders.${index}.country`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                      </SelectTrigger>
                                      <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                        {((adminData as any).countries || []).map((country: any, index: number) => (
                                          <SelectItem key={`foreign-country-${index}-${country.name || country}`} value={country.name || country}>
                                            {country.name || country}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                        </div>
                      );
                    }

                    // Foreign Resident + Legal Entity
                    if (residency === "foreign" && type === "legal-entity") {
                      return (
                        <div>
                          {/* Company Registration Number and Company Name */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`shareholders.${index}.companyRegistrationNumber`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company Registration Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter company registration number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`shareholders.${index}.companyName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter company name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                        </div>
                      );
                    }

                    return null;
                  })()}

                  {/* Shareholder Location Fields */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {form.watch(`shareholders.${index}.type`) === "legal-entity"
                        ? "Legal Entity(firm) Address Information"
                        : form.watch(`shareholders.${index}.residency`) === "foreign" && form.watch(`shareholders.${index}.type`) === "natural-person"
                          ? "Foreign Shareholder Address Information"
                          : "Shareholder Address Information"}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {form.watch(`shareholders.${index}.type`) === "legal-entity"
                        ? "Please provide the Address details for this Legal Entity(firm)"
                        : form.watch(`shareholders.${index}.residency`) === "foreign" && form.watch(`shareholders.${index}.type`) === "natural-person"
                          ? "Please provide the Foreign Address details for this shareholder"
                          : "Please provide the Address details for this shareholder"}
                    </p>

                    {/* Full Address */}
                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.fullAddress`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address with Address Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter full address with address number"
                              {...field}
                              onChange={(e) => {
                                const newAddress = e.target.value.toUpperCase();
                                field.onChange(newAddress);

                                // Real-time update: If this shareholder is a director, update the director's address
                                const currentShareholder = form.getValues(`shareholders.${index}`);
                                if (currentShareholder.isDirector) {
                                  const currentDirectors = form.getValues("directors") || [];
                                  const directorIndex = currentDirectors.findIndex(
                                    (d: any) => d.fromShareholder && d.shareholderIndex === index
                                  );

                                  if (directorIndex !== -1) {
                                    form.setValue(`directors.${directorIndex}.fullAddress`, newAddress, { shouldValidate: false });
                                  }
                                }
                              }}
                            />
                          </FormControl>

                        </FormItem>
                      )}
                    />

                    {/* Location fields - conditional based on residency and type */}
                    {(form.watch(`shareholders.${index}.residency`) === "foreign" && form.watch(`shareholders.${index}.type`) === "natural-person") || form.watch(`shareholders.${index}.type`) === "legal-entity" ? (
                      /* Foreign Resident + Natural Person OR Legal Entity - International Address Fields */
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`shareholders.${index}.city`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter city"
                                  {...field}
                                  onChange={(e) => {
                                    const newCity = e.target.value.toUpperCase();
                                    field.onChange(newCity);

                                    // Real-time update: If this shareholder is a director, update the director's city
                                    const currentShareholder = form.getValues(`shareholders.${index}`);
                                    if (currentShareholder.isDirector) {
                                      const currentDirectors = form.getValues("directors") || [];
                                      const directorIndex = currentDirectors.findIndex(
                                        (d: any) => d.fromShareholder && d.shareholderIndex === index
                                      );

                                      if (directorIndex !== -1) {
                                        form.setValue(`directors.${directorIndex}.city`, newCity, { shouldValidate: false });
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`shareholders.${index}.stateRegionProvince`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Region/Province</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter state/region/province"
                                  {...field}
                                  onChange={(e) => {
                                    const newStateRegion = e.target.value.toUpperCase();
                                    field.onChange(newStateRegion);

                                    // Real-time update: If this shareholder is a director, update the director's state/region/province
                                    const currentShareholder = form.getValues(`shareholders.${index}`);
                                    if (currentShareholder.isDirector) {
                                      const currentDirectors = form.getValues("directors") || [];
                                      const directorIndex = currentDirectors.findIndex(
                                        (d: any) => d.fromShareholder && d.shareholderIndex === index
                                      );

                                      if (directorIndex !== -1) {
                                        form.setValue(`directors.${directorIndex}.stateRegionProvince`, newStateRegion, { shouldValidate: false });
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`shareholders.${index}.postalCode`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter postal code"
                                  {...field}
                                  onChange={(e) => {
                                    const newPostalCode = e.target.value.toUpperCase();
                                    field.onChange(newPostalCode);

                                    // Real-time update: If this shareholder is a director, update the director's local postal code
                                    const currentShareholder = form.getValues(`shareholders.${index}`);
                                    if (currentShareholder.isDirector) {
                                      const currentDirectors = form.getValues("directors") || [];
                                      const directorIndex = currentDirectors.findIndex(
                                        (d: any) => d.fromShareholder && d.shareholderIndex === index
                                      );

                                      if (directorIndex !== -1) {
                                        form.setValue(`directors.${directorIndex}.localPostalCode`, newPostalCode, { shouldValidate: false });
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      /* Sri Lankan Natural Person Address Fields - Province, District, Divisional Secretariat */
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name={`shareholders.${index}.postalCode`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter postal code"
                                  {...field}
                                  onChange={(e) => {
                                    const newPostalCode = e.target.value.toUpperCase();
                                    field.onChange(newPostalCode);

                                    // Real-time update: If this shareholder is a director, update the director's local postal code
                                    const currentShareholder = form.getValues(`shareholders.${index}`);
                                    if (currentShareholder.isDirector) {
                                      const currentDirectors = form.getValues("directors") || [];
                                      const directorIndex = currentDirectors.findIndex(
                                        (d: any) => d.fromShareholder && d.shareholderIndex === index
                                      );

                                      if (directorIndex !== -1) {
                                        form.setValue(`directors.${directorIndex}.localPostalCode`, newPostalCode, { shouldValidate: false });
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`shareholders.${index}.province`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    handleShareholderProvinceChange(index, value)

                                    // Real-time update: If this shareholder is a director, update the director's province
                                    const currentShareholder = form.getValues(`shareholders.${index}`);
                                    if (currentShareholder.isDirector) {
                                      const currentDirectors = form.getValues("directors") || [];
                                      const directorIndex = currentDirectors.findIndex(
                                        (d: any) => d.fromShareholder && d.shareholderIndex === index
                                      );

                                      if (directorIndex !== -1) {
                                        form.setValue(`directors.${directorIndex}.province`, value, { shouldValidate: false });
                                      }
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger className="scrollbar-visible">
                                    <SelectValue placeholder="Select a province" />
                                  </SelectTrigger>
                                  <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-60 overflow-y-auto">
                                    {adminData.provinces?.map((province) => (
                                      <SelectItem key={province.id} value={province.name}>
                                        {province.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`shareholders.${index}.district`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>District</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    handleShareholderDistrictChange(index, value)

                                    // Real-time update: If this shareholder is a director, update the director's district
                                    const currentShareholder = form.getValues(`shareholders.${index}`);
                                    if (currentShareholder.isDirector) {
                                      const currentDirectors = form.getValues("directors") || [];
                                      const directorIndex = currentDirectors.findIndex(
                                        (d: any) => d.fromShareholder && d.shareholderIndex === index
                                      );

                                      if (directorIndex !== -1) {
                                        form.setValue(`directors.${directorIndex}.district`, value, { shouldValidate: false });
                                      }
                                    }
                                  }}
                                  value={field.value}
                                  disabled={!shareholderAvailableDistricts[index] || shareholderAvailableDistricts[index].length === 0}
                                >
                                  <SelectTrigger className="scrollbar-visible">
                                    <SelectValue placeholder="Select a district" />
                                  </SelectTrigger>
                                  <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-60 overflow-y-auto">
                                    {(shareholderAvailableDistricts[index] || []).map((district) => (
                                      <SelectItem key={district.id} value={district.name}>
                                        {district.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`shareholders.${index}.divisionalSecretariat`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Divisional Secretariat</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value)

                                    // Real-time update: If this shareholder is a director, update the director's divisional secretariat
                                    const currentShareholder = form.getValues(`shareholders.${index}`);
                                    if (currentShareholder.isDirector) {
                                      const currentDirectors = form.getValues("directors") || [];
                                      const directorIndex = currentDirectors.findIndex(
                                        (d: any) => d.fromShareholder && d.shareholderIndex === index
                                      );

                                      if (directorIndex !== -1) {
                                        form.setValue(`directors.${directorIndex}.divisionalSecretariat`, value, { shouldValidate: false });
                                      }
                                    }
                                  }}
                                  value={field.value}
                                  disabled={!shareholderAvailableDivisionalSecretariats[index] || shareholderAvailableDivisionalSecretariats[index].length === 0}
                                >
                                  <SelectTrigger className="scrollbar-visible">
                                    <SelectValue placeholder="Select a divisional secretariat" />
                                  </SelectTrigger>
                                  <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-60 overflow-y-auto">
                                    {(shareholderAvailableDivisionalSecretariats[index] || []).map((secretariat, secIndex) => (
                                      <SelectItem key={`shareholder-${index}-secretariat-${secIndex}-${secretariat}`} value={secretariat}>
                                        {secretariat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                  </div>

                  <FormField
                    control={form.control}
                    name={`shareholders.${index}.documents`}
                    render={({ field }) => (
                      <FormItem
                        className={`space-y-2 ${field.value && field.value.length > 0 ? "border-l-4 border-green-500 pl-3 rounded-l-md" : ""}`}
                      >
                        <FormLabel className="flex items-center justify-between">
                          <div className="flex items-center">
                            Please Upload a copy of your National Identity Card as an attachment below
                          </div>
                          {field.value && field.value.length > 0 && (
                            <span className="text-xs text-green-600 flex items-center">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Files attached
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className="mt-2">
                            <div
                              className={`border-2 border-dashed rounded-md p-4 ${field.value && field.value.length > 0
                                ? "border-green-500/50 bg-green-50/50"
                                : ""
                                }`}
                            >
                              <Input
                                type="file"
                                id={`shareholder-documents-${index}`}
                                multiple
                                className="hidden"
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    const uploadKey = `shareholder-${index}`;
                                    setUploadingStates(prev => ({ ...prev, [uploadKey]: true }));
                                    setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));

                                    try {
                                      console.log(`📁 CompanyDetailsStep - Uploading files for shareholder ${index}:`, e.target.files);

                                      const uploadedFiles = [];
                                      const registrationId = companyData._id || companyData.id;
                                      const totalFiles = e.target.files.length;

                                      for (let i = 0; i < e.target.files.length; i++) {
                                        const file = e.target.files[i];

                                        // Validate file type only (removed size validation)
                                        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                                          throw new Error(`File type ${file.type} is not supported. Please upload PDF, JPG, or PNG files.`);
                                        }

                                        // Update progress for current file
                                        const currentProgress = ((i + 1) / totalFiles) * 100;
                                        setUploadProgress(prev => ({ ...prev, [uploadKey]: currentProgress }));

                                        // Removed file size validation to allow unlimited uploads

                                        // Upload file to file storage immediately
                                        const uploadResult = await fileUploadClient.uploadFile(
                                          file,
                                          `${registrationId}_shareholder_${index}`
                                        );

                                        if (uploadResult.success && uploadResult.file) {
                                          uploadedFiles.push({
                                            name: file.name,
                                            type: file.type,
                                            size: file.size,
                                            url: uploadResult.file.url,
                                            id: uploadResult.file.id,
                                            uploadedAt: uploadResult.file.uploadedAt,
                                            uploaded: true
                                          });
                                          console.log(`✅ CompanyDetailsStep - Shareholder ${index} file uploaded: ${file.name}`);
                                        } else {
                                          throw new Error(`Failed to upload file ${file.name}: ${uploadResult.error}`);
                                        }
                                      }

                                      // Update the form field value with uploaded file data
                                      field.onChange(uploadedFiles);

                                      console.log(`✅ CompanyDetailsStep - All files uploaded for shareholder ${index}:`, uploadedFiles);
                                    } catch (error) {
                                      console.error(`❌ CompanyDetailsStep - Error uploading files for shareholder ${index}:`, error as Error);
                                      // You might want to show a toast notification here
                                      alert(`Error uploading files: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                    } finally {
                                      setUploadingStates(prev => ({ ...prev, [uploadKey]: false }));
                                      setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));
                                    }
                                  }
                                }}
                              />
                              <label
                                htmlFor={`shareholder-documents-${index}`}
                                className={`flex flex-col items-center justify-center gap-2 py-4 ${uploadingStates[`shareholder-${index}`] ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              >
                                {uploadingStates[`shareholder-${index}`] ? (
                                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                                ) : (
                                  <Upload
                                    className={`h-8 w-8 ${field.value && field.value.length > 0
                                      ? "text-green-500"
                                      : "text-muted-foreground"
                                      }`}
                                  />
                                )}
                                <p
                                  className={`text-sm ${field.value && field.value.length > 0
                                    ? "text-green-600"
                                    : "text-muted-foreground"
                                    }`}
                                >
                                  {uploadingStates[`shareholder-${index}`]
                                    ? "Uploading files..."
                                    : field.value && field.value.length > 0
                                      ? "Files attached - Click to change"
                                      : "Click to upload or drag and drop"
                                  }
                                </p>

                                {/* Progress Bar */}
                                {uploadingStates[`shareholder-${index}`] && (
                                  <div className="w-full max-w-xs">
                                    <Progress value={uploadProgress[`shareholder-${index}`]} className="h-2" />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {Math.round(uploadProgress[`shareholder-${index}`])}% complete
                                    </p>
                                  </div>
                                )}

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={uploadingStates[`shareholder-${index}`]}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    document.getElementById(`shareholder-documents-${index}`)?.click()
                                  }}
                                  className={
                                    field.value && field.value.length > 0
                                      ? "border-green-500/50 text-green-600 hover:bg-green-50"
                                      : ""
                                  }
                                >
                                  {uploadingStates[`shareholder-${index}`]
                                    ? "Uploading..."
                                    : field.value && field.value.length > 0
                                      ? "Change Files"
                                      : "Select Files"
                                  }
                                </Button>
                              </label>
                            </div>

                            {/* Display uploaded files */}
                            {field.value && field.value.length > 0 && (
                              <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium text-green-600">Selected Documents:</p>
                                <div className="space-y-2">
                                  {field.value.map((file: any, fileIndex: number) => (
                                    <div
                                      key={fileIndex}
                                      className={`flex items-center p-2 border rounded-md ${file.uploaded
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-blue-50 border-blue-200'
                                        }`}
                                    >
                                      <FileText className={`h-4 w-4 mr-2 ${file.uploaded ? 'text-green-600' : 'text-blue-600'
                                        }`} />
                                      <span className={`text-sm ${file.uploaded ? 'text-green-700' : 'text-blue-700'
                                        }`}>
                                        {file.name}
                                      </span>
                                      {!file.uploaded && (
                                        <span className="ml-2 text-xs text-blue-600">
                                          (Will be uploaded on submit)
                                        </span>
                                      )}
                                      {file.uploaded && (
                                        <span className="ml-2 text-xs text-green-600">
                                          ✓ Uploaded
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>

                      </FormItem>
                    )}
                  />

                  {/* Email and Contact fields on same line */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch(`shareholders.${index}.type`) === "legal-entity"
                              ? "Legal Entity(firm)'s email address"
                              : "Shareholder's email address"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              {...field}
                              onChange={(e) => {
                                const newEmail = e.target.value;
                                field.onChange(newEmail);

                                // Real-time update: If this shareholder is a director, update the director's email
                                const currentShareholder = form.getValues(`shareholders.${index}`);
                                if (currentShareholder.isDirector) {
                                  const currentDirectors = form.getValues("directors") || [];
                                  const directorIndex = currentDirectors.findIndex(
                                    (d: any) => d.fromShareholder && d.shareholderIndex === index
                                  );

                                  if (directorIndex !== -1) {
                                    form.setValue(`directors.${directorIndex}.email`, newEmail, { shouldValidate: false });
                                  }
                                }
                              }}
                            />
                          </FormControl>

                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.contactNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch(`shareholders.${index}.type`) === "legal-entity"
                              ? "Legal Entity(firm)'s contact number"
                              : "Shareholder's contact number"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter contact number"
                              {...field}
                              onChange={(e) => {
                                // Remove any non-digit characters
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                field.onChange(value);

                                // Real-time update: If this shareholder is a director, update the director's contact number
                                const currentShareholder = form.getValues(`shareholders.${index}`);
                                if (currentShareholder.isDirector) {
                                  const currentDirectors = form.getValues("directors") || [];
                                  const directorIndex = currentDirectors.findIndex(
                                    (d: any) => d.fromShareholder && d.shareholderIndex === index
                                  );

                                  if (directorIndex !== -1) {
                                    form.setValue(`directors.${directorIndex}.contactNumber`, value, { shouldValidate: false });
                                  }
                                }
                              }}
                            />
                          </FormControl>

                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Director checkbox - only show for Natural Person shareholders */}
                  {form.watch(`shareholders.${index}.type`) === "natural-person" && (
                    <FormField
                      control={form.control}
                      name={`shareholders.${index}.isDirector`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                // Update the checkbox value
                                field.onChange(checked)

                                // Immediately update directors list
                                const currentShareholder = form.getValues(`shareholders.${index}`)
                                const currentDirectors = form.getValues("directors") || []

                                if (checked) {
                                  // Add this shareholder as a director if checked
                                  const newDirectors = [
                                    ...currentDirectors.filter(
                                      (d: any) => !(d.fromShareholder && d.shareholderIndex === index),
                                    ),
                                    {
                                      residency: currentShareholder.residency,
                                      fullName: currentShareholder.fullName,
                                      nicNumber: currentShareholder.nicNumber,
                                      documents: currentShareholder.documents || [],
                                      email: currentShareholder.email,
                                      contactNumber: currentShareholder.contactNumber,
                                      fromShareholder: true,
                                      shareholderIndex: index,
                                      // Copy location data from shareholder
                                      province: currentShareholder.province || '',
                                      district: currentShareholder.district || '',
                                      divisionalSecretariat: currentShareholder.divisionalSecretariat || '',
                                      fullAddress: currentShareholder.fullAddress || '',
                                      postalCode: currentShareholder.postalCode || '',
                                    },
                                  ]

                                  // Update the directors array and count
                                  form.setValue("directors", newDirectors, { shouldValidate: false })
                                  form.setValue("numberOfDirectors", newDirectors.length.toString(), {
                                    shouldValidate: false,
                                  })
                                } else {
                                  // Remove this shareholder from directors if unchecked
                                  const filteredDirectors = currentDirectors.filter(
                                    (d: any) => !(d.fromShareholder && d.shareholderIndex === index),
                                  )

                                  // Update the directors array and count
                                  form.setValue("directors", filteredDirectors, { shouldValidate: false })
                                  form.setValue("numberOfDirectors", filteredDirectors.length.toString(), {
                                    shouldValidate: false,
                                  })
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>This shareholder is going to be a director</FormLabel>
                            <FormDescription>
                              Check this if the shareholder will also be a director of the company.
                              Their information will automatically be added to the directors list.
                            </FormDescription>
                            {field.value && (
                              <p className="text-xs text-primary mt-1">
                                {(() => {
                                  const type = form.watch(`shareholders.${index}.type`)
                                  const fullName = (form.watch(`shareholders.${index}.fullName`) || "").trim()
                                  const companyName = (form.watch(`shareholders.${index}.companyName`) || "").trim()
                                  if (type === "legal-entity") {
                                    return companyName ? `Legal Entity ${index + 1} - ${companyName}` : `Legal Entity ${index + 1}`
                                  }
                                  return fullName ? `Shareholder ${index + 1} - ${fullName}` : `Shareholder ${index + 1}`
                                })()} will be listed as a director
                              </p>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name={`shareholders.${index}.shares`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Share Percentage</FormLabel>
                        <p className="text-sm text-muted-foreground mb-2">Enter percentage (1-100%)</p>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="Enter percentage"
                              {...field}
                              className="pr-8"
                              min="1"
                              max="100"
                              step="0.01"
                              onChange={(e) => {
                                const value = e.target.value;
                                const numValue = parseFloat(value);

                                // Prevent values greater than 100
                                if (numValue > 100) {
                                  field.onChange('100');
                                } else {
                                  field.onChange(value);
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                const numValue = parseFloat(value);

                                // Ensure value is within range when user leaves the field
                                if (numValue > 100) {
                                  field.onChange('100');
                                } else if (numValue < 1 && value !== '') {
                                  field.onChange('1');
                                }
                                field.onBlur();
                              }}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <span className="text-muted-foreground text-sm">%</span>
                            </div>
                          </div>
                        </FormControl>

                      </FormItem>
                    )}
                  />

                  {/* Beneficiary Owners Section - Only show for Legal Entity shareholders */}
                  {(() => {
                    const residency = form.watch(`shareholders.${index}.residency`);
                    const type = form.watch(`shareholders.${index}.type`);

                    // Show Beneficiary Owners Section only for Legal Entity types
                    if (type === "legal-entity") {
                      return (
                        <BeneficiaryOwnersSection
                          shareholderIndex={index}
                          form={form}
                          adminData={adminData}
                        />
                      );
                    }
                    return null;
                  })()}

                </CardContent >
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Director Details */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <CardTitle className="text-lg font-medium">Director Information</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddDirector}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add More Director
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4" data-section="directors">

            {(() => {
              try {
                const settings = (typeof window !== 'undefined') ? (JSON.parse(localStorage.getItem('appSettings') || '{}')) : {}
                const conf = (additionalFeesConfig
                  ? additionalFeesConfig
                  : ((settings && (settings as any).additionalFees) || {})) as any
                // Include ALL directors (both manually added and from shareholders)
                const dir: any[] = form.watch('directors') || []
                const total = dir.length
                if (total === 0) return null
                const localCount = dir.filter(d => (d.residency || '').toLowerCase() !== 'foreign').length
                const foreignCount = dir.filter(d => (d.residency || '').toLowerCase() === 'foreign').length

                // New logic: Charge per director (no free directors)
                const localFee = Number(conf.directors?.local || 0)
                const foreignFee = Number(conf.directors?.foreign || 0)
                const fee = (n: number, p: number) => (n > 0 && p > 0 ? n * p : 0)
                const totalFee = fee(localCount, localFee) + fee(foreignCount, foreignFee)

                return (
                  <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    Director fees apply per director.
                    {localCount > 0 && localFee > 0 && (
                      <div className="mt-1">Local directors: {localCount} × Rs. {localFee.toLocaleString()} = Rs. {fee(localCount, localFee).toLocaleString()}</div>
                    )}
                    {foreignCount > 0 && foreignFee > 0 && (
                      <div>Foreign directors: {foreignCount} × Rs. {foreignFee.toLocaleString()} = Rs. {fee(foreignCount, foreignFee).toLocaleString()}</div>
                    )}
                    <div className="mt-1 font-medium">Total director fees: Rs. {totalFee.toLocaleString()}</div>
                  </div>
                )
              } catch { return null }
            })()}


            {/* Replace the numberOfDirectors FormField with an improved current directors display */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <p className="text-sm font-medium">Current Directors:</p>
                <Badge
                  variant={(form.watch("directors") || []).length === 0 ? "destructive" : "outline"}
                  className="text-sm w-fit sm:w-auto self-end sm:self-auto"
                >
                  Total: {(form.watch("directors") || []).length}
                </Badge>
              </div>
              {/* Removed the old grid view with delete buttons */}
              {(form.watch("directors") || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(form.watch("directors") || []).map((director: any, index: number) => (
                    <div
                      key={index}
                      className={`rounded-md px-3 py-1.5 text-sm flex items-center gap-1.5 ${director.fromShareholder ? "bg-primary/10 border border-primary/20" : "bg-muted/30 border border-muted"
                        }`}
                    >
                      <User
                        className={`h-3.5 w-3.5 ${director.fromShareholder ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span>
                        {(() => {
                          const full = (director.fullName || "").trim()
                          return full || `Director ${index + 1}`
                        })()}
                        {director.fromShareholder && (
                          <span className="ml-1 text-xs text-primary-foreground/70 bg-primary/20 px-1.5 py-0.5 rounded-full">
                            Shareholder
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No directors added yet. Mark shareholders as directors or add additional directors.
                </p>
              )}
            </div>

            {/* Director Forms (only for non-shareholder directors) */}
            {directorFields.map((field, index) => {
              // Skip rendering for directors that come from shareholders
              if (form.watch(`directors.${index}.fromShareholder`)) {
                return null
              }

              return (
                <Card
                  key={field.id}
                  className="border-dashed -mx-4 sm:mx-0 sm:border-2"
                >
                  <CardHeader className="pb-2 flex flex-row justify-between items-center px-4 sm:px-6">
                    <CardTitle className="text-base">
                      {(() => {
                        const full = (form.watch(`directors.${index}.fullName`) || "").trim()
                        return full ? `Director ${index + 1} - ${full}` : `Director ${index + 1}`
                      })()}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (directorFields.length > 1) {
                          removeDirector(index);
                          form.setValue("numberOfDirectors", (directorFields.length - 1).toString(), {
                            shouldValidate: false
                          });
                        }
                      }}
                      className="h-8 w-8 p-0"
                      disabled={directorFields.length === 1}
                      aria-label="Remove Director"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 sm:px-6">

                    <FormField
                      control={form.control}
                      name={`directors.${index}.residency`}
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Is your director a Sri Lankan resident or foreign resident? </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                field.onChange(value)
                                // Clear director fields when residency toggles
                                const fieldsToClear = {
                                  // Local
                                  fullName: "",
                                  nicNumber: "",
                                  province: "",
                                  district: "",
                                  divisionalSecretariat: "",
                                  // Common/local address
                                  fullAddress: "",
                                  postalCode: "",
                                  // Foreign identity
                                  firstName: "",
                                  lastName: "",
                                  passportNo: "",
                                  passportIssuedCountry: "",
                                  country: "",
                                  // Foreign address
                                  foreignAddress: "",
                                  city: "",
                                  stateRegionProvince: "",
                                  // Contacts
                                  email: "",
                                  contactNumber: "",
                                } as const
                                Object.entries(fieldsToClear).forEach(([k, v]) => {
                                  form.setValue(`directors.${index}.${k}` as any, v, { shouldValidate: false })
                                })
                              }}
                              value={field.value || ""}
                              className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sri-lankan" id={`director-residency-sl-${index}`} />
                                <Label htmlFor={`director-residency-sl-${index}`}>Sri Lankan Resident</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="foreign" id={`director-residency-foreign-${index}`} />
                                <Label htmlFor={`director-residency-foreign-${index}`}>Foreign Resident</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>

                        </FormItem>
                      )}
                    />

                    {/* Director Identity Fields - Conditional by Residency */}
                    {form.watch(`directors.${index}.residency`) === "foreign" ? (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Passport No */}
                          <FormField
                            control={form.control}
                            name={`directors.${index}.passportNo`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Passport No</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter passport number" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          {/* Passport Issued Country */}
                          <FormField
                            control={form.control}
                            name={`directors.${index}.passportIssuedCountry`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Passport Issued Country</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-60 overflow-y-auto">
                                      {((adminData as any).countries || []).map((country: any, cIndex: number) => (
                                        <SelectItem key={`dir-${index}-passport-country-${cIndex}-${country.name || country}`} value={country.name || country}>
                                          {country.name || country}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          {/* Full Name */}
                          <FormField
                            control={form.control}
                            name={`directors.${index}.fullName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter full name" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        {/* Country on separate line */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name={`directors.${index}.country`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-60 overflow-y-auto">
                                      {((adminData as any).countries || []).map((country: any, cIndex: number) => (
                                        <SelectItem key={`dir-${index}-country-${cIndex}-${country.name || country}`} value={country.name || country}>
                                          {country.name || country}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Full Name - Longer (3 columns) */}
                        <div className="md:col-span-3">
                          <FormField
                            control={form.control}
                            name={`directors.${index}.fullName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name According to the NIC </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter full name"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        {/* NIC Number - Shorter (1 column) */}
                        <div className="md:col-span-1">
                          <FormField
                            control={form.control}
                            name={`directors.${index}.nicNumber`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>NIC Number </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="NIC"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name={`directors.${index}.documents`}
                      render={({ field }) => (
                        <FormItem
                          className={`space-y-2 ${field.value && field.value.length > 0 ? "border-l-4 border-green-500 pl-3 rounded-l-md" : ""}`}
                        >
                          <FormLabel className="flex items-center justify-between">
                            <div className="flex items-center">
                              Please Upload a copy of your National Identity Card as an attachment below
                            </div>
                            {field.value && field.value.length > 0 && (
                              <span className="text-xs text-green-600 flex items-center">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Files attached
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <div className="mt-2">
                              <div
                                className={`border-2 border-dashed rounded-md p-4 ${field.value && field.value.length > 0
                                  ? "border-green-500/50 bg-green-50/50"
                                  : ""
                                  }`}
                              >
                                <Input
                                  type="file"
                                  id={`director-documents-${index}`}
                                  multiple
                                  className="hidden"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      const uploadKey = `director-${index}`;
                                      setUploadingStates(prev => ({ ...prev, [uploadKey]: true }));
                                      setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));

                                      try {
                                        console.log(`📁 CompanyDetailsStep - Uploading files for director ${index}:`, e.target.files);

                                        const uploadedFiles = [];
                                        const registrationId = companyData._id || companyData.id;
                                        const totalFiles = e.target.files.length;

                                        for (let i = 0; i < e.target.files.length; i++) {
                                          const file = e.target.files[i];

                                          // Validate file type only (removed size validation)
                                          if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                                            throw new Error(`File type ${file.type} is not supported. Please upload PDF, JPG, or PNG files.`);
                                          }

                                          // Update progress for current file
                                          const currentProgress = ((i + 1) / totalFiles) * 100;
                                          setUploadProgress(prev => ({ ...prev, [uploadKey]: currentProgress }));

                                          // Removed file size validation to allow unlimited uploads

                                          // Upload file to file storage immediately
                                          const uploadResult = await fileUploadClient.uploadFile(
                                            file,
                                            `${registrationId}_director_${index}`
                                          );

                                          if (uploadResult.success && uploadResult.file) {
                                            uploadedFiles.push({
                                              name: file.name,
                                              type: file.type,
                                              size: file.size,
                                              url: uploadResult.file.url,
                                              id: uploadResult.file.id,
                                              uploadedAt: uploadResult.file.uploadedAt,
                                              uploaded: true
                                            });
                                            console.log(`✅ CompanyDetailsStep - Director ${index} file uploaded: ${file.name}`);
                                          } else {
                                            throw new Error(`Failed to upload file ${file.name}: ${uploadResult.error}`);
                                          }
                                        }

                                        // Update the form field value with uploaded file data
                                        field.onChange(uploadedFiles);

                                        console.log(`✅ CompanyDetailsStep - All files uploaded for director ${index}:`, uploadedFiles);
                                      } catch (error) {
                                        console.error(`❌ CompanyDetailsStep - Error uploading files for director ${index}:`, error as Error);
                                        // You might want to show a toast notification here
                                        alert(`Error uploading files: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                      } finally {
                                        setUploadingStates(prev => ({ ...prev, [uploadKey]: false }));
                                        setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));
                                      }
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`director-documents-${index}`}
                                  className={`flex flex-col items-center justify-center gap-2 py-4 ${uploadingStates[`director-${index}`] ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                >
                                  {uploadingStates[`director-${index}`] ? (
                                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                                  ) : (
                                    <Upload
                                      className={`h-8 w-8 ${field.value && field.value.length > 0
                                        ? "text-green-500"
                                        : "text-muted-foreground"
                                        }`}
                                    />
                                  )}
                                  <p
                                    className={`text-sm ${field.value && field.value.length > 0
                                      ? "text-green-600"
                                      : "text-muted-foreground"
                                      }`}
                                  >
                                    {uploadingStates[`director-${index}`]
                                      ? "Uploading files..."
                                      : field.value && field.value.length > 0
                                        ? "Files attached - Click to change"
                                        : "Click to upload or drag and drop"
                                    }
                                  </p>

                                  {/* Progress Bar */}
                                  {uploadingStates[`director-${index}`] && (
                                    <div className="w-full max-w-xs">
                                      <Progress value={uploadProgress[`director-${index}`]} className="h-2" />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {Math.round(uploadProgress[`director-${index}`])}% complete
                                      </p>
                                    </div>
                                  )}

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={uploadingStates[`director-${index}`]}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      document.getElementById(`director-documents-${index}`)?.click()
                                    }}
                                    className={
                                      field.value && field.value.length > 0
                                        ? "border-green-500/50 text-green-600 hover:bg-green-50"
                                        : ""
                                    }
                                  >
                                    {uploadingStates[`director-${index}`]
                                      ? "Uploading..."
                                      : field.value && field.value.length > 0
                                        ? "Change Files"
                                        : "Select Files"
                                    }
                                  </Button>
                                </label>
                              </div>

                              {/* Display uploaded files */}
                              {field.value && field.value.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-sm font-medium text-green-600">Selected Documents:</p>
                                  <div className="space-y-2">
                                    {field.value.map((file: any, fileIndex: number) => (
                                      <div
                                        key={fileIndex}
                                        className={`flex items-center p-2 border rounded-md ${file.uploaded
                                          ? 'bg-green-50 border-green-200'
                                          : 'bg-blue-50 border-blue-200'
                                          }`}
                                      >
                                        <FileText className={`h-4 w-4 mr-2 ${file.uploaded ? 'text-green-600' : 'text-blue-600'
                                          }`} />
                                        <span className={`text-sm ${file.uploaded ? 'text-green-700' : 'text-blue-700'
                                          }`}>
                                          {file.name}
                                        </span>
                                        {!file.uploaded && (
                                          <span className="ml-2 text-xs text-blue-600">
                                            (Will be uploaded on submit)
                                          </span>
                                        )}
                                        {file.uploaded && (
                                          <span className="ml-2 text-xs text-green-600">
                                            ✓ Uploaded
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>

                        </FormItem>
                      )}
                    />

                    {/* Email and Contact fields on same line */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`directors.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Director's email address </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter email address"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>

                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`directors.${index}.contactNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Director's contact number </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter contact number"
                                {...field}
                                onChange={(e) => {
                                  // Remove any non-digit characters
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>

                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Director Location Fields */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Director Address Information (Local Address)</h4>
                      <p className="text-sm text-muted-foreground mb-2">Please provide the Address details for this director</p>

                      {/* Full Address */}
                      <FormField
                        control={form.control}
                        name={`directors.${index}.fullAddress`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Address with Address Number </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter full address with address number"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>

                          </FormItem>
                        )}
                      />

                      {/* Location fields in a single row - including postal code */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Postal Code */}
                        <FormField
                          control={form.control}
                          name={`directors.${index}.localPostalCode`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal code </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter postal code"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                />
                              </FormControl>

                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`directors.${index}.province`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    handleDirectorProvinceChange(index, value)
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger className="scrollbar-visible">
                                    <SelectValue placeholder="Select a province" />
                                  </SelectTrigger>
                                  <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-60 overflow-y-auto">
                                    {adminData.provinces?.map((province) => (
                                      <SelectItem key={province.id} value={province.name}>
                                        {province.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>

                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`directors.${index}.district`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>District </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    handleDirectorDistrictChange(index, value)
                                  }}
                                  value={field.value}
                                  disabled={!directorAvailableDistricts[index] || directorAvailableDistricts[index].length === 0}
                                >
                                  <SelectTrigger className="scrollbar-visible">
                                    <SelectValue placeholder="Select a district" />
                                  </SelectTrigger>
                                  <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-60 overflow-y-auto">
                                    {(directorAvailableDistricts[index] || []).map((district) => (
                                      <SelectItem key={district.id} value={district.name}>
                                        {district.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>

                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`directors.${index}.divisionalSecretariat`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Divisional Secretariat </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={!directorAvailableDivisionalSecretariats[index] || directorAvailableDivisionalSecretariats[index].length === 0}
                                >
                                  <SelectTrigger className="scrollbar-visible">
                                    <SelectValue placeholder="Select a divisional secretariat" />
                                  </SelectTrigger>
                                  <SelectContent className="scrollbar-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-60 overflow-y-auto">
                                    {(directorAvailableDivisionalSecretariats[index] || []).map((secretariat, secIndex) => (
                                      <SelectItem key={`director-${index}-secretariat-${secIndex}-${secretariat}`} value={secretariat}>
                                        {secretariat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>

                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Foreign Address Section (no province/district/DS) */}
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Director Address Information (Foreign Address)</h4>
                        <p className="text-sm text-muted-foreground mb-2">Please provide the Foreign Address details for this director</p>

                        {/* Address */}
                        <FormField
                          control={form.control}
                          name={`directors.${index}.foreignAddress`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter foreign address"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`directors.${index}.city`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter city" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`directors.${index}.stateRegionProvince`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State/Region/Province</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter state/region/province" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`directors.${index}.foreignPostalCode`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter postal code" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isDraftSaving}
            onClick={async () => {
              console.log("🖱️ CompanyDetailsStep - Save as Draft button clicked");
              await handleSaveAsDraft();
            }}
          >
            {isDraftSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Draft...
              </>
            ) : (
              <>
                Save as Draft
              </>
            )}
          </Button>

          <Button
            type="button"
            disabled={isSubmitting || isDraftSaving}
            onClick={async () => {
              console.log("🖱️ CompanyDetailsStep - Continue to Next Step button clicked");
              console.log("💾 CompanyDetailsStep - Saving data and proceeding to next step");


              // First validate and save all data to MySQL and file storage
              const saveSuccess = await handleManualSave();

              // Only proceed to next step if save was successful
              if (saveSuccess) {
                const currentValues = form.getValues();
                console.log("🚀 CompanyDetailsStep - Proceeding to next step with values:", currentValues);
                onComplete(currentValues);
              } else {
                console.log("❌ CompanyDetailsStep - Save failed, not proceeding to next step");
              }
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving & Continuing...
              </>
            ) : (
              <>
                Continue to Next Step
              </>
            )}
          </Button>
        </div>

      </form>
    </Form>
  )
}

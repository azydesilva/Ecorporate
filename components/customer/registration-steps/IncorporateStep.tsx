"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Download, FileText, ChevronDown, ChevronUp } from "lucide-react"

type IncorporateProps = {
  companyData: any
  onComplete: (updatedCompanyData: any) => void
}

export default function IncorporateStep({ companyData, onComplete }: IncorporateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMoreDetails, setShowMoreDetails] = useState(false)

  // Update the handleComplete function to set the status to "completed"
  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      // In a real app, you would mark the company registration as complete
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the company data with the completed status
      const updatedCompanyData = {
        ...companyData,
        status: "completed",
      }

      onComplete(updatedCompanyData)
    } catch (error) {
      console.error("Error completing registration:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Company Details Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details Summary</CardTitle>
          <CardDescription>Review your company registration information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company Name and Business Address on same line */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Company Name</h3>
              <p className="text-sm">
                {companyData.companyNameEnglish || "Not provided"}
              </p>
            </div>

            {(companyData.businessAddressNumber || companyData.businessAddressStreet || companyData.businessAddressCity) && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Business Address</h3>
                <p className="text-sm">
                  {[companyData.businessAddressNumber, companyData.businessAddressStreet, companyData.businessAddressCity]
                    .filter(Boolean)
                    .join(", ") || "Not provided"}
                </p>
              </div>
            )}
          </div>

          {/* Directors and Shareholders on same line */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Directors */}
            {companyData.directors && companyData.directors.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Directors</h3>
                <div className="grid grid-cols-1 gap-1">
                  {companyData.directors.map((director: any, index: number) => (
                    <p key={index} className="text-sm">
                      {director.fullName || `Director ${index + 1}`}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Shareholders */}
            {companyData.shareholders && companyData.shareholders.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Shareholders</h3>
                <div className="grid grid-cols-1 gap-1">
                  {companyData.shareholders.map((shareholder: any, index: number) => (
                    <p key={index} className="text-sm">
                      {shareholder.fullName || `Shareholder ${index + 1}`}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Show More Button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full sm:w-auto"
            >
              {showMoreDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show More Details
                </>
              )}
            </Button>
          </div>

          {/* Expanded Details Section */}
          {showMoreDetails && (
            <div className="mt-6 pt-6 border-t space-y-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-800">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyData.companyNameSinhala && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground">Company Name (Sinhala)</h4>
                      <p className="text-sm">{companyData.companyNameSinhala}</p>
                    </div>
                  )}
                  {companyData.companyNameTamil && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground">Company Name (Tamil)</h4>
                      <p className="text-sm">{companyData.companyNameTamil}</p>
                    </div>
                  )}
                  {companyData.companyEntity && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground">Company Entity</h4>
                      <p className="text-sm">{companyData.companyEntity}</p>
                    </div>
                  )}
                  {companyData.businessObjectives && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground">Business Objectives</h4>
                      <p className="text-sm break-words">{companyData.businessObjectives}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-800">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyData.businessAddressNumber && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground">Street Number</h4>
                      <p className="text-sm">{companyData.businessAddressNumber}</p>
                    </div>
                  )}
                  {companyData.businessAddressStreet && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground">Street Name</h4>
                      <p className="text-sm">{companyData.businessAddressStreet}</p>
                    </div>
                  )}
                  {companyData.businessAddressCity && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground">City</h4>
                      <p className="text-sm">{companyData.businessAddressCity}</p>
                    </div>
                  )}
                  {companyData.businessAddressPostalCode && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground">Postal Code</h4>
                      <p className="text-sm">{companyData.businessAddressPostalCode}</p>
                    </div>
                  )}
                  {companyData.registeredAddress && (
                    <div className="space-y-1 md:col-span-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Registered Address</h4>
                      <p className="text-sm break-words">{companyData.registeredAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Directors Information */}
              {companyData.directors && companyData.directors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-800">Directors Details</h3>
                  <div className="space-y-4">
                    {companyData.directors.map((director: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md bg-gray-50">
                        <h4 className="font-medium text-sm mb-2">{director.fullName || `Director ${index + 1}`}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {director.nicNumber && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">NIC Number:</span>
                              <p>{director.nicNumber}</p>
                            </div>
                          )}
                          {director.dateOfBirth && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Date of Birth:</span>
                              <p>{new Date(director.dateOfBirth).toLocaleDateString()}</p>
                            </div>
                          )}
                          {director.address && (
                            <div className="md:col-span-2">
                              <span className="text-xs font-medium text-muted-foreground">Address:</span>
                              <p>{director.address}</p>
                            </div>
                          )}
                          {director.occupation && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Occupation:</span>
                              <p>{director.occupation}</p>
                            </div>
                          )}
                          {director.contactNumber && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Contact Number:</span>
                              <p>{director.contactNumber}</p>
                            </div>
                          )}
                          {director.emailAddress && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Email:</span>
                              <p>{director.emailAddress}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shareholders Information */}
              {companyData.shareholders && companyData.shareholders.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-800">Shareholders Details</h3>
                  <div className="space-y-4">
                    {companyData.shareholders.map((shareholder: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md bg-gray-50">
                        <h4 className="font-medium text-sm mb-2">{shareholder.fullName || `Shareholder ${index + 1}`}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {shareholder.entityType && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Entity Type:</span>
                              <p>{shareholder.entityType}</p>
                            </div>
                          )}
                          {shareholder.nicNumber && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">NIC Number:</span>
                              <p>{shareholder.nicNumber}</p>
                            </div>
                          )}
                          {shareholder.registrationNumber && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Registration Number:</span>
                              <p>{shareholder.registrationNumber}</p>
                            </div>
                          )}
                          {shareholder.sharePercentage && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Share Percentage:</span>
                              <p>{shareholder.sharePercentage}%</p>
                            </div>
                          )}
                          {shareholder.address && (
                            <div className="md:col-span-2">
                              <span className="text-xs font-medium text-muted-foreground">Address:</span>
                              <p>{shareholder.address}</p>
                            </div>
                          )}
                          {shareholder.contactNumber && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Contact Number:</span>
                              <p>{shareholder.contactNumber}</p>
                            </div>
                          )}
                          {shareholder.emailAddress && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Email:</span>
                              <p>{shareholder.emailAddress}</p>
                            </div>
                          )}
                        </div>

                        {/* Beneficiary Owners if available */}
                        {shareholder.beneficiaryOwners && shareholder.beneficiaryOwners.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h5 className="text-xs font-medium text-muted-foreground mb-2">Beneficiary Owner(s):</h5>
                            <div className="space-y-2">
                              {shareholder.beneficiaryOwners.map((beneficiary: any, bIndex: number) => (
                                <div key={bIndex} className="text-xs p-2 bg-white rounded border border-gray-200">
                                  <p className="font-medium">
                                    {beneficiary.firstName} {beneficiary.lastName}
                                  </p>
                                  {beneficiary.type === "local" ? (
                                    <>
                                      {beneficiary.nicNumber && <p>NIC: {beneficiary.nicNumber}</p>}
                                      {beneficiary.address && <p>Address: {beneficiary.address}</p>}
                                      {beneficiary.contactNumber && <p>Contact: {beneficiary.contactNumber}</p>}
                                    </>
                                  ) : (
                                    <>
                                      {beneficiary.passportNo && <p>Passport: {beneficiary.passportNo}</p>}
                                      {beneficiary.country && <p>Country: {beneficiary.country}</p>}
                                      {beneficiary.foreignAddress && <p>Address: {beneficiary.foreignAddress}</p>}
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incorporation Certificate & Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle>Incorporate</CardTitle>
          <CardDescription>Final step of your company registration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <AlertTitle className="text-green-700">Registration Completed!</AlertTitle>
            <AlertDescription className="text-green-700">
              Your company has been successfully incorporated in Sri Lanka.
            </AlertDescription>
          </Alert>

          <div className="p-6 border rounded-md">
            <h3 className="text-lg font-medium mb-4">Next Steps</h3>

            <ul className="list-disc pl-5 space-y-2">
              <li>You will receive an email with all your company registration documents</li>
              <li>Set up your company bank account</li>
              <li>Register for taxes with the Inland Revenue Department</li>
              <li>Apply for any necessary business licenses</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full text-center">
            <p className="text-sm text-muted-foreground">
              Your registration has been completed by the administrator.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
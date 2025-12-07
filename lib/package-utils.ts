/**
 * Utility functions for package-related operations
 */

export interface Package {
  id: string
  name: string
  type: "one-time" | "advance-balance"
  price?: number
  advanceAmount?: number
  balanceAmount?: number
  description?: string
}

/**
 * Determines if a package is an advance+balance payment type
 * @param packageData - The package data object
 * @returns true if it's an advance+balance package, false otherwise
 */
export function isAdvanceBalancePackage(packageData: Package | null | undefined): boolean {
  return packageData?.type === "advance-balance"
}

/**
 * Gets the appropriate button text based on package type
 * @param packageData - The package data object
 * @param isSubmitting - Whether the form is currently submitting
 * @returns The appropriate button text
 */
export function getSubmitButtonText(packageData: Package | null | undefined, isSubmitting: boolean): string {
  if (isSubmitting) {
    return "Submitting..."
  }
  
  if (isAdvanceBalancePackage(packageData)) {
    return "Proceed to Payment"
  }
  
  return "Submit Signed Documents"
}

/**
 * Retrieves package data from available packages by package ID
 * @param availablePackages - Object containing all available packages
 * @param selectedPackageId - The ID of the selected package
 * @returns The package data or null if not found
 */
export function getPackageById(availablePackages: Record<string, Package>, selectedPackageId: string): Package | null {
  return availablePackages[selectedPackageId] || null
}

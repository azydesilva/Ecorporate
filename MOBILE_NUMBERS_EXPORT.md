# Mobile Numbers Export Feature

## Overview
This feature allows administrators to export all unique mobile numbers collected from shareholders and directors in customer registration step 2. The numbers are extracted from the database, deduplicated, and provided as a downloadable text file.

## Location
The feature is accessible through the Admin Dashboard:
1. Navigate to the Admin Dashboard
2. Click on the "Payments" tab in the left sidebar
3. In the Payment Settings page, switch to the "Mobile Numbers" tab

## Functionality
- Displays the total count of unique mobile numbers found in the database
- Extracts numbers from both shareholder and director contact fields
- Removes duplicates automatically
- Cleans numbers by removing non-numeric characters (spaces, dashes, etc.)
- Provides a download button to export numbers as a text file

## Technical Details
- Component: `components/admin/MobileNumbersExport.tsx`
- Integration: Added as a tab in `components/admin/PaymentSettings.tsx`
- Data Source: Registration data from the database, specifically the `shareholders` and `directors` JSON fields
- Export Format: Plain text file with one phone number per line

## File Naming
The exported file follows this naming convention:
`mobile-numbers-YYYY-MM-DD.txt` where YYYY-MM-DD is the current date.

## Error Handling
- If no mobile numbers are found, the export button is disabled
- Errors during data fetching or export are logged to the console
- The UI provides appropriate loading and empty states

## Testing
The feature has been tested with sample data to ensure:
- Correct extraction of mobile numbers from nested JSON structures
- Proper deduplication of identical numbers
- Accurate count display
- Successful file generation and download
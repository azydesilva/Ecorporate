# Selective Sanitization Policy Implementation

## Overview

This document describes the implementation of selective sanitization policy to avoid over-sanitizing server-side date/time fields while maintaining robust XSS protection for user-provided input data.

## Problem Statement

Previously, the XSS protection middleware was sanitizing all fields in API responses, including internal server-side date/time fields that are not exposed to users or rendered in the UI. This over-sanitization was unnecessary and could potentially cause issues with date/time data integrity.

## Solution

We've implemented a selective sanitization approach that:

1. **Continues to sanitize user-provided input data** to prevent XSS attacks
2. **Skips sanitization for internal server-side date/time fields** as they are not exposed to users
3. **Maintains data integrity** for date/time fields while keeping the application secure

## Implementation Details

### Modified Files

1. **`lib/xss-middleware.ts`** - Updated the `sanitizeApiResponse` function to selectively sanitize fields

### Key Changes

1. **Added `isDateTimeField()` helper function** - Identifies date/time fields that should not be sanitized
2. **Modified `sanitizeApiResponse()`** - Skips sanitization for identified date/time fields
3. **Updated `sanitizeObject()`** - Applies the same logic to request data
4. **Updated `sanitizeQueryParams()` and `xssProtectionMiddleware()`** - Ensures date parameters in query strings are not over-sanitized

### Protected Date/Time Fields

The following fields are exempt from sanitization:

- `created_at` / `createdAt`
- `updated_at` / `updatedAt`
- `register_start_date` / `registerStartDate`
- `expire_date` / `expireDate`
- `secretary_records_noted_at` / `secretaryRecordsNotedAt`
- `expiry_notification_sent_at` / `expiryNotificationSentAt`
- `noted_at`

## Benefits

1. **Improved Performance** - Reduces unnecessary processing of date/time fields
2. **Data Integrity** - Preserves the original format of internal server-side date/time data
3. **Security Maintained** - Continues to protect against XSS attacks for user-provided input
4. **Compliance** - Aligns with the project's selective sanitization policy

## Testing

The implementation has been tested to ensure:
- User input is properly sanitized to prevent XSS attacks
- Date/time fields are preserved without over-sanitization
- Nested objects and arrays are handled correctly
- Null values are preserved appropriately

## Future Considerations

As the application evolves, additional date/time fields may need to be added to the exemption list. The `isDateTimeField()` function should be updated accordingly to maintain the selective sanitization policy.
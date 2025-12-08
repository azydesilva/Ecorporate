import { NextRequest } from 'next/server';
import { sanitizeInput } from '@/lib/xss-utils';

/**
 * XSS Protection Middleware for API Routes
 * Sanitizes incoming request data to prevent XSS attacks
 */

// Recursively sanitize an object
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const sanitizedObj: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip sanitization for date/time fields in request data as well
        const value = obj[key];
        if (isDateTimeField(key)) {
          // Don't sanitize date/time fields
          sanitizedObj[key] = value;
        } else {
          sanitizedObj[sanitizeInput(key)] = sanitizeObject(value);
        }
      }
    }
    return sanitizedObj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  return obj;
}

// Middleware to sanitize query parameters
export function sanitizeQueryParams(request: NextRequest): NextRequest {
  try {
    // Create a new URL object to work with
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.searchParams);
    
    // Sanitize all query parameters
    for (const [key, value] of searchParams.entries()) {
      // Skip sanitization for date-related query parameters
      if (!isDateTimeField(key)) {
        searchParams.set(sanitizeInput(key), sanitizeInput(value));
      }
    }
    
    // Reconstruct URL with sanitized parameters
    url.search = searchParams.toString();
    
    // Return the original request (we can't create a new NextRequest without losing properties)
    // Instead, we'll sanitize data when it's accessed
    return request;
  } catch (error) {
    console.error('Error sanitizing query parameters:', error);
    return request; // Return original request if sanitization fails
  }
}

// Main XSS protection middleware function
export async function xssProtectionMiddleware(request: NextRequest): Promise<{ 
  sanitizedBody?: any; 
  sanitizedQuery?: URLSearchParams;
  originalRequest: NextRequest;
}> {
  let sanitizedBody: any = null;
  let sanitizedQuery: URLSearchParams | undefined;
  
  try {
    // Sanitize request body if it exists
    if (request.body) {
      try {
        const clonedRequest = request.clone();
        const bodyText = await clonedRequest.text();
        
        if (bodyText) {
          const body = JSON.parse(bodyText);
          sanitizedBody = sanitizeObject(body);
        }
      } catch (parseError) {
        // If not JSON, just pass through
        console.warn('Request body is not valid JSON, skipping sanitization:', parseError);
      }
    }
    
    // Sanitize query parameters
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.searchParams);
    
    // Sanitize all query parameters
    for (const [key, value] of searchParams.entries()) {
      // Skip sanitization for date-related query parameters
      if (!isDateTimeField(key)) {
        searchParams.set(sanitizeInput(key), sanitizeInput(value));
      }
    }
    
    sanitizedQuery = searchParams;
    
  } catch (error) {
    console.error('Error in XSS protection middleware:', error);
  }
  
  return {
    sanitizedBody,
    sanitizedQuery,
    originalRequest: request
  };
}

// Response sanitizer to prevent XSS in API responses
export function sanitizeApiResponse(data: any): any {
  try {
    if (data === null || data === undefined) {
      return data;
    }
    
    if (typeof data === 'string') {
      // For string responses, sanitize for display
      return sanitizeInput(data);
    }
    
    if (typeof data === 'object' && !Array.isArray(data)) {
      const sanitizedData: Record<string, any> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Skip sanitization for date/time fields as they are internal server-side data
          // Only sanitize user-provided input data
          const value = data[key];
          if (isDateTimeField(key)) {
            // Don't sanitize date/time fields
            sanitizedData[key] = value;
          } else {
            sanitizedData[sanitizeInput(key)] = sanitizeApiResponse(value);
          }
        }
      }
      return sanitizedData;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => sanitizeApiResponse(item));
    }
    
    return data;
  } catch (error) {
    console.error('Error sanitizing API response:', error);
    return data; // Return original data if sanitization fails
  }
}

// Helper function to identify date/time fields that should not be sanitized
function isDateTimeField(fieldName: string): boolean {
  const dateTimeFields = [
    'created_at',
    'updated_at',
    'register_start_date',
    'expire_date',
    'secretary_records_noted_at',
    'expiry_notification_sent_at',
    'noted_at',
    'createdAt',
    'updatedAt',
    'registerStartDate',
    'expireDate',
    'secretaryRecordsNotedAt',
    'expiryNotificationSentAt'
  ];
  
  return dateTimeFields.includes(fieldName);
}

export default {
  sanitizeQueryParams,
  xssProtectionMiddleware,
  sanitizeApiResponse
};
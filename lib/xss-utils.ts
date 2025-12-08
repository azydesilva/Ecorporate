/**
 * XSS Utilities for sanitizing and encoding user input/output
 * Provides protection against Cross-Site Scripting attacks
 */

// Basic HTML entity encoding
export function encodeHtmlEntities(str: string): string {
  if (typeof str !== 'string') return String(str);
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Sanitize HTML by removing dangerous tags and attributes
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return String(html);
  
  // Remove script tags and their contents
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onload, etc.)
  html = html.replace(/on\w+="[^"]*"/gi, '');
  html = html.replace(/on\w+='[^']*'/gi, '');
  html = html.replace(/on\w+=\w+/gi, '');
  
  // Remove javascript: and data: URIs
  html = html.replace(/href=("|')javascript:[^"']*("|')/gi, 'href="#"');
  html = html.replace(/href=("|')data:[^"']*("|')/gi, 'href="#"');
  html = html.replace(/src=("|')javascript:[^"']*("|')/gi, 'src="#"');
  html = html.replace(/src=("|')data:[^"']*("|')/gi, 'src="#"');
  
  // Remove iframe tags
  html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove object and embed tags
  html = html.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  html = html.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  
  // Remove any remaining script-related content
  html = html.replace(/javascript:/gi, '');
  
  // Additional sanitization for common XSS patterns
  html = html.replace(/\s+on\w+\s*=\s*/gi, ' '); // Remove event handlers with spacing variations
  
  return html;
}

// Sanitize user input for safe storage
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return String(input);
  
  // Remove or encode dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Comprehensive sanitization for rich text content
export function sanitizeRichText(content: string): string {
  if (typeof content !== 'string') return String(content);
  
  // Allow only safe HTML tags
  const safeTags = /<(?!\/?(b|strong|i|em|u|br|p|div|span|ul|ol|li|h1|h2|h3|h4|h5|h6|blockquote|pre|code|a|img)\b)[^>]*>/gi;
  content = content.replace(safeTags, '');
  
  // Remove event handlers
  content = content.replace(/on\w+="[^"]*"/gi, '');
  content = content.replace(/on\w+='[^']*'/gi, '');
  content = content.replace(/on\w+=\w+/gi, '');
  
  // Sanitize href attributes
  content = content.replace(/href=["'](javascript|data):[^"']*["']/gi, '');
  
  // Sanitize src attributes
  content = content.replace(/src=["'](javascript|data):[^"']*["']/gi, '');
  
  return content;
}

// URL encoding for safe URL parameters
export function encodeUrlParameter(param: string): string {
  if (typeof param !== 'string') return String(param);
  return encodeURIComponent(param);
}

// Attribute encoding for safe HTML attributes
export function encodeAttribute(attr: string): string {
  if (typeof attr !== 'string') return String(attr);
  return attr.replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

// JSON sanitization
export function sanitizeJson(jsonString: string): string {
  if (typeof jsonString !== 'string') return String(jsonString);
  
  // Remove potential script tags from JSON strings
  return jsonString.replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

// Sanitize filename to prevent path traversal
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return '';
  
  // Remove path traversal attempts
  return filename
    .replace(/\.\./g, '')
    .replace(/\/\\/g, '')
    .replace(/[<>:"|?*\x00-\x1f]/g, '_')
    .substring(0, 255); // Limit length
}

// Main sanitization function that combines multiple techniques
export function sanitizeForDisplay(content: string): string {
  if (typeof content !== 'string') return String(content);
  
  // First encode HTML entities to neutralize any markup
  let sanitized = encodeHtmlEntities(content);
  
  // Then sanitize for additional safety
  sanitized = sanitizeHtml(sanitized);
  
  return sanitized;
}

// Utility to safely render user content in React components
export function safeRender(content: string): string {
  return sanitizeForDisplay(content);
}

// Validate and sanitize email addresses
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') return null;
  
  // Basic email validation and sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  
  if (emailRegex.test(sanitized)) {
    return sanitized;
  }
  
  return null;
}

// Validate and sanitize phone numbers
export function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except +
  return phone.replace(/[^0-9+]/g, '');
}

export default {
  encodeHtmlEntities,
  sanitizeHtml,
  sanitizeInput,
  sanitizeRichText,
  encodeUrlParameter,
  encodeAttribute,
  sanitizeJson,
  sanitizeFilename,
  sanitizeForDisplay,
  safeRender,
  sanitizeEmail,
  sanitizePhoneNumber
};
import sanitizeHtml from 'sanitize-html';
import validator from 'validator';

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // First decode any HTML entities to prevent double encoding attacks
  let sanitized = validator.unescape(input);
  
  // Then sanitize the HTML content
  sanitized = sanitizeHtml(sanitized, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
  });
  
  // Escape any remaining special characters
  sanitized = validator.escape(sanitized);
  
  return sanitized;
}

/**
 * Sanitize HTML content with allowed tags for rich text
 * @param input - The HTML input to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtmlContent(input: string): string {
  if (!input) return '';
  
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      'a': ['href', 'target']
    },
    allowedSchemes: ['http', 'https'],
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' })
    }
  });
}

/**
 * Validate and sanitize email addresses
 * @param email - The email to validate and sanitize
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;
  
  // Trim whitespace
  const trimmed = email.trim();
  
  // Validate email format
  if (!validator.isEmail(trimmed)) {
    return null;
  }
  
  // Sanitize the email
  const normalized = validator.normalizeEmail(trimmed);
  return normalized !== false ? normalized : trimmed;
}

/**
 * Validate and sanitize URLs
 * @param url - The URL to validate and sanitize
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  
  // Trim whitespace
  const trimmed = url.trim();
  
  // Add protocol if missing
  let formattedUrl = trimmed;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'http://' + formattedUrl;
  }
  
  // Validate URL format
  if (!validator.isURL(formattedUrl, { protocols: ['http', 'https'] })) {
    return null;
  }
  
  return formattedUrl;
}

/**
 * Sanitize file names to prevent directory traversal attacks
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  
  // Remove any path components
  let sanitized = filename.replace(/[/\\?%*:|"<>]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize numeric input
 * @param input - The input to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Validated number or null if invalid
 */
export function sanitizeNumericInput(input: string | number, min?: number, max?: number): number | null {
  if (input === null || input === undefined) return null;
  
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num)) return null;
  
  if (min !== undefined && num < min) return null;
  
  if (max !== undefined && num > max) return null;
  
  return num;
}
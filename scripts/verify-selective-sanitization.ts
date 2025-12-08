/**
 * Test script to verify selective sanitization of date/time fields
 * This script tests that date/time fields are not over-sanitized
 * while user input is properly sanitized.
 */

import { sanitizeApiResponse } from '../lib/xss-middleware';

console.log('🧪 Testing Selective Sanitization for Date/Time Fields...\n');

// Test data with date/time fields
const testData = {
  id: 'reg-001',
  companyName: '<script>alert("XSS")</script>Test Company',
  contactPersonName: 'John Doe',
  createdAt: '2023-12-01T10:30:00Z',
  updatedAt: '2023-12-05T14:45:30Z',
  registerStartDate: '2023-12-01',
  expireDate: '2024-12-01T00:00:00Z',
  secretaryRecordsNotedAt: null,
  expiryNotificationSentAt: '2023-11-25T09:15:00Z',
  status: '<img src=x onerror=alert("XSS")>',
  nestedObject: {
    id: 'nested-001',
    createdAt: '2023-12-02T11:20:00Z',
    description: '<script>malicious()</script>Safe description'
  },
  arrayData: [
    {
      id: 'item-001',
      updatedAt: '2023-12-03T16:22:45Z',
      name: '<iframe src=javascript:alert("XSS")></iframe>Item Name'
    }
  ]
};

console.log('📝 Original test data:');
console.log(JSON.stringify(testData, null, 2));

// Sanitize the test data
const sanitizedData = sanitizeApiResponse(testData);

console.log('\n✅ Sanitized data:');
console.log(JSON.stringify(sanitizedData, null, 2));

// Verification tests
console.log('\n🔍 Verification Tests:');

// Test 1: Dangerous content should be sanitized
const companySanitized = sanitizedData.companyName === '&lt;script&gt;alert("XSS")&lt;/script&gt;Test Company';
console.log(`✅ Company name sanitized: ${companySanitized}`);

const statusSanitized = sanitizedData.status === '&lt;img src=x onerror=alert("XSS")&gt;';
console.log(`✅ Status sanitized: ${statusSanitized}`);

const descriptionSanitized = sanitizedData.nestedObject.description === '&lt;script&gt;malicious()&lt;/script&gt;Safe description';
console.log(`✅ Nested description sanitized: ${descriptionSanitized}`);

const itemNameSanitized = sanitizedData.arrayData[0].name === '&lt;iframe src=javascript:alert("XSS")&gt;&lt;/iframe&gt;Item Name';
console.log(`✅ Array item name sanitized: ${itemNameSanitized}`);

// Test 2: Date/time fields should NOT be sanitized
const createdAtPreserved = sanitizedData.createdAt === '2023-12-01T10:30:00Z';
console.log(`✅ CreatedAt preserved: ${createdAtPreserved}`);

const updatedAtPreserved = sanitizedData.updatedAt === '2023-12-05T14:45:30Z';
console.log(`✅ UpdatedAt preserved: ${updatedAtPreserved}`);

const registerStartDatePreserved = sanitizedData.registerStartDate === '2023-12-01';
console.log(`✅ RegisterStartDate preserved: ${registerStartDatePreserved}`);

const expireDatePreserved = sanitizedData.expireDate === '2024-12-01T00:00:00Z';
console.log(`✅ ExpireDate preserved: ${expireDatePreserved}`);

const expiryNotificationPreserved = sanitizedData.expiryNotificationSentAt === '2023-11-25T09:15:00Z';
console.log(`✅ ExpiryNotificationSentAt preserved: ${expiryNotificationPreserved}`);

const nestedCreatedAtPreserved = sanitizedData.nestedObject.createdAt === '2023-12-02T11:20:00Z';
console.log(`✅ Nested CreatedAt preserved: ${nestedCreatedAtPreserved}`);

const arrayUpdatedAtPreserved = sanitizedData.arrayData[0].updatedAt === '2023-12-03T16:22:45Z';
console.log(`✅ Array UpdatedAt preserved: ${arrayUpdatedAtPreserved}`);

// Test 3: Null values should be preserved
const nullValuePreserved = sanitizedData.secretaryRecordsNotedAt === null;
console.log(`✅ Null value preserved: ${nullValuePreserved}`);

// Overall result
const allTestsPassed = companySanitized && statusSanitized && descriptionSanitized && itemNameSanitized &&
                      createdAtPreserved && updatedAtPreserved && registerStartDatePreserved && expireDatePreserved &&
                      expiryNotificationPreserved && nestedCreatedAtPreserved && arrayUpdatedAtPreserved && nullValuePreserved;

console.log(`\n🎉 All tests passed: ${allTestsPassed}`);

if (allTestsPassed) {
  console.log('\n✅ Selective sanitization is working correctly!');
  console.log('   - User input is properly sanitized to prevent XSS');
  console.log('   - Internal date/time fields are preserved without over-sanitization');
} else {
  console.log('\n❌ Some tests failed. Check the implementation.');
}

export { testData, sanitizedData };
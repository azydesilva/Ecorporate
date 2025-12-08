/**
 * Test script for XSS protection implementation
 * This script tests the XSS utilities to ensure they properly sanitize malicious input
 */

// Note: This test script is designed to be run in a Node.js environment
// For Next.js/ES modules, you would import differently

console.log('🧪 Testing XSS Protection Implementation...\n');

// Test cases with potentially malicious input
const testCases = [
  {
    name: 'Basic script tag injection',
    input: '<script>alert("XSS")</script>',
    expectedContains: ['&lt;script&gt;', '&lt;/script&gt;']
  },
  {
    name: 'HTML entity encoding',
    input: '<div onclick="alert(\'XSS\')">Click me</div>',
    expectedContains: ['&lt;div', '&lt;/div&gt;']
  },
  {
    name: 'Event handler injection',
    input: '<img src="x" onerror="alert(\'XSS\')" />',
    expectedContains: ['&lt;img', 'onerror']
  },
  {
    name: 'JavaScript URI injection',
    input: '<a href="javascript:alert(\'XSS\')">Link</a>',
    expectedContains: ['&lt;a', 'javascript:']
  },
  {
    name: 'Iframe injection',
    input: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    expectedContains: ['&lt;iframe', '&lt;/iframe&gt;']
  }
];

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`📝 Test ${index + 1}: ${testCase.name}`);
  console.log(`   Input: ${testCase.input}`);
  
  // Test encodeHtmlEntities
  const encoded = encodeHtmlEntities(testCase.input);
  console.log(`   Encoded: ${encoded}`);
  
  // Test sanitizeHtml
  const sanitized = sanitizeHtml(testCase.input);
  console.log(`   Sanitized: ${sanitized}`);
  
  // Test sanitizeForDisplay (combination of both)
  const displaySafe = sanitizeForDisplay(testCase.input);
  console.log(`   Display Safe: ${displaySafe}`);
  
  // Check if expected strings are present
  const allChecksPassed = testCase.expectedContains.every(expected => 
    encoded.includes(expected) || sanitized.includes(expected) || displaySafe.includes(expected)
  );
  
  if (allChecksPassed) {
    console.log('   ✅ PASS\n');
    passedTests++;
  } else {
    console.log('   ❌ FAIL\n');
  }
});

console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All XSS protection tests passed! The implementation is working correctly.');
} else {
  console.log('⚠️  Some tests failed. Review the XSS protection implementation.');
}

// Additional test for safe content
console.log('\n🔒 Testing safe content...');
const safeContent = 'This is safe content with no malicious code';
const safeResult = sanitizeForDisplay(safeContent);
console.log(`   Input: ${safeContent}`);
console.log(`   Output: ${safeResult}`);
console.log(`   Match: ${safeContent === safeResult ? '✅ YES' : '❌ NO'}`);

console.log('\n✅ XSS Protection Testing Complete');
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeForDisplay, encodeHtmlEntities, sanitizeHtml } from '@/lib/xss-utils';

// Test XSS protection functions
export async function GET() {
  try {
    console.log('🧪 Running XSS Protection Tests...');
    
    // Test cases with potentially malicious input
    const testCases = [
      {
        name: 'Basic script tag injection',
        input: '<script>alert("XSS")</script>',
      },
      {
        name: 'HTML entity encoding',
        input: '<div onclick="alert(\'XSS\')">Click me</div>',
      },
      {
        name: 'Event handler injection',
        input: '<img src="x" onerror="alert(\'XSS\')" />',
      },
      {
        name: 'JavaScript URI injection',
        input: '<a href="javascript:alert(\'XSS\')">Link</a>',
      },
      {
        name: 'Iframe injection',
        input: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      }
    ];

    const results = testCases.map(testCase => {
      const encoded = encodeHtmlEntities(testCase.input);
      const sanitized = sanitizeHtml(testCase.input);
      const displaySafe = sanitizeForDisplay(testCase.input);
      
      return {
        name: testCase.name,
        input: testCase.input,
        encoded,
        sanitized,
        displaySafe,
        // Check that dangerous content is neutralized
        passed: !displaySafe.includes('<script') && 
                (!displaySafe.includes('javascript:') || displaySafe.includes('href="#"')) && 
                !displaySafe.includes('onerror=') &&
                (displaySafe.includes('&lt;') || displaySafe.includes('&gt;') || displaySafe === '')
      };
    });

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`📊 XSS Protection Test Results: ${passedTests}/${totalTests} tests passed`);
    
    // Log detailed results for debugging
    results.forEach(result => {
      console.log(`   ${result.name}: ${result.passed ? 'PASS' : 'FAIL'}`);
      console.log(`     Input: ${result.input}`);
      console.log(`     Display Safe: ${result.displaySafe}`);
    });
    
    // Test safe content
    const safeContent = 'This is safe content with no malicious code';
    const safeResult = sanitizeForDisplay(safeContent);
    const safeContentPreserved = safeContent === safeResult;
    
    console.log(`🔒 Safe content test: ${safeContentPreserved ? 'PASSED' : 'FAILED'}`);
    
    return NextResponse.json({
      success: true,
      message: 'XSS Protection Tests Completed',
      results: {
        testCases: results,
        passedTests,
        totalTests,
        allTestsPassed: passedTests === totalTests,
        safeContentPreserved
      }
    });
  } catch (error) {
    console.error('❌ Error running XSS tests:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
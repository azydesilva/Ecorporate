#!/usr/bin/env node

/**
 * Test script for registration expiry utilities
 */

async function testExpiryUtils() {
    console.log('🔍 Testing registration expiry utilities...');
    
    try {
        // Dynamically import the utility function
        const { checkRegistrationExpiryAndNotify } = await import('../lib/registration-expiry-utils.js');
        
        // Test with a fake registration ID to see if the function handles missing columns gracefully
        console.log('📝 Testing with fake registration ID...');
        const result = await checkRegistrationExpiryAndNotify('non-existent-id');
        
        console.log('✅ Test completed successfully!');
        console.log('📊 Result:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testExpiryUtils();
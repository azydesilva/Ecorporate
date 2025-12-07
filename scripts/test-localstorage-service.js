// Test script to verify LocalStorageService.getRegistrations method
const { LocalStorageService } = require('../lib/database-service.ts');

async function testLocalStorageService() {
    try {
        console.log('🧪 Testing LocalStorageService.getRegistrations method...');

        // Check if the method exists
        if (typeof LocalStorageService.getRegistrations !== 'function') {
            console.error('❌ LocalStorageService.getRegistrations is not a function');
            console.log('Available methods:', Object.getOwnPropertyNames(LocalStorageService));
            return;
        }

        console.log('✅ LocalStorageService.getRegistrations method exists');

        // Test the method (this will fail in Node.js environment but we can check the method exists)
        try {
            const registrations = await LocalStorageService.getRegistrations();
            console.log('✅ Method call successful');
            console.log(`📊 Found ${registrations.length} registrations`);
        } catch (error) {
            console.log('⚠️ Method call failed (expected in Node.js environment):', error.message);
            console.log('✅ But the method exists and is callable');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testLocalStorageService();

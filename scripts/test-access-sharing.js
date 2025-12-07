// Test script to verify access sharing functionality via API
console.log('🧪 Testing access sharing functionality via API...');

async function testAccessSharing() {
  try {
    console.log('🔍 Testing API connection...');
    
    // Test getting all registrations
    console.log('📋 Fetching all registrations...');
    const response = await fetch('http://localhost:3000/api/registrations');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const allRegs = await response.json();
    console.log(`✅ Found ${allRegs.length} registrations`);
    
    // Test updating a registration with shared emails
    if (allRegs.length > 0) {
      const testReg = allRegs[0];
      console.log(`📝 Testing with registration ID: ${testReg._id}`);
      
      // Add shared emails
      const sharedEmails = ['test@example.com', 'user@example.com'];
      console.log(`🔗 Adding shared emails: ${sharedEmails.join(', ')}`);
      
      // Update the registration via API
      console.log('💾 Saving updated registration via API...');
      const updateResponse = await fetch(`http://localhost:3000/api/registrations/${testReg._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sharedWithEmails: sharedEmails,
          updatedAt: new Date().toISOString(),
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error(`HTTP error! status: ${updateResponse.status}`);
      }
      
      console.log('✅ Registration updated successfully');
      
      // Verify the update
      console.log('🔍 Verifying update...');
      const verifyResponse = await fetch(`http://localhost:3000/api/registrations/${testReg._id}`);
      
      if (!verifyResponse.ok) {
        throw new Error(`HTTP error! status: ${verifyResponse.status}`);
      }
      
      const verifiedReg = await verifyResponse.json();
      console.log(`✅ Shared emails in database: ${JSON.stringify(verifiedReg.sharedWithEmails)}`);
    }
    
    console.log('🎉 Access sharing test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAccessSharing();
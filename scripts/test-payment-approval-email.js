const { sendPaymentApprovalEmail } = require('../lib/email-service');

async function testPaymentApprovalEmail() {
    try {
        console.log('🧪 Testing payment approval email...');

        const testData = {
            to: 'test@example.com', // Replace with a real email for testing
            name: 'John Doe',
            companyName: 'Test Company Ltd',
            packageName: 'Standard Package'
        };

        console.log('📧 Sending test email with data:', testData);

        const result = await sendPaymentApprovalEmail(testData);

        console.log('✅ Email sent successfully!');
        console.log('📋 Result:', result);

    } catch (error) {
        console.error('❌ Error testing payment approval email:', error);
    }
}

// Run the test
testPaymentApprovalEmail();

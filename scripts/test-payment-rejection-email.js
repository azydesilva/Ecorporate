const { sendPaymentRejectionEmail } = require('../lib/email-service');

async function testPaymentRejectionEmail() {
    try {
        console.log('🧪 Testing payment rejection email...');

        const testData = {
            to: 'test@example.com', // Replace with a real email for testing
            name: 'John Doe',
            companyName: 'Test Company Ltd',
            packageName: 'Standard Package',
            rejectionReason: 'Payment receipt is unclear or incomplete. Please provide a clear, legible copy of your payment receipt.'
        };

        console.log('📧 Sending test rejection email with data:', testData);

        const result = await sendPaymentRejectionEmail(testData);

        console.log('✅ Rejection email sent successfully!');
        console.log('📋 Result:', result);

    } catch (error) {
        console.error('❌ Error testing payment rejection email:', error);
    }
}

// Run the test
testPaymentRejectionEmail();

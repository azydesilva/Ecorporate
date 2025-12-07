import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentRejectionEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, name, companyName, packageName, rejectionReason } = body;

        // Use default test values if not provided
        const testData = {
            to: to || 'test@example.com',
            name: name || 'Test User',
            companyName: companyName || 'Test Company Ltd',
            packageName: packageName || 'Test Package',
            rejectionReason: rejectionReason || 'Test rejection reason - payment details require review.'
        };

        console.log('🧪 Testing payment rejection email with data:', testData);

        // Send the test email
        const result = await sendPaymentRejectionEmail(testData);

        return NextResponse.json({
            success: true,
            message: 'Test payment rejection email sent successfully',
            data: result,
            testData
        });

    } catch (error) {
        console.error('Error sending test payment rejection email:', error);
        return NextResponse.json(
            {
                error: 'Failed to send test payment rejection email',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

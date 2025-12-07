import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentApprovalEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, name, companyName, packageName } = body;

        // Use default test values if not provided
        const testData = {
            to: to || 'test@example.com',
            name: name || 'Test User',
            companyName: companyName || 'Test Company Ltd',
            packageName: packageName || 'Test Package'
        };

        console.log('🧪 Testing payment approval email with data:', testData);

        // Send the test email
        const result = await sendPaymentApprovalEmail(testData);

        return NextResponse.json({
            success: true,
            message: 'Test payment approval email sent successfully',
            data: result,
            testData
        });

    } catch (error) {
        console.error('Error sending test payment approval email:', error);
        return NextResponse.json(
            {
                error: 'Failed to send test payment approval email',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

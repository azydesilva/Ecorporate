import { NextRequest, NextResponse } from 'next/server';
import { checkAndUpdateExpiredRegistrations } from '@/scripts/cron-check-expired-registrations';

// POST - Check all registrations for expiry and update status
export async function POST(request: NextRequest) {
    try {
        // In a production environment, you might want to add authentication here
        // to ensure only authorized users can trigger this check
        
        console.log('🔍 Manual expiry check triggered via API');
        
        // Run the expiry check
        await checkAndUpdateExpiredRegistrations();
        
        return NextResponse.json({
            success: true,
            message: 'Expiry check completed successfully'
        });
    } catch (error) {
        console.error('❌ Error in POST /api/check-expiry:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
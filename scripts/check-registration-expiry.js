#!/usr/bin/env node

/**
 * Script to manually check for expired registrations and send notifications
 * This script can be run manually when needed, rather than using a cron job
 * 
 * Usage:
 *   node scripts/check-registration-expiry.js
 */

// Note: This script needs to be compatible with CommonJS since it's run directly with node

async function runExpiryCheck() {
    console.log('\n========================================');
    console.log('🔍 Starting manual registration expiry check');
    console.log('⏰ Time:', new Date().toISOString());
    console.log('========================================\n');

    try {
        // Dynamically import the utility function
        const { checkAllRegistrationsExpiryAndNotify } = await import('../lib/registration-expiry-utils.js');
        
        const result = await checkAllRegistrationsExpiryAndNotify();
        
        if (result.error) {
            console.error('❌ Error checking registrations:', result.error);
            if (result.details) {
                console.error('Details:', result.details);
            }
            process.exit(1);
        }
        
        console.log('\n========================================');
        console.log('📊 Summary:');
        console.log(`   Total registrations checked: ${result.totalChecked}`);
        console.log(`   Notifications sent: ${result.notificationsSent}`);
        console.log(`   Errors: ${result.errors}`);
        console.log('========================================\n');
        
        console.log('✅ Expiry check completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the check if this file is executed directly
if (require.main === module) {
    runExpiryCheck();
}

module.exports = { runExpiryCheck };
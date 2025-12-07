/**
 * Script to verify that the email verification system is properly set up
 */

const fs = require('fs');
const path = require('path');

// Check if required files exist
const requiredFiles = [
    'lib/resend-config.ts',
    'lib/email-service.ts',
    'app/api/auth/verify-email/route.ts',
    'scripts/migrate-email-verification.js'
];

console.log('🔍 Verifying Email Verification System Setup...\n');

let allFilesExist = true;

requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file} - FOUND`);
    } else {
        console.log(`❌ ${file} - NOT FOUND`);
        allFilesExist = false;
    }
});

// Check if environment variables are set
console.log('\n🔍 Checking Environment Variables...');
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    if (envContent.includes('RESEND_API_KEY')) {
        console.log('✅ RESEND_API_KEY found in .env.local');
    } else {
        console.log('⚠️  RESEND_API_KEY not found in .env.local');
    }

    if (envContent.includes('RESEND_FROM_EMAIL')) {
        console.log('✅ RESEND_FROM_EMAIL found in .env.local');
    } else {
        console.log('⚠️  RESEND_FROM_EMAIL not found in .env.local');
    }
} else {
    console.log('❌ .env.local file not found');
}

// Check if package.json has resend dependency
console.log('\n🔍 Checking Package Dependencies...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.dependencies && packageJson.dependencies.resend) {
        console.log('✅ Resend dependency found in package.json');
    } else {
        console.log('❌ Resend dependency not found in package.json');
    }

    if (packageJson.dependencies && packageJson.dependencies.uuid) {
        console.log('✅ UUID dependency found in package.json');
    } else {
        console.log('❌ UUID dependency not found in package.json');
    }
} else {
    console.log('❌ package.json file not found');
}

// Check if migration script is in package.json
console.log('\n🔍 Checking Package Scripts...');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.scripts && packageJson.scripts['migrate-email-verification']) {
        console.log('✅ migrate-email-verification script found in package.json');
    } else {
        console.log('❌ migrate-email-verification script not found in package.json');
    }
} else {
    console.log('❌ package.json file not found');
}

console.log('\n📋 Summary:');
if (allFilesExist) {
    console.log('✅ All required files are present');
} else {
    console.log('❌ Some required files are missing');
}

console.log('\n📝 Next Steps:');
console.log('1. Make sure to add your actual RESEND_API_KEY to .env.local');
console.log('2. Run the migration script: npm run migrate-email-verification');
console.log('3. Test the registration flow to verify emails are sent');
console.log('4. Check that unverified users cannot log in');
const fs = require('fs');
const path = require('path');

// This script helps migrate existing localStorage file data to the new file storage system
// Run this script after implementing the new file storage system

console.log('🚀 Starting file storage migration...');

// Function to read localStorage data from a JSON file
function readLocalStorageData(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('Error reading localStorage data:', error);
        return null;
    }
}

// Function to save migrated data
function saveMigratedData(data, filePath) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Migrated data saved to ${filePath}`);
    } catch (error) {
        console.error('Error saving migrated data:', error);
    }
}

// Function to create backup of original data
function createBackup(originalData, backupPath) {
    try {
        fs.writeFileSync(backupPath, JSON.stringify(originalData, null, 2));
        console.log(`✅ Backup created at ${backupPath}`);
    } catch (error) {
        console.error('Error creating backup:', error);
    }
}

// Main migration function
async function migrateFileStorage() {
    const localStoragePath = path.join(__dirname, '..', 'localStorage-backup.json');
    const backupPath = path.join(__dirname, '..', 'localStorage-backup-original.json');
    const migratedPath = path.join(__dirname, '..', 'localStorage-migrated.json');

    console.log('📁 Reading localStorage data...');
    const localStorageData = readLocalStorageData(localStoragePath);

    if (!localStorageData) {
        console.log('❌ No localStorage data found. Please export your localStorage data first.');
        console.log('💡 You can export localStorage data by running this in your browser console:');
        console.log('   localStorage.getItem("registrations")');
        console.log('   localStorage.getItem("settings")');
        console.log('   localStorage.getItem("packages")');
        console.log('   localStorage.getItem("bankDetails")');
        console.log('   localStorage.getItem("registeredUsers")');
        return;
    }

    // Create backup
    createBackup(localStorageData, backupPath);

    console.log('🔄 Starting migration process...');

    // Import the migration utilities
    const { FileStorageMigration } = require('../lib/migrate-file-storage.ts');

    try {
        // Migrate files
        const migrationResult = await FileStorageMigration.migrateLocalStorageFiles(
            localStorageData,
            'migration-script'
        );

        if (migrationResult.success) {
            console.log(`✅ Successfully migrated ${migrationResult.migratedFiles} files`);

            if (migrationResult.errors.length > 0) {
                console.log('⚠️  Some files failed to migrate:');
                migrationResult.errors.forEach(error => console.log(`   - ${error}`));
            }

            // Update localStorage data with new file references
            const updatedData = await FileStorageMigration.updateLocalStorageWithNewFileData(
                localStorageData,
                migrationResult.newFileData
            );

            // Save migrated data
            saveMigratedData(updatedData, migratedPath);

            console.log('🎉 Migration completed successfully!');
            console.log('📋 Next steps:');
            console.log('   1. Review the migrated data in localStorage-migrated.json');
            console.log('   2. Replace your localStorage data with the migrated data');
            console.log('   3. Update your components to use the new file storage system');
            console.log('   4. Test the application to ensure everything works correctly');

        } else {
            console.log('❌ Migration failed:', migrationResult.errors);
        }

    } catch (error) {
        console.error('❌ Migration error:', error);
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateFileStorage().catch(console.error);
}

module.exports = { migrateFileStorage }; 
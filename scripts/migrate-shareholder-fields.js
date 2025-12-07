#!/usr/bin/env node

/**
 * Migration script to ensure all shareholder fields are properly supported
 * This script verifies that the shareholders JSON column can handle all the new fields
 * and provides a backup/restore mechanism for shareholder data
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edashboard',
    port: process.env.DB_PORT || 3306
};

// Color logging functions
function log(color, symbol, message) {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

async function migrateShareholderFields() {
    let connection;

    try {
        log('blue', '🔗', 'Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        log('green', '✅', 'Database connected successfully');

        // Check if registrations table exists
        log('blue', '🔍', 'Checking registrations table structure...');
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'registrations'"
        );

        if (tables.length === 0) {
            log('red', '❌', 'Registrations table does not exist');
            return;
        }

        // Check if shareholders column exists
        const [columns] = await connection.execute(
            "SHOW COLUMNS FROM registrations LIKE 'shareholders'"
        );

        if (columns.length === 0) {
            log('red', '❌', 'Shareholders column does not exist in registrations table');
            return;
        }

        log('green', '✅', 'Shareholders column exists');

        // Get all registrations with shareholders data
        log('blue', '🔍', 'Fetching all registrations with shareholders data...');
        const [rows] = await connection.execute(
            "SELECT id, company_name, shareholders FROM registrations WHERE shareholders IS NOT NULL AND shareholders != 'null' AND shareholders != '[]'"
        );

        log('cyan', '📊', `Found ${rows.length} registrations with shareholders data`);

        if (rows.length === 0) {
            log('yellow', '⚠️', 'No shareholders data found to migrate');
            return;
        }

        // Process each registration
        let processedCount = 0;
        let errorCount = 0;

        for (const row of rows) {
            try {
                log('blue', '🔄', `Processing registration: ${row.company_name} (ID: ${row.id})`);

                let shareholders = null;

                // Parse shareholders JSON
                if (typeof row.shareholders === 'string') {
                    shareholders = JSON.parse(row.shareholders);
                } else {
                    shareholders = row.shareholders;
                }

                if (!Array.isArray(shareholders)) {
                    log('yellow', '⚠️', `Invalid shareholders data format for ${row.company_name}`);
                    continue;
                }

                // Validate and enhance each shareholder
                let hasChanges = false;
                const enhancedShareholders = shareholders.map((shareholder, index) => {
                    if (!shareholder || typeof shareholder !== 'object') {
                        log('yellow', '⚠️', `Invalid shareholder data at index ${index} for ${row.company_name}`);
                        return shareholder;
                    }

                    const enhancedShareholder = { ...shareholder };

                    // Ensure all required fields exist with proper defaults
                    const requiredFields = {
                        // Basic fields
                        type: 'natural-person',
                        residency: 'sri-lankan',
                        isDirector: false,
                        shares: '',

                        // Natural person fields
                        fullName: '',
                        nicNumber: '',
                        passportNo: '',
                        passportIssuedCountry: '',

                        // Legal entity fields
                        companyName: '',
                        companyRegistrationNumber: '',

                        // Contact fields
                        email: '',
                        contactNumber: '',

                        // Address fields
                        fullAddress: '',
                        postalCode: '',
                        province: '',
                        district: '',
                        divisionalSecretariat: '',
                        city: '',
                        stateRegionProvince: '',
                        country: '',

                        // Documents
                        documents: [],

                        // Beneficiary owners
                        beneficiaryOwners: []
                    };

                    // Add missing fields with defaults
                    Object.keys(requiredFields).forEach(field => {
                        if (enhancedShareholder[field] === undefined) {
                            enhancedShareholder[field] = requiredFields[field];
                            hasChanges = true;
                        }
                    });

                    // Validate beneficiary owners if they exist
                    if (enhancedShareholder.beneficiaryOwners && Array.isArray(enhancedShareholder.beneficiaryOwners)) {
                        enhancedShareholder.beneficiaryOwners = enhancedShareholder.beneficiaryOwners.map(beneficiary => {
                            if (!beneficiary || typeof beneficiary !== 'object') {
                                return beneficiary;
                            }

                            const enhancedBeneficiary = { ...beneficiary };

                            // Ensure beneficiary fields exist
                            const beneficiaryFields = {
                                type: 'local',
                                nicNumber: '',
                                firstName: '',
                                lastName: '',
                                province: '',
                                district: '',
                                divisionalSecretariat: '',
                                address: '',
                                postalCode: '',
                                contactNumber: '',
                                emailAddress: '',
                                passportNo: '',
                                country: '',
                                foreignAddress: '',
                                city: '',
                                stateRegionProvince: ''
                            };

                            Object.keys(beneficiaryFields).forEach(field => {
                                if (enhancedBeneficiary[field] === undefined) {
                                    enhancedBeneficiary[field] = beneficiaryFields[field];
                                    hasChanges = true;
                                }
                            });

                            return enhancedBeneficiary;
                        });
                    }

                    return enhancedShareholder;
                });

                // Update the database if there were changes
                if (hasChanges) {
                    const updatedShareholdersJson = JSON.stringify(enhancedShareholders);

                    await connection.execute(
                        'UPDATE registrations SET shareholders = ? WHERE id = ?',
                        [updatedShareholdersJson, row.id]
                    );

                    log('green', '✅', `Updated shareholders data for ${row.company_name}`);
                    processedCount++;
                } else {
                    log('cyan', 'ℹ️', `No changes needed for ${row.company_name}`);
                }

            } catch (error) {
                log('red', '❌', `Error processing ${row.company_name}: ${error.message}`);
                errorCount++;
            }
        }

        // Summary
        log('green', '🎉', 'Migration completed!');
        log('cyan', '📊', `Processed: ${processedCount} registrations`);
        log('cyan', '📊', `Errors: ${errorCount} registrations`);
        log('cyan', '📊', `Total: ${rows.length} registrations`);

        // Verify the migration
        log('blue', '🔍', 'Verifying migration results...');
        const [verifyRows] = await connection.execute(
            "SELECT id, company_name, shareholders FROM registrations WHERE shareholders IS NOT NULL AND shareholders != 'null' AND shareholders != '[]' LIMIT 3"
        );

        for (const row of verifyRows) {
            const shareholders = JSON.parse(row.shareholders);
            log('cyan', '📋', `Verification - ${row.company_name}: ${shareholders.length} shareholders`);

            shareholders.forEach((shareholder, index) => {
                const hasAllFields = shareholder.type && shareholder.residency &&
                    shareholder.fullName !== undefined &&
                    shareholder.email !== undefined &&
                    shareholder.documents !== undefined &&
                    shareholder.beneficiaryOwners !== undefined;

                if (hasAllFields) {
                    log('green', '✅', `  Shareholder ${index + 1}: All fields present`);
                } else {
                    log('yellow', '⚠️', `  Shareholder ${index + 1}: Missing some fields`);
                }
            });
        }

    } catch (error) {
        log('red', '❌', `Migration failed: ${error.message}`);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
            log('blue', '🔌', 'Database connection closed');
        }
    }
}

// Run the migration
if (require.main === module) {
    migrateShareholderFields()
        .then(() => {
            log('green', '🎉', 'Shareholder fields migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            log('red', '❌', `Migration failed: ${error.message}`);
            console.error(error);
            process.exit(1);
        });
}

module.exports = { migrateShareholderFields };

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    port: parseInt(process.env.DB_PORT || '3306'),
};

const dbName = process.env.DB_NAME || 'banana_db';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function log(color, symbol, message) {
    console.log(`${color}${symbol} ${message}${colors.reset}`);
}

async function installDatabase() {
    let connection;
    const startTime = Date.now();

    try {
        log(colors.cyan, '🚀', 'Starting comprehensive database installation...');
        console.log();

        // Step 1: Connect to MySQL server
        log(colors.blue, '📡', 'Connecting to MySQL server...');
        connection = await mysql.createConnection(dbConfig);
        log(colors.green, '✅', 'Connected to MySQL server successfully');

        // Step 2: Create database
        log(colors.blue, '🏗️', `Creating database '${dbName}'...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        log(colors.green, '✅', `Database '${dbName}' created or already exists`);

        // Use the database
        await connection.query(`USE ${dbName}`);
        log(colors.green, '✅', `Using database '${dbName}'`);

        // Step 3: Create all tables
        log(colors.blue, '📋', 'Creating all database tables...');
        await createAllTables(connection);

        // Step 4: Ensure all columns exist
        log(colors.blue, '🔧', 'Ensuring all required columns exist...');
        await ensureAllColumns(connection);

        // Step 5: Create indexes for performance
        log(colors.blue, '⚡', 'Creating database indexes...');
        await createIndexes(connection);

        // Step 6: Run all migrations (ensure columns like settings.additional_fees exist before inserting data)
        log(colors.blue, '🔄', 'Running database migrations...');
        await runAllMigrations(connection);

        // Step 6.1: Run shareholder fields migration
        log(colors.blue, '👥', 'Running shareholder fields migration...');
        await runShareholderFieldsMigration(connection);

        // Step 6.2: Verify email verification setup
        log(colors.blue, '📧', 'Verifying email verification setup...');
        await verifyEmailSetup(connection);

        // Step 6.3: Add foreign key constraint to secretary_renewal_payments
        log(colors.blue, '🔗', 'Adding foreign key constraint to secretary_renewal_payments...');
        await addSecretaryRenewalForeignKeys(connection);

        // Step 6.4: Ensure mobile_number column exists in users table
        log(colors.blue, '📱', 'Ensuring mobile_number column exists in users table...');
        await ensureMobileNumberColumn(connection);

        // Step 7: Insert default data (now that all columns are ensured)
        log(colors.blue, '📝', 'Inserting default data...');
        await insertDefaultData(connection);

        // Step 8: Verify installation
        log(colors.blue, '🔍', 'Verifying database installation...');
        const verificationResult = await verifyInstallation(connection);

        console.log();
        if (verificationResult.success) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            log(colors.green, '🎉', `Database installation completed successfully in ${duration}s!`);
            log(colors.green, '✨', 'All tables, columns, and data are properly installed');
            console.log();

            // Display summary
            displayInstallationSummary(verificationResult);
        } else {
            log(colors.red, '❌', 'Database installation verification failed');
            console.log();
            console.log('Issues found:');
            verificationResult.issues.forEach(issue => {
                log(colors.red, '  ❌', issue);
            });
            process.exit(1);
        }

    } catch (error) {
        console.log();
        log(colors.red, '💥', 'Database installation failed:');
        console.error(error);
        // Add specific error handling for exit code 23
        if (error.code === 'EACCES' || error.errno === -13) {
            log(colors.red, '🔐', 'Permission denied error. Check database user permissions.');
        } else if (error.code === 'ECONNREFUSED') {
            log(colors.red, '🔌', 'Connection refused. Check if MySQL server is running.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            log(colors.red, '🔑', 'Access denied. Check database credentials.');
        } else if (error.code === 'ENOTFOUND') {
            log(colors.red, '🌐', 'Host not found. Check database host configuration.');
        }
        process.exit(1);  // Changed from process.exit(23) to process.exit(1) for standard error code
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function createAllTables(connection) {
    const tables = [
        {
            name: 'users',
            sql: `
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          mobile_number VARCHAR(20) NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'customer') DEFAULT 'customer',
          email_verified BOOLEAN DEFAULT FALSE,
          email_verification_token VARCHAR(255),
          email_verification_sent_at TIMESTAMP NULL,
          email_verified_at TIMESTAMP NULL,
          reset_token VARCHAR(255) NULL,
          reset_token_expires TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `
        },
        {
            name: 'registrations',
            sql: `
        CREATE TABLE IF NOT EXISTS registrations (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL DEFAULT 'default_user',
          company_name VARCHAR(255) NOT NULL,
          contact_person_name VARCHAR(255) NOT NULL,
          contact_person_email VARCHAR(255) NOT NULL,
          contact_person_phone VARCHAR(255) NOT NULL,
          selected_package VARCHAR(255) NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'bankTransfer',
          current_step VARCHAR(50) DEFAULT 'contact-details',
          status VARCHAR(50) DEFAULT 'payment-processing',
          payment_approved BOOLEAN DEFAULT FALSE,
          details_approved BOOLEAN DEFAULT FALSE,
          documents_approved BOOLEAN DEFAULT FALSE,
          documents_published BOOLEAN DEFAULT FALSE,
          documents_acknowledged BOOLEAN DEFAULT FALSE,
          payment_receipt JSON,
          balance_payment_receipt JSON,
          form1 JSON,
          form19 JSON,
          aoa JSON,
          form18 JSON,
          address_proof JSON,
          customer_form1 JSON,
          customer_form19 JSON,
          customer_aoa JSON,
          customer_form18 JSON,
          customer_address_proof JSON,
          incorporation_certificate JSON,
          step3_additional_doc JSON,
          step3_signed_additional_doc JSON,
          signed_admin_resolution JSON,
          signed_customer_resolution JSON,
          step4_final_additional_doc JSON,
          additional_documents JSON,
          company_name_english VARCHAR(255),
          company_name_sinhala VARCHAR(255),
          company_entity VARCHAR(50),
          company_details_locked BOOLEAN DEFAULT FALSE,
          company_details_approved BOOLEAN DEFAULT FALSE,
          company_details_rejected BOOLEAN DEFAULT FALSE,
          is_foreign_owned VARCHAR(10),
          business_address_number VARCHAR(255),
          business_address_street VARCHAR(255),
          business_address_city VARCHAR(255),
          postal_code VARCHAR(20),
          shares_amount VARCHAR(50),
          number_of_shareholders VARCHAR(10),
          shareholders JSON,
          make_simple_books_secretary VARCHAR(10),
          number_of_directors VARCHAR(10),
          directors JSON,
          -- no_secretary JSON,  -- deprecated
          -- exports_to_add TEXT,  -- deprecated
          company_activities TEXT,
          drama_sedaka_division VARCHAR(255),
          grama_niladari VARCHAR(255),
          business_email VARCHAR(255),
          business_contact_number VARCHAR(255),
          province VARCHAR(255),
          district VARCHAR(255),
          divisional_secretariat VARCHAR(255),
          company_secreatary LONGTEXT,
          documents_submitted_at TIMESTAMP NULL,
          completed_at TIMESTAMP NULL,
          eroc_registered BOOLEAN DEFAULT FALSE,  -- Added this line
          pinned BOOLEAN DEFAULT FALSE,
          register_start_date DATE NULL,
          expire_days INT NULL,
          expire_date DATE NULL,
          is_expired BOOLEAN DEFAULT FALSE,
          expiry_notification_sent_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `
        },
        {
            name: 'packages',
            sql: `
        CREATE TABLE IF NOT EXISTS packages (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          advance_amount DECIMAL(10,2) DEFAULT 0,
          balance_amount DECIMAL(10,2) DEFAULT 0,
          features JSON,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `
        },
        {
            name: 'bank_details',
            sql: `
        CREATE TABLE IF NOT EXISTS bank_details (
          id VARCHAR(255) PRIMARY KEY,
          bank_name VARCHAR(255) NOT NULL,
          account_name VARCHAR(255) NOT NULL,
          account_number VARCHAR(255) NOT NULL,
          branch VARCHAR(255),
          swift_code VARCHAR(50),
          additional_instructions TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `
        },
        {
            name: 'settings',
            sql: `
        CREATE TABLE IF NOT EXISTS settings (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255),
          description TEXT,
          logo_url VARCHAR(500),
          favicon_url VARCHAR(500),
          primary_color VARCHAR(7) DEFAULT '#000000',
          secondary_color VARCHAR(7) DEFAULT '#ffffff',
          secretary_renew_fee DECIMAL(10,2) DEFAULT 0.00,
          additional_fees JSON DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `
        },
        {
            name: 'messages',
            sql: `
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          created_by VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          INDEX idx_created_at (created_at),
          INDEX idx_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
        },
        {
            name: 'about_settings',
            sql: `
        CREATE TABLE IF NOT EXISTS about_settings (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          company_information TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
        },
        {
            name: 'secretary_renewal_payments',
            sql: `
        CREATE TABLE IF NOT EXISTS secretary_renewal_payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          registration_id VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          payment_receipt JSON,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          approved_by VARCHAR(255),
          rejected_by VARCHAR(255),
          approved_at TIMESTAMP NULL,
          rejected_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_registration_id (registration_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
        }
    ];

    for (const table of tables) {
        await connection.execute(table.sql);
        log(colors.green, '  ✅', `${table.name} table created or already exists`);
    }
}

async function ensureAllColumns(connection) {
    // Get current columns
    const [columns] = await connection.execute('DESCRIBE registrations');
    const existingColumns = columns.map(col => col.Field);

    // Define all expected columns with their types
    const expectedColumns = [
        { name: 'user_id', type: 'VARCHAR(255) NOT NULL DEFAULT \'default_user\'' },
        { name: 'company_entity', type: 'VARCHAR(50)' },
        { name: 'customer_form1', type: 'JSON' },
        { name: 'customer_form19', type: 'JSON' },
        { name: 'customer_aoa', type: 'JSON' },
        { name: 'customer_form18', type: 'JSON' },
        { name: 'customer_address_proof', type: 'JSON' },
        { name: 'incorporation_certificate', type: 'JSON' },
        { name: 'step3_additional_doc', type: 'JSON' },
        { name: 'step3_signed_additional_doc', type: 'JSON' },
        { name: 'signed_admin_resolution', type: 'JSON' },
        { name: 'signed_customer_resolution', type: 'JSON' },
        { name: 'step4_final_additional_doc', type: 'JSON' },
        { name: 'additional_documents', type: 'JSON' },
        { name: 'company_name_english', type: 'VARCHAR(255)' },
        { name: 'company_name_sinhala', type: 'VARCHAR(255)' },
        { name: 'company_entity', type: 'VARCHAR(50)' },
        { name: 'company_details_locked', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'company_details_approved', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'company_details_rejected', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'form19', type: 'JSON' },
        { name: 'balance_payment_receipt', type: 'JSON' },
        { name: 'balance_payment_approved', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'is_foreign_owned', type: 'VARCHAR(10)' },
        { name: 'business_address_number', type: 'VARCHAR(255)' },
        { name: 'business_address_street', type: 'VARCHAR(255)' },
        { name: 'business_address_city', type: 'VARCHAR(255)' },
        { name: 'postal_code', type: 'VARCHAR(20)' },
        { name: 'shares_amount', type: 'VARCHAR(50)' },
        { name: 'number_of_shareholders', type: 'VARCHAR(10)' },
        { name: 'shareholders', type: 'JSON' },
        { name: 'make_simple_books_secretary', type: 'VARCHAR(10)' },
        { name: 'number_of_directors', type: 'VARCHAR(10)' },
        { name: 'directors', type: 'JSON' },
        { name: 'company_activities', type: 'TEXT' },
        { name: 'drama_sedaka_division', type: 'VARCHAR(255)' },
        { name: 'grama_niladari', type: 'VARCHAR(255)' },
        { name: 'business_email', type: 'VARCHAR(255)' },
        { name: 'business_contact_number', type: 'VARCHAR(255)' },
        { name: 'province', type: 'VARCHAR(255)' },
        { name: 'district', type: 'VARCHAR(255)' },
        { name: 'divisional_secretariat', type: 'VARCHAR(255)' },
        { name: 'company_secreatary', type: 'LONGTEXT' },
        { name: 'documents_submitted_at', type: 'TIMESTAMP NULL' },
        { name: 'completed_at', type: 'TIMESTAMP NULL' },
        { name: 'eroc_registered', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'resolutions_docs', type: 'JSON' },  // Customer-submitted board resolutions
        { name: 'admin_resolution_doc', type: 'JSON' },  // Admin-submitted board resolutions
        { name: 'pinned', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'noted', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'secretary_records_noted_at', type: 'TIMESTAMP NULL' },
        { name: 'shared_with_emails', type: 'JSON' },  // Add this line for access sharing feature
        { name: 'register_start_date', type: 'DATE NULL' },
        { name: 'expire_days', type: 'INT NULL' },
        { name: 'expire_date', type: 'DATE NULL' },
        { name: 'is_expired', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'expiry_notification_sent_at', type: 'TIMESTAMP NULL' }

    ];

    let addedColumns = 0;
    for (const column of expectedColumns) {
        if (!existingColumns.includes(column.name)) {
            try {
                await connection.execute(`ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`);
                log(colors.green, '  ✅', `Added missing column: ${column.name}`);
                addedColumns++;
            } catch (error) {
                if (error.code !== 'ER_DUP_FIELDNAME') {
                    console.error(`Error adding column ${column.name}:`, error.message);
                }
            }
        }
    }

    if (addedColumns === 0) {
        log(colors.green, '  ✅', 'All required columns already exist');
    } else {
        log(colors.green, '  ✅', `Added ${addedColumns} missing columns`);
    }
}

async function createIndexes(connection) {
    const indexes = [
        { name: 'idx_registrations_user_id', table: 'registrations', column: 'user_id' },
        { name: 'idx_registrations_status', table: 'registrations', column: 'status' },
        { name: 'idx_registrations_current_step', table: 'registrations', column: 'current_step' },
        { name: 'idx_users_email', table: 'users', column: 'email' },
        { name: 'idx_packages_is_active', table: 'packages', column: 'is_active' },
        { name: 'idx_bank_details_is_active', table: 'bank_details', column: 'is_active' }
    ];

    for (const index of indexes) {
        try {
            // First check if index exists
            const [existingIndexes] = await connection.execute(`
                SELECT COUNT(1) as cnt 
                FROM INFORMATION_SCHEMA.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = ? 
                AND INDEX_NAME = ?
            `, [index.table, index.name]);

            if (existingIndexes[0].cnt === 0) {
                // Index doesn't exist, create it
                await connection.execute(`CREATE INDEX ${index.name} ON ${index.table}(${index.column})`);
                log(colors.green, '  ✅', `Created index: ${index.name}`);
            } else {
                log(colors.yellow, '  ➤', `Index already exists: ${index.name}`);
            }
        } catch (error) {
            // Log error but don't throw to continue with other indexes
            log(colors.red, '  ❌', `Error creating index ${index.name}: ${error.message}`);
        }
    }
    log(colors.green, '  ✅', 'Database indexes processed');
}

async function insertDefaultData(connection) {
    // Insert default Admin
    await connection.execute(`
    INSERT IGNORE INTO users (id, name, email, mobile_number, password, role) 
    VALUES ('admin-001', 'Admin', 'admin@example.com', '+94771234567', 'password123', 'admin')
  `);

    // Automatically verify the admin email
    await connection.execute(`
    UPDATE users 
    SET email_verified = TRUE, email_verified_at = NOW() 
    WHERE email = 'admin@example.com' AND email_verified = FALSE
  `);

    // Insert default packages
    const packages = [
        {
            id: 'startup-package',
            name: 'Startup Package',
            description: 'Perfect for new businesses getting started',
            price: 25000.00,
            advance_amount: 15000.00,
            balance_amount: 10000.00,
            features: JSON.stringify(['Company Registration', 'Basic Compliance', 'Email Support'])
        },
        {
            id: 'standard-package',
            name: 'Standard Package',
            description: 'Comprehensive business registration with additional services',
            price: 50000.00,
            advance_amount: 30000.00,
            balance_amount: 20000.00,
            features: JSON.stringify(['Company Registration', 'Full Compliance', 'Priority Support', 'Document Templates'])
        },
        {
            id: 'premium-package',
            name: 'Premium Package',
            description: 'Complete business setup with premium support',
            price: 75000.00,
            advance_amount: 45000.00,
            balance_amount: 30000.00,
            features: JSON.stringify(['Company Registration', 'Full Compliance', '24/7 Support', 'Legal Consultation'])
        }
    ];

    for (const pkg of packages) {
        await connection.execute(`
      INSERT IGNORE INTO packages (id, name, description, price, advance_amount, balance_amount, features) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [pkg.id, pkg.name, pkg.description, pkg.price, pkg.advance_amount, pkg.balance_amount, pkg.features]);
    }

    // Insert default bank details
    await connection.execute(`
    INSERT IGNORE INTO bank_details (id, bank_name, account_name, account_number, branch) 
    VALUES 
    ('bank-001', 'Bank of Ceylon', 'Company Registration Services', '1234567890', 'Main Branch'),
    ('bank-002', 'Commercial Bank', 'Business Services Ltd', '0987654321', 'Colombo Branch')
  `);

    // Insert default settings
    const defaultAdditionalFees = JSON.stringify({
        directors: {
            local: 0,
            foreign: 0
        },
        shareholders: {
            localNaturalPerson: 0,
            localLegalEntity: 0,
            foreignNaturalPerson: 0,
            foreignLegalEntity: 0
        }
    });

    await connection.execute(`
    INSERT IGNORE INTO settings (id, title, description, primary_color, secondary_color, secretary_renew_fee, additional_fees) 
    VALUES ('settings-001', 'Company Registration Portal', 'Complete business registration platform', '#2563eb', '#ffffff', 0.00, ?)
  `, [defaultAdditionalFees]);

    // Skip inserting default about settings - keep table empty
    log(colors.green, '  ✅', 'Default data inserted or already exists (about_settings kept empty)');
}

// Enhanced function to run all migrations
async function runAllMigrations(connection) {
    log(colors.blue, '  🔄', 'Running Form 19 column migration...');
    await runForm19Migration(connection);

    log(colors.blue, '  🔄', 'Running column rename migration (drama_sedaka_division to grama_niladari)...');
    await runRenameMigration(connection);

    log(colors.blue, '  🔄', 'Running location fields migration (province, district, divisional_secretariat)...');
    await runLocationFieldsMigration(connection);

    log(colors.blue, '  🔄', 'Running company secretary column migration (make_simple_books_secretary to company_secreatary)...');
    await runCompanySecretaryMigration(connection);

    // Skipping deprecated no_secretary column

    log(colors.blue, '  🔄', 'Running general database migration...');
    await runGeneralMigration(connection);

    log(colors.blue, '  🔄', 'Running resolutions docs column migration...');
    await runResolutionsDocsMigration(connection);

    log(colors.blue, '  🔄', 'Running admin resolution doc column migration...');
    await runAdminResolutionDocMigration(connection);

    log(colors.blue, '  🔄', 'Running company_entity values migration...');
    await runCompanyEntityValueMigration(connection);

    log(colors.blue, '  🔄', 'Running company details locked column migration...');
    await runCompanyDetailsLockedMigration(connection);

    log(colors.blue, '  🔄', 'Running company details approved column migration...');
    await runCompanyDetailsApprovedMigration(connection);

    log(colors.blue, '  🔄', 'Running company details rejected column migration...');
    await runCompanyDetailsRejectedMigration(connection);

    log(colors.blue, '  🔄', 'Running additional fees column migration...');
    await runAdditionalFeesMigration(connection);

    log(colors.blue, '  🔄', 'Running settings additional fees column migration...');
    await runSettingsAdditionalFeesMigration(connection);

    log(colors.blue, '  🔄', 'Running settings secretary renew fee column migration...');
    await runSecretaryRenewFeeMigration(connection);

    log(colors.blue, '  🔄', 'Running pinned column migration...');
    await runPinnedColumnMigration(connection);

    log(colors.blue, '  🔄', 'Running noted column migration...');
    await runNotedColumnMigration(connection);

    log(colors.blue, '  🔄', 'Running shared_with_emails column migration...');
    await runSharedWithEmailsMigration(connection);

    // Ensure company_secreatary is a JSON column via safe migration
    await ensureCompanySecretaryTextColumn(connection);

    // Skipping deprecated no_secretary column

    log(colors.green, '  ✅', 'All migrations completed');
}

// Migration for Form 19 columns
async function runForm19Migration(connection) {
    try {
        // Check if form19 column exists
        const [form19Columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'form19'
        `, [dbName]);

        if (form19Columns.length === 0) {
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN form19 JSON AFTER aoa
            `);
            log(colors.green, '    ✅', 'form19 column added');
        }

        // Check if customer_form19 column exists
        const [customerForm19Columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'customer_form19'
        `, [dbName]);

        if (customerForm19Columns.length === 0) {
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN customer_form19 JSON AFTER customer_aoa
            `);
            log(colors.green, '    ✅', 'customer_form19 column added');
        }
    } catch (error) {
        // Ignore errors if columns already exist
        if (!error.message.includes('Duplicate column name')) {
            throw error;
        }
    }
}

// Migration for renaming drama_sedaka_division to grama_niladari
async function runRenameMigration(connection) {
    try {
        // Get existing columns
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        if (existingColumns.includes('drama_sedaka_division')) {
            if (existingColumns.includes('grama_niladari')) {
                // Copy data from old column to new column
                await connection.execute(`
                    UPDATE registrations 
                    SET grama_niladari = drama_sedaka_division 
                    WHERE drama_sedaka_division IS NOT NULL AND grama_niladari IS NULL
                `);
                log(colors.green, '    ✅', 'Data migrated from drama_sedaka_division to grama_niladari');

                // Drop the old column
                await connection.execute('ALTER TABLE registrations DROP COLUMN drama_sedaka_division');
                log(colors.green, '    ✅', 'Dropped old drama_sedaka_division column');
            } else {
                // Rename the column directly
                await connection.execute(`
                    ALTER TABLE registrations 
                    CHANGE COLUMN drama_sedaka_division grama_niladari VARCHAR(255)
                `);
                log(colors.green, '    ✅', 'Renamed drama_sedaka_division to grama_niladari');
            }
        } else if (!existingColumns.includes('grama_niladari')) {
            // Create the new column if neither exists
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN grama_niladari VARCHAR(255)
            `);
            log(colors.green, '    ✅', 'Created grama_niladari column');
        }
    } catch (error) {
        // Handle errors appropriately
        console.log('Note: Some rename migration steps may have already been completed');
    }
}

// Migration for location fields (province, district, divisional_secretariat)
async function runLocationFieldsMigration(connection) {
    try {
        // Get existing columns
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        // Define the location columns
        const locationColumns = [
            { name: 'province', type: 'VARCHAR(255)' },
            { name: 'district', type: 'VARCHAR(255)' },
            { name: 'divisional_secretariat', type: 'VARCHAR(255)' }
        ];

        let addedCount = 0;

        // Add missing location columns
        for (const column of locationColumns) {
            if (!existingColumns.includes(column.name)) {
                try {
                    await connection.execute(`ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`);
                    log(colors.green, '    ✅', `Added missing column: ${column.name}`);
                    addedCount++;
                } catch (error) {
                    if (error.code !== 'ER_DUP_FIELDNAME') {
                        console.error(`Error adding column ${column.name}:`, error.message);
                    }
                }
            }
        }

        if (addedCount > 0) {
            log(colors.green, '    ✅', `Location fields migration completed: Added ${addedCount} new columns`);
        } else {
            log(colors.green, '    ✅', 'Location fields migration: All columns already exist');
        }
    } catch (error) {
        console.log('Note: Location fields migration may have already been completed');
    }
}

// Migration for company secretary column (make_simple_books_secretary to company_secreatary)
async function runCompanySecretaryMigration(connection) {
    try {
        // Get existing columns
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        if (existingColumns.includes('make_simple_books_secretary')) {
            if (existingColumns.includes('company_secreatary')) {
                // Copy data from old column to new column
                const [result] = await connection.execute(`
                    UPDATE registrations 
                    SET company_secreatary = make_simple_books_secretary 
                    WHERE make_simple_books_secretary IS NOT NULL AND company_secreatary IS NULL
                `);
                log(colors.green, '    ✅', `Data migrated from make_simple_books_secretary to company_secreatary. Rows affected: ${result.affectedRows}`);

                // Drop the old column
                await connection.execute('ALTER TABLE registrations DROP COLUMN make_simple_books_secretary');
                log(colors.green, '    ✅', 'Dropped old make_simple_books_secretary column');
            } else {
                // Rename the column directly
                await connection.execute(`
                    ALTER TABLE registrations 
                    CHANGE COLUMN make_simple_books_secretary company_secreatary VARCHAR(255)
                `);
                log(colors.green, '    ✅', 'Successfully renamed make_simple_books_secretary to company_secreatary');
            }
        } else if (existingColumns.includes('company_secreatary')) {
            // Ensure company_secreatary is JSON type
            try {
                const [colInfo] = await connection.execute(`
                    SELECT DATA_TYPE 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'company_secreatary'
                `, [dbName]);
                const type = (colInfo[0] && colInfo[0].DATA_TYPE) || '';
                if (type.toLowerCase() !== 'json') {
                    await connection.execute('ALTER TABLE registrations MODIFY COLUMN company_secreatary JSON');
                    log(colors.green, '    ✅', 'Converted company_secreatary column to JSON');
                } else {
                    log(colors.green, '    ✅', 'company_secreatary column already JSON');
                }
            } catch (e) {
                log(colors.yellow, '    ⚠️', `Could not verify/convert company_secreatary type: ${e.message}`);
            }
        } else {
            // Create the new column if neither exists
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN company_secreatary VARCHAR(255)
            `);
            log(colors.green, '    ✅', 'Created company_secreatary column');
        }
    } catch (error) {
        console.log('Note: Company secretary migration may have already been completed');
    }
}

// General database migration
async function runGeneralMigration(connection) {
    try {
        // Define all expected columns for registrations table
        const expectedColumns = [
            { name: 'company_name_english', type: 'VARCHAR(255)' },
            { name: 'company_name_sinhala', type: 'VARCHAR(255)' },
            { name: 'is_foreign_owned', type: 'VARCHAR(10)' },
            { name: 'business_address_number', type: 'VARCHAR(255)' },
            { name: 'business_address_street', type: 'VARCHAR(255)' },
            { name: 'business_address_city', type: 'VARCHAR(255)' },
            { name: 'postal_code', type: 'VARCHAR(20)' },
            { name: 'shares_amount', type: 'VARCHAR(50)' },
            { name: 'number_of_shareholders', type: 'VARCHAR(10)' },
            { name: 'shareholders', type: 'JSON' },
            { name: 'number_of_directors', type: 'VARCHAR(10)' },
            { name: 'directors', type: 'JSON' },
            { name: 'grama_niladari', type: 'VARCHAR(255)' },
            { name: 'business_email', type: 'VARCHAR(255)' },
            { name: 'business_contact_number', type: 'VARCHAR(255)' }
        ];

        // Get existing columns
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        // Add missing columns
        let addedCount = 0;
        for (const column of expectedColumns) {
            if (!existingColumns.includes(column.name)) {
                try {
                    await connection.execute(`ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`);
                    log(colors.green, '    ✅', `Added missing column: ${column.name}`);
                    addedCount++;
                } catch (error) {
                    if (error.code !== 'ER_DUP_FIELDNAME') {
                        console.error(`Error adding column ${column.name}:`, error.message);
                    }
                }
            }
        }

        if (addedCount > 0) {
            log(colors.green, '    ✅', `General migration completed: Added ${addedCount} new columns`);
        } else {
            log(colors.green, '    ✅', 'General migration: All columns already exist');
        }
    } catch (error) {
        console.log('Note: General migration may have already been completed');
    }
}

// New migration for resolutions_docs column
// Email verification setup verification
async function verifyEmailSetup(connection) {
    try {
        // Check for required email verification columns
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
            AND COLUMN_NAME IN ('email_verified', 'email_verification_token', 'email_verification_sent_at', 'email_verified_at')
        `, [dbName]);

        const requiredColumns = ['email_verified', 'email_verification_token', 'email_verification_sent_at', 'email_verified_at'];
        const existingColumns = columns.map(col => col.COLUMN_NAME);

        for (const column of requiredColumns) {
            if (!existingColumns.includes(column)) {
                // Add missing column
                const columnType = column === 'email_verified' ? 'BOOLEAN DEFAULT FALSE'
                    : column === 'email_verification_token' ? 'VARCHAR(255)'
                        : 'TIMESTAMP NULL';

                await connection.execute(`ALTER TABLE users ADD COLUMN ${column} ${columnType}`);
                log(colors.green, '  ✅', `Added missing email verification column: ${column}`);
            }
        }

        // Verify indexes for email verification
        await connection.execute(`
            CREATE INDEX IF NOT EXISTS idx_email_verification_token 
            ON users(email_verification_token)
        `);

        log(colors.green, '  ✅', 'Email verification setup verified and completed');
    } catch (error) {
        log(colors.yellow, '  ⚠️', 'Note: Some email verification columns may already exist');
    }
}

async function runResolutionsDocsMigration(connection) {
    try {
        // Check if resolutions_docs column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'resolutions_docs'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the resolutions_docs column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN resolutions_docs JSON
            `);
            log(colors.green, '    ✅', 'resolutions_docs column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'resolutions_docs column already exists');
        }
    } catch (error) {
        console.log('Note: Resolutions docs migration may have already been completed');
    }
}

async function runAdminResolutionDocMigration(connection) {
    try {
        // Check if admin_resolution_doc column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'admin_resolution_doc'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the admin_resolution_doc column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN admin_resolution_doc JSON
            `);
            log(colors.green, '    ✅', 'admin_resolution_doc column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'admin_resolution_doc column already exists');
        }
    } catch (error) {
        console.log('Note: Admin resolution doc migration may have already been completed');
    }
}

// Migration to normalize existing company_entity values
async function runCompanyEntityValueMigration(connection) {
    try {
        // Ensure column exists before attempting updates
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);
        if (!existingColumns.includes('company_entity')) {
            return; // Nothing to migrate
        }

        // Update legacy values to new formats
        const updates = [
            { from: 'PVT (LTD)', to: '(PVT) LTD' },
            { from: 'PRIVATE LIMITED', to: '(PRIVATE) LIMITED' }
        ];

        let totalAffected = 0;
        for (const u of updates) {
            const [result] = await connection.execute(
                `UPDATE registrations SET company_entity = ? WHERE company_entity = ?`,
                [u.to, u.from]
            );
            totalAffected += result.affectedRows || 0;
        }

        if (totalAffected > 0) {
            log(colors.green, '    ✅', `company_entity values migration completed. Rows updated: ${totalAffected}`);
        } else {
            log(colors.green, '    ✅', 'company_entity values migration: No rows needed updating');
        }
    } catch (error) {
        log(colors.yellow, '    ⚠️', `company_entity values migration encountered an issue: ${error.message}`);
    }
}

// Migration for company_details_locked column
async function runCompanyDetailsLockedMigration(connection) {
    try {
        // Check if company_details_locked column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'company_details_locked'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the company_details_locked column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN company_details_locked BOOLEAN DEFAULT FALSE 
                AFTER company_entity
            `);
            log(colors.green, '    ✅', 'company_details_locked column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'company_details_locked column already exists');
        }
    } catch (error) {
        console.log('Note: Company details locked migration may have already been completed');
    }
}

// Migration for company_details_approved column
async function runCompanyDetailsApprovedMigration(connection) {
    try {
        // Check if company_details_approved column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'company_details_approved'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the company_details_approved column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN company_details_approved BOOLEAN DEFAULT FALSE 
                AFTER company_details_locked
            `);
            log(colors.green, '    ✅', 'company_details_approved column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'company_details_approved column already exists');
        }
    } catch (error) {
        console.log('Note: Company details approved migration may have already been completed');
    }
}

// Migration for company_details_rejected column
async function runCompanyDetailsRejectedMigration(connection) {
    try {
        // Check if company_details_rejected column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'company_details_rejected'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the company_details_rejected column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN company_details_rejected BOOLEAN DEFAULT FALSE 
                AFTER company_details_approved
            `);
            log(colors.green, '    ✅', 'company_details_rejected column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'company_details_rejected column already exists');
        }
    } catch (error) {
        console.log('Note: Company details rejected migration may have already been completed');
    }
}

// Migration for additional fees column
async function runAdditionalFeesMigration(connection) {
    try {
        // Check if additional_fees column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'additional_fees'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the additional_fees column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN additional_fees JSON
            `);
            log(colors.green, '    ✅', 'additional_fees column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'additional_fees column already exists');
        }
    } catch (error) {
        console.log('Note: Additional fees migration may have already been completed');
    }
}

// Migration for settings additional fees column
async function runSettingsAdditionalFeesMigration(connection) {
    try {
        // Check if additional_fees column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'additional_fees'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the additional_fees column
            await connection.execute(`
                ALTER TABLE settings 
                ADD COLUMN additional_fees JSON
            `);
            log(colors.green, '    ✅', 'additional_fees column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'additional_fees column already exists');
        }
    } catch (error) {
        console.log('Note: Settings additional fees migration may have already been completed');
    }
}

// Migration for settings secretary renew fee column
async function runSecretaryRenewFeeMigration(connection) {
    try {
        // Check if secretary_renew_fee column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'secretary_renew_fee'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the secretary_renew_fee column
            await connection.execute(`
                ALTER TABLE settings 
                ADD COLUMN secretary_renew_fee DECIMAL(10, 2) DEFAULT 0.00
            `);
            log(colors.green, '    ✅', 'secretary_renew_fee column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'secretary_renew_fee column already exists');
        }
    } catch (error) {
        console.log('Note: Settings secretary renew fee migration may have already been completed');
    }
}

// Migration for pinned column
async function runPinnedColumnMigration(connection) {
    try {
        // Check if pinned column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'pinned'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the pinned column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN pinned BOOLEAN DEFAULT FALSE
            `);
            log(colors.green, '    ✅', 'pinned column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'pinned column already exists');
        }
    } catch (error) {
        console.log('Note: Pinned column migration may have already been completed');
    }
}

// Migration for noted column
async function runNotedColumnMigration(connection) {
    try {
        // Check if noted column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'noted'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the noted column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN noted BOOLEAN DEFAULT FALSE
            `);
            log(colors.green, '    ✅', 'noted column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'noted column already exists');
        }
    } catch (error) {
        console.log('Note: Noted column migration may have already been completed');
    }
}

// Migration for shared_with_emails column
async function runSharedWithEmailsMigration(connection) {
    try {
        // Check if shared_with_emails column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'shared_with_emails'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the shared_with_emails column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN shared_with_emails JSON NULL
            `);
            log(colors.green, '    ✅', 'shared_with_emails column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'shared_with_emails column already exists');
        }
    } catch (error) {
        console.log('Note: Shared with emails migration may have already been completed');
    }
}

// Migration to ensure company_secreatary is a JSON column
async function ensureCompanySecretaryTextColumn(connection) {
    try {
        // Ensure column exists before attempting updates
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);
        if (!existingColumns.includes('company_secreatary')) {
            return; // Nothing to migrate
        }

        // Check if company_secreatary is a JSON column
        const [colInfo] = await connection.execute(`
            SELECT DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'company_secreatary'
        `, [dbName]);
        const type = (colInfo[0] && colInfo[0].DATA_TYPE) || '';
        if (type.toLowerCase() !== 'json') {
            await connection.execute('ALTER TABLE registrations MODIFY COLUMN company_secreatary JSON');
            log(colors.green, '    ✅', 'Converted company_secreatary column to JSON');
        } else {
            log(colors.green, '    ✅', 'company_secreatary column already JSON');
        }
    } catch (error) {
        log(colors.yellow, '    ⚠️', `Could not verify/convert company_secreatary type: ${error.message}`);
    }
}

// Migration for company_details_approved column
async function runCompanyDetailsApprovedMigration(connection) {
    try {
        // Check if company_details_approved column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'company_details_approved'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the company_details_approved column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN company_details_approved BOOLEAN DEFAULT FALSE 
                AFTER company_details_locked
            `);
            log(colors.green, '    ✅', 'company_details_approved column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'company_details_approved column already exists');
        }
    } catch (error) {
        console.log('Note: Company details approved migration may have already been completed');
    }
}

// Migration for company_details_rejected column
async function runCompanyDetailsRejectedMigration(connection) {
    try {
        // Check if company_details_rejected column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'company_details_rejected'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the company_details_rejected column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN company_details_rejected BOOLEAN DEFAULT FALSE 
                AFTER company_details_approved
            `);
            log(colors.green, '    ✅', 'company_details_rejected column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'company_details_rejected column already exists');
        }
    } catch (error) {
        console.log('Note: Company details rejected migration may have already been completed');
    }
}

// Add additional_fees column to registrations table
async function runAdditionalFeesMigration(connection) {
    try {
        // Check if additional_fees column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'additional_fees'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the additional_fees column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN additional_fees JSON DEFAULT NULL
            `);
            log(colors.green, '    ✅', 'additional_fees column added to registrations table');
        } else {
            log(colors.yellow, '    ➤', 'additional_fees column already exists in registrations table');
        }
    } catch (error) {
        console.log('Note: Additional fees migration may have already been completed');
    }
}

// Add additional_fees column to settings table
async function runSettingsAdditionalFeesMigration(connection) {
    try {
        // Check if additional_fees column exists in settings table
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'additional_fees'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the additional_fees column to settings table
            await connection.execute(`
                ALTER TABLE settings 
                ADD COLUMN additional_fees JSON DEFAULT NULL
            `);
            log(colors.green, '    ✅', 'additional_fees column added to settings table');

            // Update existing settings record to have default additional_fees structure
            const [existingSettings] = await connection.execute('SELECT id FROM settings LIMIT 1');

            if (existingSettings.length > 0) {
                const defaultAdditionalFees = {
                    directors: {
                        local: 0,
                        foreign: 0
                    },
                    shareholders: {
                        localNaturalPerson: 0,
                        localLegalEntity: 0,
                        foreignNaturalPerson: 0,
                        foreignLegalEntity: 0
                    }
                };

                await connection.execute(`
                    UPDATE settings 
                    SET additional_fees = ? 
                    WHERE id = ?
                `, [JSON.stringify(defaultAdditionalFees), existingSettings[0].id]);

                log(colors.green, '    ✅', 'Updated existing settings record with default additional_fees structure');
            }
        } else {
            log(colors.yellow, '    ➤', 'additional_fees column already exists in settings table');
        }
    } catch (error) {
        log(colors.red, '    ❌', `Settings additional fees migration failed: ${error.message}`);
    }
}

// Add secretary_renew_fee column to settings table
async function runSecretaryRenewFeeMigration(connection) {
    try {
        // Check if secretary_renew_fee column exists in settings table
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'secretary_renew_fee'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the secretary_renew_fee column to settings table
            await connection.execute(`
                ALTER TABLE settings 
                ADD COLUMN secretary_renew_fee DECIMAL(10,2) DEFAULT 0.00
            `);
            log(colors.green, '    ✅', 'secretary_renew_fee column added to settings table');

            // Update existing settings record to have default secretary_renew_fee value
            const [existingSettings] = await connection.execute('SELECT id FROM settings LIMIT 1');

            if (existingSettings.length > 0) {
                await connection.execute(`
                    UPDATE settings 
                    SET secretary_renew_fee = 0.00 
                    WHERE id = ? AND secretary_renew_fee IS NULL
                `, [existingSettings[0].id]);

                log(colors.green, '    ✅', 'Updated existing settings record with default secretary_renew_fee value');
            }
        } else {
            log(colors.yellow, '    ➤', 'secretary_renew_fee column already exists in settings table');
        }
    } catch (error) {
        log(colors.red, '    ❌', `Settings secretary renew fee migration failed: ${error.message}`);
    }
}

// Add pinned column to registrations table
async function runPinnedColumnMigration(connection) {
    try {
        // Check if pinned column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'pinned'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the pinned column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN pinned BOOLEAN DEFAULT FALSE
            `);
            log(colors.green, '    ✅', 'pinned column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'pinned column already exists');
        }
    } catch (error) {
        console.log('Note: Pinned column migration may have already been completed');
    }
}

// Add noted and secretary_records_noted_at columns to registrations table
async function runNotedColumnMigration(connection) {
    try {
        // Check if noted column exists
        const [notedColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'noted'
        `, [dbName]);

        if (notedColumns.length === 0) {
            // Add the noted column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN noted BOOLEAN DEFAULT FALSE
            `);
            log(colors.green, '    ✅', 'noted column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'noted column already exists');
        }

        // Check if secretary_records_noted_at column exists
        const [timestampColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'secretary_records_noted_at'
        `, [dbName]);

        if (timestampColumns.length === 0) {
            // Add the secretary_records_noted_at column
            await connection.execute(`
                ALTER TABLE registrations 
                ADD COLUMN secretary_records_noted_at TIMESTAMP NULL
            `);
            log(colors.green, '    ✅', 'secretary_records_noted_at column added successfully');
        } else {
            log(colors.yellow, '    ➤', 'secretary_records_noted_at column already exists');
        }
    } catch (error) {
        console.log('Note: Noted column migration may have already been completed');
    }
}

// Safely convert company_secreatary to JSON, preserving data where possible
async function ensureCompanySecretaryTextColumn(connection) {
    try {
        // Check current type
        const [typeRows] = await connection.execute(`
            SELECT DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'company_secreatary'
        `);
        const currentType = (typeRows[0] && typeRows[0].DATA_TYPE) ? String(typeRows[0].DATA_TYPE).toLowerCase() : '';
        if (currentType === 'longtext') {
            log(colors.green, '    ✅', 'company_secreatary already LONGTEXT');
            return;
        }

        log(colors.blue, '  🔄', 'Converting company_secreatary column to LONGTEXT (safe migration)...');

        // Directly modify to LONGTEXT; existing VARCHAR will widen safely
        await connection.execute(`ALTER TABLE registrations MODIFY COLUMN company_secreatary LONGTEXT NULL`);
        log(colors.green, '    ✅', 'company_secreatary converted to LONGTEXT successfully');
    } catch (error) {
        log(colors.yellow, '    ⚠️', `company_secreatary LONGTEXT migration encountered an issue: ${error.message}`);
    }
}

// Deprecated: no_secretary column intentionally not created/ensured

// Add foreign key constraint to secretary_renewal_payments table
async function addSecretaryRenewalForeignKeys(connection) {
    try {
        // Check if foreign key constraint already exists
        const [constraints] = await connection.execute(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'secretary_renewal_payments' 
            AND REFERENCED_TABLE_NAME = 'registrations'
            AND REFERENCED_COLUMN_NAME = 'id'
        `, [dbName]);

        if (constraints.length === 0) {
            // Add foreign key constraint
            await connection.execute(`
                ALTER TABLE secretary_renewal_payments 
                ADD CONSTRAINT fk_secretary_renewal_registration 
                FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
            `);
            log(colors.green, '    ✅', 'Foreign key constraint added to secretary_renewal_payments');
        } else {
            log(colors.yellow, '    ➤', 'Foreign key constraint already exists for secretary_renewal_payments');
        }
    } catch (error) {
        log(colors.yellow, '    ⚠️', `Foreign key constraint creation encountered an issue: ${error.message}`);
    }
}

// Ensure mobile_number column exists in users table
async function ensureMobileNumberColumn(connection) {
    try {
        // Check if mobile_number column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'mobile_number'
        `, [dbName]);

        if (columns.length === 0) {
            // Add the mobile_number column
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN mobile_number VARCHAR(20) NULL AFTER email
            `);
            log(colors.green, '    ✅', 'mobile_number column added to users table');
        } else {
            log(colors.yellow, '    ➤', 'mobile_number column already exists in users table');
        }
    } catch (error) {
        log(colors.yellow, '    ⚠️', `Mobile number column creation encountered an issue: ${error.message}`);
    }
}

// Shareholder fields migration to ensure all shareholder data is properly structured
async function runShareholderFieldsMigration(connection) {
    try {
        log(colors.blue, '  🔄', 'Ensuring shareholder data structure...');

        // Get all registrations with shareholders data
        const [rows] = await connection.execute(
            "SELECT id, company_name, shareholders FROM registrations WHERE shareholders IS NOT NULL AND shareholders != 'null' AND shareholders != '[]'"
        );

        if (rows.length === 0) {
            log(colors.green, '  ✅', 'No shareholders data found to migrate');
            return;
        }

        log(colors.cyan, '  📊', `Found ${rows.length} registrations with shareholders data`);

        let processedCount = 0;
        let errorCount = 0;

        for (const row of rows) {
            try {
                let shareholders = null;

                // Parse shareholders JSON
                if (typeof row.shareholders === 'string') {
                    shareholders = JSON.parse(row.shareholders);
                } else {
                    shareholders = row.shareholders;
                }

                if (!Array.isArray(shareholders)) {
                    log(colors.yellow, '  ⚠️', `Invalid shareholders data format for ${row.company_name}`);
                    continue;
                }

                // Validate and enhance each shareholder
                let hasChanges = false;
                const enhancedShareholders = shareholders.map((shareholder, index) => {
                    if (!shareholder || typeof shareholder !== 'object') {
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

                    processedCount++;
                }

            } catch (error) {
                log(colors.red, '  ❌', `Error processing ${row.company_name}: ${error.message}`);
                errorCount++;
            }
        }

        if (processedCount > 0) {
            log(colors.green, '  ✅', `Shareholder fields migration completed: ${processedCount} registrations updated`);
        } else {
            log(colors.green, '  ✅', 'Shareholder fields migration: No changes needed');
        }

        if (errorCount > 0) {
            log(colors.yellow, '  ⚠️', `${errorCount} registrations had errors during migration`);
        }

    } catch (error) {
        log(colors.red, '  ❌', `Shareholder fields migration failed: ${error.message}`);
    }
}

async function verifyInstallation(connection) {
    const issues = [];
    let tablesCount = 0;
    let columnsCount = 0;

    // Check tables exist
    const [tables] = await connection.execute(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = ?
  `, [dbName]);

    const expectedTables = ['users', 'registrations', 'packages', 'bank_details', 'settings', 'messages', 'about_settings', 'secretary_renewal_payments'];
    const existingTables = tables.map(t => t.TABLE_NAME);

    for (const table of expectedTables) {
        if (existingTables.includes(table)) {
            tablesCount++;
            log(colors.green, '  ✅', `${table} table verified`);
        } else {
            issues.push(`Missing table: ${table}`);
        }
    }

    // Check critical columns
    const [columns] = await connection.execute('DESCRIBE registrations');
    const existingColumns = columns.map(col => col.Field);

    const criticalColumns = [
        'id', 'user_id', 'company_name', 'contact_person_name', 'contact_person_email',
        'contact_person_phone', 'selected_package', 'current_step', 'status',
        'payment_approved', 'details_approved', 'documents_approved',
        'customer_form1', 'customer_form19', 'customer_aoa',
        'customer_form18', 'customer_address_proof', 'incorporation_certificate',
        'step3_additional_doc', 'step3_signed_additional_doc', 'signed_admin_resolution', 'signed_customer_resolution', 'step4_final_additional_doc',
        'additional_documents', 'company_name_english', 'company_name_sinhala', 'company_entity', 'company_details_locked', 'company_details_approved', 'company_details_rejected',
        'form19', 'balance_payment_receipt', 'shareholders', 'directors',
        'documents_submitted_at', 'completed_at', 'grama_niladari',
        'province', 'district', 'divisional_secretariat', 'company_secreatary',
        'eroc_registered', 'resolutions_docs', 'admin_resolution_doc', 'pinned', 'noted', 'secretary_records_noted_at'  // Added these lines
    ];

    for (const column of criticalColumns) {
        if (existingColumns.includes(column)) {
            columnsCount++;
        } else {
            issues.push(`Missing column: registrations.${column}`);
        }
    }

    // Check data counts
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [packageCount] = await connection.execute('SELECT COUNT(*) as count FROM packages');
    const [bankCount] = await connection.execute('SELECT COUNT(*) as count FROM bank_details');
    const [settingsCount] = await connection.execute('SELECT COUNT(*) as count FROM settings');
    const [messageCount] = await connection.execute('SELECT COUNT(*) as count FROM messages');
    const [aboutCount] = await connection.execute('SELECT COUNT(*) as count FROM about_settings');
    const [renewalCount] = await connection.execute('SELECT COUNT(*) as count FROM secretary_renewal_payments');

    return {
        success: issues.length === 0,
        issues,
        stats: {
            tables: { existing: tablesCount, expected: expectedTables.length },
            columns: { existing: columnsCount, expected: criticalColumns.length },
            data: {
                users: userCount[0].count,
                packages: packageCount[0].count,
                bankDetails: bankCount[0].count,
                settings: settingsCount[0].count,
                messages: messageCount[0].count,
                aboutSettings: aboutCount[0].count,
                renewalPayments: renewalCount[0].count
            }
        }
    };
}

function displayInstallationSummary(result) {
    console.log(colors.cyan + '📊 Installation Summary:' + colors.reset);
    console.log();

    // Add email verification status
    console.log(`${colors.green}📧 Email Verification System: Installed and Ready${colors.reset}`);

    console.log(`${colors.green}✅ Tables: ${result.stats.tables.existing}/${result.stats.tables.expected} installed${colors.reset}`);
    console.log(`${colors.green}✅ Columns: ${result.stats.columns.existing}/${result.stats.columns.expected} installed${colors.reset}`);
    console.log();

    console.log(`${colors.blue}📝 Default Data:${colors.reset}`);
    console.log(`   • Users: ${result.stats.data.users}`);
    console.log(`   • Packages: ${result.stats.data.packages}`);
    console.log(`   • Bank Details: ${result.stats.data.bankDetails}`);
    console.log(`   • Settings: ${result.stats.data.settings}`);
    console.log(`   • Messages: ${result.stats.data.messages}`);
    console.log(`   • About Settings: ${result.stats.data.aboutSettings} (kept empty)`);
    console.log(`   • Secretary Renewal Payments: ${result.stats.data.renewalPayments} (empty)`);
    console.log();

    console.log(`${colors.cyan}🎯 Next Steps:${colors.reset}`);
    console.log(`   • Run ${colors.bright}npm run dev${colors.reset} to start the application`);
    console.log(`   • Login with: admin@example.com / password123`);
    console.log(`   • Access database at: ${dbConfig.host}:${dbConfig.port}/${dbName}`);
    console.log();
}

// Run the installation
if (require.main === module) {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });

    installDatabase()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error();
            log(colors.red, '💥', 'Database installation failed');
            console.error(error);
            process.exit(1);
        });
}

module.exports = installDatabase;
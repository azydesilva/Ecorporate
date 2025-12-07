// Server-side only database configuration
let pool: any = null;

// Only initialize database connection on server side
if (typeof window === 'undefined') {
  const mysql = require('mysql2/promise');

  // Database configuration for banana_db
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    database: process.env.DB_NAME || 'banana_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  // Create connection pool
  pool = mysql.createPool(dbConfig);
}

// Test database connection
export async function testConnection() {
  if (!pool) {
    console.log('Database pool not initialized (client-side)');
    return false;
  }

  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  if (!pool) {
    console.log('Database pool not initialized (client-side)');
    return;
  }

  try {
    // Initialize file storage directories
    await initializeFileStorage();

    const connection = await pool.getConnection();

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
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
    `);

    // Create registrations table with all columns
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id VARCHAR(255) PRIMARY KEY,
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
        -- Customer Signed Documents (separate columns)
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
        -- Company Details Fields
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
        province VARCHAR(255),
        district VARCHAR(255),
        divisional_secretariat VARCHAR(255),
        shares_amount VARCHAR(50),
        number_of_shareholders VARCHAR(10),
        shareholders JSON,
        company_secreatary JSON,
        number_of_directors VARCHAR(10),
        directors JSON,
        grama_niladari VARCHAR(255),
        company_activities TEXT,
        business_email VARCHAR(255),
        business_contact_number VARCHAR(255),
        eroc_registered BOOLEAN DEFAULT FALSE,
        pinned BOOLEAN DEFAULT FALSE,
        noted BOOLEAN DEFAULT FALSE,
        additional_fees JSON,
        register_start_date DATE NULL,
        expire_days INT NULL,
        expire_date DATE NULL,
        is_expired BOOLEAN DEFAULT FALSE,
        expiry_notification_sent_at TIMESTAMP NULL,
        resolutions_docs JSON,
        admin_resolution_doc JSON,
        signed_admin_resolution JSON,
        signed_customer_resolution JSON,
        secretary_records_noted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create packages table
    await connection.execute(`
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
    `);

    // Create bank_details table
    await connection.execute(`
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
    `);

    // Create settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        logo_url VARCHAR(500),
        favicon_url VARCHAR(500),
        primary_color VARCHAR(7) DEFAULT '#000000',
        secondary_color VARCHAR(7) DEFAULT '#ffffff',
        secretary_renew_fee DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create secretary_renewal_payments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS secretary_renewal_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_receipt JSON,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        approved_by VARCHAR(255),
        rejected_by VARCHAR(255),
        approved_at TIMESTAMP NULL,
        rejected_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
        INDEX idx_registration_id (registration_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);

    // Run automatic migration to add any missing columns
    await migrateDatabase(connection);

    connection.release();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Automatic database migration function
async function migrateDatabase(connection: any) {
  try {
    console.log('Running automatic database migration...');

    // Get existing columns for users table
    const [userColumns] = await connection.execute('DESCRIBE users');
    const existingUserColumns = userColumns.map((col: any) => col.Field);

    // Define expected columns for users table
    const expectedUserColumns = [
      { name: 'email_verified', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'email_verification_token', type: 'VARCHAR(255)' },
      { name: 'email_verification_sent_at', type: 'TIMESTAMP NULL' },
      { name: 'email_verified_at', type: 'TIMESTAMP NULL' },
      { name: 'reset_token', type: 'VARCHAR(255) NULL' },
      { name: 'reset_token_expires', type: 'TIMESTAMP NULL' }
    ];

    // Add missing user columns
    for (const column of expectedUserColumns) {
      if (!existingUserColumns.includes(column.name)) {
        try {
          await connection.execute(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✅ Added missing column to users table: ${column.name}`);
        } catch (error: any) {
          if (error.code !== 'ER_DUP_FIELDNAME') {
            console.error(`❌ Error adding column ${column.name} to users table:`, error.message);
          }
        }
      }
    }

    // Define all expected columns for registrations table
    const expectedColumns = [
      { name: 'company_name_english', type: 'VARCHAR(255)' },
      { name: 'company_name_sinhala', type: 'VARCHAR(255)' },
      { name: 'company_entity', type: 'VARCHAR(50)' },
      { name: 'is_foreign_owned', type: 'VARCHAR(10)' },
      { name: 'business_address_number', type: 'VARCHAR(255)' },
      { name: 'business_address_street', type: 'VARCHAR(255)' },
      { name: 'business_address_city', type: 'VARCHAR(255)' },
      { name: 'postal_code', type: 'VARCHAR(20)' },
      { name: 'province', type: 'VARCHAR(255)' },
      { name: 'district', type: 'VARCHAR(255)' },
      { name: 'divisional_secretariat', type: 'VARCHAR(255)' },
      { name: 'shares_amount', type: 'VARCHAR(50)' },
      { name: 'number_of_shareholders', type: 'VARCHAR(10)' },
      { name: 'shareholders', type: 'JSON' },
      { name: 'company_secreatary', type: 'JSON' },
      { name: 'number_of_directors', type: 'VARCHAR(10)' },
      { name: 'directors', type: 'JSON' },
      { name: 'grama_niladari', type: 'VARCHAR(255)' },
      { name: 'company_activities', type: 'TEXT' },
      { name: 'business_email', type: 'VARCHAR(255)' },
      { name: 'business_contact_number', type: 'VARCHAR(255)' },
      { name: 'step3_signed_additional_doc', type: 'JSON' },
      { name: 'eroc_registered', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'pinned', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'noted', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'additional_fees', type: 'JSON' },
      { name: 'register_start_date', type: 'DATE NULL' },
      { name: 'expire_days', type: 'INT NULL' },
      { name: 'expire_date', type: 'DATE NULL' },
      { name: 'is_expired', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'resolutions_docs', type: 'JSON' },
      { name: 'admin_resolution_doc', type: 'JSON' },
      { name: 'signed_admin_resolution', type: 'JSON' },
      { name: 'signed_customer_resolution', type: 'JSON' },
      { name: 'company_details_locked', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'company_details_approved', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'company_details_rejected', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'step4_final_additional_doc', type: 'JSON' },
      { name: 'shared_with_emails', type: 'JSON' }, // Add this line for access sharing feature
      { name: 'secretary_records_noted_at', type: 'TIMESTAMP NULL' },
      { name: 'secretary_period_year', type: 'VARCHAR(4) NULL' },
      { name: 'expiry_notification_sent_at', type: 'TIMESTAMP NULL' },
      { name: 'balance_payment_approved', type: 'BOOLEAN DEFAULT FALSE' }
    ];

    // Get existing columns
    const [columns] = await connection.execute('DESCRIBE registrations');
    const existingColumns = columns.map((col: any) => col.Field);
    
    console.log('🔍 Existing database columns:', existingColumns);
    console.log('🔍 Expected database columns:', expectedColumns.map(c => c.name));

    // Add missing columns
    for (const column of expectedColumns) {
      if (!existingColumns.includes(column.name)) {
        try {
          await connection.execute(`ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✅ Added missing column: ${column.name}`);
        } catch (error: any) {
          if (error.code !== 'ER_DUP_FIELDNAME') {
            console.error(`❌ Error adding column ${column.name}:`, error.message);
          }
        }
      }
    }

    // Check if secretary_renewal_payments table exists and has correct structure
    try {
      const [tables] = await connection.execute("SHOW TABLES LIKE 'secretary_renewal_payments'");
      if (tables.length > 0) {
        console.log('✅ Secretary renewal payments table exists');

        // Check columns in secretary_renewal_payments table
        const [paymentColumns] = await connection.execute('DESCRIBE secretary_renewal_payments');
        const existingPaymentColumns = paymentColumns.map((col: any) => col.Field);

        console.log('📋 Existing payment columns:', existingPaymentColumns);

        // Expected columns for secretary_renewal_payments
        const expectedPaymentColumns = [
          'id', 'registration_id', 'amount', 'payment_receipt', 'status',
          'approved_by', 'rejected_by', 'approved_at', 'rejected_at',
          'created_at', 'updated_at'
        ];

        // Check if all expected columns exist
        const missingColumns = expectedPaymentColumns.filter(col => !existingPaymentColumns.includes(col));
        if (missingColumns.length > 0) {
          console.log('⚠️ Missing columns in secretary_renewal_payments:', missingColumns);
        } else {
          console.log('✅ All expected columns exist in secretary_renewal_payments');
        }
      } else {
        console.log('⚠️ Secretary renewal payments table does not exist');
      }
    } catch (error) {
      console.error('❌ Error checking secretary_renewal_payments table:', error);
    }

    // Check if settings table has secretary_renew_fee column and add it if missing
    try {
      const [settingsColumns] = await connection.execute('DESCRIBE settings');
      const existingSettingsColumns = settingsColumns.map((col: any) => col.Field);

      if (!existingSettingsColumns.includes('secretary_renew_fee')) {
        console.log('⚠️ Missing secretary_renew_fee column in settings table, adding it now...');
        await connection.execute('ALTER TABLE settings ADD COLUMN secretary_renew_fee DECIMAL(10,2) DEFAULT 0.00');
        console.log('✅ Added secretary_renew_fee column to settings table');
      } else {
        console.log('✅ secretary_renew_fee column already exists in settings table');
      }
    } catch (error) {
      console.error('❌ Error checking or adding secretary_renew_fee column:', error);
    }

    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
  }
}

// Initialize file storage directories
async function initializeFileStorage() {
  if (typeof window !== 'undefined') {
    return; // Skip on client side
  }

  try {
    const fs = require('fs');
    const path = require('path');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const subdirectories = ['images', 'documents', 'temp'];

    // Create main uploads directory
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    }

    // Create subdirectories
    for (const subdir of subdirectories) {
      const subdirPath = path.join(uploadsDir, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
        console.log(`✅ Created ${subdir} directory`);
      }
    }

    // Create .gitkeep files
    for (const subdir of subdirectories) {
      const gitkeepPath = path.join(uploadsDir, subdir, '.gitkeep');
      if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '# This file ensures the directory is tracked in git\n');
      }
    }

  } catch (error) {
    console.error('Error initializing file storage:', error);
  }
}

export default pool;
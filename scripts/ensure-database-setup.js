const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'wp@XRT.2003',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function ensureDatabaseSetup() {
  let connection;

  try {
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'banana_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created or already exists`);

    // Use the database
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Using database '${dbName}'`);

    // Step 1: Create all tables
    await createAllTables(connection);

    // Step 2: Ensure all columns exist
    await ensureAllColumns(connection);

    // Step 3: Insert default data
    await insertDefaultData(connection);

    console.log('🎉 Database setup completed successfully!');
    console.log('📊 All tables and columns are now properly installed.');

  } catch (error) {
    console.error('❌ Error ensuring database setup:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createAllTables(connection) {
  console.log('\n📋 Creating all tables...');

  // Create users table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'customer') DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Users table created');

  // Create registrations table with all columns
  await connection.execute(`
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
      exports_to_add TEXT,
      drama_sedaka_division VARCHAR(255),
      business_email VARCHAR(255),
      business_contact_number VARCHAR(255),
      documents_submitted_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      register_start_date DATE NULL,
      expire_days INT NULL,
      expire_date DATE NULL,
      is_expired BOOLEAN DEFAULT FALSE,
      balance_payment_approved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Registrations table created');

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
  console.log('✅ Packages table created');

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
  console.log('✅ Bank details table created');

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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Settings table created');
}

async function ensureAllColumns(connection) {
  console.log('\n🔍 Ensuring all columns exist...');

  // Define all expected columns for registrations table
  const expectedColumns = [
    { name: 'user_id', type: 'VARCHAR(255) NOT NULL DEFAULT \'default_user\'' },
    { name: 'customer_form1', type: 'JSON' },
    { name: 'customer_form19', type: 'JSON' },
    { name: 'customer_aoa', type: 'JSON' },
    { name: 'customer_form18', type: 'JSON' },
    { name: 'customer_address_proof', type: 'JSON' },
    { name: 'incorporation_certificate', type: 'JSON' },
    { name: 'step3_additional_doc', type: 'JSON' },
    { name: 'step3_signed_additional_doc', type: 'JSON' },
    { name: 'step4_final_additional_doc', type: 'JSON' },
    { name: 'additional_documents', type: 'JSON' },
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
    { name: 'make_simple_books_secretary', type: 'VARCHAR(10)' },
    { name: 'number_of_directors', type: 'VARCHAR(10)' },
    { name: 'directors', type: 'JSON' },
    { name: 'drama_sedaka_division', type: 'VARCHAR(255)' },
    { name: 'business_email', type: 'VARCHAR(255)' },
    { name: 'business_contact_number', type: 'VARCHAR(255)' },
    { name: 'documents_submitted_at', type: 'TIMESTAMP NULL' },
    { name: 'completed_at', type: 'TIMESTAMP NULL' },
    { name: 'eroc_registered', type: 'BOOLEAN DEFAULT FALSE' },
    { name: 'balance_payment_approved', type: 'BOOLEAN DEFAULT FALSE' }
  ];

  // Get existing columns
  const [columns] = await connection.execute('DESCRIBE registrations');
  const existingColumns = columns.map(col => col.Field);

  // Add missing columns
  let addedColumns = 0;
  for (const column of expectedColumns) {
    if (!existingColumns.includes(column.name)) {
      try {
        await connection.execute(`ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✅ Added missing column: ${column.name}`);
        addedColumns++;
      } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
          console.error(`❌ Error adding column ${column.name}:`, error.message);
        }
      }
    }
  }

  if (addedColumns === 0) {
    console.log('✅ All columns already exist');
  } else {
    console.log(`✅ Added ${addedColumns} missing columns`);
  }
}

async function insertDefaultData(connection) {
  console.log('\n📝 Inserting default data...');

  // Insert default Admin
  await connection.execute(`
    INSERT IGNORE INTO users (id, name, email, password, role) 
    VALUES ('admin-1', 'Admin', 'admin@example.com', 'admin123', 'admin')
  `);
  console.log('✅ Default Admin created');

  // Insert default settings
  await connection.execute(`
    INSERT IGNORE INTO settings (id, title, description, primary_color, secondary_color) 
    VALUES ('default', 'E CORPORATE', 'CENTRAL COURT (PRIVATE) LIMITED.', '#000000', '#ffffff')
  `);
  console.log('✅ Default settings created');

  // Insert default bank details
  await connection.execute(`
    INSERT IGNORE INTO bank_details (id, bank_name, account_name, account_number, branch, swift_code, additional_instructions) 
    VALUES ('default', 'Sample Bank', 'Sample Account', '1234567890', 'Main Branch', 'SAMPLE123', 'Please include your registration ID in the payment reference.')
  `);
  console.log('✅ Default bank details created');

  // Insert sample packages
  const packages = [
    {
      id: 'basic',
      name: 'Basic Package',
      description: 'Essential company registration services',
      price: 50000.00,
      advance_amount: 25000.00,
      balance_amount: 25000.00,
      features: JSON.stringify(['Company Registration', 'Basic Documentation', 'Standard Processing'])
    },
    {
      id: 'premium',
      name: 'Premium Package',
      description: 'Comprehensive company registration with additional services',
      price: 75000.00,
      advance_amount: 37500.00,
      balance_amount: 37500.00,
      features: JSON.stringify(['Company Registration', 'Advanced Documentation', 'Priority Processing', 'Additional Support'])
    }
  ];

  for (const pkg of packages) {
    await connection.execute(`
      INSERT IGNORE INTO packages (id, name, description, price, advance_amount, balance_amount, features) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [pkg.id, pkg.name, pkg.description, pkg.price, pkg.advance_amount, pkg.balance_amount, pkg.features]);
  }
  console.log('✅ Sample packages created');
}

// Run the setup
if (require.main === module) {
  ensureDatabaseSetup()
    .then(() => {
      console.log('\n🎉 Database setup verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup verification failed:', error);
      process.exit(1);
    });
}

module.exports = ensureDatabaseSetup;

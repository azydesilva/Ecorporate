// Script to create the secretary_renewal_payments table
const fs = require('fs');
const path = require('path');

// SQL to create the secretary_renewal_payments table
const createTableSQL = `
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
);
`;

// Write the SQL to a file that can be executed
const sqlFilePath = path.join(__dirname, 'sql', 'create_secretary_renewal_payments_table.sql');
const sqlDir = path.dirname(sqlFilePath);

// Create the sql directory if it doesn't exist
if (!fs.existsSync(sqlDir)) {
    fs.mkdirSync(sqlDir, { recursive: true });
}

fs.writeFileSync(sqlFilePath, createTableSQL);

console.log('✅ Secretary renewal payments table creation SQL generated at:', sqlFilePath);
console.log('📋 SQL Statement:');
console.log(createTableSQL);

// Also create a migration script that can be run directly
const migrationScript = `
const mysql = require('mysql2/promise');

async function createSecretaryRenewalPaymentsTable() {
  // Database configuration - update with your actual database credentials
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edashboard'
  };

  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔌 Connected to database');
    
    // Create the secretary_renewal_payments table
    const createTableSQL = \`
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
    \`;
    
    console.log('📝 Creating secretary_renewal_payments table...');
    await connection.execute(createTableSQL);
    console.log('✅ Secretary renewal payments table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating secretary renewal payments table:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createSecretaryRenewalPaymentsTable();
}

module.exports = createSecretaryRenewalPaymentsTable;
`;

const migrationFilePath = path.join(__dirname, 'migrate-secretary-renewal-payments-table.js');
fs.writeFileSync(migrationFilePath, migrationScript);

console.log('✅ Secretary renewal payments table migration script generated at:', migrationFilePath);
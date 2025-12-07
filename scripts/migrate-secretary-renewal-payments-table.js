const mysql = require('mysql2/promise');

async function createSecretaryRenewalPaymentsTable() {
  // Use the same database configuration as the main application
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

  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);

    console.log('🔌 Connected to database');

    // Create the secretary_renewal_payments table
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
      )
    `;

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
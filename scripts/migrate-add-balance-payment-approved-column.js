// Script to add balance_payment_approved column to registrations table
const mysql = require('mysql2/promise');

// Database configuration - update with your actual database credentials
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'wp@XRT.2003',
  database: process.env.DB_NAME || 'banana_db',
  port: parseInt(process.env.DB_PORT || '3306')
};

async function addBalancePaymentApprovedColumn() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');
    
    // Check if the column already exists
    console.log('🔍 Checking if balance_payment_approved column exists...');
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM registrations LIKE 'balance_payment_approved'"
    );
    
    if (columns.length > 0) {
      console.log('⚠️ Column balance_payment_approved already exists');
      return;
    }
    
    // Add the new column
    console.log('📝 Adding balance_payment_approved column...');
    await connection.execute(
      'ALTER TABLE registrations ADD COLUMN balance_payment_approved BOOLEAN DEFAULT FALSE'
    );
    
    console.log('✅ Column balance_payment_approved added successfully');
    
    // Update existing records where balance payment is already approved
    console.log('📝 Updating existing records with approved balance payments...');
    const [result] = await connection.execute(`
      UPDATE registrations 
      SET balance_payment_approved = TRUE 
      WHERE balance_payment_receipt IS NOT NULL 
      AND JSON_EXTRACT(balance_payment_receipt, '$.status') = 'approved'
    `);
    
    console.log(`✅ Updated ${result.affectedRows} records with approved balance payments`);
    
  } catch (error) {
    console.error('❌ Error adding balance_payment_approved column:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  addBalancePaymentApprovedColumn()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addBalancePaymentApprovedColumn };
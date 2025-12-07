const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'wp@XRT.2003',
  database: process.env.DB_NAME || 'banana_db',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function checkCompanyNames() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    
    // Query to get registrations with company name data
    const [rows] = await connection.execute(
      'SELECT id, company_name, company_name_english, company_name_sinhala FROM registrations LIMIT 10'
    );
    
    console.log('Company Name Data in Database:');
    console.log('================================');
    
    if (rows.length === 0) {
      console.log('No registrations found in database');
      return;
    }
    
    rows.forEach((row, index) => {
      console.log(`\nRegistration ${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  company_name: ${row.company_name || 'NULL'}`);
      console.log(`  company_name_english: ${row.company_name_english || 'NULL'}`);
      console.log(`  company_name_sinhala: ${row.company_name_sinhala || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the function
checkCompanyNames();
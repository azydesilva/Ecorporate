const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'wp@XRT.2003',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'banana_db'
};

async function verifyDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check all tables exist
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [dbConfig.database]);

    const expectedTables = ['users', 'registrations', 'packages', 'bank_details', 'settings'];
    const existingTables = tables.map(t => t.TABLE_NAME);

    console.log('\n📋 Checking tables...');
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ ${table} table exists`);
      } else {
        console.log(`❌ ${table} table missing`);
      }
    }

    // Check registrations table columns
    console.log('\n🔍 Checking registrations table columns...');
    const [columns] = await connection.execute('DESCRIBE registrations');
    const existingColumns = columns.map(col => col.Field);

    const criticalColumns = [
      'id', 'user_id', 'company_name', 'contact_person_name', 'contact_person_email',
      'contact_person_phone', 'selected_package', 'current_step', 'status',
      'payment_approved', 'details_approved', 'documents_approved',
      'customer_form1', 'customer_form19', 'customer_aoa',
      'customer_form18', 'customer_address_proof', 'incorporation_certificate',
      'step3_additional_doc', 'step3_signed_additional_doc', 'step4_final_additional_doc',
      'additional_documents', 'company_name_english', 'company_name_sinhala',
      'shareholders', 'directors', 'documents_submitted_at', 'completed_at'
    ];

    let missingColumns = 0;
    for (const column of criticalColumns) {
      if (existingColumns.includes(column)) {
        console.log(`✅ ${column} column exists`);
      } else {
        console.log(`❌ ${column} column missing`);
        missingColumns++;
      }
    }

    // Check default data
    console.log('\n📝 Checking default data...');

    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users count: ${users[0].count}`);

    const [packages] = await connection.execute('SELECT COUNT(*) as count FROM packages');
    console.log(`✅ Packages count: ${packages[0].count}`);

    const [settings] = await connection.execute('SELECT COUNT(*) as count FROM settings');
    console.log(`✅ Settings count: ${settings[0].count}`);

    const [bankDetails] = await connection.execute('SELECT COUNT(*) as count FROM bank_details');
    console.log(`✅ Bank details count: ${bankDetails[0].count}`);

    // Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Tables: ${existingTables.length}/${expectedTables.length} exist`);
    console.log(`✅ Critical columns: ${criticalColumns.length - missingColumns}/${criticalColumns.length} exist`);

    if (missingColumns === 0) {
      console.log('🎉 Database is fully set up and ready to use!');
    } else {
      console.log(`⚠️  ${missingColumns} critical columns are missing. Run 'npm run ensure-db' to fix.`);
    }

  } catch (error) {
    console.error('❌ Error verifying database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the verification
if (require.main === module) {
  verifyDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database verification failed:', error);
      process.exit(1);
    });
}

module.exports = verifyDatabase;

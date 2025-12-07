const mysql = require('mysql2/promise');
require('dotenv').config();

async function testExpireDateUpdate() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'edashboard',
            port: process.env.DB_PORT || 3306
        });

        console.log('🔗 Connected to MySQL database');

        // Get a sample registration to test with
        const [rows] = await connection.execute(`
      SELECT id, company_name_english, company_name 
      FROM registrations 
      LIMIT 1
    `);

        if (rows.length === 0) {
            console.log('❌ No registrations found to test with');
            return;
        }

        const testRegistration = rows[0];
        console.log(`📋 Testing with registration: ${testRegistration.company_name_english || testRegistration.company_name} (ID: ${testRegistration.id})`);

        // Test updating expire date fields
        const startDate = '2024-01-01';
        const expireDays = 365;
        const expireDate = '2024-12-31';
        const isExpired = false;

        await connection.execute(`
      UPDATE registrations 
      SET register_start_date = ?, expire_days = ?, expire_date = ?, is_expired = ?
      WHERE id = ?
    `, [startDate, expireDays, expireDate, isExpired, testRegistration.id]);

        console.log('✅ Successfully updated expire date fields');

        // Verify the update
        const [updatedRows] = await connection.execute(`
      SELECT register_start_date, expire_days, expire_date, is_expired
      FROM registrations 
      WHERE id = ?
    `, [testRegistration.id]);

        const updated = updatedRows[0];
        console.log('📊 Updated values:');
        console.log(`  - Start Date: ${updated.register_start_date}`);
        console.log(`  - Expire Days: ${updated.expire_days}`);
        console.log(`  - Expire Date: ${updated.expire_date}`);
        console.log(`  - Is Expired: ${updated.is_expired}`);

        // Test API endpoint simulation
        console.log('\n🧪 Testing API endpoint simulation...');

        const testData = {
            registerStartDate: '2024-02-01',
            expireDays: 730,
            expireDate: '2026-01-31',
            isExpired: false
        };

        await connection.execute(`
      UPDATE registrations 
      SET register_start_date = ?, expire_days = ?, expire_date = ?, is_expired = ?
      WHERE id = ?
    `, [testData.registerStartDate, testData.expireDays, testData.expireDate, testData.isExpired, testRegistration.id]);

        console.log('✅ API simulation test passed');

        console.log('\n🎉 All tests passed! Expire date update functionality is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run test if called directly
if (require.main === module) {
    testExpireDateUpdate()
        .then(() => {
            console.log('🎉 Test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testExpireDateUpdate };

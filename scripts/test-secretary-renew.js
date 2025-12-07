const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSecretaryRenew() {
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

        // Get all completed registrations
        const [allRegistrations] = await connection.execute(`
      SELECT id, company_name_english, company_name, status, expire_date, is_expired
      FROM registrations 
      WHERE status = 'completed'
    `);

        console.log(`📋 Found ${allRegistrations.length} completed registrations`);

        if (allRegistrations.length === 0) {
            console.log('❌ No completed registrations found to test with');
            return;
        }

        // Test the filtering logic (same as in SecretaryRenewPage)
        const today = new Date();
        const expired = allRegistrations.filter((reg) => {
            const isExpired = reg.is_expired || (reg.expire_date && new Date(reg.expire_date) < today);
            return isExpired && reg.status === 'completed';
        });

        console.log(`🔍 Found ${expired.length} expired registrations`);

        if (expired.length === 0) {
            console.log('ℹ️  No expired registrations found. Creating a test expired registration...');

            // Create a test expired registration
            const testRegistration = allRegistrations[0];
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 30); // 30 days ago

            await connection.execute(`
        UPDATE registrations 
        SET expire_date = ?, is_expired = true
        WHERE id = ?
      `, [pastDate.toISOString().split('T')[0], testRegistration.id]);

            console.log(`✅ Created test expired registration: ${testRegistration.company_name_english || testRegistration.company_name}`);

            // Test the filtering again
            const [updatedRegistrations] = await connection.execute(`
        SELECT id, company_name_english, company_name, status, expire_date, is_expired
        FROM registrations 
        WHERE status = 'completed'
      `);

            const newExpired = updatedRegistrations.filter((reg) => {
                const isExpired = reg.is_expired || (reg.expire_date && new Date(reg.expire_date) < today);
                return isExpired && reg.status === 'completed';
            });

            console.log(`🔍 Now found ${newExpired.length} expired registrations`);

            if (newExpired.length > 0) {
                console.log('📊 Expired registrations:');
                newExpired.forEach((reg, index) => {
                    console.log(`  ${index + 1}. ${reg.company_name_english || reg.company_name} (Expired: ${reg.expire_date})`);
                });
            }
        } else {
            console.log('📊 Expired registrations:');
            expired.forEach((reg, index) => {
                console.log(`  ${index + 1}. ${reg.company_name_english || reg.company_name} (Expired: ${reg.expire_date})`);
            });
        }

        // Test renewal functionality
        if (expired.length > 0 || (allRegistrations.length > 0)) {
            console.log('\n🧪 Testing renewal functionality...');

            const testReg = expired.length > 0 ? expired[0] : allRegistrations[0];
            const newExpireDays = 365;
            const startDate = new Date();
            const newExpireDate = new Date(startDate);
            newExpireDate.setDate(newExpireDate.getDate() + newExpireDays);

            await connection.execute(`
        UPDATE registrations 
        SET register_start_date = ?, expire_days = ?, expire_date = ?, is_expired = false
        WHERE id = ?
      `, [startDate.toISOString().split('T')[0], newExpireDays, newExpireDate.toISOString().split('T')[0], testReg.id]);

            console.log(`✅ Successfully renewed registration: ${testReg.company_name_english || testReg.company_name}`);
            console.log(`   New expire date: ${newExpireDate.toISOString().split('T')[0]}`);
        }

        console.log('\n🎉 Secretary Renew functionality test completed successfully!');

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
    testSecretaryRenew()
        .then(() => {
            console.log('🎉 Secretary Renew test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Secretary Renew test failed:', error);
            process.exit(1);
        });
}

module.exports = { testSecretaryRenew };

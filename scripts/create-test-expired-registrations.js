const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestExpiredRegistrations() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'banana_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('🔗 Connected to MySQL database');

        // Get existing completed registrations
        const [rows] = await connection.execute(`
      SELECT id, company_name_english, company_name, status 
      FROM registrations 
      WHERE status = 'completed'
      LIMIT 3
    `);

        if (rows.length === 0) {
            console.log('❌ No completed registrations found to make expired');
            return;
        }

        console.log(`📋 Found ${rows.length} completed registrations to make expired`);

        // Create expired registrations
        for (let i = 0; i < rows.length; i++) {
            const reg = rows[i];
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - (30 + i * 10)); // Different past dates

            await connection.execute(`
        UPDATE registrations 
        SET register_start_date = ?, expire_days = 30, expire_date = ?, is_expired = true
        WHERE id = ?
      `, [pastDate.toISOString().split('T')[0], pastDate.toISOString().split('T')[0], reg.id]);

            console.log(`✅ Made expired: ${reg.company_name_english || reg.company_name} (Expired: ${pastDate.toISOString().split('T')[0]})`);
        }

        // Verify expired registrations
        const [expiredRows] = await connection.execute(`
      SELECT id, company_name_english, company_name, expire_date, is_expired
      FROM registrations 
      WHERE is_expired = true AND status = 'completed'
    `);

        console.log(`\n📊 Created ${expiredRows.length} expired registrations:`);
        expiredRows.forEach((reg, index) => {
            console.log(`  ${index + 1}. ${reg.company_name_english || reg.company_name} (Expired: ${reg.expire_date})`);
        });

        console.log('\n🎉 Test expired registrations created successfully!');
        console.log('Now you can test the Secretary Renew page.');

    } catch (error) {
        console.error('❌ Failed to create test expired registrations:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run if called directly
if (require.main === module) {
    createTestExpiredRegistrations()
        .then(() => {
            console.log('🎉 Test expired registrations creation completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test expired registrations creation failed:', error);
            process.exit(1);
        });
}

module.exports = { createTestExpiredRegistrations };

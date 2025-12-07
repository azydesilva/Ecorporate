const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateExpiredStatus() {
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

        // Get all registrations with expire dates
        const [rows] = await connection.execute(`
      SELECT id, expire_date, is_expired, company_name_english, company_name 
      FROM registrations 
      WHERE expire_date IS NOT NULL
    `);

        console.log(`📋 Found ${rows.length} registrations with expire dates`);

        let updatedCount = 0;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        for (const row of rows) {
            const isExpired = row.expire_date < today;
            const currentExpiredStatus = row.is_expired;

            // Only update if the status has changed
            if (isExpired !== currentExpiredStatus) {
                await connection.execute(`
          UPDATE registrations 
          SET is_expired = ? 
          WHERE id = ?
        `, [isExpired, row.id]);

                const companyName = row.company_name_english || row.company_name || 'Unknown';
                console.log(`✅ Updated ${companyName}: ${currentExpiredStatus} → ${isExpired}`);
                updatedCount++;
            }
        }

        console.log(`🎉 Updated ${updatedCount} registrations`);
        console.log('✅ Expired status update completed successfully');

    } catch (error) {
        console.error('❌ Update failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run update if called directly
if (require.main === module) {
    updateExpiredStatus()
        .then(() => {
            console.log('🎉 Expired status update completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Expired status update failed:', error);
            process.exit(1);
        });
}

module.exports = { updateExpiredStatus };

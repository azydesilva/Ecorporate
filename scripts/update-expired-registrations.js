const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateExpiredRegistrations() {
    console.log('🔍 Checking and updating expired registrations...');
    
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'wp@XRT.2003',
        database: process.env.DB_NAME || 'banana_db',
        port: parseInt(process.env.DB_PORT || '3306'),
    };

    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Get today's date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        console.log(`📅 Today's date: ${todayStr}`);

        // Find registrations that should be marked as expired
        const [rows] = await connection.execute(
            `SELECT id, company_name, company_name_english, expire_date, is_expired 
             FROM registrations 
             WHERE status = 'completed' 
             AND expire_date IS NOT NULL 
             AND expire_date < ? 
             AND is_expired = 0`,
            [todayStr]
        );

        console.log(`📊 Found ${rows.length} registrations that should be marked as expired`);

        let updatedCount = 0;
        for (const row of rows) {
            const expireDate = new Date(row.expire_date);
            const isActuallyExpired = expireDate < today;
            
            if (isActuallyExpired) {
                console.log(`📝 Updating registration ${row.id}: ${row.company_name_english || row.company_name} (Expired: ${row.expire_date})`);
                
                // Update the is_expired flag
                await connection.execute(
                    'UPDATE registrations SET is_expired = 1 WHERE id = ?',
                    [row.id]
                );
                
                updatedCount++;
            }
        }

        console.log(`✅ Successfully updated ${updatedCount} registrations`);
        
        // Also check if there are any registrations incorrectly marked as expired
        const [incorrectRows] = await connection.execute(
            `SELECT id, company_name, company_name_english, expire_date, is_expired 
             FROM registrations 
             WHERE status = 'completed' 
             AND expire_date IS NOT NULL 
             AND expire_date >= ? 
             AND is_expired = 1`,
            [todayStr]
        );

        console.log(`📊 Found ${incorrectRows.length} registrations incorrectly marked as expired`);

        let correctedCount = 0;
        for (const row of incorrectRows) {
            const expireDate = new Date(row.expire_date);
            const isActuallyExpired = expireDate < today;
            
            if (!isActuallyExpired) {
                console.log(`📝 Correcting registration ${row.id}: ${row.company_name_english || row.company_name} (Not expired yet: ${row.expire_date})`);
                
                // Update the is_expired flag
                await connection.execute(
                    'UPDATE registrations SET is_expired = 0 WHERE id = ?',
                    [row.id]
                );
                
                correctedCount++;
            }
        }

        console.log(`✅ Successfully corrected ${correctedCount} registrations`);
        
        await connection.end();
        console.log('📡 Database connection closed');

    } catch (error) {
        console.error('❌ Error updating expired registrations:', error.message);
        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

updateExpiredRegistrations();
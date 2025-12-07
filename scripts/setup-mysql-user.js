const mysql = require('mysql2/promise');

// Script to set up MySQL user with password
async function setupMySQLUser() {
    console.log('🔐 Setting up MySQL user with password...\n');

    const rootConfig = {
        host: 'localhost',
        user: 'root',
        password: '', // Assuming root has no password initially
        port: 3306,
    };

    try {
        // Try to connect as root without password first
        let connection;
        try {
            connection = await mysql.createConnection(rootConfig);
            console.log('✅ Connected to MySQL as root (no password)');
        } catch (error) {
            // If that fails, try with the new password
            rootConfig.password = 'wp@XRT.2003';
            try {
                connection = await mysql.createConnection(rootConfig);
                console.log('✅ Connected to MySQL as root (with password)');
            } catch (error2) {
                console.error('❌ Cannot connect to MySQL. Please check:');
                console.error('   1. MySQL is running');
                console.error('   2. Root user exists');
                console.error('   3. Root password is correct');
                process.exit(1);
            }
        }

        // Set password for root user
        try {
            await connection.execute("ALTER USER 'root'@'localhost' IDENTIFIED BY 'wp@XRT.2003'");
            console.log('✅ Set password for root user');
        } catch (error) {
            if (error.code === 'ER_CANNOT_USER') {
                console.log('⚠️  Root user already has password set');
            } else {
                console.error('❌ Error setting password:', error.message);
            }
        }

        // Create database if it doesn't exist
        const dbName = 'banana_db';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✅ Database '${dbName}' created or already exists`);

        // Grant privileges to root user
        try {
            await connection.execute(`GRANT ALL PRIVILEGES ON ${dbName}.* TO 'root'@'localhost'`);
            await connection.execute('FLUSH PRIVILEGES');
            console.log('✅ Granted privileges to root user');
        } catch (error) {
            console.log('⚠️  Privileges already granted or error:', error.message);
        }

        await connection.end();
        console.log('\n🎉 MySQL user setup completed successfully!');
        console.log('📋 Database configuration:');
        console.log(`   Host: localhost`);
        console.log(`   User: root`);
        console.log(`   Password: wp@XRT.2003`);
        console.log(`   Database: ${dbName}`);
        console.log(`   Port: 3306`);

    } catch (error) {
        console.error('❌ MySQL user setup failed:', error);
        process.exit(1);
    }
}

// Run the setup
setupMySQLUser();

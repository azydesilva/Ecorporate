const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Auto-setup script for DashboardPro
async function autoSetup() {
    console.log('🚀 Starting DashboardPro Auto-Setup...\n');

    try {
        // 1. Create all necessary directories
        await createDirectories();

        // 2. Initialize database
        await initializeDatabase();

        // 3. Create .gitkeep files for empty directories
        await createGitkeepFiles();

        // 4. Verify setup
        await verifySetup();

        console.log('\n🎉 Auto-Setup completed successfully!');
        console.log('✅ Your DashboardPro application is ready to run.');
        console.log('\n📋 Next steps:');
        console.log('   1. Start XAMPP (Apache & MySQL)');
        console.log('   2. Run: npm run dev');
        console.log('   3. Open: http://localhost:3000');

    } catch (error) {
        console.error('\n❌ Auto-Setup failed:', error);
        process.exit(1);
    }
}

async function createDirectories() {
    console.log('📁 Creating directory structure...');

    const directories = [
        'public/uploads',
        'public/uploads/images',
        'public/uploads/documents',
        'public/uploads/temp',
        'public/logs',
        'public/cache',
        'data',
        'data/backups',
        'data/exports'
    ];

    for (const dir of directories) {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`✅ Created: ${dir}`);
        } else {
            console.log(`⚠️  Already exists: ${dir}`);
        }
    }
}

async function initializeDatabase() {
    console.log('\n🗄️  Initializing database...');

    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: 'wp@XRT.2003',
        port: 3306,
    };

    try {
        // Create connection without database
        const connection = await mysql.createConnection(dbConfig);

        // Create database if it doesn't exist
        await connection.execute('CREATE DATABASE IF NOT EXISTS banana_db');
        console.log('✅ Database created: banana_db');

        // Use the database
        await connection.execute('USE banana_db');

        // Create tables
        await createTables(connection);

        // Insert default data
        await insertDefaultData(connection);

        await connection.end();
        console.log('✅ Database initialization completed');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.log('⚠️  Make sure XAMPP is running with MySQL service started');
        throw error;
    }
}

async function createTables(connection) {
    console.log('📋 Creating database tables...');

    const tables = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'customer') DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,

        // Registrations table with all columns
        `CREATE TABLE IF NOT EXISTS registrations (
            id VARCHAR(255) PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            contact_person_name VARCHAR(255) NOT NULL,
            contact_person_email VARCHAR(255) NOT NULL,
            contact_person_phone VARCHAR(255) NOT NULL,
            selected_package VARCHAR(255) NOT NULL,
            payment_method VARCHAR(50) DEFAULT 'bankTransfer',
            current_step VARCHAR(50) DEFAULT 'contact-details',
            status VARCHAR(50) DEFAULT 'payment-processing',
            payment_approved BOOLEAN DEFAULT FALSE,
            details_approved BOOLEAN DEFAULT FALSE,
            documents_approved BOOLEAN DEFAULT FALSE,
                    documents_published BOOLEAN DEFAULT FALSE,
        documents_acknowledged BOOLEAN DEFAULT FALSE,
        payment_receipt JSON,
            balance_payment_receipt JSON,
            form1 JSON,
            form19 JSON,
            aoa JSON,
            form18 JSON,
            address_proof JSON,
            -- Customer Signed Documents (separate columns)
            customer_form1 JSON,
            customer_form19 JSON,
            customer_aoa JSON,
            customer_form18 JSON,
            customer_address_proof JSON,
                        incorporation_certificate JSON,
            step3_additional_doc JSON,
    
        -- Company Details Fields
            company_name_english VARCHAR(255),
            company_name_sinhala VARCHAR(255),
            is_foreign_owned VARCHAR(10),
            business_address_number VARCHAR(255),
            business_address_street VARCHAR(255),
            business_address_city VARCHAR(255),
            postal_code VARCHAR(20),
            shares_amount VARCHAR(50),
            number_of_shareholders VARCHAR(10),
            shareholders JSON,
            make_simple_books_secretary VARCHAR(10),
            number_of_directors VARCHAR(10),
            directors JSON,
            exports_to_add TEXT,
            register_start_date DATE NULL,
            expire_days INT NULL,
            expire_date DATE NULL,
            is_expired BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,

        // Packages table
        `CREATE TABLE IF NOT EXISTS packages (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            advance_amount DECIMAL(10,2) DEFAULT 0,
            balance_amount DECIMAL(10,2) DEFAULT 0,
            features JSON,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,

        // Bank details table
        `CREATE TABLE IF NOT EXISTS bank_details (
            id VARCHAR(255) PRIMARY KEY,
            bank_name VARCHAR(255) NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            account_number VARCHAR(255) NOT NULL,
            branch VARCHAR(255),
            swift_code VARCHAR(50),
            additional_instructions TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,

        // Settings table
        `CREATE TABLE IF NOT EXISTS settings (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255),
            description TEXT,
            logo_url VARCHAR(500),
            favicon_url VARCHAR(500),
            primary_color VARCHAR(7) DEFAULT '#000000',
            secondary_color VARCHAR(7) DEFAULT '#ffffff',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
    ];

    for (const tableQuery of tables) {
        await connection.execute(tableQuery);
    }

    console.log('✅ All tables created successfully');
}

async function insertDefaultData(connection) {
    console.log('📝 Inserting default data...');

    try {
        // Insert default Admin
        await connection.execute(`
            INSERT IGNORE INTO users (id, name, email, password, role) 
            VALUES ('admin-1', 'Admin', 'admin@example.com', 'admin123', 'admin')
        `);
        console.log('✅ Default Admin created');

        // Insert default settings
        await connection.execute(`
            INSERT IGNORE INTO settings (id, title, description, primary_color, secondary_color) 
            VALUES ('default', 'DashboardPro', 'CENTRAL COURT (PRIVATE) LIMITED.', '#000000', '#ffffff')
        `);
        console.log('✅ Default settings created');

        // Insert sample packages
        const packages = [
            {
                id: 'pkg-1',
                name: 'Basic Package',
                description: 'Essential company registration services',
                price: 50000.00,
                advance_amount: 25000.00,
                balance_amount: 25000.00,
                features: JSON.stringify(['Company Registration', 'Basic Documentation', 'Email Support'])
            },
            {
                id: 'pkg-2',
                name: 'Premium Package',
                description: 'Complete registration with additional services',
                price: 75000.00,
                advance_amount: 37500.00,
                balance_amount: 37500.00,
                features: JSON.stringify(['Company Registration', 'Complete Documentation', 'Priority Support', 'Legal Consultation'])
            }
        ];

        for (const pkg of packages) {
            await connection.execute(`
                INSERT IGNORE INTO packages (id, name, description, price, advance_amount, balance_amount, features)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [pkg.id, pkg.name, pkg.description, pkg.price, pkg.advance_amount, pkg.balance_amount, pkg.features]);
        }
        console.log('✅ Sample packages created');

    } catch (error) {
        console.error('❌ Error inserting default data:', error);
    }
}

async function createGitkeepFiles() {
    console.log('\n📄 Creating .gitkeep files...');

    const emptyDirs = [
        'public/uploads/images',
        'public/uploads/documents',
        'public/uploads/temp',
        'public/logs',
        'public/cache',
        'data/backups',
        'data/exports'
    ];

    for (const dir of emptyDirs) {
        const gitkeepPath = path.join(process.cwd(), dir, '.gitkeep');
        if (!fs.existsSync(gitkeepPath)) {
            fs.writeFileSync(gitkeepPath, '# This file ensures the directory is tracked in git\n');
            console.log(`✅ Created .gitkeep in: ${dir}`);
        }
    }
}

async function verifySetup() {
    console.log('\n🔍 Verifying setup...');

    // Check directories
    const requiredDirs = [
        'public/uploads',
        'public/uploads/images',
        'public/uploads/documents',
        'public/uploads/temp'
    ];

    for (const dir of requiredDirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (fs.existsSync(dirPath)) {
            console.log(`✅ Directory exists: ${dir}`);
        } else {
            console.log(`❌ Directory missing: ${dir}`);
        }
    }

    // Test database connection
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: null,
            database: 'banana_db',
            port: 3306,
        });

        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`✅ Database connected: ${rows[0].count} users found`);

        await connection.end();
    } catch (error) {
        console.log('⚠️  Database connection test failed (make sure XAMPP is running)');
    }
}

// Run auto-setup
autoSetup(); 
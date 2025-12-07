# Database Setup Guide

This guide provides comprehensive database installation and setup for the DashboardFinal application with verification to ensure all components are properly installed.

## 🚀 Quick Start

### Option 1: Complete Database Installation (Recommended)
```bash
# This will install ALL database components with verification
npm run install-db
```

### Option 2: Automatic Setup with App Start
```bash
# This will ensure database setup, then start the app
npm run startup
```

### Option 3: Manual Setup
```bash
# Step 1: Ensure database setup
npm run ensure-db

# Step 2: Verify setup (optional)
npm run verify-db

# Step 3: Start the application
npm run dev
```

## 🎯 What the Installation Script Does

The `npm run install-db` command performs a comprehensive database installation:

### 1. **Database Creation**
- Creates MySQL database if it doesn't exist
- Establishes connection with proper credentials
- Configures database with UTF-8 encoding

### 2. **Table Creation**
- **`users`** - User accounts (admin/customer) with role-based access
- **`registrations`** - Company registration data with full lifecycle tracking
- **`packages`** - Service packages with pricing and features
- **`bank_details`** - Bank account information for payments
- **`settings`** - Application configuration and branding

### 3. **Column Verification**
Ensures all critical columns exist in the `registrations` table:
- **Process Tracking**: `current_step`, `status`, approval flags
- **Documents**: `form1`, `form19`, `aoa`, `form18`, `address_proof`
- **Shareholders Data**: Complete JSON structure with all fields
- **Customer Documents**: `customer_*` versions for signed documents
- **Additional Documents**: `step3_additional_doc`, `step3_signed_additional_doc`, `step4_final_additional_doc`
- **Company Details**: `company_name_english`, `company_name_sinhala`
- **Business Info**: `shareholders`, `directors`, address fields

### 4. **Performance Optimization**
- Creates database indexes for faster queries
- Optimizes foreign key relationships
- Sets up proper column types and constraints

### 5. **Default Data Population**
- **Admin User**: `admin@company.com` / `password`
- **Test Customer**: `customer@test.com` / `password`
- **Service Packages**: Startup, Standard, Premium packages
- **Bank Details**: Default payment account information
- **Settings**: Application branding and configuration

### 6. **Migration Execution**
- Runs all database migrations automatically
- Ensures backward compatibility
- Handles schema updates safely

### 7. **Shareholder Fields Migration** ⭐
**NEW**: Comprehensive shareholder data structure support:
- **Basic Information**: type, residency, isDirector, shares
- **Natural Person Fields**: fullName, nicNumber, passportNo, passportIssuedCountry
- **Legal Entity Fields**: companyName, companyRegistrationNumber
- **Contact Information**: email, contactNumber
- **Address Fields**: 
  - Sri Lankan: fullAddress, postalCode, province, district, divisionalSecretariat
  - Foreign/Legal Entity: fullAddress, postalCode, city, stateRegionProvince, country
- **Documents**: Complete document management array
- **Beneficiary Owners**: Full local and foreign beneficiary support with all address fields

### 8. **Comprehensive Verification**
- Verifies all tables exist and are accessible
- Checks all critical columns are present
- Validates data integrity and relationships
- Confirms default data is properly inserted

## 📋 Installation Output

When you run `npm run install-db`, you'll see detailed progress:

```
🚀 Starting comprehensive database installation...

📡 Connecting to MySQL server...
✅ Connected to MySQL server successfully

🏗️ Creating database 'banana_db'...
✅ Database 'banana_db' created or already exists
✅ Using database 'banana_db'

📋 Creating all database tables...
  ✅ users table created
  ✅ registrations table created
  ✅ packages table created
  ✅ bank_details table created
  ✅ settings table created

🔧 Ensuring all required columns exist...
  ✅ Added missing column: form19

⚡ Creating database indexes...
  ✅ Database indexes created

📝 Inserting default data...
  ✅ Default data inserted

🔄 Running database migrations...
  ✅ Migrations completed

🔍 Verifying database installation...
  ✅ users table verified
  ✅ registrations table verified
  ✅ packages table verified
  ✅ bank_details table verified
  ✅ settings table verified

🎉 Database installation completed successfully in 2.34s!
✨ All tables, columns, and data are properly installed

📊 Installation Summary:

✅ Tables: 5/5 installed
✅ Columns: 18/18 installed

📝 Default Data:
   • Users: 4
   • Packages: 5
   • Bank Details: 3
   • Settings: 2

🎯 Next Steps:
   • Run npm run dev to start the application
   • Login with: admin@example.com / password123
   • Access database at: localhost:3306/banana_db
```

## 🔧 Available Scripts

| Script | Command | Purpose | Verification |
|--------|---------|---------|-------------|
| **install-db** | `npm run install-db` | 🎯 **Complete installation with verification** | ✅ Full verification |
| **ensure-db** | `npm run ensure-db` | Creates all tables and columns | ⚠️ Basic checks |
| **verify-db** | `npm run verify-db` | Checks if everything is set up correctly | ✅ Detailed verification |
| **startup** | `npm run startup` | Ensures DB setup + starts development server | ✅ Quick verification |
| **init-db** | `npm run init-db` | Legacy initialization script | ⚠️ Limited checks |
| **migrate-db** | `npm run migrate-db` | Runs database migrations | ✅ Migration verification |

### 🎆 Recommended Usage

**For New Setup:**
```bash
npm run install-db  # Complete installation with full verification
```

**For Development:**
```bash
npm run startup     # Quick setup + start app
```

**For Troubleshooting:**
```bash
npm run verify-db   # Check what's missing
npm run install-db  # Fix any issues
```

## 🔍 Verification Features

The installation script includes comprehensive verification:

### 📋 Table Verification
- Checks existence of all 5 required tables
- Verifies table structure and relationships
- Ensures proper column types and constraints

### 🔧 Column Verification
- Validates all 20+ critical columns in registrations table
- Checks data types and default values
- Ensures foreign key relationships

### 📝 Data Verification
- Confirms default admin and customer users exist
- Validates service packages are properly configured
- Checks bank details and settings are populated

### ⚡ Performance Verification
- Ensures database indexes are created
- Validates query optimization settings
- Checks connection pooling configuration

## 🔄 Environment Variables

Ensure your `.env.local` file has the correct database settings:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_PORT=3306
DB_NAME=banana_db

# Optional: Advanced Settings
DB_CONNECTION_LIMIT=10
DB_TIMEOUT=60000
```

### 🔑 Default Credentials

After installation, you can login with:

- **Admin Account**: `admin@example.com` / `password123`
<!-- - **Test Customer**: `customer@test.com` / `password` --> 

> ⚠️ **Security Note**: Change default passwords in production!

## 🛠️ Troubleshooting

### 🔴 Common Issues

#### Database Connection Issues
```bash
# Check if MySQL is running
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# Test connection manually
mysql -u root -p
```

#### Permission Issues
```sql
-- Grant proper permissions
GRANT ALL PRIVILEGES ON banana_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Missing Columns Error
```bash
# Run the complete installation to fix missing columns
npm run install-db
```

#### Port Already in Use
```bash
# Check what's using port 3306
lsof -i :3306

# Kill conflicting process
kill -9 <PID>
```

### 🟢 Verification Commands

```bash
# Check database exists
mysql -u root -p -e "SHOW DATABASES;"

# Verify tables
mysql -u root -p banana_db -e "SHOW TABLES;"

# Check registrations table structure
mysql -u root -p banana_db -e "DESCRIBE registrations;"

# Verify data counts
mysql -u root -p banana_db -e "SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM packages) as packages,
  (SELECT COUNT(*) FROM bank_details) as bank_details,
  (SELECT COUNT(*) FROM settings) as settings;"
```

## 📊 Verification Output

When you run `npm run verify-db`, you should see:

```
✅ Connected to database

📋 Checking tables...
✅ users table exists
✅ registrations table exists
✅ packages table exists
✅ bank_details table exists
✅ settings table exists

🔍 Checking registrations table columns...
✅ id column exists
✅ user_id column exists
... (all 27 critical columns)

📝 Checking default data...
✅ Users count: 4
✅ Packages count: 5
✅ Settings count: 2
✅ Bank details count: 3

📊 Summary:
✅ Tables: 5/5 exist
✅ Critical columns: 28/28 exist
🎉 Database is fully set up and ready to use!
```

## 🔄 Environment Variables

Make sure your `.env.local` file has the correct database settings:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_PORT=3306
DB_NAME=banana_db
```

## 🎯 Best Practices

1. **Always run `npm run ensure-db`** when setting up a new environment
2. **Use `npm run startup`** for development to ensure everything is ready
3. **Run `npm run verify-db`** if you suspect database issues
4. **Check the verification output** to ensure all critical columns exist

## 🚨 Important Notes

- The `ensure-db` script is **idempotent** - it's safe to run multiple times
- Missing columns will be automatically added
- Default data (Admin, packages, settings) will be created if missing
- The script uses `INSERT IGNORE` to avoid duplicate data errors

#!/bin/bash

echo "🍎 Setting up MySQL for macOS..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "🗄️ Installing MySQL..."
    brew install mysql
    
    echo "🚀 Starting MySQL service..."
    brew services start mysql
    
    # Wait for MySQL to start
    echo "⏳ Waiting for MySQL to start..."
    sleep 5
else
    echo "✅ MySQL is already installed"
    
    # Start MySQL service if not running
    if ! brew services list | grep mysql | grep started &> /dev/null; then
        echo "🚀 Starting MySQL service..."
        brew services start mysql
        sleep 3
    fi
fi

# Check if we can connect to MySQL
echo "🔍 Testing MySQL connection..."

# Try to connect without password first
if mysql -u root -e "SELECT 1;" &> /dev/null; then
    echo "✅ MySQL root has no password, setting password..."
    mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'wp@XRT.2003'; FLUSH PRIVILEGES;"
elif mysql -u root -p'wp@XRT.2003' -e "SELECT 1;" &> /dev/null; then
    echo "✅ MySQL root password is already set correctly"
else
    echo "❌ Cannot connect to MySQL. Running secure installation..."
    echo "Please follow the prompts and set root password to: wp@XRT.2003"
    mysql_secure_installation
fi

# Create database
echo "🗄️ Creating database..."
mysql -u root -p'wp@XRT.2003' -e "CREATE DATABASE IF NOT EXISTS banana_db;" 2>/dev/null || {
    echo "❌ Failed to create database. Please check MySQL connection."
    exit 1
}

# Create environment file
echo "📝 Creating environment file..."
cat > .env.local << 'EOF'
# Database Configuration for banana_db
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=wp@XRT.2003
DB_NAME=banana_db
DB_PORT=3306

# Next.js Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
EOF

echo "✅ MySQL setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm run init-db"
echo "2. Run: npm run dev"
echo ""
echo "🔐 Default admin login:"
echo "   Email: admin@example.com"
echo "   Password: admin123"

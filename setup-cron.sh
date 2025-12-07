#!/bin/bash

# Setup script for automatic daily expiry checks
# This will configure a cron job to run every day at 9 AM

echo "=========================================="
echo "🔧 Setting up Automatic Expiry Checks"
echo "=========================================="
echo ""

# Get the current directory
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 Project directory: $CURRENT_DIR"
echo ""

# Create logs directory if it doesn't exist
mkdir -p "$CURRENT_DIR/logs"
echo "✅ Logs directory created/verified"
echo ""

# Create the cron job command
CRON_COMMAND="0 9 * * * cd $CURRENT_DIR && npm run check-expired-companies >> $CURRENT_DIR/logs/expiry-check.log 2>&1"

echo "📝 Cron job command:"
echo "$CRON_COMMAND"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "check-expired-companies"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    echo "Current crontab:"
    crontab -l | grep "check-expired-companies"
    echo ""
    echo "Do you want to replace it? (y/n)"
    read -r REPLACE
    
    if [ "$REPLACE" != "y" ] && [ "$REPLACE" != "Y" ]; then
        echo "❌ Setup cancelled"
        exit 0
    fi
    
    # Remove old cron job
    crontab -l 2>/dev/null | grep -v "check-expired-companies" | crontab -
    echo "🗑️  Old cron job removed"
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

echo "✅ Cron job added successfully!"
echo ""

echo "=========================================="
echo "📊 Verification"
echo "=========================================="
echo ""

# Verify cron job was added
if crontab -l | grep -q "check-expired-companies"; then
    echo "✅ Cron job is active:"
    crontab -l | grep "check-expired-companies"
    echo ""
    echo "Schedule: Every day at 9:00 AM"
    echo "Log file: $CURRENT_DIR/logs/expiry-check.log"
    echo ""
    echo "=========================================="
    echo "✅ Setup Complete!"
    echo "=========================================="
    echo ""
    echo "📋 Useful commands:"
    echo ""
    echo "View logs:"
    echo "  tail -f $CURRENT_DIR/logs/expiry-check.log"
    echo ""
    echo "Test manually:"
    echo "  npm run check-expired-companies"
    echo ""
    echo "View crontab:"
    echo "  crontab -l"
    echo ""
    echo "Remove cron job:"
    echo "  crontab -l | grep -v 'check-expired-companies' | crontab -"
    echo ""
else
    echo "❌ Failed to add cron job"
    exit 1
fi


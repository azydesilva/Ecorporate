#!/usr/bin/env node
/*
  Script: add-shared-with-emails-column.js
  Purpose: Ensure `shared_with_emails` JSON column exists on `registrations` table.

  Usage:
    node scripts/add-shared-with-emails-column.js

  Notes:
    - Uses the repository's DB connection helper at lib/database.js (or lib/database.ts compiled to JS at runtime).
    - If your environment variables are required (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME), ensure they are set.
    - This script will attempt to add the column only if it doesn't already exist.
*/

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const path = require('path')
const fs = require('fs')

async function main() {
  try {
    // Create a direct MySQL connection pool using env vars so this script can run standalone
    const mysql = require('mysql2/promise')
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'banana_db',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    }

    console.log('Connecting to database with config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });

    const pool = mysql.createPool(dbConfig)
    const connection = await pool.getConnection()

    try {
      // Check if column exists
      const [cols] = await connection.execute(`SHOW COLUMNS FROM registrations LIKE 'shared_with_emails'`)
      if (Array.isArray(cols) && cols.length > 0) {
        console.log('✅ Column `shared_with_emails` already exists on registrations table.')
      } else {
        console.log('➕ Adding `shared_with_emails` JSON column to registrations table...')
        // Add column as JSON NULL after a safe column (use last default to be safe)
        await connection.execute(`ALTER TABLE registrations ADD COLUMN shared_with_emails JSON NULL`)
        console.log('✅ Column added successfully.')
      }
    } catch (err) {
      console.error('❌ Error while checking/adding column:', err)
      process.exitCode = 2
    } finally {
      try { connection.release() } catch (e) { }
      await pool.end();
    }

    process.exit(process.exitCode || 0)
  } catch (error) {
    console.error('Unexpected error in migration script:', error)
    process.exit(1)
  }
}

main()
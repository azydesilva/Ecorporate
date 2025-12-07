#!/usr/bin/env node
// Script to test JSON_SEARCH function with shared_with_emails column

require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

async function testJsonSearch() {
    try {
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'banana_db',
            port: parseInt(process.env.DB_PORT || '3306'),
        };

        console.log('Connecting to database...');
        const pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();

        // First, let's insert a test row with shared_with_emails data
        console.log('Inserting test data...');
        const testId = 'test_' + Date.now();
        const testEmails = ['test@example.com', 'admin@example.com'];

        await connection.execute(
            "INSERT INTO registrations (id, company_name, contact_person_name, contact_person_email, contact_person_phone, selected_package) VALUES (?, ?, ?, ?, ?, ?)",
            [testId, 'Test Company', 'Test Person', 'contact@test.com', '1234567890', 'basic']
        );

        await connection.execute(
            "UPDATE registrations SET shared_with_emails = ? WHERE id = ?",
            [JSON.stringify(testEmails), testId]
        );

        console.log('Test data inserted with shared_with_emails:', testEmails);

        // Now test the JSON_SEARCH function
        console.log('Testing JSON_SEARCH function...');
        const [results] = await connection.execute(
            "SELECT id, shared_with_emails, JSON_SEARCH(shared_with_emails, 'one', ?) as search_result FROM registrations WHERE id = ?",
            ['admin@example.com', testId]
        );

        console.log('JSON_SEARCH results:', results);

        // Test the actual query that was failing
        console.log('Testing the exact query that was failing...');
        const [filteredResults] = await connection.execute(
            "SELECT * FROM registrations WHERE JSON_SEARCH(shared_with_emails, 'one', ?) IS NOT NULL",
            ['admin@example.com']
        );

        console.log('Filtered results count:', filteredResults.length);
        if (filteredResults.length > 0) {
            console.log('✅ Query works correctly!');
        } else {
            console.log('⚠️ Query returned no results');
        }

        // Clean up test data
        await connection.execute("DELETE FROM registrations WHERE id = ?", [testId]);
        console.log('Test data cleaned up');

        connection.release();
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

testJsonSearch();
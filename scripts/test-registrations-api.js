const http = require('http');

// Test the registrations API endpoint
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/registrations?userEmail=admin@example.com',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('Testing registrations API with userEmail parameter...');
console.log('Request:', options);

const req = http.request(options, (res) => {
    console.log('Response status:', res.statusCode);
    console.log('Response headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('Response data:', jsonData);
        } catch (e) {
            console.log('Response data (raw):', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error.message);
});

req.end();
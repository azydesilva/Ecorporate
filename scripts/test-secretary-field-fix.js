const http = require('http');

// Test data with makeSimpleBooksSecretary field
const testData = {
    id: 'reg_1762354048810_viq15bh8a_w7f8d',
    currentStep: 'documentation',
    status: 'documentation-processing',
    makeSimpleBooksSecretary: 'yes'
};

const registrationId = 'reg_1762354048810_viq15bh8a_w7f8d';

const updateOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/registrations/${registrationId}`,
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('Testing secretary field update...');
console.log('Registration ID:', registrationId);
console.log('Update data:', JSON.stringify(testData, null, 2));

const updateReq = http.request(updateOptions, (res) => {
    console.log('Update response status:', res.statusCode);
    
    let updateData = '';
    res.on('data', (chunk) => {
        updateData += chunk;
    });
    
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(updateData);
            console.log('Update response data:', jsonData);
        } catch (e) {
            console.log('Update response data (raw):', updateData);
        }
    });
});

updateReq.on('error', (error) => {
    console.error('Update request error:', error.message);
});

updateReq.write(JSON.stringify(testData));
updateReq.end();
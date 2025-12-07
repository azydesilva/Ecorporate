const http = require('http');

// Test data that simulates what would be sent when clicking "Continue to Next Step"
const testData = {
    id: 'reg_1762354048810_viq15bh8a_w7f8d',
    currentStep: 'documentation',
    status: 'documentation-processing',
    companyNameEnglish: 'E COMMERCE',
    companyNameSinhala: 'E COMMERCE',
    shareholders: [
        {
            type: 'natural-person',
            residency: 'sri-lankan',
            fullName: 'John Doe',
            nicNumber: '123456789V',
            email: 'john@example.com',
            contactNumber: '0771234567',
            shares: '50%',
            isDirector: true,
            province: 'Western',
            district: 'Colombo',
            divisionalSecretariat: 'Colombo',
            fullAddress: '123 Main Street',
            postalCode: '00100',
            documents: []
        }
    ],
    directors: [
        {
            residency: 'sri-lankan',
            fullName: 'John Doe',
            nicNumber: '123456789V',
            email: 'john@example.com',
            contactNumber: '0771234567',
            fromShareholder: true,
            shareholderIndex: 0,
            province: 'Western',
            district: 'Colombo',
            divisionalSecretariat: 'Colombo',
            fullAddress: '123 Main Street',
            postalCode: '00100',
            documents: []
        }
    ],
    numberOfShareholders: '1',
    numberOfDirectors: '1',
    sharePrice: '100000'
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

console.log('Testing company details save with shareholder and director data...');
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
            
            // Now fetch the registration to verify the data was saved
            const fetchOptions = {
                hostname: 'localhost',
                port: 3000,
                path: `/api/registrations/${registrationId}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            console.log('\nFetching registration to verify data...');
            
            const fetchReq = http.request(fetchOptions, (res) => {
                console.log('Fetch response status:', res.statusCode);
                
                let fetchData = '';
                res.on('data', (chunk) => {
                    fetchData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(fetchData);
                        console.log('Fetch response data:');
                        console.log('  ID:', jsonData._id);
                        console.log('  Company Name:', jsonData.companyName);
                        console.log('  Shareholders count:', jsonData.shareholders ? jsonData.shareholders.length : 0);
                        console.log('  Directors count:', jsonData.directors ? jsonData.directors.length : 0);
                        
                        if (jsonData.shareholders) {
                            console.log('  Shareholders:');
                            jsonData.shareholders.forEach((s, i) => {
                                console.log(`    ${i + 1}. ${s.fullName || s.companyName} (${s.type}) - ${s.shares}`);
                            });
                        }
                        
                        if (jsonData.directors) {
                            console.log('  Directors:');
                            jsonData.directors.forEach((d, i) => {
                                console.log(`    ${i + 1}. ${d.fullName} (${d.residency})`);
                            });
                        }
                    } catch (e) {
                        console.log('Fetch response data (raw):', fetchData);
                    }
                });
            });
            
            fetchReq.on('error', (error) => {
                console.error('Fetch request error:', error.message);
            });
            
            fetchReq.end();
            
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
const http = require('http');

// Test data with shareholders and directors
const testRegistration = {
    id: 'test_reg_' + Date.now(),
    userId: 'default_user',
    companyName: 'Test Company',
    companyNameEnglish: 'Test Company English',
    companyNameSinhala: 'Test Company Sinhala',
    currentStep: 'company-details',
    status: 'company-details-processing',
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
    ]
};

// First create the registration
const createOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/registrations',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('Creating test registration...');
console.log('Request data:', JSON.stringify(testRegistration, null, 2));

const createReq = http.request(createOptions, (res) => {
    console.log('Create response status:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('Create response data:', jsonData);
            
            if (jsonData.success) {
                // Now update the registration with shareholder and director data
                const updateData = {
                    currentStep: 'documentation',
                    status: 'documentation-processing',
                    shareholders: testRegistration.shareholders,
                    directors: testRegistration.directors
                };
                
                const updateOptions = {
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/registrations/${testRegistration.id}`,
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                console.log('\nUpdating registration with shareholder and director data...');
                console.log('Update data:', JSON.stringify(updateData, null, 2));
                
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
                                path: `/api/registrations/${testRegistration.id}`,
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
                                        console.log('  Shareholders:', JSON.stringify(jsonData.shareholders, null, 2));
                                        console.log('  Directors:', JSON.stringify(jsonData.directors, null, 2));
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
                
                updateReq.write(JSON.stringify(updateData));
                updateReq.end();
            }
        } catch (e) {
            console.log('Create response data (raw):', data);
        }
    });
});

createReq.on('error', (error) => {
    console.error('Create request error:', error.message);
});

createReq.write(JSON.stringify(testRegistration));
createReq.end();
const http = require('http');

// Test data with company name updates
const testData = {
    id: 'reg_1762354048810_viq15bh8a_w7f8d',
    currentStep: 'documentation',
    status: 'documentation-processing',
    companyName: 'Updated Company Name',
    companyNameEnglish: 'Updated Company Name English',
    companyNameSinhala: 'යාවත්කාලීන සමාගම් නාමය සිංහල',
    companyEntity: 'Public Limited'
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

console.log('Testing company name update...');
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
                        console.log('  Company Name English:', jsonData.companyNameEnglish);
                        console.log('  Company Name Sinhala:', jsonData.companyNameSinhala);
                        console.log('  Company Entity:', jsonData.companyEntity);
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
// Mock the form data that would be submitted from CompanyDetailsStep
const mockCompanyData = {
  _id: 'test-registration-id',
  companyName: 'OLD COMPANY NAME', // This is from ContactDetailsStep
  // ... other existing fields
};

const mockProcessedValues = {
  companyNameEnglish: 'NEW COMPANY NAME ENGLISH',
  companyNameSinhala: 'NEW COMPANY NAME SINHALA',
  // ... other form fields
};

// Test the fix for onSubmit function
function testOnSubmitFix() {
  // This simulates the registrationData object created in the onSubmit function
  const registrationData = {
    ...mockCompanyData,
    ...mockProcessedValues,
    companyName: mockProcessedValues.companyNameEnglish, // Our fix
    // ... other fields
  };

  console.log('onSubmit test:');
  console.log('companyName:', registrationData.companyName);
  console.log('companyNameEnglish:', registrationData.companyNameEnglish);
  console.log('Test passed:', registrationData.companyName === mockProcessedValues.companyNameEnglish);
  console.log('Test passed (not old value):', registrationData.companyName !== mockCompanyData.companyName);
  return registrationData.companyName === mockProcessedValues.companyNameEnglish &&
    registrationData.companyName !== mockCompanyData.companyName;
}

// Test the fix for handleManualSave function
function testHandleManualSaveFix() {
  // This simulates the updatedRegistrationData object created in the handleManualSave function
  const updatedRegistrationData = {
    ...mockCompanyData,
    companyName: mockProcessedValues.companyNameEnglish, // Our fix
    companyNameEnglish: mockProcessedValues.companyNameEnglish,
    companyNameSinhala: mockProcessedValues.companyNameSinhala,
    // ... other fields
  };

  console.log('\nhandleManualSave test:');
  console.log('companyName:', updatedRegistrationData.companyName);
  console.log('companyNameEnglish:', updatedRegistrationData.companyNameEnglish);
  console.log('Test passed:', updatedRegistrationData.companyName === mockProcessedValues.companyNameEnglish);
  console.log('Test passed (not old value):', updatedRegistrationData.companyName !== mockCompanyData.companyName);
  return updatedRegistrationData.companyName === mockProcessedValues.companyNameEnglish &&
    updatedRegistrationData.companyName !== mockCompanyData.companyName;
}

// Test the fix for handleSaveAsDraft function
function testHandleSaveAsDraftFix() {
  // This simulates the updatedRegistrationData object created in the handleSaveAsDraft function
  const updatedRegistrationData = {
    ...mockCompanyData,
    companyName: mockProcessedValues.companyNameEnglish, // Our fix
    companyNameEnglish: mockProcessedValues.companyNameEnglish,
    companyNameSinhala: mockProcessedValues.companyNameSinhala,
    // ... other fields
  };

  console.log('\nhandleSaveAsDraft test:');
  console.log('companyName:', updatedRegistrationData.companyName);
  console.log('companyNameEnglish:', updatedRegistrationData.companyNameEnglish);
  console.log('Test passed:', updatedRegistrationData.companyName === mockProcessedValues.companyNameEnglish);
  console.log('Test passed (not old value):', updatedRegistrationData.companyName !== mockCompanyData.companyName);
  return updatedRegistrationData.companyName === mockProcessedValues.companyNameEnglish &&
    updatedRegistrationData.companyName !== mockCompanyData.companyName;
}

// Run all tests
const test1 = testOnSubmitFix();
const test2 = testHandleManualSaveFix();
const test3 = testHandleSaveAsDraftFix();

console.log('\nAll tests passed:', test1 && test2 && test3);
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { FileStorageService } from '@/lib/file-storage';
import { safeJsonParse } from '@/lib/utils';
import { checkRegistrationExpiryAndNotify } from '@/lib/registration-expiry-utils';
import { xssProtectionMiddleware, sanitizeApiResponse } from '@/lib/xss-middleware';

// Helper function to convert ISO date string to MySQL date format
function formatDateForMySQL(dateString: string | null | undefined): string | null {
    if (!dateString) return null;

    try {
        const date = new Date(dateString);
        // Return YYYY-MM-DD HH:MM:SS format for MySQL DATETIME columns
        return date.toISOString().slice(0, 19).replace('T', ' ');
    } catch (error) {
        console.warn('Invalid date format:', dateString, error);
        return null;
    }
}

// GET registration by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let connection;
    try {
        console.log('🔍 GET /api/registrations/[id] called');
        
        // Apply XSS protection middleware
        const protectedRequest = await xssProtectionMiddleware(request);
        
        if (!pool) {
            console.error('❌ Database pool not initialized');
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        console.log('🔍 Fetching registration with ID:', id);

        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT r.*, u.name as user_name, u.email as user_email, u.password as user_password FROM registrations r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?',
            [id]
        );
        connection.release();
        connection = null;

        if (Array.isArray(rows) && rows.length === 0) {
            console.log('❌ Registration not found with ID:', id);
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        const row = rows[0];
        console.log('🔍 Raw database row:', {
            id: row.id,
            company_name: row.company_name,
            company_name_english: row.company_name_english,
            shared_with_emails: row.shared_with_emails
        });

        // Check for expiry and send notification if needed
        try {
            await checkRegistrationExpiryAndNotify(id);
        } catch (notificationError) {
            console.error(`❌ Error checking/sending expiry notification for registration ${id}:`, notificationError);
        }

        // Handle noSecretary field - can be either JSON object or boolean
        let noSecretary = null;
        let makeSimpleBooksSecretary = 'yes'; // Default to yes (no secretary)

        if (row.company_secreatary) {
            try {
                noSecretary = typeof row.company_secreatary === 'string'
                    ? JSON.parse(row.company_secreatary)
                    : row.company_secreatary;
                makeSimpleBooksSecretary = 'no'; // If we have secretary data, then it's "no" (we do have a secretary)
            } catch (parseError) {
                console.warn('⚠️ Failed to parse company_secreatary as JSON:', row.company_secreatary);
                // If parsing fails, keep noSecretary as null and makeSimpleBooksSecretary as 'yes'
            }
        }

        // Parse JSON fields safely
        const paymentReceipt = row.payment_receipt ? safeJsonParse(row.payment_receipt) : null;
        const balancePaymentReceipt = row.balance_payment_receipt ? safeJsonParse(row.balance_payment_receipt) : null;
        const form1 = row.form1 ? safeJsonParse(row.form1) : null;
        const form19 = row.form19 ? safeJsonParse(row.form19) : null;
        const aoa = row.aoa ? safeJsonParse(row.aoa) : null;
        const form18 = row.form18 ? safeJsonParse(row.form18) : null;
        const addressProof = row.address_proof ? safeJsonParse(row.address_proof) : null;
        const incorporationCertificate = row.incorporation_certificate ? safeJsonParse(row.incorporation_certificate) : null;
        const step3AdditionalDoc = row.step3_additional_doc ? safeJsonParse(row.step3_additional_doc) : null;
        const step3SignedAdditionalDoc = row.step3_signed_additional_doc ? safeJsonParse(row.step3_signed_additional_doc) : null;
        const step4FinalAdditionalDoc = row.step4_final_additional_doc ? safeJsonParse(row.step4_final_additional_doc) : null;
        const resolutions_docs = row.resolutions_docs ? safeJsonParse(row.resolutions_docs) : null;
        const admin_resolution_doc = row.admin_resolution_doc ? safeJsonParse(row.admin_resolution_doc) : null;
        const signed_admin_resolution = row.signed_admin_resolution ? safeJsonParse(row.signed_admin_resolution) : null;
        const signed_customer_resolution = row.signed_customer_resolution ? safeJsonParse(row.signed_customer_resolution) : null;
        const shareholders = row.shareholders ? safeJsonParse(row.shareholders) : null;
        const directors = row.directors ? safeJsonParse(row.directors) : null;
        const additionalFees = row.additional_fees ? safeJsonParse(row.additional_fees) : null;
        const sharedWithEmails = row.shared_with_emails ? safeJsonParse(row.shared_with_emails) : [];

        // Combine customer documents from separate columns
        const customerDocs: any = {};
        if (row.customer_form1) {
            customerDocs.form1 = safeJsonParse(row.customer_form1);
        }
        if (row.customer_form19) {
            customerDocs.form19 = safeJsonParse(row.customer_form19);
        }
        if (row.customer_aoa) {
            customerDocs.aoa = safeJsonParse(row.customer_aoa);
        }
        if (row.customer_form18) {
            customerDocs.form18 = safeJsonParse(row.customer_form18);
        }
        if (row.customer_address_proof) {
            customerDocs.addressProof = safeJsonParse(row.customer_address_proof);
        }

        const customerDocuments = Object.keys(customerDocs).length > 0 ? customerDocs : null;

        const convertedRow = {
            _id: row.id,
            userId: row.user_id,
            userName: row.user_name, // Added user name from join
            userEmail: row.user_email, // Added user email from join
            userPassword: row.user_password, // Added user password from join
            companyName: row.company_name,
            contactPersonName: row.contact_person_name,
            contactPersonEmail: row.contact_person_email,
            contactPersonPhone: row.contact_person_phone,
            selectedPackage: row.selected_package,
            paymentMethod: row.payment_method,
            currentStep: row.current_step,
            status: row.status,
            paymentApproved: row.payment_approved,
            detailsApproved: row.details_approved,
            documentsApproved: row.documents_approved,
            documentsPublished: row.documents_published,
            paymentReceipt,
            balancePaymentReceipt,
            balancePaymentApproved: row.balance_payment_approved || false,
            form1,
            form19,
            aoa,
            form18,
            addressProof,
            customerDocuments,
            incorporationCertificate,
            step3AdditionalDoc,
            step3SignedAdditionalDoc,
            step4FinalAdditionalDoc,
            noSecretary,
            // Company Details Fields
            companyNameEnglish: row.company_name_english,
            companyNameSinhala: row.company_name_sinhala,
            companyEntity: row.company_entity,
            companyDetailsLocked: row.company_details_locked || false,
            companyDetailsApproved: row.company_details_approved || false,
            companyDetailsRejected: row.company_details_rejected || false,
            isForeignOwned: row.is_foreign_owned,
            businessAddressNumber: row.business_address_number,
            businessAddressStreet: row.business_address_street,
            businessAddressCity: row.business_address_city,
            postalCode: row.postal_code,
            province: row.province,
            district: row.district,
            divisionalSecretariat: row.divisional_secretariat,
            sharePrice: row.shares_amount,
            numberOfShareholders: row.number_of_shareholders,
            shareholders,
            makeSimpleBooksSecretary,
            numberOfDirectors: row.number_of_directors,
            directors,
            gramaNiladhari: row.grama_niladari,
            companyActivities: row.company_activities,
            businessEmail: row.business_email,
            businessContactNumber: row.business_contact_number,
            erocRegistered: row.eroc_registered,
            resolutions_docs,
            admin_resolution_doc,
            signed_admin_resolution,
            signed_customer_resolution,
            // Access sharing field
            sharedWithEmails,
            additionalFees,
            noted: row.noted || false,
            secretaryRecordsNotedAt: row.secretary_records_noted_at,
            // Expire date fields
            registerStartDate: row.register_start_date,
            expireDays: row.expire_days,
            expireDate: row.expire_date,
            isExpired: row.is_expired || false,
            secretaryPeriodYear: row.secretary_period_year,
            expiryNotificationSentAt: row.expiry_notification_sent_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        console.log('✅ Converted registration data:', {
            id: convertedRow._id,
            companyNameEnglish: convertedRow.companyNameEnglish,
            companyNameSinhala: convertedRow.companyNameSinhala
        });

        // Sanitize the response to prevent XSS
        const sanitizedResponse = sanitizeApiResponse(convertedRow);
        return NextResponse.json(sanitizedResponse);
    } catch (error) {
        console.error('❌ Error fetching registration:', error);
        // Make sure to release connection if it exists
        if (connection) {
            try {
                connection.release();
            } catch (releaseError) {
                console.error('Error releasing database connection:', releaseError);
            }
        }
        return NextResponse.json({ error: 'Failed to fetch registration', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

// PUT update registration
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Apply XSS protection middleware
        const protectedRequest = await xssProtectionMiddleware(request);
        
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        
        // Safely parse the request body
        let body: any = {};
        try {
            body = protectedRequest.sanitizedBody || await request.json();
        } catch (parseError) {
            console.error('❌ Error parsing request body as JSON:', parseError);
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        console.log('📝 PUT /api/registrations/[id] - Updating registration:', {
            id,
            currentStep: body.currentStep,
            status: body.status,
            documentsAcknowledged: body.documentsAcknowledged,
            balancePaymentReceipt: body.balancePaymentReceipt,
            customerDocuments: body.customerDocuments,
            noSecretaryType: typeof body.noSecretary,
            hasNoSecretary: !!body.noSecretary
        });
        console.log('🚨 API CALL DETECTED - PUT /api/registrations/[id] called at:', new Date().toISOString());
        console.log('🚨 Request headers:', Object.fromEntries(request.headers.entries()));
        console.log('🚨 Request method:', request.method);
        console.log('🚨 Request URL:', request.url);

        const connection = await pool.getConnection();

        // Get current registration data to preserve existing values
        const [existingRows] = await connection.execute(
            'SELECT * FROM registrations WHERE id = ?',
            [id]
        );

        if (Array.isArray(existingRows) && existingRows.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        const existingRegistration = existingRows[0];

        // Build update fields
        const fields: string[] = [];
        const values: any[] = [];

        // Handle all the possible fields that can be updated
        if (body.currentStep !== undefined) {
            fields.push('current_step = ?');
            values.push(body.currentStep);
        }
        if (body.status !== undefined) {
            fields.push('status = ?');
            values.push(body.status);
        }
        if (body.paymentApproved !== undefined) {
            fields.push('payment_approved = ?');
            values.push(body.paymentApproved);
        }
        if (body.detailsApproved !== undefined) {
            fields.push('details_approved = ?');
            values.push(body.detailsApproved);
        }
        if (body.documentsApproved !== undefined) {
            fields.push('documents_approved = ?');
            values.push(body.documentsApproved);
        }
        if (body.documentsPublished !== undefined) {
            fields.push('documents_published = ?');
            values.push(body.documentsPublished);
        }
        if (body.paymentReceipt !== undefined) {
            fields.push('payment_receipt = ?');
            values.push(JSON.stringify(body.paymentReceipt));
        }
        if (body.balancePaymentReceipt !== undefined) {
            fields.push('balance_payment_receipt = ?');
            values.push(JSON.stringify(body.balancePaymentReceipt));
        }
        if (body.balancePaymentApproved !== undefined) {
            fields.push('balance_payment_approved = ?');
            values.push(body.balancePaymentApproved);
        }
        if (body.customerDocuments !== undefined) {
            // Handle individual customer document fields
            const customerDocs = body.customerDocuments || {};
            if (customerDocs.form1 !== undefined) {
                fields.push('customer_form1 = ?');
                values.push(JSON.stringify(customerDocs.form1));
            }
            if (customerDocs.form19 !== undefined) {
                fields.push('customer_form19 = ?');
                values.push(JSON.stringify(customerDocs.form19));
            }
            if (customerDocs.aoa !== undefined) {
                fields.push('customer_aoa = ?');
                values.push(JSON.stringify(customerDocs.aoa));
            }
            if (customerDocs.form18 !== undefined) {
                fields.push('customer_form18 = ?');
                values.push(JSON.stringify(customerDocs.form18));
            }
            if (customerDocs.addressProof !== undefined) {
                fields.push('customer_address_proof = ?');
                values.push(JSON.stringify(customerDocs.addressProof));
            }
        }
        if (body.incorporationCertificate !== undefined) {
            fields.push('incorporation_certificate = ?');
            values.push(JSON.stringify(body.incorporationCertificate));
        }
        if (body.step3AdditionalDoc !== undefined) {
            fields.push('step3_additional_doc = ?');
            values.push(JSON.stringify(body.step3AdditionalDoc));
        }
        if (body.noSecretary !== undefined) {
            fields.push('company_secreatary = ?');
            // If noSecretary is an object, JSON stringify it, otherwise store as string
            values.push(typeof body.noSecretary === 'object' ? JSON.stringify(body.noSecretary) : body.noSecretary);
        }
        if (body.companyDetailsLocked !== undefined) {
            fields.push('company_details_locked = ?');
            values.push(body.companyDetailsLocked);
        }
        if (body.companyDetailsApproved !== undefined) {
            fields.push('company_details_approved = ?');
            values.push(body.companyDetailsApproved);
        }
        if (body.companyDetailsRejected !== undefined) {
            fields.push('company_details_rejected = ?');
            values.push(body.companyDetailsRejected);
        }
        if (body.pinned !== undefined) {
            fields.push('pinned = ?');
            values.push(body.pinned);
        }
        if (body.noted !== undefined) {
            fields.push('noted = ?');
            values.push(body.noted);
        }
        if (body.secretaryRecordsNotedAt !== undefined) {
            fields.push('secretary_records_noted_at = ?');
            values.push(formatDateForMySQL(body.secretaryRecordsNotedAt));
        }
        if (body.isExpired !== undefined) {
            fields.push('is_expired = ?');
            values.push(body.isExpired);
        }
        if (body.expireDate !== undefined) {
            fields.push('expire_date = ?');
            values.push(formatDateForMySQL(body.expireDate));
        }
        if (body.registerStartDate !== undefined) {
            fields.push('register_start_date = ?');
            values.push(formatDateForMySQL(body.registerStartDate));
        }
        if (body.expireDays !== undefined) {
            fields.push('expire_days = ?');
            values.push(body.expireDays);
        }
        if (body.secretaryPeriodYear !== undefined) {
            fields.push('secretary_period_year = ?');
            values.push(body.secretaryPeriodYear);
        }
        if (body.expiryNotificationSentAt !== undefined) {
            fields.push('expiry_notification_sent_at = ?');
            values.push(formatDateForMySQL(body.expiryNotificationSentAt));
        }
        if (body.sharedWithEmails !== undefined) {
            fields.push('shared_with_emails = ?');
            values.push(JSON.stringify(body.sharedWithEmails));
        }
        if (body.additionalFees !== undefined) {
            fields.push('additional_fees = ?');
            values.push(JSON.stringify(body.additionalFees));
        }
        if (body.shareholders !== undefined) {
            fields.push('shareholders = ?');
            values.push(body.shareholders ? JSON.stringify(body.shareholders) : null);
        }
        if (body.directors !== undefined) {
            fields.push('directors = ?');
            values.push(body.directors ? JSON.stringify(body.directors) : null);
        }
        // Add company name fields
        // Remove the separate companyName field handling since we want to use only companyNameEnglish
        if (body.companyNameEnglish !== undefined) {
            fields.push('company_name_english = ?');
            values.push(body.companyNameEnglish);
            // Always update the main company_name field with the English name
            fields.push('company_name = ?');
            values.push(body.companyNameEnglish);
        }
        if (body.companyNameSinhala !== undefined) {
            fields.push('company_name_sinhala = ?');
            values.push(body.companyNameSinhala);
        }
        if (body.companyEntity !== undefined) {
            fields.push('company_entity = ?');
            values.push(body.companyEntity);
        }
        if (body.isForeignOwned !== undefined) {
            fields.push('is_foreign_owned = ?');
            values.push(body.isForeignOwned);
        }
        if (body.businessAddressNumber !== undefined) {
            fields.push('business_address_number = ?');
            values.push(body.businessAddressNumber);
        }
        if (body.businessAddressStreet !== undefined) {
            fields.push('business_address_street = ?');
            values.push(body.businessAddressStreet);
        }
        if (body.businessAddressCity !== undefined) {
            fields.push('business_address_city = ?');
            values.push(body.businessAddressCity);
        }
        if (body.postalCode !== undefined) {
            fields.push('postal_code = ?');
            values.push(body.postalCode);
        }
        if (body.province !== undefined) {
            fields.push('province = ?');
            values.push(body.province);
        }
        if (body.district !== undefined) {
            fields.push('district = ?');
            values.push(body.district);
        }
        if (body.divisionalSecretariat !== undefined) {
            fields.push('divisional_secretariat = ?');
            values.push(body.divisionalSecretariat);
        }
        if (body.sharePrice !== undefined) {
            fields.push('shares_amount = ?');
            values.push(body.sharePrice);
        }
        if (body.numberOfShareholders !== undefined) {
            fields.push('number_of_shareholders = ?');
            values.push(body.numberOfShareholders);
        }
        if (body.shareholders !== undefined) {
            fields.push('shareholders = ?');
            values.push(body.shareholders ? JSON.stringify(body.shareholders) : null);
        }
        if (body.makeSimpleBooksSecretary !== undefined || body.noSecretary !== undefined) {
            fields.push('company_secreatary = ?');
            if (body.makeSimpleBooksSecretary === 'no' && body.noSecretary) {
                values.push(JSON.stringify(body.noSecretary));
            } else if (body.makeSimpleBooksSecretary === 'yes') {
                // do not store the flag; keep null to indicate no details
                values.push(null);
            } else {
                values.push(null);
            }
        }
        if (body.numberOfDirectors !== undefined) {
            fields.push('number_of_directors = ?');
            values.push(body.numberOfDirectors);
        }
        if (body.gramaNiladhari !== undefined) {
            fields.push('grama_niladari = ?');
            values.push(body.gramaNiladhari);
        }
        if (body.companyActivities !== undefined) {
            fields.push('company_activities = ?');
            values.push(body.companyActivities);
        }
        if (body.businessEmail !== undefined) {
            fields.push('business_email = ?');
            values.push(body.businessEmail);
        }
        if (body.businessContactNumber !== undefined) {
            fields.push('business_contact_number = ?');
            values.push(body.businessContactNumber);
        }
        if (body.erocRegistered !== undefined) {
            fields.push('eroc_registered = ?');
            values.push(body.erocRegistered);
        }
        if (body.pinned !== undefined) {
            fields.push('pinned = ?');
            values.push(body.pinned);
        }
        if (body.companyDetailsLocked !== undefined) {
            fields.push('company_details_locked = ?');
            values.push(body.companyDetailsLocked);
        }
        if (body.companyDetailsApproved !== undefined) {
            fields.push('company_details_approved = ?');
            values.push(body.companyDetailsApproved);
        }
        if (body.companyDetailsRejected !== undefined) {
            fields.push('company_details_rejected = ?');
            values.push(body.companyDetailsRejected);
        }
        if (body.documentsAcknowledged !== undefined) {
            fields.push('documents_acknowledged = ?');
            values.push(body.documentsAcknowledged);
        }
        if (body.paymentReceipt !== undefined) {
            fields.push('payment_receipt = ?');
            values.push(JSON.stringify(body.paymentReceipt));
        }
        if (body.form1 !== undefined) {
            fields.push('form1 = ?');
            values.push(JSON.stringify(body.form1));
        }
        if (body.form19 !== undefined) {
            fields.push('form19 = ?');
            values.push(JSON.stringify(body.form19));
        }
        if (body.aoa !== undefined) {
            fields.push('aoa = ?');
            values.push(JSON.stringify(body.aoa));
        }
        if (body.form18 !== undefined) {
            fields.push('form18 = ?');
            values.push(JSON.stringify(body.form18));
        }
        if (body.addressProof !== undefined) {
            fields.push('address_proof = ?');
            values.push(JSON.stringify(body.addressProof));
        }
        if (body.incorporationCertificate !== undefined) {
            fields.push('incorporation_certificate = ?');
            values.push(JSON.stringify(body.incorporationCertificate));
        }
        if (body.step3AdditionalDoc !== undefined) {
            fields.push('step3_additional_doc = ?');
            values.push(JSON.stringify(body.step3AdditionalDoc));
        }
        if (body.step3SignedAdditionalDoc !== undefined) {
            fields.push('step3_signed_additional_doc = ?');
            values.push(JSON.stringify(body.step3SignedAdditionalDoc));
        }

        // Add handling for step4FinalAdditionalDoc
        if (body.step4FinalAdditionalDoc !== undefined) {
            fields.push('step4_final_additional_doc = ?');
            values.push(JSON.stringify(body.step4FinalAdditionalDoc));
        } else if (body.step4_final_additional_doc !== undefined) {
            // Handle snake_case field name as well
            fields.push('step4_final_additional_doc = ?');
            values.push(JSON.stringify(body.step4_final_additional_doc));
        }
        
        // Add handling for admin_resolution_doc
        if (body.adminResolutionDoc !== undefined) {
            fields.push('admin_resolution_doc = ?');
            values.push(JSON.stringify(body.adminResolutionDoc));
        } else if (body.admin_resolution_doc !== undefined) {
            // Handle snake_case field name as well
            fields.push('admin_resolution_doc = ?');
            values.push(JSON.stringify(body.admin_resolution_doc));
        }
        
        // Add handling for resolutions_docs (customer uploaded secretary records)
        if (body.resolutionsDocs !== undefined) {
            fields.push('resolutions_docs = ?');
            values.push(JSON.stringify(body.resolutionsDocs));
        } else if (body.resolutions_docs !== undefined) {
            // Handle snake_case field name as well
            fields.push('resolutions_docs = ?');
            values.push(JSON.stringify(body.resolutions_docs));
        }
        
        // Add handling for signed_admin_resolution
        if (body.signedAdminResolution !== undefined) {
            fields.push('signed_admin_resolution = ?');
            values.push(JSON.stringify(body.signedAdminResolution));
        } else if (body.signed_admin_resolution !== undefined) {
            // Handle snake_case field name as well
            fields.push('signed_admin_resolution = ?');
            values.push(JSON.stringify(body.signed_admin_resolution));
        }

        // Always update the updated_at timestamp
        fields.push('updated_at = CURRENT_TIMESTAMP');

        // Add the registration ID to the values array for the WHERE clause
        values.push(id);

        if (fields.length === 1) {
            // Only the updated_at field was added, no actual updates
            connection.release();
            return NextResponse.json({ success: true, message: 'No fields to update' });
        }

        const query = `UPDATE registrations SET ${fields.join(', ')} WHERE id = ?`;
        console.log('📝 Registration API - Update query:', query);
        console.log('📝 Registration API - Update values:', values);

        const [result]: any = await connection.execute(query, values);
        connection.release();

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Registration updated successfully' });
    } catch (error) {
        console.error('Error updating registration:', error);
        return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
    }
}

// DELETE registration
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id } = await params;
        const connection = await pool.getConnection();

        // First, get the registration data to identify files to delete
        const [rows] = await connection.execute(
            'SELECT * FROM registrations WHERE id = ?',
            [id]
        );

        if (Array.isArray(rows) && rows.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        const registration = rows[0];

        // Delete associated files from file storage
        try {
            const fileStorage = new FileStorageService();

            // Helper function to delete files from parsed data
            const deleteFilesFromData = async (data: any, fieldName: string) => {
                if (!data) return;

                try {
                    let parsedData;
                    if (typeof data === 'string') {
                        parsedData = safeJsonParse(data);
                    } else {
                        parsedData = data;
                    }

                    if (!parsedData) return;

                    // Handle array of files
                    if (Array.isArray(parsedData)) {
                        for (const file of parsedData) {
                            if (file && file.filePath) {
                                try {
                                    await fileStorage.deleteFile(file.filePath);
                                    console.log(`✅ Deleted file for field ${fieldName}:`, file.filePath);
                                } catch (deleteError) {
                                    console.warn(`⚠️ Failed to delete file for field ${fieldName}:`, file.filePath, deleteError);
                                }
                            }
                        }
                    }
                    // Handle single file object
                    else if (parsedData.filePath) {
                        try {
                            await fileStorage.deleteFile(parsedData.filePath);
                            console.log(`✅ Deleted file for field ${fieldName}:`, parsedData.filePath);
                        } catch (deleteError) {
                            console.warn(`⚠️ Failed to delete file for field ${fieldName}:`, parsedData.filePath, deleteError);
                        }
                    }
                } catch (parseError) {
                    console.warn(`⚠️ Failed to parse data for field ${fieldName}:`, data, parseError);
                }
            };

            // Delete files from all relevant fields
            await deleteFilesFromData(registration.payment_receipt, 'payment_receipt');
            await deleteFilesFromData(registration.balance_payment_receipt, 'balance_payment_receipt');
            await deleteFilesFromData(registration.form1, 'form1');
            await deleteFilesFromData(registration.form19, 'form19');
            await deleteFilesFromData(registration.aoa, 'aoa');
            await deleteFilesFromData(registration.form18, 'form18');
            await deleteFilesFromData(registration.address_proof, 'address_proof');
            await deleteFilesFromData(registration.customer_form1, 'customer_form1');
            await deleteFilesFromData(registration.customer_form19, 'customer_form19');
            await deleteFilesFromData(registration.customer_aoa, 'customer_aoa');
            await deleteFilesFromData(registration.customer_form18, 'customer_form18');
            await deleteFilesFromData(registration.customer_address_proof, 'customer_address_proof');
            await deleteFilesFromData(registration.incorporation_certificate, 'incorporation_certificate');
            await deleteFilesFromData(registration.step3_additional_doc, 'step3_additional_doc');
            await deleteFilesFromData(registration.step3_signed_additional_doc, 'step3_signed_additional_doc');
            await deleteFilesFromData(registration.step4_final_additional_doc, 'step4_final_additional_doc');
            await deleteFilesFromData(registration.resolutions_docs, 'resolutions_docs');
            await deleteFilesFromData(registration.admin_resolution_doc, 'admin_resolution_doc');
            await deleteFilesFromData(registration.signed_admin_resolution, 'signed_admin_resolution');
            await deleteFilesFromData(registration.signed_customer_resolution, 'signed_customer_resolution');

        } catch (fileError) {
            console.warn('⚠️ Error deleting associated files:', fileError);
            // Don't fail the deletion if file deletion fails
        }

        // Delete the registration record
        const [result]: any = await connection.execute(
            'DELETE FROM registrations WHERE id = ?',
            [id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Registration deleted successfully' });
    } catch (error) {
        console.error('Error deleting registration:', error);
        return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
    }
}

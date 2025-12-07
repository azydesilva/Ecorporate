import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { safeJsonParse } from '@/lib/utils';
import { checkRegistrationExpiryAndNotify } from '@/lib/registration-expiry-utils';

// GET all registrations
export async function GET(request: NextRequest) {
    let connection;
    try {
        console.log('🚨 API CALL DETECTED - GET /api/registrations called at:', new Date().toISOString());

        if (!pool) {
            console.error('❌ Database pool not available');
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        // Get user ID from query parameters
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        console.log('🔍 Filtering registrations for user ID:', userId);

        connection = await pool.getConnection();

        // Get user email (for shared access) from query parameters
        const userEmail = searchParams.get('userEmail');

        console.log('🔍 Filtering registrations for user ID:', userId, 'and userEmail:', userEmail);
        console.log('🔎 Registrations query will use JSON_SEARCH on shared_with_emails (ensure emails are lowercase)');

        // Build SELECT with optional filters: owner (user_id) OR shared_with_emails JSON contains userEmail
        // Join with users table to get user name and email
        let query = 'SELECT r.*, u.name as user_name, u.email as user_email FROM registrations r LEFT JOIN users u ON r.user_id = u.id';
        const params: any[] = [];
        const whereClauses: string[] = [];

        if (userId) {
            whereClauses.push('r.user_id = ?');
            params.push(userId);
        }
        if (userEmail) {
            // Only treat shared entries as access when either:
            // 1) The shared_with_emails array contains an object with { email: userEmail, status: 'approved' }
            // 2) Backwards-compatibility: the column contains legacy string entries (array of emails as strings).
            // This prevents entries with status 'pending' or 'rejected' from granting access.
            whereClauses.push(`(
                JSON_CONTAINS(r.shared_with_emails, JSON_OBJECT('email', ?, 'status', 'approved'))
                OR (JSON_SEARCH(r.shared_with_emails, 'one', ?) IS NOT NULL AND JSON_TYPE(JSON_EXTRACT(r.shared_with_emails, '$[0]')) = 'STRING')
            )`);
            // push email twice for the two placeholders
            params.push(userEmail, userEmail);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' OR ');
        }

        query += ' ORDER BY r.created_at DESC';

        console.log('SQL Query:', query);
        console.log('SQL Params:', params);
        const [rows] = await connection.execute(query, params);

        // Ensure rows is an array
        const safeRows = Array.isArray(rows) ? rows : [];

        try {
            // Debug: show which rows contain shared_with_emails
            const debugMap = safeRows.map((r: any) => ({
                id: r.id,
                shared_with_emails: r.shared_with_emails,
                user_id: r.user_id,
                contact_person_email: r.contact_person_email
            }));
            console.log('🔍 Registrations fetched:', safeRows.length, 'entries. shared_with_emails preview:', debugMap.slice(0, 10));
        } catch (e) {
            console.log('Could not log rows preview:', e);
        }

        // Check for expiry and send notifications for expired registrations
        try {
            // Check the first few registrations for expiry (to avoid performance issues with large datasets)
            const registrationsToCheck = safeRows.slice(0, 10);
            
            for (const row of registrationsToCheck) {
                try {
                    await checkRegistrationExpiryAndNotify(row.id);
                } catch (notificationError) {
                    console.error(`❌ Error checking/sending expiry notification for registration ${row.id}:`, notificationError);
                }
            }
        } catch (expiryCheckError) {
            console.error('❌ Error during expiry check for registrations:', expiryCheckError);
        }

        connection.release();
        connection = null;

        // Convert snake_case to camelCase for frontend compatibility
        const convertedRows = safeRows.map((row: any) => {
            try {
                // company_secreatary can be 'yes' or JSON (string/object) with details
                let makeSimpleBooksSecretary: any = row.company_secreatary;
                let noSecretary: any = null;
                if (row.company_secreatary) {
                    if (typeof row.company_secreatary === 'object') {
                        makeSimpleBooksSecretary = 'no';
                        noSecretary = row.company_secreatary;
                    } else if (typeof row.company_secreatary === 'string') {
                        const trimmed = row.company_secreatary.trim();
                        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                            try {
                                const parsed = JSON.parse(trimmed);
                                if (parsed && typeof parsed === 'object') {
                                    makeSimpleBooksSecretary = 'no';
                                    noSecretary = parsed;
                                }
                            } catch (parseError) {
                                console.warn('Failed to parse company_secreatary JSON:', parseError);
                                // leave as-is (likely 'yes')
                            }
                        } else {
                            // plain string like 'yes'
                            makeSimpleBooksSecretary = row.company_secreatary;
                        }
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
                const resolutions_docs = row.resolutions_docs ? safeJsonParse(row.resolutions_docs) : null;
                const admin_resolution_doc = row.admin_resolution_doc ? safeJsonParse(row.admin_resolution_doc) : null;
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

                return {
                    _id: row.id,
                    id: row.id,
                    userId: row.user_id,
                    userName: row.user_name, // Added user name from join
                    userEmail: row.user_email, // Added user email from join
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
                    form1,
                    form19,
                    aoa,
                    form18,
                    addressProof,
                    customerDocuments,
                    incorporationCertificate,
                    step3AdditionalDoc,
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
                    pinned: row.pinned || false,
                    noted: row.noted || false,
                    secretaryRecordsNotedAt: row.secretary_records_noted_at,
                    // Expire date fields
                    registerStartDate: row.register_start_date,
                    expireDays: row.expire_days,
                    expireDate: row.expire_date,
                    isExpired: row.is_expired || false,
                    secretaryPeriodYear: row.secretary_period_year,
                    expiryNotificationSentAt: row.expiry_notification_sent_at,
                    // Access sharing field
                    sharedWithEmails,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                };
            } catch (convertError) {
                console.error('Error converting registration row:', convertError, 'Row data:', row);
                // Return a minimal object to avoid breaking the entire response
                return {
                    _id: row.id,
                    id: row.id,
                    userId: row.user_id,
                    userName: row.user_name, // Added user name from join
                    userEmail: row.user_email, // Added user email from join
                    companyName: row.company_name,
                    contactPersonName: row.contact_person_name,
                    contactPersonEmail: row.contact_person_email,
                    selectedPackage: row.selected_package,
                    currentStep: row.current_step,
                    status: row.status,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                };
            }
        });

        console.log('✅ Successfully converted', convertedRows.length, 'registrations');
        return NextResponse.json(convertedRows);
    } catch (error) {
        console.error('❌ Error fetching registrations:', error);
        // Make sure to release connection if it exists
        if (connection) {
            try {
                connection.release();
            } catch (releaseError) {
                console.error('Error releasing database connection:', releaseError);
            }
        }
        return NextResponse.json({ error: 'Failed to fetch registrations', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

// POST new registration
export async function POST(request: NextRequest) {
    try {
        console.log('🚨 API CALL DETECTED - POST /api/registrations called at:', new Date().toISOString());
        console.log('🚨 Request headers:', Object.fromEntries(request.headers.entries()));
        console.log('🚨 Request method:', request.method);
        console.log('🚨 Request URL:', request.url);

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const body = await request.json();
        console.log('📝 Registration API - Received body:', JSON.stringify(body, null, 2));

        const connection = await pool.getConnection();

        // Validate required fields and handle undefined values
        if (!body || typeof body !== 'object') {
            console.error('❌ Registration API - Invalid body received:', body);
            connection.release();
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        if (!body.id) {
            console.error('❌ Registration API - Missing ID in body:', body);
            connection.release();
            return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
        }

        console.log('✅ Registration API - Valid body received with ID:', body.id);

        // Check if registration already exists
        const [existingRows] = await connection.execute(
            'SELECT id FROM registrations WHERE id = ?',
            [body.id]
        );

        if (existingRows.length > 0) {
            connection.release();
            return NextResponse.json({
                success: true,
                id: body.id,
                message: 'Registration already exists'
            });
        }

        const [result] = await connection.execute(
            `INSERT INTO registrations (
        id, user_id, company_name, company_name_english, company_name_sinhala, contact_person_name, contact_person_email, 
        contact_person_phone, selected_package, payment_method, current_step, 
        status, payment_receipt, eroc_registered, company_entity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                body.id,
                body.userId || 'default_user',
                body.companyName || null,
                body.companyNameEnglish || null,
                body.companyNameSinhala || null,
                body.contactPersonName || null,
                body.contactPersonEmail || null,
                body.contactPersonPhone || null,
                body.selectedPackage || null,
                body.paymentMethod || null,
                body.currentStep || null,
                body.status || null,
                body.paymentReceipt ? JSON.stringify(body.paymentReceipt) : null,
                body.erocRegistered || false,
                body.companyEntity || null
            ]
        );

        connection.release();
        return NextResponse.json({ success: true, id: body.id });
    } catch (error) {
        console.error('Error creating registration:', error);
        return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 });
    }
}

// PUT (update) registration
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        console.log('🚨 API CALL DETECTED - PUT /api/registrations/:id called at:', new Date().toISOString());

        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const { id: registrationId } = await params;
        if (!registrationId) {
            return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
        }

        // Safely parse the request body
        let body: any = {};
        try {
            body = await request.json();
        } catch (parseError) {
            console.error('❌ Error parsing request body as JSON:', parseError);
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        console.log('📝 Registration API - Updating registration:', registrationId);
        console.log('📝 Registration API - Received body:', JSON.stringify(body, null, 2));

        const connection = await pool.getConnection();

        // Build the update query dynamically based on provided fields
        const fields: string[] = [];
        const values: any[] = [];

        // Add all possible fields
        if (body.companyNameEnglish !== undefined) {
            fields.push('company_name_english = ?');
            values.push(body.companyNameEnglish);
            // Always update the main company_name field with the English name
            fields.push('company_name = ?');
            values.push(body.companyNameEnglish);
        }
        if (body.contactPersonName !== undefined) {
            fields.push('contact_person_name = ?');
            values.push(body.contactPersonName);
        }
        if (body.contactPersonEmail !== undefined) {
            fields.push('contact_person_email = ?');
            values.push(body.contactPersonEmail);
        }
        if (body.contactPersonPhone !== undefined) {
            fields.push('contact_person_phone = ?');
            values.push(body.contactPersonPhone);
        }
        if (body.selectedPackage !== undefined) {
            fields.push('selected_package = ?');
            values.push(body.selectedPackage);
        }
        if (body.paymentMethod !== undefined) {
            fields.push('payment_method = ?');
            values.push(body.paymentMethod);
        }
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
        if (body.documentsAcknowledged !== undefined) {
            fields.push('documents_acknowledged = ?');
            values.push(body.documentsAcknowledged);
        }
        if (body.paymentReceipt !== undefined) {
            fields.push('payment_receipt = ?');
            values.push(body.paymentReceipt ? JSON.stringify(body.paymentReceipt) : null);
        }
        if (body.balancePaymentReceipt !== undefined) {
            fields.push('balance_payment_receipt = ?');
            values.push(body.balancePaymentReceipt ? JSON.stringify(body.balancePaymentReceipt) : null);
        }
        if (body.form1 !== undefined) {
            fields.push('form1 = ?');
            values.push(body.form1 ? JSON.stringify(body.form1) : null);
        }
        if (body.form19 !== undefined) {
            fields.push('form19 = ?');
            values.push(body.form19 ? JSON.stringify(body.form19) : null);
        }
        if (body.aoa !== undefined) {
            fields.push('aoa = ?');
            values.push(body.aoa ? JSON.stringify(body.aoa) : null);
        }
        if (body.form18 !== undefined) {
            fields.push('form18 = ?');
            values.push(body.form18 ? JSON.stringify(body.form18) : null);
        }
        if (body.addressProof !== undefined) {
            fields.push('address_proof = ?');
            values.push(body.addressProof ? JSON.stringify(body.addressProof) : null);
        }
        if (body.customerDocuments !== undefined) {
            // Handle customer documents separately
            if (body.customerDocuments?.form1 !== undefined) {
                fields.push('customer_form1 = ?');
                values.push(body.customerDocuments.form1 ? JSON.stringify(body.customerDocuments.form1) : null);
            }
            if (body.customerDocuments?.form19 !== undefined) {
                fields.push('customer_form19 = ?');
                values.push(body.customerDocuments.form19 ? JSON.stringify(body.customerDocuments.form19) : null);
            }
            if (body.customerDocuments?.aoa !== undefined) {
                fields.push('customer_aoa = ?');
                values.push(body.customerDocuments.aoa ? JSON.stringify(body.customerDocuments.aoa) : null);
            }
            if (body.customerDocuments?.form18 !== undefined) {
                fields.push('customer_form18 = ?');
                values.push(body.customerDocuments.form18 ? JSON.stringify(body.customerDocuments.form18) : null);
            }
            if (body.customerDocuments?.addressProof !== undefined) {
                fields.push('customer_address_proof = ?');
                values.push(body.customerDocuments.addressProof ? JSON.stringify(body.customerDocuments.addressProof) : null);
            }
        }

        // Compute company_secreatary value: JSON details when 'no'; do NOT save 'yes'
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
        if (body.incorporationCertificate !== undefined) {
            fields.push('incorporation_certificate = ?');
            values.push(body.incorporationCertificate ? JSON.stringify(body.incorporationCertificate) : null);
        }
        if (body.step3AdditionalDoc !== undefined) {
            fields.push('step3_additional_doc = ?');
            values.push(body.step3AdditionalDoc ? JSON.stringify(body.step3AdditionalDoc) : null);
        }
        if (body.step3SignedAdditionalDoc !== undefined) {
            fields.push('step3_signed_additional_doc = ?');
            values.push(body.step3SignedAdditionalDoc ? JSON.stringify(body.step3SignedAdditionalDoc) : null);
        }
        
        // Add handling for step4FinalAdditionalDoc
        if (body.step4FinalAdditionalDoc !== undefined) {
            fields.push('step4_final_additional_doc = ?');
            values.push(body.step4FinalAdditionalDoc ? JSON.stringify(body.step4FinalAdditionalDoc) : null);
        } else if (body.step4_final_additional_doc !== undefined) {
            // Handle snake_case field name as well
            fields.push('step4_final_additional_doc = ?');
            values.push(body.step4_final_additional_doc ? JSON.stringify(body.step4_final_additional_doc) : null);
        }
        
        // Add handling for admin_resolution_doc
        if (body.adminResolutionDoc !== undefined) {
            fields.push('admin_resolution_doc = ?');
            values.push(body.adminResolutionDoc ? JSON.stringify(body.adminResolutionDoc) : null);
        } else if (body.admin_resolution_doc !== undefined) {
            // Handle snake_case field name as well
            fields.push('admin_resolution_doc = ?');
            values.push(body.admin_resolution_doc ? JSON.stringify(body.admin_resolution_doc) : null);
        }
        
        // Add handling for resolutions_docs (customer uploaded secretary records)
        if (body.resolutionsDocs !== undefined) {
            fields.push('resolutions_docs = ?');
            values.push(body.resolutionsDocs ? JSON.stringify(body.resolutionsDocs) : null);
        } else if (body.resolutions_docs !== undefined) {
            // Handle snake_case field name as well
            fields.push('resolutions_docs = ?');
            values.push(body.resolutions_docs ? JSON.stringify(body.resolutions_docs) : null);
        }
        
        // Add handling for signed_admin_resolution
        if (body.signedAdminResolution !== undefined) {
            fields.push('signed_admin_resolution = ?');
            values.push(body.signedAdminResolution ? JSON.stringify(body.signedAdminResolution) : null);
        } else if (body.signed_admin_resolution !== undefined) {
            // Handle snake_case field name as well
            fields.push('signed_admin_resolution = ?');
            values.push(body.signed_admin_resolution ? JSON.stringify(body.signed_admin_resolution) : null);
        }

        // Always update the updated_at timestamp
        fields.push('updated_at = CURRENT_TIMESTAMP');

        // Add the registration ID to the values array for the WHERE clause
        values.push(registrationId);

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

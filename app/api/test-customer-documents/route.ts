import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { safeJsonParse } from '@/lib/utils';

// GET test customer documents
export async function GET() {
    try {
        if (!pool) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT id, company_name, customer_documents, customer_form1, customer_form19, customer_aoa, customer_form18, customer_address_proof FROM registrations WHERE id = ?',
            ['reg_1754308978698_7cztjd9fo_y0h9a']
        );
        connection.release();

        if (Array.isArray(rows) && rows.length === 0) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        const row = rows[0];

        // Test the same logic as the main API
        const customerDocs: any = {};

        console.log('🔍 TEST API Debug - Raw database row:');
        console.log('  - customer_documents:', row.customer_documents ? 'has data' : 'no data');
        console.log('  - customer_form1:', row.customer_form1 ? 'has data' : 'no data');
        console.log('  - customer_form19:', row.customer_form19 ? 'has data' : 'no data');
        console.log('  - customer_aoa:', row.customer_aoa ? 'has data' : 'no data');
        console.log('  - customer_form18:', row.customer_form18 ? 'has data' : 'no data');
        console.log('  - customer_address_proof:', row.customer_address_proof ? 'has data' : 'no data');

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

        console.log('🔍 TEST API Debug - Combined customerDocs:', customerDocs);
        console.log('🔍 TEST API Debug - Object.keys(customerDocs).length:', Object.keys(customerDocs).length);

        const result = Object.keys(customerDocs).length > 0 ? customerDocs : null;

        return NextResponse.json({
            registrationId: row.id,
            companyName: row.company_name,
            oldCustomerDocuments: row.customer_documents ? safeJsonParse(row.customer_documents) : null,
            newCustomerDocuments: result,
            debug: {
                hasOldData: !!row.customer_documents,
                hasNewData: Object.keys(customerDocs).length > 0,
                newDataKeys: Object.keys(customerDocs)
            }
        });
    } catch (error) {
        console.error('❌ Error in test API:', error);
        return NextResponse.json({ error: 'Failed to test customer documents' }, { status: 500 });
    }
} 
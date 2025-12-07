import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { companyName } = await request.json();
    
    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Make a request to the external site's API endpoint
    const response = await axios.get(
      `https://360accountants.lk/register/eroc.php?name=${encodeURIComponent(companyName)}`
    );

    const data = response.data;
    
    if (!data) {
      return NextResponse.json(
        { error: 'Could not parse response from external site' },
        { status: 500 }
      );
    }

    // Extract information from the response
    let result = {
      status: 'unknown' as 'available' | 'unavailable' | 'unknown',
      message: '',
      companyName: companyName,
      phoneticallySimilar: false
    };

    // Check if the name is available
    if (data.available) {
      result.status = 'available';
      result.message = data.reason || 'Name is available';
      
      // Check for phonetically similar message
      if (data.status === 'available_with_warnings' || (data.reason && data.reason.includes('Phonetically similar'))) {
        result.phoneticallySimilar = true;
      }
    } else {
      result.status = 'unavailable';
      result.message = data.reason || 'Name is not available';
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error checking company name availability:', error.message);
    return NextResponse.json(
      { error: 'Failed to check company name availability: ' + error.message },
      { status: 500 }
    );
  }
}
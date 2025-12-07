import resend from './resend-config';

interface SendVerificationEmailParams {
  to: string;
  name: string;
  verificationToken: string;
}

/**
 * Sends an email verification email to the user
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendVerificationEmail({ to, name, verificationToken }: SendVerificationEmailParams) {
  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Verify your email address',
      html: `
        <h1>Hello ${name}!</h1>
        <p>Thank you for registering an account with us.</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${verificationUrl}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p><strong>Note: This is an automated message. Please do not reply to this email.</strong></p>
        <p>If you have any questions, please contact our support team.</p>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }

    console.log('Verification email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendVerificationEmail:', error);
    throw error;
  }
}

/**
 * Sends a resend verification email to the user
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendResendVerificationEmail({ to, name, verificationToken }: SendVerificationEmailParams) {
  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">Email Verification</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>Thank you for registering an account with us.</p>
            <p>Please click the button below to verify your email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="text-align: center;">Or copy and paste this link in your browser:</p>
            <p style="text-align: center; word-break: break-all; color: #0070f3;">
              ${verificationUrl}
            </p>
            
            <p><small>This link will expire in 24 hours.</small></p>
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
            <p><small>If you have any questions, please contact our support team.</small></p>
            <p><small>If you didn't create an account, you can safely ignore this email.</small></p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }

    console.log('Verification email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendResendVerificationEmail:', error);
    throw error;
  }
}

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetToken: string;
}

interface SendPaymentApprovalEmailParams {
  to: string;
  name: string;
  companyName: string;
  packageName?: string;
}

interface SendPaymentRejectionEmailParams {
  to: string;
  name: string;
  companyName: string;
  packageName?: string;
  rejectionReason?: string;
}

interface SendNameApprovalEmailParams {
  to: string;
  name: string;
  companyName: string;
}

interface SendNameRejectionEmailParams {
  to: string;
  name: string;
  companyName: string;
  rejectionReason?: string;
}

interface SendDocumentsPublishedEmailParams {
  to: string;
  name: string;
  companyName: string;
}

interface SendRegistrationCompletedEmailParams {
  to: string;
  name: string;
  companyName: string;
}

interface SendSecretaryRecordsSubmittedEmailParams {
  to: string;
  name: string;
  companyName: string;
}

interface SendSignedSecretaryRecordsEmailParams {
  to: string;
  name: string;
  companyName: string;
}

interface SendCompanyExpiryNotificationEmailParams {
  to: string;
  name: string;
  companyName: string;
  expireDate: string;
}

/**
 * Sends a password reset email to the user
 * @param to - The recipient's email address
 * @param name - The recipient's name
 * @param resetToken - The password reset token
 * @returns The result of the email sending operation
 */
export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">Password Reset</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>We received a request to reset your password for your account.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="text-align: center;">Or copy and paste this link in your browser:</p>
            <p style="text-align: center; word-break: break-all; color: #0070f3;">
              ${resetUrl}
            </p>
            
            <p><small>This link will expire in 1 hour.</small></p>
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
            <p><small>If you have any questions, please contact our support team.</small></p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log('Password reset email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    throw error;
  }
}

/**
 * Sends a payment approval notification email to the customer
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendPaymentApprovalEmail({ to, name, companyName, packageName }: SendPaymentApprovalEmailParams) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: `Payment Approved - ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">Payment Approved</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>Great news! Your payment for <strong>${companyName}</strong> has been approved by our team.</p>
            ${packageName ? `<p>Package: <strong>${packageName}</strong></p>` : ''}
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #28a745; margin: 0 0 10px 0;">✅ Payment Status: Approved</h3>
              <p style="margin: 0; color: #333;">Your registration is now moving to the next stage of processing.</p>
            </div>
            
            <h3 style="color: #333;">What happens next?</h3>
            <ul style="color: #555; line-height: 1.6;">
             
              <li>You can continue with the documentation step in your dashboard</li>
              <li>We'll keep you updated on the progress</li>
              <li>You'll receive notifications for any additional requirements</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold;">
                Access Your Dashboard
              </a>
            </div>
            
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
            <p><small>If you have any questions, please contact our support team.</small></p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated'
      }
    });

    if (error) {
      console.error('Error sending payment approval email:', error);
      throw new Error('Failed to send payment approval email');
    }

    console.log('Payment approval email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendPaymentApprovalEmail:', error);
    throw error;
  }
}

/**
 * Sends a payment rejection notification email to the customer
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendPaymentRejectionEmail({ to, name, companyName, packageName, rejectionReason }: SendPaymentRejectionEmailParams) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: `Payment Rejected - ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">Payment Rejected</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>We have reviewed your payment for <strong>${companyName}</strong> and unfortunately, it has been rejected.</p>
            ${packageName ? `<p>Package: <strong>${packageName}</strong></p>` : ''}
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h3 style="color: #721c24; margin: 0 0 10px 0;">❌ Payment Status: Rejected</h3>
              <p style="margin: 0; color: #333;">Your payment has been rejected and requires correction before we can proceed with your registration.</p>
            </div>
            
            ${rejectionReason ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #dee2e6;">
                <h4 style="color: #333; margin: 0 0 10px 0;">Reason for Rejection:</h4>
                <p style="margin: 0; color: #555;">${rejectionReason}</p>
              </div>
            ` : ''}
            
            <h3 style="color: #333;">What you need to do:</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li>Please review your payment details and ensure all information is correct</li>
              <li>Check that your payment receipt is clear and legible</li>
              <li>Verify that the payment amount matches your selected package</li>
              <li>If you have any questions, please contact our support team</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold;">
                Access Your Dashboard
              </a>
            </div>
            
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
            <p><small>If you have any questions or need assistance, please contact our support team.</small></p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated'
      }
    });

    if (error) {
      console.error('Error sending payment rejection email:', error);
      throw new Error('Failed to send payment rejection email');
    }

    console.log('Payment rejection email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendPaymentRejectionEmail:', error);
    throw error;
  }
}

/**
 * Sends a company name approval notification email to the customer (Step 2 approved)
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendNameApprovalEmail({ to, name, companyName }: SendNameApprovalEmailParams) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Company Name Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">Company Name Approved</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>Great news! The company name for <strong>${companyName}</strong> has been approved.</p>
           
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
          </div>
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Error sending name approval email:', error);
      throw new Error('Failed to send name approval email');
    }

    console.log('Name approval email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendNameApprovalEmail:', error);
    throw error;
  }
}

/**
 * Sends a company name rejection notification email to the customer (Step 2 rejected)
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendNameRejectionEmail({ to, name, companyName, rejectionReason }: SendNameRejectionEmailParams) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Company Name Rejected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">Company Name Rejected</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>We reviewed the proposed company name for <strong>${companyName}</strong> and it has been rejected.</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            <p>Please review and submit a new name for approval.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
          </div>
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Error sending name rejection email:', error);
      throw new Error('Failed to send name rejection email');
    }

    console.log('Name rejection email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendNameRejectionEmail:', error);
    throw error;
  }
}

/**
 * Sends a notification email to the customer when admin publishes documents to them (Step 3)
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendDocumentsPublishedEmail({ to, name, companyName }: SendDocumentsPublishedEmailParams) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Documents Ready - Please Submit Signed Documents',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">Documents Ready for Review</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>Great news! We have prepared the necessary documents for your company registration: <strong>${companyName}</strong>.</p>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #28a745; margin: 0 0 10px 0;">📄 Documents Available for Download</h3>
              <p style="margin: 0; color: #333;">Your documents are now ready in your dashboard.</p>
            </div>
            
            <h3 style="color: #333;">What you need to do:</h3>
            <ol style="color: #555; line-height: 1.8;">
              <li><strong>Log in to your dashboard</strong> and navigate to the Documentation section</li>
              <li><strong>Download all the provided documents</strong> (Form 1, Form 19, AOA, Form 18, etc.)</li>
              <li><strong>Print and sign all documents</strong> as required</li>
              <li><strong>Scan the signed documents</strong> and upload them back to the dashboard</li>
              <li><strong>Submit the signed documents</strong> for our final review</li>
            </ol>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Important Notes:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #856404;">
                <li>Please ensure all signatures are clear and legible</li>
                <li>Scan documents in high quality (PDF format preferred)</li>
                <li>Review all documents carefully before signing</li>
                <li>Upload signed versions of ALL documents provided</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
            <p><small>If you have any questions or need assistance, please contact our support team.</small></p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Error sending documents published email:', error);
      throw new Error('Failed to send documents published email');
    }

    console.log('Documents published email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendDocumentsPublishedEmail:', error);
    throw error;
  }
}

/**
 * Sends a notification email to the customer when registration is completed (Step 4)
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendRegistrationCompletedEmail({ to, name, companyName }: SendRegistrationCompletedEmailParams) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Congratulations! Your Company Registration is Complete',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">🎉 Registration Complete!</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>We are delighted to inform you that your company registration has been <strong>successfully completed</strong>!</p>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; text-align: center;">
              <h3 style="color: #28a745; margin: 0 0 10px 0;">✅ Registration Completed</h3>
              <h2 style="color: #333; margin: 10px 0; font-size: 24px;">${companyName}</h2>
              <p style="margin: 10px 0; color: #333; font-size: 16px;">Your company is now officially registered!</p>
            </div>
            
            <h3 style="color: #333;">What's Next?</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li><strong>Access your dashboard</strong> to view your incorporation certificate and final documents</li>
              <li><strong>Download all your company documents</strong> for your records</li>
              <li><strong>Keep your documents safe</strong> - you'll need them for banking and business operations</li>
              <li><strong>Contact us</strong> if you have any questions about your registered company</li>
            </ul>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">📄 Important Documents Available</h4>
              <p style="margin: 0; color: #555;">Your incorporation certificate and all final documents are now available in your dashboard. Please download and store them securely.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #28a745; color: white; padding: 14px 35px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Access Your Dashboard
              </a>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin: 0 0 10px 0;">💼 Business Tips</h4>
              <ul style="margin: 0; padding-left: 20px; color: #856404;">
                <li>Open a business bank account using your incorporation certificate</li>
                <li>Register for any necessary business licenses or permits</li>
                <li>Set up your accounting and bookkeeping system</li>
                <li>Consider consulting with a tax advisor for your new company</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; font-size: 16px; color: #333;">Thank you for choosing our services. We wish you great success with <strong>${companyName}</strong>!</p>
            
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
            <p><small>If you have any questions or need assistance, please contact our support team.</small></p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Error sending registration completed email:', error);
      throw new Error('Failed to send registration completed email');
    }

    console.log('Registration completed email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendRegistrationCompletedEmail:', error);
    throw error;
  }
}

/**
 * Sends a notification email to the customer when admin submits Secretary Records (Step 4)
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendSecretaryRecordsSubmittedEmail({ to, name, companyName }: SendSecretaryRecordsSubmittedEmailParams) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Secretary Records Available - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">Secretary Records Submitted</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>We have submitted important secretary records for your company registration: <strong>${companyName}</strong>.</p>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #28a745; margin: 0 0 10px 0;">📋 Secretary Records Available</h3>
              <p style="margin: 0; color: #333;">New secretary records and documents are now available in your dashboard.</p>
            </div>
            
            <h3 style="color: #333;">What you need to do:</h3>
            <ol style="color: #555; line-height: 1.8;">
              <li><strong>Log in to your dashboard</strong> and navigate to the Secretary Records section</li>
              <li><strong>Review the submitted documents</strong> carefully</li>
              <li><strong>Download all documents</strong> that require your signature</li>
              <li><strong>Print, sign, and scan</strong> the documents as required</li>
              <li><strong>Upload the signed versions</strong> back to the dashboard</li>
            </ol>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Important Notes:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #856404;">
                <li>Please review all documents carefully before signing</li>
                <li>Ensure all signatures are clear and legible</li>
                <li>Scan documents in high quality (PDF format preferred)</li>
                <li>If you have any questions about the documents, contact our support team</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold;">
                Access Your Dashboard
              </a>
            </div>
            
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
            <p><small>If you have any questions or need assistance, please contact our support team.</small></p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Error sending secretary records submitted email:', error);
      throw new Error('Failed to send secretary records submitted email');
    }

    console.log('Secretary records submitted email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendSecretaryRecordsSubmittedEmail:', error);
    throw error;
  }
}

/**
 * Sends a notification email to the customer when admin submits signed Secretary Records (Step 4)
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendSignedSecretaryRecordsEmail({ to, name, companyName }: SendSignedSecretaryRecordsEmailParams) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Signed Secretary Records Available',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">✅ Signed Secretary Records Ready</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>Great news! We have completed and submitted the signed secretary records for your company: <strong>${companyName}</strong>.</p>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; text-align: center;">
              <h3 style="color: #28a745; margin: 0 0 10px 0;">✅ Signed Documents Available</h3>
              <p style="margin: 0; color: #333; font-size: 16px;">The signed secretary records are now ready for your review and download.</p>
            </div>
            
            <h3 style="color: #333;">What you need to do:</h3>
            <ol style="color: #555; line-height: 1.8;">
              <li><strong>Log in to your dashboard</strong> and navigate to the Secretary Records section</li>
              <li><strong>Review the signed documents</strong> carefully</li>
              <li><strong>Download the signed secretary records</strong> for your company files</li>
              <li><strong>Keep these documents safe</strong> as they are important corporate records</li>
            </ol>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <h4 style="color: #1976d2; margin: 0 0 10px 0;">📋 Important Corporate Records</h4>
              <p style="margin: 0; color: #555;">These signed secretary records are essential corporate documents that form part of your company's official records. Please download and store them securely with your other important company documents.</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin: 0 0 10px 0;">💡 Document Storage Tips</h4>
              <ul style="margin: 0; padding-left: 20px; color: #856404;">
                <li>Keep both digital and physical copies</li>
                <li>Store in a secure location accessible to authorized personnel</li>
                <li>Include these in your corporate records book</li>
                <li>Make backups of all digital files</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #28a745; color: white; padding: 14px 35px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                View Signed Documents
              </a>
            </div>
            
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
            <p><small>If you have any questions or need assistance, please contact our support team.</small></p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Error sending signed secretary records email:', error);
      throw new Error('Failed to send signed secretary records email');
    }

    console.log('Signed secretary records email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendSignedSecretaryRecordsEmail:', error);
    throw error;
  }
}

/**
 * Sends a notification email to the customer when their company registration has expired
 * @param params - The email parameters
 * @returns The result of the email sending operation
 */
export async function sendCompanyExpiryNotificationEmail({ to, name, companyName, expireDate }: SendCompanyExpiryNotificationEmailParams) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;

    // Format the expiry date nicely
    const formattedDate = new Date(expireDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: `Company Registration Expired - ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333;">⚠️ Company Secretary Practice Period Expired</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>This is to inform you that your company registration has expired.</p>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; text-align: center;">
              <h3 style="color: #856404; margin: 0 0 10px 0;">Company Registration Expired</h3>
              <h2 style="color: #333; margin: 10px 0; font-size: 24px;">${companyName}</h2>
              <p style="margin: 10px 0; color: #856404; font-size: 16px;"><strong>Expiry Date:</strong> ${formattedDate}</p>
            </div>
            
            <h3 style="color: #333;">What you need to do:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li><strong>Contact our support team</strong> to renew your company registration</li>
              <li><strong>Review the renewal requirements</strong> and prepare necessary documents</li>
              <li><strong>Complete the renewal process</strong> as soon as possible to avoid penalties</li>
              <li><strong>Keep your company records up to date</strong> for compliance purposes</li>
            </ul>
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h4 style="color: #721c24; margin: 0 0 10px 0;">⚠️ Important Notice:</h4>
              <p style="margin: 0; color: #721c24;">Operating a company with an expired registration may result in legal penalties and complications. Please take immediate action to renew your registration.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #dc3545; color: white; padding: 14px 35px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Access Your Dashboard
              </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 16px; color: #333;">If you need assistance with the renewal process, please contact our support team.</p>
            
            <p><small><strong>Note: This is an automated message. Please do not reply to this email.</strong></small></p>
            <p><small>For inquiries, please contact our support team through the dashboard or our official support channels.</small></p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CENTRAL COURT (PRIVATE) LIMITED. ALL RIGHTS RESERVED.</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `,
      headers: {
        'Reply-To': 'noreply@balancedashboard.shop',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Precedence': 'bulk'
      }
    });

    if (error) {
      console.error('Error sending company expiry notification email:', error);
      throw new Error('Failed to send company expiry notification email');
    }

    console.log('Company expiry notification email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in sendCompanyExpiryNotificationEmail:', error);
    throw error;
  }
}
import { Resend } from 'resend';

// Initialize Resend client with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export default resend;
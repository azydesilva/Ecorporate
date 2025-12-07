'use client';

import { useState, useEffect } from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [navigateTo, setNavigateTo] = useState('');

    useEffect(() => {
        // Get email from URL parameters if available
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, []);

    const handlePasswordReset = (email: string) => {
        // Password reset completed successfully
        console.log('Password reset completed for:', email);
    };

    const handleNavigation = (page: string) => {
        setNavigateTo(page);
    };

    // Handle navigation
    useEffect(() => {
        if (navigateTo) {
            if (navigateTo === 'login') {
                window.location.href = '/'; // Navigate to home page which contains login
            }
        }
    }, [navigateTo]);

    return (
        <ResetPasswordForm
            navigateTo={handleNavigation}
            onPasswordReset={handlePasswordReset}
            email={email}
        />
    );
}
'use client';

import { useState, useEffect } from 'react';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
    const [navigateTo, setNavigateTo] = useState('');

    const handlePasswordResetRequested = (email: string) => {
        // Password reset requested successfully
        console.log('Password reset requested for:', email);
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
        <ForgotPasswordForm
            navigateTo={handleNavigation}
            onPasswordResetRequested={handlePasswordResetRequested}
        />
    );
}
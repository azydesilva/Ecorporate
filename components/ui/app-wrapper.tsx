'use client';

import { useEffect, useState } from 'react';
import { Header } from './header';
import { userStorage } from '@/lib/local-storage';

interface AppWrapperProps {
    children: React.ReactNode;
    navigateTo?: (page: string) => void;
    onLogout?: () => void;
}

export function AppWrapper({ children, navigateTo, onLogout }: AppWrapperProps) {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Load user from localStorage
        const currentUser = userStorage.getUser();
        setUser(currentUser);

        // Listen for user changes
        const handleUserUpdate = () => {
            const updatedUser = userStorage.getUser();
            setUser(updatedUser);
        };

        window.addEventListener('user-updated', handleUserUpdate);
        return () => window.removeEventListener('user-updated', handleUserUpdate);
    }, []);

    return (
        <>
            <Header user={user} navigateTo={navigateTo} onLogout={onLogout} />
            {children}
        </>
    );
}

// Database service layer for handling all database operations
export class DatabaseService {
    private static async safeParseJson(response: Response) {
        const text = await response.text();
        if (!text) {
            return null;
        }
        try {
            return JSON.parse(text);
        } catch (error) {
            console.error('Failed to parse JSON response:', error, 'Body:', text);
            throw new Error('Invalid JSON response');
        }
    }
    // Registration operations
    static async getRegistrations(userId?: string, userEmail?: string) {
        try {
            let url = '/api/registrations';
            const params: string[] = [];
            if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
            if (userEmail) params.push(`userEmail=${encodeURIComponent(userEmail)}`);
            if (params.length > 0) url += `?${params.join('&')}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch registrations: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            // Ensure the result is an array
            if (!Array.isArray(result)) {
                console.error('API returned non-array result:', result);
                throw new Error('Invalid response format from API');
            }
            return result;
        } catch (error) {
            console.error('Error fetching registrations:', error);
            throw error;
        }
    }

    static async getRegistrationById(id: string) {
        const response = await fetch(`/api/registrations/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error('Failed to fetch registration');
        }
        return response.json();
    }

    static async createRegistration(registration: any) {
        console.log('📝 DatabaseService - Sending registration:', JSON.stringify(registration, null, 2));

        const response = await fetch('/api/registrations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registration),
        });

        console.log('📊 DatabaseService - Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ DatabaseService - Error response:', errorText);
            throw new Error(`Failed to create registration: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ DatabaseService - Registration created successfully:', result);
        return result;
    }

    static async updateRegistration(id: string, registration: any) {
        const response = await fetch(`/api/registrations/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registration),
        });
        if (!response.ok) {
            throw new Error('Failed to update registration');
        }
        return response.json();
    }

    static async deleteRegistration(id: string) {
        const response = await fetch(`/api/registrations/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete registration');
        }
        return response.json();
    }

    static async togglePinnedStatus(id: string, pinned: boolean) {
        const response = await fetch(`/api/registrations/${id}/pin`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pinned }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('togglePinnedStatus error response:', errorText);
            throw new Error(`Failed to toggle pinned status: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Package operations
    static async getPackages() {
        const response = await fetch('/api/packages');
        if (!response.ok) {
            throw new Error('Failed to fetch packages');
        }
        return response.json();
    }

    static async createPackage(packageData: any) {
        const response = await fetch('/api/packages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(packageData),
        });
        if (!response.ok) {
            throw new Error('Failed to create package');
        }
        return response.json();
    }

    static async updatePackages(packages: any[]) {
        const response = await fetch('/api/packages', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ packages }),
        });
        if (!response.ok) {
            throw new Error('Failed to update packages');
        }
        return response.json();
    }

    // Bank details operations
    static async getBankDetails() {
        const response = await fetch('/api/bank-details');
        if (!response.ok) {
            throw new Error('Failed to fetch bank details');
        }
        return response.json();
    }

    static async createBankDetail(bankDetail: any) {
        const response = await fetch('/api/bank-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bankDetail),
        });
        if (!response.ok) {
            throw new Error('Failed to create bank detail');
        }
        return response.json();
    }

    static async updateBankDetails(bankDetails: any[]) {
        const response = await fetch('/api/bank-details', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bankDetails }),
        });
        if (!response.ok) {
            throw new Error('Failed to update bank details');
        }
        return response.json();
    }

    // Settings operations
    static async getSettings() {
        const response = await fetch('/api/settings');
        if (!response.ok) {
            // Try to read error body safely for logging/diagnostics
            try {
                const err = await DatabaseService.safeParseJson(response);
                throw new Error(err?.error || 'Failed to fetch settings');
            } catch {
                throw new Error('Failed to fetch settings');
            }
        }
        const data = await DatabaseService.safeParseJson(response);
        return data ?? {};
    }

    static async updateSettings(settings: any) {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });
        if (!response.ok) {
            // Try to extract error details if present
            try {
                const err = await DatabaseService.safeParseJson(response);
                throw new Error(err?.error || 'Failed to update settings');
            } catch {
                throw new Error('Failed to update settings');
            }
        }
        const data = await DatabaseService.safeParseJson(response);
        // Some routes may return 200 with empty body; normalize to success
        return data ?? { success: true };
    }

    // User operations
    static async getUsers() {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return response.json();
    }

    static async getUserById(id: string) {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error('Failed to fetch user');
        }
        return response.json();
    }

    static async createUser(userData: any) {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create user');
        }
        return response.json();
    }

    static async updateUser(id: string, userData: any) {
        console.log('DatabaseService.updateUser called with:', { id, userData });
        const response = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('DatabaseService.updateUser failed:', errorData);
            throw new Error(errorData.error || 'Failed to update user');
        }
        const result = await response.json();
        console.log('DatabaseService.updateUser success:', result);
        return result;
    }

    static async deleteUser(id: string) {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete user');
        }
        return response.json();
    }

    // Authentication operations
    static async authenticateUser(email: string, password: string) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Authentication failed');
        }
        return response.json();
    }
}

// Legacy localStorage compatibility layer
export class LocalStorageService {
    static async getRegistrations(userId?: string, userEmail?: string) {
        try {
            let url = '/api/registrations';
            const params: string[] = [];
            if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
            if (userEmail) params.push(`userEmail=${encodeURIComponent(userEmail)}`);
            if (params.length > 0) url += `?${params.join('&')}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch registrations: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            // Ensure the result is an array
            if (!Array.isArray(result)) {
                console.error('API returned non-array result:', result);
                throw new Error('Invalid response format from API');
            }
            return result;
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage:', error);
            const savedRegistrations = localStorage.getItem("registrations");
            const parsed = savedRegistrations ? JSON.parse(savedRegistrations) : [];
            // Ensure localStorage fallback also returns an array
            if (!Array.isArray(parsed)) {
                console.error('localStorage fallback also returned non-array:', parsed);
                return [];
            }
            // If userId is provided, filter the localStorage data
            if (userId) {
                return parsed.filter((reg: any) => reg.userId === userId);
            }
            return parsed;
        }
    }

    static async getRegistrationById(id: string) {
        try {
            console.log("🔍 LocalStorageService.getRegistrationById called with ID:", id);
            const response = await fetch(`/api/registrations/${id}`);
            console.log("🔍 API response status:", response.status);
            if (!response.ok) {
                if (response.status === 404) {
                    console.log("❌ Registration not found in database");
                    return null;
                }
                throw new Error('Failed to fetch registration');
            }
            const data = await response.json();
            console.log("🔍 API response data:", data);
            return data;
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage:', error);
            const savedRegistrations = localStorage.getItem("registrations");
            if (savedRegistrations) {
                const registrations = JSON.parse(savedRegistrations);
                const result = registrations.find((reg: any) => reg._id === id || reg.id === id);
                console.log("🔍 Found in localStorage:", result);
                return result;
            }
            return null;
        }
    }

    static async saveRegistration(registration: any) {
        try {
            if (registration._id && registration._id !== 'new') {
                const response = await fetch(`/api/registrations/${registration._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(registration),
                });
                if (!response.ok) {
                    throw new Error('Failed to update registration');
                }
                return response.json();
            } else {
                const response = await fetch('/api/registrations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(registration),
                });
                if (!response.ok) {
                    throw new Error('Failed to create registration');
                }
                return response.json();
            }
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            const savedRegistrations = localStorage.getItem("registrations");
            let registrations = savedRegistrations ? JSON.parse(savedRegistrations) : [];

            if (registration._id && registration._id !== 'new') {
                registrations = registrations.map((reg: any) =>
                    reg._id === registration._id ? registration : reg
                );
            } else {
                registrations.push(registration);
            }

            localStorage.setItem("registrations", JSON.stringify(registrations));
            return { success: true };
        }
    }

    // Pure localStorage version that doesn't make API calls
    static async saveRegistrationLocalOnly(registration: any) {
        console.log('💾 LocalStorageService - Saving to localStorage only (no API calls)');
        const savedRegistrations = localStorage.getItem("registrations");
        let registrations = savedRegistrations ? JSON.parse(savedRegistrations) : [];

        if (registration._id && registration._id !== 'new') {
            registrations = registrations.map((reg: any) =>
                reg._id === registration._id ? registration : reg
            );
        } else {
            registrations.push(registration);
        }

        localStorage.setItem("registrations", JSON.stringify(registrations));
        return { success: true };
    }

    static async deleteRegistration(id: string) {
        try {
            const response = await fetch(`/api/registrations/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete registration');
            }
            return response.json();
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            const savedRegistrations = localStorage.getItem("registrations");
            if (savedRegistrations) {
                let registrations = JSON.parse(savedRegistrations);
                registrations = registrations.filter((reg: any) => reg._id !== id);
                localStorage.setItem("registrations", JSON.stringify(registrations));
            }
            return { success: true };
        }
    }

    static async getPackages() {
        try {
            const dbPackages = await DatabaseService.getPackages();
            // Convert snake_case to camelCase and parse features for frontend compatibility
            const convertedPackages = dbPackages.map((pkg: any) => ({
                id: pkg.id,
                name: pkg.name,
                description: pkg.description,
                price: Number(pkg.price),
                type: pkg.advance_amount && pkg.balance_amount ? "advance-balance" : "one-time",
                advanceAmount: pkg.advance_amount ? Number(pkg.advance_amount) : undefined,
                balanceAmount: pkg.balance_amount ? Number(pkg.balance_amount) : undefined,
                features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : (pkg.features || [])
            }));
            return convertedPackages;
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            const savedPackages = localStorage.getItem("packages");
            return savedPackages ? JSON.parse(savedPackages) : [];
        }
    }

    static async savePackages(packages: any[]) {
        try {
            // Save to database
            await DatabaseService.updatePackages(packages);
            // Also save to localStorage as fallback
            localStorage.setItem("packages", JSON.stringify(packages));
            return { success: true };
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            localStorage.setItem("packages", JSON.stringify(packages));
            return { success: true };
        }
    }

    static async getBankDetails() {
        try {
            console.log('LocalStorageService.getBankDetails: Fetching from database...');
            const dbBankDetails = await DatabaseService.getBankDetails();
            console.log('LocalStorageService.getBankDetails: Raw database response:', dbBankDetails);

            // Convert snake_case to camelCase for frontend compatibility
            const convertedBankDetails = dbBankDetails.map((bank: any) => ({
                id: bank.id,
                bankName: bank.bank_name,
                accountName: bank.account_name,
                accountNumber: bank.account_number,
                branchName: bank.branch,
                swiftCode: bank.swift_code || '',
                additionalInstructions: bank.additional_instructions || '',
            }));

            console.log('LocalStorageService.getBankDetails: Converted response:', convertedBankDetails);
            return convertedBankDetails;
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage:', error);
            const savedBankDetails = localStorage.getItem("bankDetails");
            return savedBankDetails ? JSON.parse(savedBankDetails) : [];
        }
    }

    static async saveBankDetails(bankDetails: any[]) {
        try {
            console.log('LocalStorageService.saveBankDetails called with:', bankDetails);

            // Convert frontend format (camelCase) to database format (snake_case)
            const dbBankDetails = bankDetails.map(bank => ({
                id: bank.id,
                bank_name: bank.bankName,
                account_name: bank.accountName,
                account_number: bank.accountNumber,
                branch: bank.branchName,
                swift_code: bank.swiftCode || null,
                additional_instructions: bank.additionalInstructions || null,
            }));

            console.log('Converted to database format:', dbBankDetails);

            // Save to database
            await DatabaseService.updateBankDetails(dbBankDetails);
            console.log('Database update successful');

            // Also save to localStorage as fallback
            localStorage.setItem("bankDetails", JSON.stringify(bankDetails));
            return { success: true };
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage:', error);
            localStorage.setItem("bankDetails", JSON.stringify(bankDetails));
            return { success: true };
        }
    }

    static async getSettings() {
        try {
            return await DatabaseService.getSettings();
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            const savedSettings = localStorage.getItem("settings");
            return savedSettings ? JSON.parse(savedSettings) : {};
        }
    }

    static async saveSettings(settings: any) {
        try {
            return await DatabaseService.updateSettings(settings);
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            localStorage.setItem("settings", JSON.stringify(settings));
            return { success: true };
        }
    }

    // User operations with localStorage fallback
    static async getUsers() {
        try {
            return await DatabaseService.getUsers();
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            const savedUsers = localStorage.getItem("registeredUsers");
            return savedUsers ? JSON.parse(savedUsers) : [];
        }
    }

    static async getUserById(id: string) {
        try {
            return await DatabaseService.getUserById(id);
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            const savedUsers = localStorage.getItem("registeredUsers");
            if (savedUsers) {
                const users = JSON.parse(savedUsers);
                return users.find((user: any) => user.id === id) || null;
            }
            return null;
        }
    }

    static async createUser(userData: any) {
        try {
            return await DatabaseService.createUser(userData);
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            const savedUsers = localStorage.getItem("registeredUsers");
            let users = savedUsers ? JSON.parse(savedUsers) : [];

            // Check if email already exists
            if (users.some((user: any) => user.email === userData.email)) {
                throw new Error('A user with this email already exists');
            }

            const newUser = {
                ...userData,
                id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                role: userData.role || 'customer'
            };

            users.push(newUser);
            localStorage.setItem("registeredUsers", JSON.stringify(users));

            return { success: true, user: newUser };
        }
    }

    static async updateUser(id: string, userData: any) {
        try {
            return await DatabaseService.updateUser(id, userData);
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            const savedUsers = localStorage.getItem("registeredUsers");
            if (savedUsers) {
                let users = JSON.parse(savedUsers);
                const index = users.findIndex((user: any) => user.id === id);

                if (index !== -1) {
                    users[index] = { ...users[index], ...userData };
                    localStorage.setItem("registeredUsers", JSON.stringify(users));
                    return { success: true };
                }
            }
            throw new Error('User not found');
        }
    }

    static async deleteUser(id: string) {
        try {
            return await DatabaseService.deleteUser(id);
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            const savedUsers = localStorage.getItem("registeredUsers");
            if (savedUsers) {
                let users = JSON.parse(savedUsers);
                users = users.filter((user: any) => user.id !== id);
                localStorage.setItem("registeredUsers", JSON.stringify(users));
                return { success: true };
            }
            throw new Error('User not found');
        }
    }

    // Authentication operations with localStorage fallback
    static async authenticateUser(email: string, password: string) {
        try {
            return await DatabaseService.authenticateUser(email, password);
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage');
            const savedUsers = localStorage.getItem("registeredUsers");
            if (savedUsers) {
                const users = JSON.parse(savedUsers);
                const user = users.find((u: any) => u.email === email && u.password === password);

                if (user) {
                    return {
                        success: true,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role
                        }
                    };
                }
            }
            throw new Error('Invalid email or password');
        }
    }

    static async togglePinnedStatus(id: string, pinned: boolean) {
        try {
            const response = await fetch(`/api/registrations/${id}/pin`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pinned }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('togglePinnedStatus error response:', errorText);
                throw new Error(`Failed to toggle pinned status: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.warn('Database unavailable for togglePinnedStatus, operation failed:', error);
            throw error;
        }
    }

    // About settings methods
    static async getAboutSettings() {
        try {
            const response = await fetch('/api/about');
            if (!response.ok) {
                throw new Error('Failed to fetch about settings');
            }
            return response.json();
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage for about settings:', error);
            const savedAboutSettings = localStorage.getItem("aboutSettings");
            if (savedAboutSettings) {
                return JSON.parse(savedAboutSettings);
            }
            // Return default settings if none exist
            return {
                title: "About Our Company",
                companyInformation: "Welcome to our company incorporation service. We provide comprehensive support for business registration and incorporation processes.",
                updatedAt: new Date().toISOString()
            };
        }
    }

    static async saveAboutSettings(aboutSettings: any) {
        try {
            const response = await fetch('/api/about', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(aboutSettings),
            });

            if (!response.ok) {
                throw new Error('Failed to save about settings');
            }

            return response.json();
        } catch (error) {
            console.warn('Database unavailable, falling back to localStorage for about settings:', error);
            localStorage.setItem("aboutSettings", JSON.stringify(aboutSettings));
            return aboutSettings;
        }
    }
} 
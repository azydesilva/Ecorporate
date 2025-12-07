import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe JSON parse function that handles invalid JSON gracefully
export function safeJsonParse(value: any): any {
  if (!value || typeof value !== 'string') {
    return value;
  }

  try {
    // Check if the value is already an object (might be stored as [object Object])
    if (value === '[object Object]' || value === '[object Array]') {
      console.warn('Found [object Object] or [object Array] string, returning null');
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    console.warn('Failed to parse JSON:', value, 'Error:', error);
    return null;
  }
}

// Types for our application data
export interface User {
  id: string
  name: string
  email: string
  mobile_number?: string
  role: "admin" | "customer"
  password?: string // Only stored for demo purposes
  email_verified?: boolean
  email_verified_at?: string
  email_verification_token?: string
  email_verification_sent_at?: string
}

export interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  branchName: string
  swiftCode?: string
  additionalInstructions?: string
}

export interface Message {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  created_by: string
  is_active: boolean
}

export interface Registration {
  _id: string
  companyName: string
  companyNameEnglish?: string
  companyNameSinhala?: string
  contactPersonName: string
  contactPersonEmail: string
  contactPersonPhone: string
  selectedPackage: string
  paymentMethod: string
  currentStep: string
  paymentApproved: boolean
  detailsApproved: boolean
  documentsApproved: boolean
  paymentReceipt: any
  status: string
  pinned?: boolean
  createdAt: string
  updatedAt?: string
  [key: string]: any // Allow for additional properties
}

// Storage keys
const STORAGE_KEYS = {
  USER: "user",
  REGISTRATIONS: "registrations",
  BANK_DETAILS: "bankDetails",
  SETTINGS: "appSettings",
}

// Default values
const DEFAULT_VALUES = {
  BANK_DETAILS: {
    bankName: "",
    accountName: "",
    accountNumber: "",
    branchName: "",
    swiftCode: "",
    additionalInstructions: "",
  },
  REGISTRATIONS: [] as Registration[],
  SETTINGS: {
    theme: "light",
    notifications: true,
  },
}

// Helper functions
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error)
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    // Dispatch a storage event to notify other tabs/windows
    window.dispatchEvent(new Event("storage"))
    // Dispatch a custom event for the specific data type
    window.dispatchEvent(
      new CustomEvent(`${key}-updated`, {
        detail: { value },
      }),
    )
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

// User functions
export const userStorage = {
  getUser: (): User | null => getItem<User | null>(STORAGE_KEYS.USER, null),
  saveUser: (user: User): void => setItem(STORAGE_KEYS.USER, user),
  removeUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER)
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent(`${STORAGE_KEYS.USER}-updated`, { detail: { value: null } }))
  },
  updateUser: (updates: Partial<User>): void => {
    const currentUser = userStorage.getUser()
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates }
      userStorage.saveUser(updatedUser)
    }
  },
}

// Import database service
import { LocalStorageService } from './database-service';
import { isAdmin } from './auth-utils';

// Registration functions
export const registrationStorage = {
  getRegistrations: async (userId?: string): Promise<Registration[]> => {
    try {
      // If we have a current user saved in local storage, include their email so
      // registrations shared with them are returned by the API.
      // However, for admin users, we want to see ALL registrations, not just shared ones
      const currentUser = userStorage.getUser();
      const userEmail = currentUser && !isAdmin(currentUser) ? currentUser.email : undefined;
      const result = await LocalStorageService.getRegistrations(userId, userEmail);
      // Ensure the result is an array
      if (!Array.isArray(result)) {
        console.error('getRegistrations returned non-array:', result);
        return getItem<Registration[]>(STORAGE_KEYS.REGISTRATIONS, DEFAULT_VALUES.REGISTRATIONS);
      }
      return result;
    } catch (error) {
      console.warn('Database unavailable, using localStorage fallback:', error);
      const fallback = getItem<Registration[]>(STORAGE_KEYS.REGISTRATIONS, DEFAULT_VALUES.REGISTRATIONS);
      if (!Array.isArray(fallback)) {
        console.error('localStorage fallback also returned non-array:', fallback);
        return DEFAULT_VALUES.REGISTRATIONS;
      }
      // If userId is provided, filter the localStorage data
      if (userId) {
        return fallback.filter((reg: Registration) => reg.userId === userId);
      }
      return fallback;
    }
  },

  saveRegistrations: async (registrations: Registration[]): Promise<void> => {
    try {
      // Save each registration individually to database
      for (const registration of registrations) {
        await LocalStorageService.saveRegistration(registration);
      }
    } catch (error) {
      console.warn('Database unavailable, using localStorage fallback');
      setItem(STORAGE_KEYS.REGISTRATIONS, registrations);
    }
  },

  addRegistration: async (registration: Registration): Promise<void> => {
    try {
      await LocalStorageService.saveRegistration(registration);

      // Dispatch a specific event for registration added
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-saved",
            registrationId: registration._id,
          },
        }),
      );
    } catch (error) {
      console.warn('Database unavailable, using localStorage fallback');
      const registrations = await registrationStorage.getRegistrations();
      await registrationStorage.saveRegistrations([registration, ...registrations]);
    }
  },

  updateRegistration: async (updatedRegistration: Registration): Promise<void> => {
    try {
      await LocalStorageService.saveRegistration(updatedRegistration);

      // Dispatch a specific event for registration updated
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-updated",
            registrationId: updatedRegistration._id,
          },
        }),
      );
    } catch (error) {
      console.warn('Database unavailable, using localStorage fallback:', error);
      try {
        const registrations = await registrationStorage.getRegistrations();

        // Ensure registrations is an array
        if (!Array.isArray(registrations)) {
          console.error('Registrations is not an array:', registrations);
          return;
        }

        const index = registrations.findIndex((reg: Registration) => reg._id === updatedRegistration._id);

        if (index !== -1) {
          registrations[index] = updatedRegistration;
          await registrationStorage.saveRegistrations(registrations);
        }
      } catch (fallbackError) {
        console.error('Error in localStorage fallback:', fallbackError);
      }
    }
  },

  removeRegistration: async (registrationId: string): Promise<void> => {
    try {
      await LocalStorageService.deleteRegistration(registrationId);

      // Dispatch a specific event for registration removed
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-removed",
            registrationId,
          },
        }),
      );
    } catch (error) {
      console.warn('Database unavailable, using localStorage fallback');
      const registrations = await registrationStorage.getRegistrations();
      const filteredRegistrations = registrations.filter((reg: Registration) => reg._id !== registrationId);
      await registrationStorage.saveRegistrations(filteredRegistrations);
    }
  },

  getRegistrationById: async (id: string): Promise<Registration | null> => {
    try {
      return await LocalStorageService.getRegistrationById(id);
    } catch (error) {
      console.warn('Database unavailable, using localStorage fallback');
      const registrations = await registrationStorage.getRegistrations();
      return registrations.find((reg: Registration) => reg._id === id) || null;
    }
  },
}

// Bank details functions
export const bankDetailsStorage = {
  getBankDetails: (): BankDetails => {
    if (typeof window === 'undefined') {
      return DEFAULT_VALUES.BANK_DETAILS;
    }
    return getItem<BankDetails>(STORAGE_KEYS.BANK_DETAILS, DEFAULT_VALUES.BANK_DETAILS);
  },

  saveBankDetails: (bankDetails: BankDetails): void => {
    if (typeof window === 'undefined') {
      return;
    }
    setItem(STORAGE_KEYS.BANK_DETAILS, bankDetails);
  },
}

// Settings functions
export const settingsStorage = {
  getSettings: () => getItem(STORAGE_KEYS.SETTINGS, DEFAULT_VALUES.SETTINGS),
  saveSettings: (settings: any) => setItem(STORAGE_KEYS.SETTINGS, settings),
  updateSettings: (updates: any) => {
    const currentSettings = settingsStorage.getSettings()
    settingsStorage.saveSettings({ ...currentSettings, ...updates })
  },
}

// Initialize localStorage with default values if they don't exist
export function initializeLocalStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(DEFAULT_VALUES.REGISTRATIONS))
  }

  if (!localStorage.getItem(STORAGE_KEYS.BANK_DETAILS)) {
    localStorage.setItem(STORAGE_KEYS.BANK_DETAILS, JSON.stringify(DEFAULT_VALUES.BANK_DETAILS))
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_VALUES.SETTINGS))
  }
}

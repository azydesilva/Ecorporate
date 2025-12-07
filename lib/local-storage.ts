// Types for our application data
export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "customer"
  password?: string // Only stored for demo purposes
}

export interface Settings {
  theme: string;
  notifications: boolean;
  title?: string;
  logo?: string;
  primaryColor?: string;
  favicon?: string;
  changeNavbarColor?: boolean;
  additionalFees?: {
    directors: {
      local: number;
      foreign: number;
    };
    shareholders: {
      localNaturalPerson: number;
      localLegalEntity: number;
      foreignNaturalPerson: number;
      foreignLegalEntity: number;
    };
  };
}

export interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  branchName: string
  swiftCode?: string
  additionalInstructions?: string
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

// (Removed duplicate Settings interface)

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
    bankName: "Global Trust Bank",
    accountName: "Company Registration Services Ltd",
    accountNumber: "1234567890",
    branchName: "Main Branch",
    swiftCode: "GTBKLK12",
    additionalInstructions: "Please include your company name as the payment reference.",
  },
  REGISTRATIONS: [] as Registration[],
  SETTINGS: {
    theme: "light",
    notifications: true,
    title: "",
    primaryColor: "#2563eb", // blue-600
  } as Settings,
}

// Cached settings to avoid repeated localStorage access
let cachedSettings: {
  [key: string]: any
} = {};

// Helper functions
function getItem<T>(key: string, defaultValue: T): T {
  try {
    // Check if we have a cached value (helps with SSR and hydration)
    if (cachedSettings[key]) {
      return cachedSettings[key] as T;
    }

    // Check if localStorage is available (we're on client side)
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }

    const item = localStorage.getItem(key)
    const parsedItem = item ? JSON.parse(item) : defaultValue;

    // Cache the result
    cachedSettings[key] = parsedItem;

    return parsedItem;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error)
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    // Update the cache immediately
    cachedSettings[key] = value;

    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

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

// Registration functions
export const registrationStorage = {
  getRegistrations: (): Registration[] => {
    const registrations = getItem<Registration[]>(STORAGE_KEYS.REGISTRATIONS, DEFAULT_VALUES.REGISTRATIONS);

    // Ensure registrations is always an array
    if (!Array.isArray(registrations)) {
      console.warn('Registrations is not an array, resetting to empty array:', registrations);
      // Reset to empty array and save it
      const emptyArray: Registration[] = [];
      setItem(STORAGE_KEYS.REGISTRATIONS, emptyArray);
      return emptyArray;
    }

    return registrations;
  },

  saveRegistrations: (registrations: Registration[]): void => {
    // Ensure we're always saving an array
    if (!Array.isArray(registrations)) {
      console.error('Attempting to save non-array registrations:', registrations);
      return;
    }
    setItem(STORAGE_KEYS.REGISTRATIONS, registrations);
  },

  addRegistration: (registration: Registration): void => {
    const registrations = registrationStorage.getRegistrations()

    // Ensure registrations is an array
    if (!Array.isArray(registrations)) {
      console.error('Registrations is not an array in addRegistration:', registrations);
      return;
    }

    registrationStorage.saveRegistrations([registration, ...registrations])

    // Dispatch a specific event for registration added
    window.dispatchEvent(
      new CustomEvent("registration-updated", {
        detail: {
          type: "registration-saved",
          registrationId: registration._id,
        },
      }),
    )
  },

  updateRegistration: (updatedRegistration: Registration): void => {
    const registrations = registrationStorage.getRegistrations()

    // Ensure registrations is an array
    if (!Array.isArray(registrations)) {
      console.error('Registrations is not an array:', registrations);
      return;
    }

    const index = registrations.findIndex((reg) => reg._id === updatedRegistration._id)

    if (index !== -1) {
      registrations[index] = updatedRegistration
      registrationStorage.saveRegistrations(registrations)

      // Dispatch a specific event for registration updated
      window.dispatchEvent(
        new CustomEvent("registration-updated", {
          detail: {
            type: "registration-updated",
            registrationId: updatedRegistration._id,
          },
        }),
      )
    }
  },

  removeRegistration: (registrationId: string): void => {
    const registrations = registrationStorage.getRegistrations()

    // Ensure registrations is an array
    if (!Array.isArray(registrations)) {
      console.error('Registrations is not an array in removeRegistration:', registrations);
      return;
    }

    const filteredRegistrations = registrations.filter((reg) => reg._id !== registrationId)
    registrationStorage.saveRegistrations(filteredRegistrations)

    // Dispatch a specific event for registration removed
    window.dispatchEvent(
      new CustomEvent("registration-updated", {
        detail: {
          type: "registration-removed",
          registrationId,
        },
      }),
    )
  },

  getRegistrationById: (registrationId: string): Registration | undefined => {
    const registrations = registrationStorage.getRegistrations()

    // Ensure registrations is an array
    if (!Array.isArray(registrations)) {
      console.error('Registrations is not an array in getRegistrationById:', registrations);
      return undefined;
    }

    return registrations.find((reg) => reg._id === registrationId)
  },
}

// Bank details functions
export const bankDetailsStorage = {
  getBankDetails: (): BankDetails => getItem<BankDetails>(STORAGE_KEYS.BANK_DETAILS, DEFAULT_VALUES.BANK_DETAILS),

  saveBankDetails: (bankDetails: BankDetails): void => setItem(STORAGE_KEYS.BANK_DETAILS, bankDetails),
}

// Settings functions
export const settingsStorage = {
  getSettings: () => getItem(STORAGE_KEYS.SETTINGS, DEFAULT_VALUES.SETTINGS),
  saveSettings: (settings: any) => setItem(STORAGE_KEYS.SETTINGS, settings),
  updateSettings: (updates: any) => {
    const currentSettings = settingsStorage.getSettings()
    settingsStorage.saveSettings({ ...currentSettings, ...updates })
  },
  // Enhanced method to get settings with database fallback
  async getSettingsWithFallback() {
    try {
      const localSettings = settingsStorage.getSettings();

      // If localStorage has meaningful settings, return them
      const hasMeaningfulLocalSettings = !!(
        (localSettings && typeof localSettings.title === 'string' && localSettings.title.trim()) ||
        (localSettings && localSettings.logo) ||
        (localSettings && localSettings.favicon) ||
        (localSettings && localSettings.primaryColor && localSettings.primaryColor !== DEFAULT_VALUES.SETTINGS.primaryColor)
      );
      if (hasMeaningfulLocalSettings) {
        return localSettings;
      }

      // Otherwise, try to load from database
      const { LocalStorageService } = await import('./database-service');
      const dbSettings = await LocalStorageService.getSettings();

      if (dbSettings) {
        // Convert database format to localStorage format
        const convertedSettings = {
          title: dbSettings.title || '',
          logo: dbSettings.logo_url || '',
          primaryColor: dbSettings.primary_color || DEFAULT_VALUES.SETTINGS.primaryColor,
          favicon: dbSettings.favicon_url || '',
          changeNavbarColor: dbSettings.changeNavbarColor || false,
          theme: DEFAULT_VALUES.SETTINGS.theme,
          notifications: DEFAULT_VALUES.SETTINGS.notifications
        };

        // Save to localStorage for future use
        settingsStorage.saveSettings(convertedSettings);

        return convertedSettings;
      }

      return DEFAULT_VALUES.SETTINGS;
    } catch (error) {
      console.error('Error loading settings with fallback:', error);
      return settingsStorage.getSettings();
    }
  }
}

// Utility function to reset corrupted registrations data
export const resetRegistrationsData = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Clear the cached value
      delete cachedSettings[STORAGE_KEYS.REGISTRATIONS];

      // Remove the corrupted data from localStorage
      localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS);

      // Initialize with empty array
      setItem(STORAGE_KEYS.REGISTRATIONS, DEFAULT_VALUES.REGISTRATIONS);

      console.log('✅ Registrations data reset successfully');
    }
  } catch (error) {
    console.error('Error resetting registrations data:', error);
  }
};

// Initialize localStorage with default values if they don't exist
export async function initializeLocalStorage(): Promise<void> {
  // Check if registrations exist and are valid
  const registrationsItem = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
  if (!registrationsItem) {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(DEFAULT_VALUES.REGISTRATIONS))
  } else {
    // Check if the stored data is valid (should be an array)
    try {
      const parsed = JSON.parse(registrationsItem);
      if (!Array.isArray(parsed)) {
        console.warn('Found corrupted registrations data, resetting to empty array');
        resetRegistrationsData();
      }
    } catch (error) {
      console.error('Error parsing registrations data, resetting to empty array:', error);
      resetRegistrationsData();
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.BANK_DETAILS)) {
    localStorage.setItem(STORAGE_KEYS.BANK_DETAILS, JSON.stringify(DEFAULT_VALUES.BANK_DETAILS))
  }

  // For settings, try to load from database first if localStorage is empty
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    try {
      const { LocalStorageService } = await import('./database-service');
      const dbSettings = await LocalStorageService.getSettings();

      if (dbSettings) {
        // Convert database format to localStorage format
        const convertedSettings = {
          title: dbSettings.title || '',
          logo: dbSettings.logo_url || '',
          primaryColor: dbSettings.primary_color || DEFAULT_VALUES.SETTINGS.primaryColor,
          favicon: dbSettings.favicon_url || '',
          changeNavbarColor: dbSettings.changeNavbarColor || false,
          theme: DEFAULT_VALUES.SETTINGS.theme,
          notifications: DEFAULT_VALUES.SETTINGS.notifications
        };

        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(convertedSettings));
      } else {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_VALUES.SETTINGS));
      }
    } catch (error) {
      console.error('Error loading settings from database during initialization:', error);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_VALUES.SETTINGS));
    }
  }
}

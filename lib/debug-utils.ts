import { userStorage, registrationStorage, bankDetailsStorage, settingsStorage } from "./local-storage"

// Function to clear all localStorage data
export function clearAllData(): void {
  localStorage.clear()
  console.log("All localStorage data has been cleared.")
}

// Function to export all localStorage data as JSON
export function exportAllData(): string {
  const data = {
    user: userStorage.getUser(),
    registrations: registrationStorage.getRegistrations(),
    bankDetails: bankDetailsStorage.getBankDetails(),
    settings: settingsStorage.getSettings(),
    otherData: {} as Record<string, any>,
  }

  // Get any other localStorage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && !["user", "registrations", "bankDetails", "appSettings"].includes(key)) {
      try {
        data.otherData[key] = JSON.parse(localStorage.getItem(key) || "null")
      } catch {
        data.otherData[key] = localStorage.getItem(key)
      }
    }
  }

  return JSON.stringify(data, null, 2)
}

// Function to import data from JSON
export function importData(jsonData: string): void {
  try {
    const data = JSON.parse(jsonData)

    // Import user data
    if (data.user) {
      userStorage.saveUser(data.user)
    }

    // Import registrations
    if (data.registrations) {
      registrationStorage.saveRegistrations(data.registrations)
    }

    // Import bank details
    if (data.bankDetails) {
      bankDetailsStorage.saveBankDetails(data.bankDetails)
    }

    // Import settings
    if (data.settings) {
      settingsStorage.saveSettings(data.settings)
    }

    // Import other data
    if (data.otherData) {
      Object.entries(data.otherData).forEach(([key, value]) => {
        localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value))
      })
    }

    console.log("Data imported successfully.")
  } catch (error) {
    console.error("Error importing data:", error)
  }
}

// Function to print current localStorage usage
export function getStorageUsage(): { used: string; remaining: string; percentUsed: string } {
  const totalSize = 5 * 1024 * 1024 // 5MB is typical localStorage limit
  let usedSize = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key) || ""
      usedSize += key.length + value.length
    }
  }

  const remainingSize = totalSize - usedSize
  const percentUsed = (usedSize / totalSize) * 100

  return {
    used: `${(usedSize / 1024).toFixed(2)} KB`,
    remaining: `${(remainingSize / 1024).toFixed(2)} KB`,
    percentUsed: `${percentUsed.toFixed(2)}%`,
  }
}

// Function to check data integrity
export function checkDataIntegrity(): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check user data
  try {
    const user = userStorage.getUser()
    if (user && (!user.id || !user.email || !user.role)) {
      issues.push("User data is incomplete")
    }
  } catch (error) {
    issues.push("Error parsing user data")
  }

  // Check registrations
  try {
    const registrations = registrationStorage.getRegistrations()
    registrations.forEach((reg, index) => {
      if (!reg._id) {
        issues.push(`Registration at index ${index} is missing an ID`)
      }
    })
  } catch (error) {
    issues.push("Error parsing registrations data")
  }

  // Check bank details
  try {
    const bankDetails = bankDetailsStorage.getBankDetails()
    if (!bankDetails.bankName || !bankDetails.accountNumber) {
      issues.push("Bank details are incomplete")
    }
  } catch (error) {
    issues.push("Error parsing bank details data")
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

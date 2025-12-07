import type { User } from "./utils"
import { LocalStorageService } from "./database-service"
// Removed password hashing utilities as per user request

// User roles
export type UserRole = "admin" | "customer"

// Default Admin
const DEFAULT_ADMIN: User = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  mobile_number: "+94771234567", // Default admin mobile number
  role: "admin",
  password: "admin123", // Plain text password as requested
  email_verified: true, // Admin is pre-verified
  email_verified_at: new Date().toISOString(),
}

// Initialize users in database
export async function initializeUsers(): Promise<void> {
  try {
    const users = await getUsers()

    // Add default admin if no users exist
    if (users.length === 0) {
      await registerUser({
        name: DEFAULT_ADMIN.name,
        email: DEFAULT_ADMIN.email,
        mobile_number: DEFAULT_ADMIN.mobile_number,
        password: DEFAULT_ADMIN.password,
        role: DEFAULT_ADMIN.role,
      })
    }
  } catch (error) {
    console.error('Error initializing users:', error)
  }
}

// Get all registered users
export async function getUsers(): Promise<User[]> {
  try {
    return await LocalStorageService.getUsers()
  } catch (error) {
    console.error("Error retrieving users:", error)
    return []
  }
}

// Save users to database
export async function saveUsers(users: User[]): Promise<void> {
  try {
    // This function is kept for backward compatibility
    // In the new implementation, users are saved individually
    console.warn('saveUsers function is deprecated. Use individual user operations instead.')
  } catch (error) {
    console.error("Error saving users:", error)
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    return await LocalStorageService.getUserById(userId)
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Register a new user
export async function registerUser(user: Omit<User, "id">): Promise<User | null> {
  try {
    const result = await LocalStorageService.createUser(user)
    return result.user || null
  } catch (error) {
    console.error("Error registering user:", error)
    throw error
  }
}

// Authenticate user with plain text password comparison
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const result = await LocalStorageService.authenticateUser(email, password)
    return result.user || null
  } catch (error) {
    console.error("Error authenticating user:", error)
    return null
  }
}

// Update user
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    // First get the current user data
    const currentUser = await getUserById(userId)
    if (!currentUser) {
      throw new Error('User not found')
    }

    // Merge the updates with current user data
    const updatedUserData = {
      name: currentUser.name,
      email: currentUser.email,
      mobile_number: currentUser.mobile_number,
      role: currentUser.role,
      password: currentUser.password,
      ...updates
    }

    await LocalStorageService.updateUser(userId, updatedUserData)
    const updatedUser = await getUserById(userId)
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user')
    }
    return updatedUser
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

// Delete user
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    await LocalStorageService.deleteUser(userId)
    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

// Validate user's current password with plain text comparison
export async function validateUserPassword(userId: string, password: string): Promise<boolean> {
  try {
    console.log('Validating password for user:', userId);
    const user = await getUserById(userId)

    if (!user) {
      console.error("User not found when validating password")
      return false
    }

    console.log('User found:', { id: user.id, email: user.email, hasPassword: !!user.password });
    console.log('Password comparison:', {
      provided: password,
      stored: user.password,
      match: user.password === password
    });

    // Compare passwords directly (plain text as requested)
    const isValid = user.password === password

    if (!isValid) {
      console.log("Password validation failed for user:", userId)
    } else {
      console.log("Password validation successful for user:", userId)
    }

    return isValid
  } catch (error) {
    console.error("Error validating user password:", error)
    return false
  }
}

// Change password function with strict validation
export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  try {
    console.log('Changing password for user:', userId);

    // First validate the current password
    if (!(await validateUserPassword(userId, currentPassword))) {
      throw new Error("Current password is incorrect")
    }

    // Get the user
    const user = await getUserById(userId)

    if (!user) {
      throw new Error("User not found")
    }

    // Ensure new password is different from current
    if (currentPassword === newPassword) {
      throw new Error("New password must be different from current password")
    }

    // Update the password in database - send all required fields
    await LocalStorageService.updateUser(userId, {
      name: user.name,
      email: user.email,
      mobile_number: user.mobile_number,
      role: user.role,
      password: newPassword
    })

    console.log("Password successfully changed for user:", userId)
    return true
  } catch (error) {
    console.error("Error changing user password:", error)
    throw error
  }
}

// Check if user has admin role
export function isAdmin(user: User | null): boolean {
  return user?.role === "admin"
}

// Check if user has customer role
export function isCustomer(user: User | null): boolean {
  return user?.role === "customer"
}

// Check if user can manage company registrations (only admin can)
export function canManageRegistrations(user: User | null): boolean {
  return isAdmin(user)
}

// Change user role (only admins can do this)
export async function changeUserRole(currentUserId: string, targetUserId: string, newRole: UserRole): Promise<boolean> {
  try {
    console.log('changeUserRole called:', { currentUserId, targetUserId, newRole });

    // Get current user
    const currentUser = await getUserById(currentUserId)
    console.log('Current user:', currentUser);

    // Check if current user is admin
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can change user roles")
    }

    // Get target user to ensure we have all required fields
    const targetUser = await getUserById(targetUserId)
    console.log('Target user:', targetUser);

    if (!targetUser) {
      throw new Error("Target user not found")
    }

    // Update target user with all required fields
    const updateData = {
      name: targetUser.name,
      email: targetUser.email,
      mobile_number: targetUser.mobile_number,
      role: newRole,
      password: targetUser.password
    };
    console.log('Updating user with data:', updateData);

    await LocalStorageService.updateUser(targetUserId, updateData)
    console.log('User role updated successfully');

    return true
  } catch (error) {
    console.error("Error changing user role:", error)
    throw error
  }
}
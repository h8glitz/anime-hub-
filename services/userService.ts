import type { User, UserPreferences, Notification } from "@/types"

// Initialize demo user if not exists
const initializeDemoUser = () => {
  // Проверяем, доступен ли localStorage (только на клиенте)
  if (typeof window === 'undefined') return;
  
  const usersJson = localStorage.getItem("users")
  const users = usersJson ? JSON.parse(usersJson) : []

  // Check if demo user already exists
  const demoUserExists = users.some((user: any) => user.id === "demo123")

  if (!demoUserExists) {
    // Create demo user
    const demoUser = {
      id: "demo123",
      username: "Demo User",
      email: "demo@example.com",
      password: "password", // In a real app, this would be hashed
      createdAt: new Date().toISOString(),
      bio: "Это демонстрационный аккаунт для тестирования функций сайта.",
      stats: {
        animeWatched: 12,
        episodesWatched: 48,
        commentsPosted: 5,
        joinDate: new Date().toISOString(),
      },
      preferences: {
        theme: "dark",
        autoplay: true,
        notifications: true,
        quality: "1080p",
        language: "ru",
        useUpscaling: true, // Включаем апскейлинг по умолчанию
        preferredPlayer: "kodik" // По умолчанию используем Kodik
      },
      role: "beta", // Demo user gets beta access
    }

    // Add demo user to users array
    users.push(demoUser)

    // Save to localStorage
    localStorage.setItem("users", JSON.stringify(users))

    // Initialize demo user's watch history
    const demoHistory = [
      { id: "1", timestamp: Date.now() - 86400000, season: 1, episode: 5 },
      { id: "2", timestamp: Date.now() - 172800000, season: 1, episode: 3 },
      { id: "3", timestamp: Date.now() - 259200000, season: 1, episode: 1 },
    ]
    localStorage.setItem(`user_${demoUser.id}_history`, JSON.stringify(demoHistory))
  }
}

// Вызываем функцию только на клиенте
if (typeof window !== 'undefined') {
  // Call initialization on module load (only client-side)
  initializeDemoUser()
}

// Function to login user
export async function login(email: string, password: string): Promise<User> {
  // Проверка доступности localStorage
  if (typeof window === 'undefined') {
    throw new Error("Cannot access localStorage on server side");
  }
  
  // Get users from localStorage
  const usersJson = localStorage.getItem("users")
  const users = usersJson ? JSON.parse(usersJson) : []

  // Find user with matching email
  const user = users.find((u: any) => u.email === email)

  if (!user) {
    throw new Error("Пользователь не найден")
  }

  // Check password
  if (user.password !== password) {
    throw new Error("Неверный пароль")
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword as User
}

// Function to register user
export async function register(username: string, email: string, password: string): Promise<User> {
  // Проверка доступности localStorage
  if (typeof window === 'undefined') {
    throw new Error("Cannot access localStorage on server side");
  }
  
  // Get users from localStorage
  const usersJson = localStorage.getItem("users")
  const users = usersJson ? JSON.parse(usersJson) : []

  // Check if user with email already exists
  if (users.some((u: any) => u.email === email)) {
    throw new Error("Пользователь с таким email уже существует")
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    username,
    email,
    password,
    createdAt: new Date().toISOString(),
    avatar: null,
    role: "beta", // All new users get beta access
    stats: {
      animeWatched: 0,
      episodesWatched: 0,
      commentsPosted: 0,
      joinDate: new Date().toISOString(),
    },
    preferences: {
      theme: "dark",
      autoplay: true,
      notifications: true,
      quality: "1080p",
      language: "ru",
      useUpscaling: true, // Включаем апскейлинг по умолчанию
      preferredPlayer: "kodik" // По умолчанию используем Kodik
    },
  }

  // Add to users array
  users.push(newUser)

  // Save to localStorage
  localStorage.setItem("users", JSON.stringify(users))

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser
  return userWithoutPassword as User
}

// Function to get user profile
export async function getUserProfile(userId: string): Promise<User> {
  // Проверка доступности localStorage
  if (typeof window === 'undefined') {
    throw new Error("Cannot access localStorage on server side");
  }
  
  // Get users from localStorage
  const usersJson = localStorage.getItem("users")
  const users = usersJson ? JSON.parse(usersJson) : []

  // Find user with matching ID
  const user = users.find((u: any) => u.id === userId)

  if (!user) {
    throw new Error("Пользователь не найден")
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword as User
}

// Function to update user profile
export async function updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
  // Get users from localStorage
  const usersJson = localStorage.getItem("users")
  const users = usersJson ? JSON.parse(usersJson) : []

  // Find user index
  const userIndex = users.findIndex((u: any) => u.id === userId)

  if (userIndex === -1) {
    throw new Error("Пользователь не найден")
  }

  // Update user data
  users[userIndex] = {
    ...users[userIndex],
    ...data,
  }

  // Save to localStorage
  localStorage.setItem("users", JSON.stringify(users))

  // Return updated user without password
  const { password: _, ...userWithoutPassword } = users[userIndex]
  return userWithoutPassword as User
}

// Function to update user password
export async function updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  // Get users from localStorage
  const usersJson = localStorage.getItem("users")
  const users = usersJson ? JSON.parse(usersJson) : []

  // Find user index
  const userIndex = users.findIndex((u: any) => u.id === userId)

  if (userIndex === -1) {
    throw new Error("Пользователь не найден")
  }

  // Check current password
  if (users[userIndex].password !== currentPassword) {
    throw new Error("Неверный текущий пароль")
  }

  // Update password
  users[userIndex].password = newPassword

  // Save to localStorage
  localStorage.setItem("users", JSON.stringify(users))

  return true
}

// Function to update user preferences
export async function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User> {
  // Проверяем, доступен ли localStorage (только на клиенте)
  if (typeof window === 'undefined') {
    throw new Error("Cannot access localStorage on server side");
  }
  
  // Get users from localStorage
  const usersJson = localStorage.getItem("users")
  const users = usersJson ? JSON.parse(usersJson) : []

  // Find user index
  const userIndex = users.findIndex((u: any) => u.id === userId)

  if (userIndex === -1) {
    throw new Error("Пользователь не найден")
  }

  // Update user preferences
  users[userIndex].preferences = {
    ...users[userIndex].preferences,
    ...preferences,
  }

  // Save to localStorage
  localStorage.setItem("users", JSON.stringify(users))

  // Return updated user without password
  const { password: _, ...userWithoutPassword } = users[userIndex]
  return userWithoutPassword as User
}

// Function to get user notifications
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  // Проверяем, доступен ли localStorage (только на клиенте)
  if (typeof window === 'undefined') {
    return [];
  }
  
  // Get notifications from localStorage
  const notificationsJson = localStorage.getItem(`user_${userId}_notifications`)
  if (!notificationsJson) return []

  const notifications = JSON.parse(notificationsJson) as Notification[]

  // Sort by date (newest first)
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Function to add notification
export async function addNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
  // Get notifications from localStorage
  const notificationsJson = localStorage.getItem(`user_${notification.userId}_notifications`)
  const notifications = notificationsJson ? (JSON.parse(notificationsJson) as Notification[]) : []

  // Create new notification
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }

  // Add to notifications array
  notifications.push(newNotification)

  // Save to localStorage
  localStorage.setItem(`user_${notification.userId}_notifications`, JSON.stringify(notifications))

  return newNotification
}

// Function to mark notification as read
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
  // Get notifications from localStorage
  const notificationsJson = localStorage.getItem(`user_${userId}_notifications`)
  if (!notificationsJson) return false

  const notifications = JSON.parse(notificationsJson) as Notification[]

  // Find notification index
  const notificationIndex = notifications.findIndex((n) => n.id === notificationId)

  if (notificationIndex === -1) {
    return false
  }

  // Mark as read
  notifications[notificationIndex].read = true

  // Save to localStorage
  localStorage.setItem(`user_${userId}_notifications`, JSON.stringify(notifications))

  return true
}

// Function to mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  // Проверяем, доступен ли localStorage (только на клиенте)
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Get notifications from localStorage
  const notificationsJson = localStorage.getItem(`user_${userId}_notifications`)
  if (!notificationsJson) return false

  const notifications = JSON.parse(notificationsJson) as Notification[]

  // Mark all as read
  const updatedNotifications = notifications.map((n) => ({ ...n, read: true }))

  // Save to localStorage
  localStorage.setItem(`user_${userId}_notifications`, JSON.stringify(updatedNotifications))

  return true
}

// Function to delete notification
export async function deleteNotification(userId: string, notificationId: string): Promise<boolean> {
  // Get notifications from localStorage
  const notificationsJson = localStorage.getItem(`user_${userId}_notifications`)
  if (!notificationsJson) return false

  const notifications = JSON.parse(notificationsJson) as Notification[]

  // Filter out the notification
  const updatedNotifications = notifications.filter((n) => n.id !== notificationId)

  // Save to localStorage
  localStorage.setItem(`user_${userId}_notifications`, JSON.stringify(updatedNotifications))

  return true
}

// Function to increment user stats
export async function incrementUserStats(
  userId: string,
  stat: keyof Omit<User["stats"], "joinDate">,
  amount = 1,
): Promise<boolean> {
  // Get users from localStorage
  const usersJson = localStorage.getItem("users")
  const users = usersJson ? JSON.parse(usersJson) : []

  // Find user index
  const userIndex = users.findIndex((u: any) => u.id === userId)

  if (userIndex === -1) {
    return false
  }

  // Make sure stats object exists
  if (!users[userIndex].stats) {
    users[userIndex].stats = {
      animeWatched: 0,
      episodesWatched: 0,
      commentsPosted: 0,
      joinDate: users[userIndex].createdAt || new Date().toISOString(),
    }
  }

  // Increment stat
  users[userIndex].stats[stat] += amount

  // Save to localStorage
  localStorage.setItem("users", JSON.stringify(users))

  return true
}

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import {
  Edit,
  LogOut,
  Heart,
  Clock,
  Settings,
  User,
  Save,
  Camera,
  Bell,
  Award,
  Shield,
  ChevronRight,
  Check,
  X,
  MessageCircle,
} from "lucide-react"
import { getWatchHistory, getUserCollection } from "@/services/animeService"
import {
  updateUserProfile,
  updatePassword,
  updateUserPreferences,
  getUserNotifications,
  markAllNotificationsAsRead,
} from "@/services/userService"
import { useTheme } from "@/context/ThemeContext"
import type { Anime, Notification } from "@/types"
import AnimeCard from "@/components/anime/AnimeCard"
import Link from "next/link"

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth()
  const { theme: currentTheme, setTheme } = useTheme()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("favorites")
  const [collection, setCollection] = useState<Anime[]>([])
  const [history, setHistory] = useState<Anime[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Preferences state
  const [autoplay, setAutoplay] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState<"dark" | "light" | "system">("dark")
  const [quality, setQuality] = useState<"auto" | "360p" | "480p" | "720p" | "1080p" | "1440p" | "2160p">("auto")
  const [useUpscaling, setUseUpscaling] = useState(true)
  const [preferredPlayer, setPreferredPlayer] = useState<"kodik" | "aniboom">("kodik")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    setUsername(user.username)
    setEmail(user.email)
    setBio(user.bio || "")

    // Set preferences
    if (user.preferences) {
      setAutoplay(user.preferences.autoplay !== false)
      setNotificationsEnabled(user.preferences.notifications !== false)
      
      // Типизация для темы
      const themeValue = user.preferences.theme || "dark"
      setSelectedTheme(themeValue as "dark" | "light" | "system")
      
      // Типизация для качества
      const qualityValue = user.preferences.quality || "auto"
      setQuality(qualityValue as "auto" | "360p" | "480p" | "720p" | "1080p" | "1440p" | "2160p")
      
      // Апскейлинг
      setUseUpscaling(user.preferences.useUpscaling !== false)
      
      // Предпочитаемый плеер
      if (user.preferences.preferredPlayer) {
        setPreferredPlayer(user.preferences.preferredPlayer)
      }
    }

    const fetchUserData = async () => {
      setLoading(true)
      try {
        // Fetch collection and history in parallel
        const [collectionData, historyData] = await Promise.all([getUserCollection(user.id), getWatchHistory(user.id)])

        setCollection(collectionData)
        setHistory(historyData)
      } catch (err) {
        console.error("Error fetching user data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()

    // Fetch notifications
    const fetchNotifications = async () => {
      setNotificationsLoading(true)
      try {
        const notifs = await getUserNotifications(user.id)
        setNotifications(notifs)
      } catch (err) {
        console.error("Error fetching notifications:", err)
      } finally {
        setNotificationsLoading(false)
      }
    }

    fetchNotifications()
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // Update profile info
      const updatedUser = await updateUserProfile(user!.id, {
        username,
        email,
        bio,
      })

      setUser(updatedUser)
      setSuccess("Профиль успешно обновлен")

      // If password fields are filled, update password
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          setError("Новые пароли не совпадают")
          return
        }

        await updatePassword(user!.id, currentPassword, newPassword)
        setSuccess("Профиль и пароль успешно обновлены")

        // Clear password fields
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }

      // Exit edit mode
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || "Ошибка при обновлении профиля")
    }
  }

  const handlePreferencesUpdate = async () => {
    try {
      const updatedUser = await updateUserPreferences(user!.id, {
        autoplay,
        notifications: notificationsEnabled,
        theme: selectedTheme,
        quality,
        useUpscaling,
        preferredPlayer,
      })

      setUser(updatedUser)
      setTheme(selectedTheme)
      setSuccess("Настройки успешно обновлены")

      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Ошибка при обновлении настроек")
    }
  }

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user!.id)
      // Refresh notifications
      const notifs = await getUserNotifications(user!.id)
      setNotifications(notifs)
    } catch (err) {
      console.error("Error marking notifications as read:", err)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="loader mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg border border-gray-700/50">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-4xl font-bold mb-4 relative group">
                {user.avatar ? (
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}

                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{user.username}</h2>
              <p className="text-gray-400 mb-1">{user.email}</p>

              {user.role && (
                <div className="mb-4 flex items-center">
                  {user.role === "beta" && (
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Award className="w-3 h-3 mr-1" />
                      BETA
                    </span>
                  )}
                  {user.role === "moderator" && (
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      Модератор
                    </span>
                  )}
                  {user.role === "admin" && (
                    <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      Администратор
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center mb-2 transition-all"
              >
                <Edit className="w-4 h-4 mr-2" />
                Редактировать профиль
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">Статистика</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Избранное:</span>
                  <span className="text-white">{collection.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Просмотрено:</span>
                  <span className="text-white">{history.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Эпизодов:</span>
                  <span className="text-white">{user.stats?.episodesWatched || 0}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Комментарии:</span>
                  <span className="text-white">{user.stats?.commentsPosted || 0}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Дата регистрации:</span>
                  <span className="text-white">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-gray-800/50 rounded-xl shadow-lg overflow-hidden border border-gray-700/50">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              <button
                className={`px-4 py-3 flex items-center whitespace-nowrap ${activeTab === "favorites" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveTab("favorites")}
              >
                <Heart className="w-4 h-4 mr-2" />
                Избранное
              </button>
              <button
                className={`px-4 py-3 flex items-center whitespace-nowrap ${activeTab === "history" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveTab("history")}
              >
                <Clock className="w-4 h-4 mr-2" />
                История просмотров
              </button>
              <button
                className={`px-4 py-3 flex items-center whitespace-nowrap ${activeTab === "notifications" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="w-4 h-4 mr-2" />
                Уведомления
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="ml-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              <button
                className={`px-4 py-3 flex items-center whitespace-nowrap ${activeTab === "settings" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-400 hover:text-white"}`}
                onClick={() => {
                  setActiveTab("settings")
                  setIsEditing(true)
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </button>
            </div>

            <div className="p-6">
              {activeTab === "favorites" && (
                <div>
                  {loading ? (
                    <div className="text-center py-10">
                      <div className="loader mx-auto"></div>
                    </div>
                  ) : collection.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {collection.map((anime) => (
                        <AnimeCard key={anime.id} anime={anime} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      <Heart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-lg mb-2">У вас пока нет избранных аниме</p>
                      <p className="mb-6">Добавляйте аниме в избранное, чтобы быстро находить их позже</p>
                      <Link
                        href="/"
                        className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-6 rounded-lg transition"
                      >
                        Найти аниме
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "history" && (
                <div>
                  {loading ? (
                    <div className="text-center py-10">
                      <div className="loader mx-auto"></div>
                    </div>
                  ) : history.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {history.map((anime) => (
                        <AnimeCard key={anime.id} anime={anime} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-lg mb-2">История просмотров пуста</p>
                      <p className="mb-6">Здесь будут отображаться аниме, которые вы смотрели</p>
                      <Link
                        href="/"
                        className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-6 rounded-lg transition"
                      >
                        Найти аниме
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "notifications" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Уведомления</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsAsRead}
                        className="text-sm text-orange-500 hover:text-orange-400"
                      >
                        Отметить все как прочитанные
                      </button>
                    )}
                  </div>

                  {notificationsLoading ? (
                    <div className="text-center py-10">
                      <div className="loader mx-auto"></div>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border ${notification.read ? "bg-gray-800/30 border-gray-700/50" : "bg-gray-800/50 border-gray-700"}`}
                        >
                          <div className="flex items-start">
                            <div
                              className={`p-2 rounded-full mr-3 ${
                                notification.type === "comment"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : notification.type === "like"
                                    ? "bg-red-500/20 text-red-400"
                                    : notification.type === "follow"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-orange-500/20 text-orange-400"
                              }`}
                            >
                              {notification.type === "comment" ? (
                                <MessageCircle className="w-5 h-5" />
                              ) : notification.type === "like" ? (
                                <Heart className="w-5 h-5" />
                              ) : notification.type === "follow" ? (
                                <User className="w-5 h-5" />
                              ) : (
                                <Bell className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`${notification.read ? "text-gray-400" : "text-white"}`}>
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
                          </div>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="mt-2 text-sm text-orange-500 hover:text-orange-400 flex items-center"
                            >
                              Перейти <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      <Bell className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-lg mb-2">У вас нет уведомлений</p>
                      <p>Здесь будут отображаться уведомления о комментариях и обновлениях</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-orange-500" />
                    Настройки аккаунта
                  </h3>

                  {error && <div className="bg-red-900/30 text-red-400 p-4 rounded-lg mb-4">{error}</div>}

                  {success && <div className="bg-green-900/30 text-green-400 p-4 rounded-lg mb-4">{success}</div>}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-4">Профиль</h4>
                      <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div>
                          <label className="block text-gray-300 mb-2">Имя пользователя</label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={!isEditing}
                            className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed border border-gray-600"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 mb-2">Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!isEditing}
                            className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed border border-gray-600"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 mb-2">О себе</label>
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            disabled={!isEditing}
                            rows={3}
                            className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed border border-gray-600"
                          />
                        </div>

                        {isEditing && (
                          <>
                            <div className="pt-4 border-t border-gray-700">
                              <h4 className="text-lg font-medium text-white mb-4">Изменить пароль</h4>

                              <div className="space-y-4">
                                <div>
                                  <label className="block text-gray-300 mb-2">Текущий пароль</label>
                                  <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                                  />
                                </div>

                                <div>
                                  <label className="block text-gray-300 mb-2">Новый пароль</label>
                                  <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                                  />
                                </div>

                                <div>
                                  <label className="block text-gray-300 mb-2">Подтвердите новый пароль</label>
                                  <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditing(false)
                                  setUsername(user.username)
                                  setEmail(user.email)
                                  setBio(user.bio || "")
                                  setCurrentPassword("")
                                  setNewPassword("")
                                  setConfirmPassword("")
                                  setError(null)
                                  setSuccess(null)
                                }}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition mr-3"
                              >
                                Отмена
                              </button>

                              <button
                                type="submit"
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition flex items-center"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Сохранить изменения
                              </button>
                            </div>
                          </>
                        )}
                      </form>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-white mb-4">Настройки просмотра</h4>

                      <div className="space-y-6">
                        <div>
                          <label className="flex items-center justify-between text-gray-300 mb-2">
                            <span>Автовоспроизведение</span>
                            <button
                              onClick={() => setAutoplay(!autoplay)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors ${autoplay ? "bg-orange-500" : "bg-gray-700"}`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transform transition-transform ${autoplay ? "translate-x-6" : "translate-x-0"}`}
                              ></div>
                            </button>
                          </label>
                          <p className="text-sm text-gray-500">Автоматически воспроизводить следующий эпизод</p>
                        </div>

                        <div>
                          <label className="flex items-center justify-between text-gray-300 mb-2">
                            <span>Уведомления</span>
                            <button
                              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors ${notificationsEnabled ? "bg-orange-500" : "bg-gray-700"}`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transform transition-transform ${notificationsEnabled ? "translate-x-6" : "translate-x-0"}`}
                              ></div>
                            </button>
                          </label>
                          <p className="text-sm text-gray-500">Получать уведомления о новых эпизодах и комментариях</p>
                        </div>

                        <div>
                          <label className="block text-gray-300 mb-2">Тема</label>
                          <select
                            value={selectedTheme}
                            onChange={(e) => setSelectedTheme(e.target.value as "dark" | "light" | "system")}
                            className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                          >
                            <option value="dark">Темная</option>
                            <option value="light">Светлая</option>
                            <option value="system">Системная</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-300 mb-2">Качество видео</label>
                          <select
                            value={quality}
                            onChange={(e) => setQuality(e.target.value as "auto" | "360p" | "480p" | "720p" | "1080p" | "1440p" | "2160p")}
                            className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                          >
                            <option value="auto">Авто</option>
                            <option value="360p">360p</option>
                            <option value="480p">480p</option>
                            <option value="720p">720p</option>
                            <option value="1080p">1080p (Full HD)</option>
                            <option value="1440p">1440p (2K)</option>
                            <option value="2160p">2160p (4K)</option>
                          </select>
                        </div>

                        <div className="mt-4">
                          <label className="flex items-center justify-between text-gray-300 mb-2">
                            <span>Апскейлинг видео (ИИ-улучшение)</span>
                            <button
                              onClick={() => setUseUpscaling(!useUpscaling)}
                              className={`w-12 h-6 rounded-full p-1 transition-colors ${useUpscaling ? "bg-orange-500" : "bg-gray-700"}`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transform transition-transform ${useUpscaling ? "translate-x-6" : "translate-x-0"}`}
                              ></div>
                            </button>
                          </label>
                          <p className="text-sm text-gray-500">Улучшает качество видео с помощью технологий ИИ (работает для любого разрешения)</p>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={handlePreferencesUpdate}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition flex items-center"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Сохранить настройки
                          </button>
                        </div>
                      </div>

                      {user.role === "beta" && (
                        <div className="mt-8 pt-6 border-t border-gray-700">
                          <div className="bg-purple-900/30 rounded-lg p-4">
                            <h4 className="text-lg font-medium text-purple-400 mb-2 flex items-center">
                              <Award className="w-5 h-5 mr-2" />
                              Бета-функции
                            </h4>
                            <p className="text-gray-400 text-sm mb-3">
                              У вас есть доступ к бета-функциям сайта. Вы можете тестировать новые возможности до их
                              официального релиза.
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-gray-300 p-2 rounded-lg bg-gray-800/50">
                                <span className="flex items-center">
                                  <Check className="w-4 h-4 text-green-500 mr-2" />
                                  Расширенный плеер
                                </span>
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                  Активно
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-gray-300 p-2 rounded-lg bg-gray-800/50">
                                <span className="flex items-center">
                                  <Check className="w-4 h-4 text-green-500 mr-2" />
                                  Уведомления
                                </span>
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                  Активно
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-gray-300 p-2 rounded-lg bg-gray-800/50">
                                <span className="flex items-center">
                                  <X className="w-4 h-4 text-gray-500 mr-2" />
                                  Синхронизация с MyAnimeList
                                </span>
                                <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">Скоро</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

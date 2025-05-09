"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "@/types"

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  isLoading: true,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Инициализация только на клиенте после первого рендера
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Проверяем пользователя только после монтирования компонента на клиенте
    if (isMounted) {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error("Failed to parse user from localStorage", error)
          localStorage.removeItem("user")
        }
      }
      setIsLoading(false)
    }
  }, [isMounted])

  // Update localStorage when user changes
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user))
      } else {
        localStorage.removeItem("user")
      }
    }
  }, [user, isMounted])

  const logout = () => {
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>{children}</AuthContext.Provider>
}

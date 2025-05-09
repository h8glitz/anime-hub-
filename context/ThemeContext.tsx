"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Theme = "dark" | "light" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("dark")
  const [isMounted, setIsMounted] = useState(false)

  // Определяем системную тему
  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }

  // Инициализация только на клиенте после первого рендера
  useEffect(() => {
    setIsMounted(true)
    // При инициализации читаем тему из localStorage
    const storedTheme = localStorage.getItem("theme") as Theme | null
    if (storedTheme) {
      setTheme(storedTheme)
    } else {
      setTheme("system")
    }
  }, [])

  // Применяем тему только после монтирования компонента
  useEffect(() => {
    if (!isMounted) return;
    
    let appliedTheme = theme
    if (theme === 'system') {
      appliedTheme = getSystemTheme()
    }
    document.documentElement.classList.toggle("dark", appliedTheme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme, isMounted])

  // Следим за изменением системной темы, если выбрана system
  useEffect(() => {
    if (!isMounted || theme !== 'system') return;
    
    const handler = () => {
      const appliedTheme = getSystemTheme()
      document.documentElement.classList.toggle("dark", appliedTheme === "dark")
    }
    
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme, isMounted])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

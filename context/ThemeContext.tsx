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
  const [theme, setTheme] = useState<Theme>("system")

  // Определяем системную тему
  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }

  // При инициализации читаем тему из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem("theme") as Theme | null
      if (storedTheme) {
        setTheme(storedTheme)
      }
    }
  }, [])

  // Применяем тему
  useEffect(() => {
    let appliedTheme = theme
    if (theme === 'system') {
      appliedTheme = getSystemTheme()
    }
    document.documentElement.classList.toggle("dark", appliedTheme === "dark")
    if (typeof window !== 'undefined') {
      localStorage.setItem("theme", theme)
    }
  }, [theme])

  // Следим за изменением системной темы, если выбрана system
  useEffect(() => {
    if (theme !== 'system') return
    const handler = () => {
      const appliedTheme = getSystemTheme()
      document.documentElement.classList.toggle("dark", appliedTheme === "dark")
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

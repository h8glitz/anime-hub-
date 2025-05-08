"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { login } from "@/services/userService"
import { useAuth } from "@/context/AuthContext"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, user } = useAuth()

  // Get redirect URL from query params
  const redirect = searchParams.get("redirect") || "/"

  // If user is already logged in, redirect
  useEffect(() => {
    if (user) {
      router.push(redirect)
    }
  }, [user, router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const user = await login(email, password)
      setUser(user)
      router.push(redirect)
    } catch (err: any) {
      setError(err.message || "Неверный email или пароль")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Pre-fill demo account
  const fillDemoAccount = () => {
    setEmail("demo@example.com")
    setPassword("password123")
  }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700/50">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Вход в аккаунт</h1>

          {error && <div className="bg-red-900/30 text-red-400 p-4 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700/70 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-300 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700/70 text-white rounded-lg pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition disabled:opacity-50 pulse-on-hover"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-orange-500 hover:underline">
              Зарегистрироваться
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-center text-gray-400 mb-3">Для демонстрации используйте:</p>
            <div className="bg-gray-700/50 p-4 rounded-lg text-sm">
              <p className="text-gray-300">
                <strong>Email:</strong> demo@example.com
              </p>
              <p className="text-gray-300">
                <strong>Пароль:</strong> password123
              </p>
            </div>
            <button
              type="button"
              onClick={fillDemoAccount}
              className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition"
            >
              Заполнить демо-данные
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

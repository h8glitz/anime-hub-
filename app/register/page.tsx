"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { register } from "@/services/userService"
import { useAuth } from "@/context/AuthContext"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setUser, user } = useAuth()

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    if (password.length < 6) {
      setError("Пароль должен содержать не менее 6 символов")
      return
    }

    setLoading(true)

    try {
      const user = await register(username, email, password)
      setUser(user)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Ошибка при регистрации. Возможно, email уже используется.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700/50">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Регистрация</h1>

          {error && <div className="bg-red-900/30 text-red-400 p-4 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-300 mb-2">
                Имя пользователя
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-300 mb-2">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-300 mb-2">
                Подтвердите пароль
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition disabled:opacity-50 pulse-on-hover"
            >
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-orange-500 hover:underline">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

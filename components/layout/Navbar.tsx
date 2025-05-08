"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { Search, Menu, X, User, Heart, LogIn, Home, Info } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    console.log("handleSearch called")
    e.preventDefault()
    if (searchQuery.trim()) {
      const targetUrl = `/?search=${encodeURIComponent(searchQuery.trim())}`
      console.log("Navbar: Navigating to URL:", targetUrl)
      router.push(targetUrl)
      console.log("Navbar: router.push executed")
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
    if (!isSearchOpen) {
      setTimeout(() => {
        document.getElementById("search-input")?.focus()
      }, 100)
    }
  }

  const navLinks = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/collection", label: "Коллекция", icon: Heart },
    { href: "/about", label: "О нас", icon: Info },
  ]

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "navbar-blur py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold gradient-text">Anime</span>
              <span className="text-2xl font-bold text-white">Hub</span>
            </Link>

            <nav className="hidden md:ml-10 md:flex md:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                    pathname === link.href
                      ? "bg-gray-800/70 text-orange-500"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/30"
                  }`}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSearch}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800/50"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <Link
                href="/profile"
                className="hidden md:flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-800/80 rounded-lg px-3 py-2"
              >
                <User className="w-5 h-5 mr-2" />
                <span>{user.username}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-800/80 rounded-lg px-3 py-2"
              >
                <LogIn className="w-5 h-5 mr-2" />
                <span>Войти</span>
              </Link>
            )}

            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800/50"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 mt-4 bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700/50">
            <nav className="flex flex-col space-y-2 p-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center ${
                    pathname === link.href
                      ? "bg-gray-700/70 text-orange-500"
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <link.icon className="w-5 h-5 mr-2" />
                  <span>{link.label}</span>
                </Link>
              ))}

              {user ? (
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-gray-700/50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5 mr-2" />
                  <span>Профиль</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-gray-700/50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  <span>Войти</span>
                </Link>
              )}

              <Link
                href="/collection"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-gray-700/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart className="w-5 h-5 mr-2" />
                <span>Избранное</span>
              </Link>
            </nav>
          </div>
        )}

        {/* Search overlay */}
        {isSearchOpen && (
          <div className="absolute inset-x-0 top-full mt-2 mx-4 bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl">
            <form onSubmit={handleSearch} className="flex p-3">
              <input
                id="search-input"
                type="text"
                placeholder="Поиск аниме..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700/70 text-white rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}

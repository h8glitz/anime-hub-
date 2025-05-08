"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"

export default function AnimeFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [genre, setGenre] = useState("")
  const [status, setStatus] = useState("")
  const [sort, setSort] = useState("")

  // Initialize form values from URL params
  useEffect(() => {
    setSearch(searchParams.get("search") || "")
    setGenre(searchParams.get("genre") || "")
    setStatus(searchParams.get("status") || "")
    setSort(searchParams.get("sort") || "")
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Build query params
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (genre) params.set("genre", genre)
    if (status) params.set("status", status)
    if (sort) params.set("sort", sort)

    // Navigate with new params
    router.push(`/?${params.toString()}`)

    // Close filters on mobile
    if (window.innerWidth < 768) {
      setIsOpen(false)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setGenre("")
    setStatus("")
    setSort("")
    router.push("/")
  }

  const hasActiveFilters = genre || status || sort

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Каталог аниме</h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 mr-1" />
              Сбросить
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
          </button>
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-gray-300 mb-2">
                Поиск
              </label>
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Название аниме..."
                className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="genre" className="block text-gray-300 mb-2">
                Жанр
              </label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Все жанры</option>
                <option value="action">Боевик</option>
                <option value="comedy">Комедия</option>
                <option value="drama">Драма</option>
                <option value="fantasy">Фэнтези</option>
                <option value="romance">Романтика</option>
                <option value="sci-fi">Научная фантастика</option>
                <option value="slice-of-life">Повседневность</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-gray-300 mb-2">
                Статус
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Любой статус</option>
                <option value="ongoing">Онгоинг</option>
                <option value="released">Завершён</option>
                <option value="anons">Анонс</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="block text-gray-300 mb-2">
                Сортировка
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">По умолчанию</option>
                <option value="rating_desc">По рейтингу ↓</option>
                <option value="rating_asc">По рейтингу ↑</option>
                <option value="year_desc">По году ↓</option>
                <option value="year_asc">По году ↑</option>
                <option value="title_asc">По названию (А-Я)</option>
                <option value="title_desc">По названию (Я-А)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Применить
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

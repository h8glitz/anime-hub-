"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import AnimeCard from "@/components/anime/AnimeCard"
import type { Anime } from "@/types"
import { getUserCollection } from "@/services/animeService"
import { Filter, SortDesc, SortAsc, Grid, List } from "lucide-react"

export default function CollectionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [collection, setCollection] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchCollection = async () => {
      try {
        setLoading(true)
        const data = await getUserCollection(user.id)
        setCollection(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [user, router])

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const sortedCollection = [...collection].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.title.localeCompare(b.title)
    } else {
      return b.title.localeCompare(a.title)
    }
  })

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="loader mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Моя коллекция</h1>

      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
          </button>

          <button
            onClick={toggleSortOrder}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center"
          >
            {sortOrder === "asc" ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
            Сортировка
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${viewMode === "grid" ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400"}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${viewMode === "list" ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400"}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Жанр</label>
              <select className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="all">Все жанры</option>
                <option value="action">Боевик</option>
                <option value="comedy">Комедия</option>
                <option value="drama">Драма</option>
                <option value="fantasy">Фэнтези</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Статус</label>
              <select className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="all">Все статусы</option>
                <option value="completed">Завершено</option>
                <option value="ongoing">В процессе</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Рейтинг</label>
              <select className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="all">Любой рейтинг</option>
                <option value="high">Высокий (8+)</option>
                <option value="medium">Средний (5-8)</option>
                <option value="low">Низкий (до 5)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="loader mx-auto"></div>
        </div>
      ) : collection.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Ваша коллекция пуста</h2>
          <p className="text-gray-400 mb-6">Добавляйте аниме в коллекцию, чтобы сохранить их для просмотра позже</p>
          <button
            onClick={() => router.push("/")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          >
            Найти аниме
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              : "space-y-4"
          }
        >
          {sortedCollection.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  )
}

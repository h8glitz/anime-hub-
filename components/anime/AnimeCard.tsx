import Link from "next/link"
import type { Anime } from "@/types"
import { Star, Clock } from "lucide-react"

interface AnimeCardProps {
  anime: Anime
  viewMode?: "grid" | "list"
}

export default function AnimeCard({ anime, viewMode = "grid" }: AnimeCardProps) {
  if (viewMode === "list") {
    return (
      <div className="anime-card bg-gray-800/80 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700/50">
        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-48 h-64 md:h-auto">
            <img
              src={anime.poster || "/placeholder.svg?height=300&width=200"}
              alt={anime.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg?height=300&width=200"
              }}
            />
            <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-lg font-bold text-sm flex items-center shadow-lg">
              <Star className="w-3 h-3 mr-1 fill-white" />
              {anime.rating.toFixed(1)}
            </div>
            <div
              className={`absolute top-3 left-3 px-2 py-1 rounded-lg font-bold text-xs text-white flex items-center shadow-lg ${
                anime.status === "ongoing"
                  ? "bg-gradient-to-r from-green-500 to-green-600"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              }`}
            >
              {anime.status === "ongoing" ? "Онгоинг" : "Завершено"}
            </div>
          </div>

          <div className="p-5 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{anime.title}</h3>

            <p className="text-gray-400 text-sm mb-4 line-clamp-3">{anime.description || "Описание отсутствует"}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {anime.genres.slice(0, 3).map((genre, index) => (
                <span key={index} className="bg-gray-700/70 text-gray-300 px-2 py-1 rounded-lg text-xs">
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between">
              <div className="text-sm text-gray-400 flex items-center">
                <Clock className="w-4 h-4 mr-1 text-gray-500" />
                {anime.episodes ? `${anime.episodes} эп.` : "N/A"}
              </div>
              <Link
                href={`/anime/${anime.id}`}
                className="watch-btn bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition inline-block"
              >
                Смотреть
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="anime-card bg-gray-800/80 rounded-xl overflow-hidden shadow-lg border border-gray-700/50">
      <div className="anime-poster relative">
        <img
          src={anime.poster || "/placeholder.svg?height=300&width=200"}
          alt={anime.title}
          className="w-full h-64 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=300&width=200"
          }}
        />
        <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-lg font-bold text-sm flex items-center shadow-lg">
          <Star className="w-3 h-3 mr-1 fill-white" />
          {anime.rating.toFixed(1)}
        </div>
        <div
          className={`absolute top-3 left-3 px-2 py-1 rounded-lg font-bold text-xs text-white flex items-center shadow-lg ${
            anime.status === "ongoing"
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : "bg-gradient-to-r from-blue-500 to-blue-600"
          }`}
        >
          {anime.status === "ongoing" ? "Онгоинг" : "Завершено"}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-white font-bold mb-2 line-clamp-2 h-12">{anime.title}</h3>

        <div className="flex flex-wrap gap-1 mb-4">
          {anime.genres.slice(0, 2).map((genre, index) => (
            <span key={index} className="bg-gray-700/70 text-gray-300 px-2 py-1 rounded-lg text-xs">
              {genre}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-400 flex items-center">
            <Clock className="w-4 h-4 mr-1 text-gray-500" />
            {anime.episodes ? `${anime.episodes} эп.` : "N/A"}
          </div>
          <div className="text-sm text-gray-400">{anime.year || "N/A"}</div>
        </div>

        <Link
          href={`/anime/${anime.id}`}
          className="block watch-btn bg-orange-500 hover:bg-orange-600 text-white text-center font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
        >
          Смотреть
        </Link>
      </div>
    </div>
  )
}

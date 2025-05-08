import AnimeList from "@/components/anime/AnimeList"
import AnimeFilters from "@/components/anime/AnimeFilters"
import { Suspense } from "react"
import { Film, Star, Tv } from "lucide-react"

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">
          <span className="gradient-text">Anime</span>
          <span className="text-white">Hub</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto">Смотрите лучшие аниме онлайн в высоком качестве</p>

        <div className="flex flex-wrap justify-center gap-8 mt-8">
          <div className="flex items-center bg-gray-800/50 px-6 py-4 rounded-xl border border-gray-700/50">
            <Film className="w-8 h-8 text-orange-500 mr-3" />
            <div className="text-left">
              <div className="text-sm text-gray-400">Аниме</div>
              <div className="text-xl font-bold text-white">1000+</div>
            </div>
          </div>

          <div className="flex items-center bg-gray-800/50 px-6 py-4 rounded-xl border border-gray-700/50">
            <Star className="w-8 h-8 text-orange-500 mr-3" />
            <div className="text-left">
              <div className="text-sm text-gray-400">Рейтинг</div>
              <div className="text-xl font-bold text-white">Высокий</div>
            </div>
          </div>

          <div className="flex items-center bg-gray-800/50 px-6 py-4 rounded-xl border border-gray-700/50">
            <Tv className="w-8 h-8 text-orange-500 mr-3" />
            <div className="text-left">
              <div className="text-sm text-gray-400">Обновления</div>
              <div className="text-xl font-bold text-white">Ежедневно</div>
            </div>
          </div>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="text-center py-10">
            <div className="loader mx-auto"></div>
          </div>
        }
      >
        <AnimeFilters />
      </Suspense>

      <Suspense
        fallback={
          <div className="text-center py-20">
            <div className="loader mx-auto"></div>
          </div>
        }
      >
        <AnimeList />
      </Suspense>
    </main>
  )
}

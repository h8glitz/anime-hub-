"use client"

import { useEffect, useState, Suspense } from "react"
import React from "react"
import {
  getAnimeById,
  isAnimeInCollection,
  addAnimeToCollection,
  removeAnimeFromCollection,
  getAnimeRecommendations,
  getWatchOrder,
} from "@/services/animeService"
import VideoPlayer from "@/components/anime/VideoPlayer"
import CommentSection from "@/components/anime/CommentSection"
import type { Anime } from "@/types"
import {
  Star,
  Calendar,
  Clock,
  Tag,
  Heart,
  Share2,
  ExternalLink,
  Info,
  Film,
  Globe,
  Award,
  Bookmark,
  AlertTriangle,
  ListOrdered,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import AnimeCard from "@/components/anime/AnimeCard"

// Компонент для получения параметров из URL
function AnimePageContent({ animeId }: { animeId: string }) {
  const [anime, setAnime] = useState<Anime | null>(null)
  const [isInCollection, setIsInCollection] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<Anime[]>([])
  const [watchOrder, setWatchOrder] = useState<Anime[]>([])
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const seasonParam = searchParams.get("season")
  const episodeParam = searchParams.get("episode")
  
  const initialSeason = seasonParam ? parseInt(seasonParam, 10) : 1
  const initialEpisode = episodeParam ? parseInt(episodeParam, 10) : 1

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true)
        const animeData = await getAnimeById(animeId)
        setAnime(animeData)

        // Загружаем рекомендации
        try {
          const recommendationsData = await getAnimeRecommendations(animeId)
          setRecommendations(recommendationsData)
        } catch (err) {
          console.error("Error fetching recommendations:", err)
          setRecommendations([])
        }

        // Загружаем порядок просмотра для всех аниме
        try {
          const watchOrderData = await getWatchOrder(animeData.title)
          
          // Проверяем, есть ли текущее аниме в списке
          const currentAnimeInList = watchOrderData.some(item => item.id === animeId)
          
          // Если текущего аниме нет в списке, добавляем его
          if (!currentAnimeInList) {
            // Создаем список только с текущим аниме
            setWatchOrder([animeData])
          } else {
            // Помечаем текущее аниме в списке, но не удаляем его
            const markedWatchOrder = watchOrderData.map(item => ({
              ...item,
              isCurrent: item.id === animeId
            }))
            setWatchOrder(markedWatchOrder)
          }
        } catch (err) {
          console.error("Error fetching watch order:", err)
          // Если произошла ошибка, все равно показываем текущее аниме в списке
          setWatchOrder([animeData])
        }

        // Проверяем, добавлено ли аниме в коллекцию
        if (user) {
          const inCollection = await isAnimeInCollection(user.id, animeId)
          setIsInCollection(inCollection)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching anime:", err)
        setError("Не удалось загрузить информацию об аниме")
        setLoading(false)
      }
    }

    fetchAnime()
  }, [animeId, user])

  const handleCollectionToggle = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = "/login?redirect=" + encodeURIComponent(`/anime/${animeId}`)
      return
    }

    try {
      if (isInCollection) {
        await removeAnimeFromCollection(user.id, animeId)
        setIsInCollection(false)
      } else {
        await addAnimeToCollection(user.id, animeId)
        setIsInCollection(true)
      }
    } catch (err) {
      console.error("Error toggling collection:", err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="loader mx-auto"></div>
      </div>
    )
  }

  if (error || !anime) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="bg-red-900/30 text-red-400 p-6 rounded-xl inline-block max-w-md">
          <h3 className="text-xl font-bold mb-2">Что-то пошло не так</h3>
          <p>{error || "Не удалось загрузить аниме"}</p>
          <Link
            href="/"
            className="mt-4 bg-red-500 hover:bg-red-600 text-white inline-block px-4 py-2 rounded-lg transition"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <VideoPlayer animeId={animeId} initialSeason={initialSeason} initialEpisode={initialEpisode} />

          <div className="mt-8">
            <h1 className="text-3xl font-bold text-white">{anime.title}</h1>
            {anime.titleOrig && <p className="text-gray-400 mt-1">{anime.titleOrig}</p>}

            <div className="flex flex-wrap gap-2 mt-4">
              {anime.genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/?genre=${encodeURIComponent(genre)}`}
                  className="bg-gray-800/70 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1 rounded-full text-sm transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-6 mt-6">
              {anime.rating > 0 && (
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span className="text-white">{anime.rating.toFixed(1)}</span>
                </div>
              )}

              {anime.year && (
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-1" />
                  <span className="text-gray-300">{anime.year}</span>
                </div>
              )}

              {anime.episodes && anime.episodes > 0 && (
                <div className="flex items-center">
                  <Film className="w-5 h-5 text-gray-400 mr-1" />
                  <span className="text-gray-300">{anime.episodes} эп.</span>
                </div>
              )}

              {anime.duration && (
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-1" />
                  <span className="text-gray-300">{anime.duration}</span>
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCollectionToggle}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    isInCollection
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                  } transition-colors`}
                >
                  {isInCollection ? (
                    <>
                      <Bookmark className="w-5 h-5 mr-2 fill-white" /> В коллекции
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-5 h-5 mr-2" /> Добавить в коллекцию
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: anime.title,
                        text: `Смотреть ${anime.title} на AnimeHub`,
                        url: window.location.href,
                      })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      alert("Ссылка скопирована в буфер обмена")
                    }
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                >
                  <Share2 className="w-5 h-5 mr-2" /> Поделиться
                </button>
              </div>
            </div>

            {anime.description && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-white mb-3">Описание</h2>
                <div className="text-gray-300 description-text">{anime.description}</div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {anime.studios && (
                <div>
                  <h3 className="text-gray-400 mb-1 flex items-center">
                    <Award className="w-4 h-4 mr-1" /> Студия
                  </h3>
                  <p className="text-white">{anime.studios}</p>
                </div>
              )}

              {anime.countries && (
                <div>
                  <h3 className="text-gray-400 mb-1 flex items-center">
                    <Globe className="w-4 h-4 mr-1" /> Страна
                  </h3>
                  <p className="text-white">{anime.countries}</p>
                </div>
              )}

              <div>
                <h3 className="text-gray-400 mb-1 flex items-center">
                  <Info className="w-4 h-4 mr-1" /> Статус
                </h3>
                <p className="text-white">
                  {anime.status === "released"
                    ? "Вышел"
                    : anime.status === "ongoing"
                      ? "Онгоинг"
                      : anime.status === "anons"
                        ? "Анонс"
                        : anime.status}
                </p>
              </div>

              <div>
                <h3 className="text-gray-400 mb-1 flex items-center">
                  <Tag className="w-4 h-4 mr-1" /> Тип
                </h3>
                <p className="text-white">
                  {anime.type === "anime"
                    ? "ТВ-сериал"
                    : anime.type === "movie"
                      ? "Фильм"
                      : anime.type === "ova"
                        ? "OVA"
                        : anime.type === "ona"
                          ? "ONA"
                          : anime.type}
                </p>
              </div>
            </div>

            {(anime.shikimoriId || anime.kinopoiskId || anime.imdbId) && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-white mb-3">Ссылки</h2>
                <div className="flex flex-wrap gap-3">
                  {anime.shikimoriId && (
                    <a
                      href={`https://shikimori.one/animes/${anime.shikimoriId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" /> Shikimori
                    </a>
                  )}

                  {anime.kinopoiskId && (
                    <a
                      href={`https://www.kinopoisk.ru/film/${anime.kinopoiskId}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" /> Кинопоиск
                    </a>
                  )}

                  {anime.imdbId && (
                    <a
                      href={`https://www.imdb.com/title/${anime.imdbId}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" /> IMDb
                    </a>
                  )}
                </div>
              </div>
            )}

            {anime.status === "anons" && (
              <div className="mt-8 bg-yellow-900/30 border border-yellow-800/50 p-4 rounded-lg flex items-start">
                <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-yellow-500 font-bold">Аниме ещё не вышло</h3>
                  <p className="text-gray-300">
                    Это аниме находится в статусе анонса. Видео будет доступно после релиза.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12">
            <CommentSection animeId={animeId} />
          </div>
        </div>

        <div>
          {/* Блок порядка просмотра */}
          {watchOrder.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg border border-gray-700/50 mb-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <ListOrdered className="w-5 h-5 mr-2 text-orange-500" />
                Порядок просмотра
              </h2>

              <div className="space-y-4">
                {watchOrder.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`group ${item.id === animeId || item.isCurrent ? 'bg-gray-700/40 rounded-lg p-2' : ''}`}
                  >
                    <Link href={`/anime/${item.id}`} className="flex">
                      <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className={`font-medium line-clamp-1 ${item.id === animeId || item.isCurrent ? 'text-orange-500' : 'text-white group-hover:text-orange-500 transition-colors'}`}>
                          {item.title}
                        </h3>
                        <div className="text-gray-500 text-sm">
                          {item.year} • {item.type === "anime" ? "ТВ-сериал" : item.type === "movie" ? "Фильм" : item.type}
                          {(item.id === animeId || item.isCurrent) && <span className="ml-2 text-orange-500">• Текущий</span>}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Блок рекомендаций */}
          <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4">Рекомендации</h2>

            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.slice(0, 5).map((anime) => (
                  <div key={anime.id} className="group">
                    <Link href={`/anime/${anime.id}`} className="flex">
                      <div className="w-20 h-28 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        {anime.poster && (
                          <img
                            src={anime.poster}
                            alt={anime.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-white font-medium group-hover:text-orange-500 transition-colors line-clamp-2">
                          {anime.title}
                        </h3>
                        <div className="flex items-center mt-1">
                          {anime.rating > 0 && (
                            <div className="flex items-center text-sm">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-gray-400">{anime.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {anime.year && (
                            <div className="text-gray-500 text-sm ml-3">
                              {anime.year}
                            </div>
                          )}
                        </div>
                        <div className="text-gray-500 text-sm mt-1 line-clamp-1">
                          {anime.genres.slice(0, 3).join(", ")}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-4">
                Рекомендации не найдены
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Основной компонент с Suspense для useSearchParams
export default function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="loader mx-auto"></div>
      </div>
    }>
      <AnimePageContent animeId={resolvedParams.id} />
    </Suspense>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { getAnimeVideo, addToWatchHistory } from "@/services/animeService"
import { incrementUserStats } from "@/services/userService"
import { useAuth } from "@/context/AuthContext"
import { Loader } from "lucide-react"
import type { Season } from "@/types"

interface VideoPlayerProps {
  animeId: string
  initialSeason?: number
  initialEpisode?: number
}

export default function VideoPlayer({ animeId, initialSeason = 1, initialEpisode = 1 }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSeason, setCurrentSeason] = useState(initialSeason)
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode)
  const [totalSeasons, setTotalSeasons] = useState(1)
  const [totalEpisodes, setTotalEpisodes] = useState(1)
  const [seasons, setSeasons] = useState<Season[]>([])
  const { user } = useAuth()

  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const fetchVideo = async () => {
      console.log(`[VideoPlayer] fetchVideo вызван: сезон ${currentSeason}, эпизод ${currentEpisode}`);
      try {
        setLoading(true)
        setError(null)

        const data = await getAnimeVideo(animeId, currentSeason, currentEpisode)
        console.log("[VideoPlayer] Данные от getAnimeVideo:", data);

        if (data && data.url) {
          console.log("[VideoPlayer] Новый URL для iframe плеера:", data.url);
          setVideoUrl(data.url)
          setTotalSeasons(data.totalSeasons)
          setTotalEpisodes(data.totalEpisodes)
          setSeasons(data.seasons)

          if (user) {
            await addToWatchHistory(user.id, animeId, currentSeason, currentEpisode)
            // @ts-ignore
            await incrementUserStats(user.id, "episodesWatched")
          }
        } else {
          console.error("[VideoPlayer] Не удалось получить URL видео или данные отсутствуют:", data);
          throw new Error("Видео недоступно или неверные данные от API")
        }
      } catch (err) {
        console.error("[VideoPlayer] Ошибка в fetchVideo:", err);
        if (err instanceof Error) {
            setError(`Ошибка загрузки: ${err.message}`);
        } else {
            setError("Не удалось загрузить видео. Неизвестная ошибка.");
        }
      } finally {
        setLoading(false)
      }
    }

    if (animeId) {
        fetchVideo()
    } else {
        console.warn("[VideoPlayer] animeId отсутствует, fetchVideo не будет вызван.");
        setLoading(false);
        setError("Ошибка: ID аниме не указан.");
    }
  }, [animeId, currentSeason, currentEpisode, user])

  const handleEpisodeChange = (seasonNum: number, episodeNum: number) => {
    console.log(`[VideoPlayer] handleEpisodeChange вызван: сезон ${seasonNum}, эпизод ${episodeNum}`);
    setCurrentSeason(seasonNum)
    setCurrentEpisode(episodeNum)
  }

  if (loading) {
    return (
      <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center">
          <Loader className="w-10 h-10 text-orange-500 animate-spin mb-4" />
          <p className="text-gray-400">Загрузка плеера...</p>
        </div>
      </div>
    )
  }

  if (error || !videoUrl) {
    return (
      <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error || "Видео недоступно"}</p>
          <p className="text-gray-400 text-sm mb-4">Попробуйте позже или выберите другое аниме</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-xl relative">
        <div className="absolute top-3 right-3 bg-red-900/80 text-white px-3 py-1 rounded-md font-bold z-10">18+</div>
        <iframe
          ref={iframeRef}
          src={videoUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          style={{ border: 'none' }}
        ></iframe>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Сезоны и эпизоды</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {seasons.map((season) => (
            <div key={season.id} className="bg-gray-800/30 rounded-lg p-3">
              <h4 className="font-medium mb-2">{season.title}</h4>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {season.episodes.map((episode) => (
                  <button
                    key={episode.id}
                    onClick={() => handleEpisodeChange(season.number, episode.number)}
                    className={`p-2 rounded ${
                      currentSeason === season.number && currentEpisode === episode.number
                        ? "bg-orange-500 text-white"
                        : "bg-gray-700/50 hover:bg-gray-700 text-gray-300"
                    }`}
                  >
                    {episode.number}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
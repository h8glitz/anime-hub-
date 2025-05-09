"use client"

import { useState, useEffect, useRef } from "react"
import { getAnimeVideo, addToWatchHistory } from "@/services/animeService"
import { incrementUserStats } from "@/services/userService"
import { useAuth } from "@/context/AuthContext"
import { Loader, ZoomIn, Monitor } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Season } from "@/types"

interface VideoPlayerProps {
  animeId: string
  initialSeason?: number
  initialEpisode?: number
}

// Доступные качества видео
type VideoQuality = "360p" | "480p" | "720p" | "1080p" | "1440p" | "2160p"

// Типы доступных плееров
type PlayerType = "kodik" | "aniboom"

export default function VideoPlayer({ animeId, initialSeason = 1, initialEpisode = 1 }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSeason, setCurrentSeason] = useState(initialSeason)
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode)
  const [totalSeasons, setTotalSeasons] = useState(1)
  const [totalEpisodes, setTotalEpisodes] = useState(1)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>("1080p")
  const [useUpscaling, setUseUpscaling] = useState<boolean>(false)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerType>("kodik")
  const { user } = useAuth()
  const router = useRouter()

  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // Загружаем настройки пользователя при монтировании компонента
  useEffect(() => {
    if (user && user.preferences) {
      // Устанавливаем качество из настроек пользователя, если оно не "auto"
      if (user.preferences.quality && user.preferences.quality !== "auto") {
        setSelectedQuality(user.preferences.quality as VideoQuality);
      }
      
      // Устанавливаем апскейлинг из настроек пользователя
      if (user.preferences.useUpscaling !== undefined) {
        setUseUpscaling(user.preferences.useUpscaling);
      }
      
      // Устанавливаем предпочитаемый плеер
      if (user.preferences.preferredPlayer) {
        setSelectedPlayer(user.preferences.preferredPlayer);
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchVideo = async () => {
      console.log(`[VideoPlayer] fetchVideo вызван: сезон ${currentSeason}, эпизод ${currentEpisode}, плеер ${selectedPlayer}`);
      try {
        setLoading(true)
        setError(null)

        let fetchedVideoUrl = ""; // Переименовано во избежание путаницы с состоянием
        let fetchedSeasons: Season[] = []; // Явно типизируем
        
        // Общая логика для обоих плееров
        const data = await getAnimeVideo(animeId, currentSeason, currentEpisode, selectedPlayer);
        console.log(`[VideoPlayer] Данные от getAnimeVideo для плеера ${selectedPlayer}:`, data);

        if (!data || !data.url) {
          throw new Error(`Не удалось получить URL для плеера ${selectedPlayer}`);
        }

        fetchedVideoUrl = data.url;
        fetchedSeasons = data.seasons;
        setTotalSeasons(data.totalSeasons);
        setTotalEpisodes(data.totalEpisodes);
        
        // Модифицируем URL для Kodik (если это Kodik и URL существует)
        if (selectedPlayer === "kodik" && fetchedVideoUrl && fetchedVideoUrl.trim() !== "") {
          // Добавляем параметр для отключения рекламы
          if (fetchedVideoUrl.includes('?')) {
            fetchedVideoUrl += '&no_ads=1';
          } else {
            fetchedVideoUrl += '?no_ads=1';
          }
          
          // Добавляем параметр для выбора качества
          fetchedVideoUrl += `&quality=${selectedQuality}`;
          
          // Добавляем параметр для апскейлинга, если включен
          if (useUpscaling) {
            fetchedVideoUrl += `&upscale=1&enable_ai_upscale=true`;
          }
        }
        
        setSeasons(fetchedSeasons);
        
        if (fetchedVideoUrl && fetchedVideoUrl.trim() !== "") {
          console.log("[VideoPlayer] Финальный URL для iframe плеера:", fetchedVideoUrl);
          setVideoUrl(fetchedVideoUrl);

          if (user) {
            await addToWatchHistory(user.id, animeId, currentSeason, currentEpisode);
            // @ts-ignore
            await incrementUserStats(user.id, "episodesWatched");
          }
        } else {
          console.error("[VideoPlayer] Не удалось получить URL видео");
          throw new Error("Видео недоступно или неверные данные от API");
        }
      } catch (err) {
        console.error("[VideoPlayer] Ошибка в fetchVideo:", err);
        if (err instanceof Error) {
            setError(`Ошибка загрузки: ${err.message}`);
        } else {
            setError("Не удалось загрузить видео. Неизвестная ошибка.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (animeId) {
        fetchVideo();
    } else {
        console.warn("[VideoPlayer] animeId отсутствует, fetchVideo не будет вызван.");
        setLoading(false);
        setError("Ошибка: ID аниме не указан.");
    }
  }, [animeId, currentSeason, currentEpisode, selectedQuality, useUpscaling, selectedPlayer, user]);

  // Обработчик изменения качества видео
  const handleQualityChange = (quality: VideoQuality) => {
    setSelectedQuality(quality);
  };
  
  // Обработчик переключения апскейлинга
  const handleUpscalingToggle = () => {
    setUseUpscaling(!useUpscaling);
  };
  
  // Обработчик изменения плеера
  const handlePlayerChange = (player: PlayerType) => {
    setSelectedPlayer(player);
  };

  const handleEpisodeChange = (seasonNum: number, episodeNum: number) => {
    console.log(`[VideoPlayer] handleEpisodeChange вызван: сезон ${seasonNum}, эпизод ${episodeNum}`);
    
    // Обновляем URL страницы для сохранения выбора пользователя
    const url = new URL(window.location.href);
    url.searchParams.set('season', seasonNum.toString());
    url.searchParams.set('episode', episodeNum.toString());
    
    // Используем router.replace для обновления URL без перезагрузки страницы
    router.replace(`/anime/${animeId}?season=${seasonNum}&episode=${episodeNum}`);
    
    // Обновляем состояние компонента
    setCurrentSeason(seasonNum);
    setCurrentEpisode(episodeNum);
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
      
      {/* Селектор плеера */}
      <div className="mt-4 mb-4">
        <h3 className="text-lg font-medium mb-2">Выбор плеера</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handlePlayerChange("kodik")}
            className={`px-3 py-1 rounded flex items-center ${
              selectedPlayer === "kodik"
                ? "bg-orange-500 text-white"
                : "bg-gray-700/50 hover:bg-gray-700 text-gray-300"
            }`}
          >
            <Monitor className="w-4 h-4 mr-1" />
            Kodik
          </button>
          <button
            onClick={() => handlePlayerChange("aniboom")}
            className={`px-3 py-1 rounded flex items-center ${
              selectedPlayer === "aniboom"
                ? "bg-orange-500 text-white"
                : "bg-gray-700/50 hover:bg-gray-700 text-gray-300"
            }`}
          >
            <Monitor className="w-4 h-4 mr-1" />
            AniBoom
          </button>
        </div>
      </div>
      
      {/* Селектор качества видео (только для Kodik) */}
      {selectedPlayer === "kodik" && (
        <div className="mt-4 mb-4">
          <h3 className="text-lg font-medium mb-2">Качество видео</h3>
          <div className="flex flex-wrap gap-2">
            {["360p", "480p", "720p", "1080p", "1440p", "2160p"].map((quality) => (
              <button
                key={quality}
                onClick={() => handleQualityChange(quality as VideoQuality)}
                className={`px-3 py-1 rounded ${
                  selectedQuality === quality
                    ? "bg-orange-500 text-white"
                    : "bg-gray-700/50 hover:bg-gray-700 text-gray-300"
                }`}
              >
                {quality === "2160p" ? "4K" : quality}
              </button>
            ))}
          </div>
          
          {/* Опция апскейлинга - доступна для всех разрешений */}
          <div className="mt-2 flex items-center">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={useUpscaling} 
                  onChange={handleUpscalingToggle} 
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full ${useUpscaling ? 'bg-orange-500' : 'bg-gray-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${useUpscaling ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <div className="ml-3 flex items-center text-gray-300">
                <ZoomIn className="w-4 h-4 mr-1" />
                Апскейлинг
                <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Рекомендуется</span>
              </div>
            </label>
            <div className="ml-2 text-xs text-gray-500">
              Улучшает качество видео с помощью ИИ
            </div>
          </div>
        </div>
      )}
      
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
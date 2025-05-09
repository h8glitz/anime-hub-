import type { Anime, AnimeVideo, AnimeListParams, Season, Episode, Comment, PlayerType } from "@/types"

// Jikan API base URL
const JIKAN_API_URL = "https://api.jikan.moe/v4"

// Kodik API configuration
const API_KEY = "447d179e875efe44217f20d1ee2146be"
const API_BASE_URL = "https://kodikapi.com"
const ITEMS_PER_PAGE = 50
const MAX_PAGES = 40
const MAX_ITEMS = 2000

// Function to get API URL for fetching anime list
export function getApiUrl(params: AnimeListParams) {
  const { page = 1, search = "", genre = "", status = "", sort = "", next, limit = ITEMS_PER_PAGE } = params;

  if (search) {
    // Используем эндпоинт /search для поиска по названию
    let url = `${API_BASE_URL}/search?token=${API_KEY}&with_material_data=true&limit=${limit}`;
    url += `&title=${encodeURIComponent(search)}`;
    // Kodik API может поддерживать title_orig для поиска по оригинальному названию,
    // но основной поиск, скорее всего, идет по 'title'.
    // Добавим и full_match=false для более гибкого поиска, если поддерживается.
    url += `&full_match=false`; 
    // Если Kodik API для /search поддерживает пагинацию через page/offset, это нужно будет проверить.
    // Пока предполагаем, что /search может не поддерживать offset/page так же, как /list,
    // или что для поиска обычно запрашивается только первая "страница" результатов.
    // Если нужна пагинация для результатов поиска, это потребует дополнительного исследования API.
    console.log("[getApiUrl] Generated URL for TITLE SEARCH:", url);
    return url;
  }

  if (next) {
    // Пагинация для /list
    const nextUrl = `${API_BASE_URL}/list?token=${API_KEY}&with_material_data=true&with_pagination=true&next=${encodeURIComponent(next)}&limit=${limit}`;
    console.log("[getApiUrl] Generated URL for PAGINATION (next):", nextUrl);
    return nextUrl;
  }

  // Стандартный запрос к /list для фильтров (кроме title search) и постраничной навигации (page)
  let url = `${API_BASE_URL}/list?token=${API_KEY}&types=anime-serial,anime&limit=${limit}&with_material_data=true&with_pagination=true`;

  if (page > 1) {
    const offset = (page - 1) * limit; // Используем limit, переданный в params
    url += `&offset=${offset}`;
  }

  if (genre) {
    url += `&genres=${encodeURIComponent(genre)}`;
  }
  if (status) {
    url += `&anime_status=${encodeURIComponent(status)}`;
  }
  if (sort) {
    const [field, direction] = sort.split("_");
    url += `&sort=${field}&order=${direction}`;
  }

  console.log("[getApiUrl] Generated URL for LIST (filters/page):", url);
  return url;
}

// Function to fetch anime list
export async function getAnimeList(params: AnimeListParams): Promise<Anime[]> {
  try {
    const url = getApiUrl(params)
    

    // Add retry logic
    let retries = 3
    let response

    while (retries > 0) {
      try {
        // Получаем endpoint и query string
        const urlObj = new URL(url);
        const endpoint = urlObj.pathname.replace(/^\//, "");
        const params = urlObj.searchParams;
        const queryString = Array.from(params.entries()).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
        response = await fetch(`/api/proxy/kodik?endpoint=${endpoint}&${queryString}`, { cache: "no-store" })
        if (response.ok) break
        retries--
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (err) {
        retries--
        if (retries === 0) throw err
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    if (!response || !response.ok) {
      throw new Error(`API error: ${response?.status || "Network error"}`)
    }

    const data = await response.json()
    console.log("[FETCH RAW DATA]", data);



    if (typeof window !== 'undefined' && data.next_page) {
      const nextPageUrl = new URL(data.next_page);
      const nextToken = nextPageUrl.searchParams.get("next");
    
      if (nextToken) {
        window.kodikPaginationToken = nextToken;
        console.log("[PAGINATION] Новый токен сохранен:", nextToken);
      } else {
        window.kodikPaginationToken = null;
        console.log("[PAGINATION] Нет следующего токена (конец данных)");
      }
    }
    

    if (!data.results || !Array.isArray(data.results)) {
      return []
    }

    // Process and normalize the data
    return data.results.map((item: any) => {
      const anime: Anime = {
        id: item.id || item.link || "",
        title: item.title || (item.material_data && item.material_data.title) || "Без названия",
        titleOrig: item.title_orig || (item.material_data && item.material_data.title_orig) || "",
        poster: item.poster_url || item.poster || (item.material_data && item.material_data.poster_url) || "",
        genres: Array.isArray(item.genres)
          ? item.genres
          : item.material_data && Array.isArray(item.material_data.genres)
            ? item.material_data.genres
            : ["Без жанра"],
        rating: Number(item.rating || (item.material_data && item.material_data.shikimori_rating) || 0),
        status: item.status || (item.material_data && item.material_data.anime_status) || "released",
        description: item.description || (item.material_data && item.material_data.description) || "",
        year: item.year || (item.material_data && item.material_data.year) || "",
        episodes: item.episodes_count || (item.material_data && item.material_data.episodes_count) || 0,
        duration: item.duration || (item.material_data && item.material_data.duration) || "",
        studios: item.material_data && item.material_data.studios ? item.material_data.studios.join(", ") : "",
        countries: item.material_data && item.material_data.countries ? item.material_data.countries.join(", ") : "",
        link: item.link || "",
        shikimoriId: item.material_data && item.material_data.shikimori_id ? item.material_data.shikimori_id : null,
        kinopoiskId: item.material_data && item.material_data.kinopoisk_id ? item.material_data.kinopoisk_id : null,
        imdbId: item.material_data && item.material_data.imdb_id ? item.material_data.imdb_id : null,
        worldArtId: item.material_data && item.material_data.worldart_link ? item.material_data.worldart_link : null,
        type: item.type || (item.material_data && item.material_data.type) || "anime",
        seasons: [],
      }
      return anime
    })
  } catch (error) {
    console.error("Error fetching anime list:", error)
    throw error
  }
}

// Function to fetch anime by ID
export async function getAnimeById(id: string): Promise<Anime> {
  try {
    // Проверяем, доступен ли localStorage (только на клиенте)
    let cachedAnime = null;
    if (typeof window !== 'undefined') {
      // Try to get from cache first
      cachedAnime = localStorage.getItem(`anime_cache_${id}`)
      if (cachedAnime) {
        try {
          const parsedAnime = JSON.parse(cachedAnime)
          const cacheTime = parsedAnime._cacheTime || 0

          // Cache is valid for 24 hours
          if (Date.now() - cacheTime < 24 * 60 * 60 * 1000) {
            delete parsedAnime._cacheTime
            return parsedAnime
          }
        } catch (e) {
          console.error("Error parsing cached anime:", e)
        }
      }
    }

    console.log('[getAnimeById] вызов для id:', id);
    const url = `${API_BASE_URL}/search?token=${API_KEY}&id=${id}&with_material_data=true&with_episodes=true`

    // Add retry logic
    let retries = 3
    let response

    while (retries > 0) {
      try {
        // Получаем endpoint и query string
        const urlObj = new URL(url);
        const endpoint = urlObj.pathname.replace(/^\//, "");
        const params = urlObj.searchParams;
        const queryString = Array.from(params.entries()).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
        response = await fetch(`/api/proxy/kodik?endpoint=${endpoint}&${queryString}`, { cache: "no-store" })
        if (response.ok) break
        retries--
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (err) {
        retries--
        if (retries === 0) throw err
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    if (!response || !response.ok) {
      console.error('[getAnimeById] fetch error:', response?.status);
      throw new Error(`API error: ${response?.status || "Network error"}`)
    }

    const data = await response.json()
    console.log('[getAnimeById] ответ Kodik:', data);

    if (!data.results || !data.results[0]) {
      console.error('[getAnimeById] Нет результатов в ответе Kodik:', data);
      throw new Error("Anime not found")
    }

    const item = data.results[0]

    // Логируем весь объект item для отладки
    console.log('[getAnimeById] item из Kodik:', item);

    // Process seasons and episodes
    const seasons: Season[] = []
    if (item.seasons) {
      Object.keys(item.seasons).forEach((seasonNum) => {
        const seasonData = item.seasons[seasonNum]
        const episodes: Episode[] = []

        if (seasonData.episodes) {
          Object.keys(seasonData.episodes).forEach((episodeNum) => {
            const episodeData = seasonData.episodes[episodeNum]
            episodes.push({
              id: `${seasonNum}_${episodeNum}`,
              number: Number.parseInt(episodeNum, 10),
              title: episodeData.title || `Эпизод ${episodeNum}`,
              link: episodeData.link || item.link || "", // Fallback to the anime's main link if episode link is missing
              screenshots: episodeData.screenshots || [],
            })
          })
        }

        // If no episodes were found but we have a main link, create a default episode
        if (episodes.length === 0 && item.link) {
          episodes.push({
            id: `${seasonNum}_1`,
            number: 1,
            title: "Эпизод 1",
            link: item.link,
            screenshots: [],
          })
        }

        // Sort episodes by number
        episodes.sort((a, b) => a.number - b.number)

        seasons.push({
          id: `season_${seasonNum}`,
          number: Number.parseInt(seasonNum, 10),
          title: seasonData.title || `Сезон ${seasonNum}`,
          episodes: episodes,
        })
      })
    }

    // If no seasons were found but we have a main link, create a default season with a default episode
    if (seasons.length === 0 && item.link) {
      seasons.push({
        id: "season_1",
        number: 1,
        title: "Сезон 1",
        episodes: [
          {
            id: "1_1",
            number: 1,
            title: "Эпизод 1",
            link: item.link,
            screenshots: [],
          },
        ],
      })
    }

    // Sort seasons by number
    seasons.sort((a, b) => a.number - b.number)

    const anime: Anime = {
      id: item.id || item.link || "",
      title: item.title || (item.material_data && item.material_data.title) || "Без названия",
      titleOrig: item.title_orig || (item.material_data && item.material_data.title_orig) || "",
      poster: item.poster_url || item.poster || (item.material_data && item.material_data.poster_url) || "",
      genres: Array.isArray(item.genres)
        ? item.genres
        : item.material_data && Array.isArray(item.material_data.genres)
          ? item.material_data.genres
          : ["Без жанра"],
      rating: Number(item.rating || (item.material_data && item.material_data.shikimori_rating) || 0),
      status: item.status || (item.material_data && item.material_data.anime_status) || "released",
      description: item.description || (item.material_data && item.material_data.description) || "",
      year: item.year || (item.material_data && item.material_data.year) || "",
      episodes: item.episodes_count || (item.material_data && item.material_data.episodes_count) || 0,
      duration: item.duration || (item.material_data && item.material_data.duration) || "",
      studios: item.material_data && item.material_data.studios ? item.material_data.studios.join(", ") : "",
      countries: item.material_data && item.material_data.countries ? item.material_data.countries.join(", ") : "",
      link: item.link || "",
      shikimoriId: item.material_data && item.material_data.shikimori_id ? item.material_data.shikimori_id : null,
      kinopoiskId: item.material_data && item.material_data.kinopoisk_id ? item.material_data.kinopoisk_id : null,
      imdbId: item.material_data && item.material_data.imdb_id ? item.material_data.imdb_id : null,
      worldArtId: item.material_data && item.material_data.worldart_link ? item.material_data.worldart_link : null,
      type: item.type || (item.material_data && item.material_data.type) || "anime",
      seasons: seasons,
    }

    // Cache the result with timestamp
    if (typeof window !== 'undefined') {
      const cacheData = {
        ...anime,
        _cacheTime: Date.now(),
      }
      localStorage.setItem(`anime_cache_${id}`, JSON.stringify(cacheData))
    }

    return anime
  } catch (error) {
    console.error("Error fetching anime by ID:", error)
    throw error
  }
}

// Function to fetch anime video
export async function getAnimeVideo(animeId: string, seasonNumber = 1, episodeNumber = 1, playerType: PlayerType = "kodik"): Promise<AnimeVideo> {
  try {
    // First get the anime details to get the seasons and episodes
    const anime = await getAnimeById(animeId)

    if (!anime.seasons || anime.seasons.length === 0) {
      console.warn("No seasons available, creating default season")
      // Create a default season with episodes
      anime.seasons = [
        {
          id: "season_1",
          number: 1,
          title: "Сезон 1",
          episodes: [
            {
              id: "1_1",
              number: 1,
              title: "Эпизод 1",
              link: "", // Empty link for default episode
              screenshots: [],
            },
            {
              id: "1_2",
              number: 2,
              title: "Эпизод 2",
              link: "", // Empty link for default episode
              screenshots: [],
            },
          ],
        },
      ]
    }

    // Find the requested season
    const season = anime.seasons.find((s) => s.number === seasonNumber) || anime.seasons[0]

    if (!season.episodes || season.episodes.length === 0) {
      console.warn("No episodes available in season, creating default episode")
      // Create a default episode
      season.episodes = [
        {
          id: `${season.number}_1`,
          number: 1,
          title: "Эпизод 1",
          link: "", // Empty link for default episode
          screenshots: [],
        },
      ]
    }

    // Сортируем эпизоды по возрастанию номера
    const sortedEpisodes = [...season.episodes].sort((a, b) => a.number - b.number)
    // Find the requested episode
    const episode = sortedEpisodes.find((e) => e.number === episodeNumber) || sortedEpisodes[0]

    // Логируем выбранный эпизод и ссылку
    console.log('[getAnimeVideo] Выбран эпизод:', episode);
    
    let videoUrl = "";
    let finalPlayerType = playerType; // Используем новую переменную для определения типа плеера в ответе
    
    // Выбираем источник видео в зависимости от выбранного плеера
    if (playerType === "aniboom") {
      // Для AniBoom используем API для поиска аниме
      try {
        // Формируем варианты названия для поиска
        const titleVariants = [
          anime.titleOrig,
          anime.title,
          anime.title ? anime.title.replace(/\([^)]*\)/g, "").trim() : undefined, // без скобок
          anime.title ? anime.title.split(":")[0].trim() : undefined, // до двоеточия
          anime.title && anime.year ? `${anime.title} ${anime.year}` : undefined,
        ].filter(Boolean);
        let found = false;
        let searchLog = [];
        for (const variant of titleVariants) {
          if (!variant) continue;
          const searchUrl = `/api/proxy/aniboom?endpoint=search&query=${encodeURIComponent(variant)}`;
          console.log(`[getAnimeVideo] AniBoom поиск по варианту: ${variant}`);
          const searchResponse = await fetch(searchUrl, { cache: "no-store" });
          const searchData = await searchResponse.json();
          searchLog.push({variant, searchData});
          if (searchData && searchData.results && searchData.results.length > 0) {
            // Перебираем все результаты поиска
            for (const result of searchData.results) {
              const aniBoomId = result.id;
              const episodesUrl = `/api/proxy/aniboom?endpoint=anime&id=${aniBoomId}`;
              const episodesResponse = await fetch(episodesUrl, { cache: "no-store" });
              const episodesData = await episodesResponse.json();
              if (episodesData && episodesData.episodes && episodesData.episodes.length > 0) {
                // Находим нужный эпизод
                const targetEpisode = episodesData.episodes.find((ep: any) => 
                  ep.number === episodeNumber && ep.season === seasonNumber
                ) || episodesData.episodes[0];
                if (targetEpisode) {
                  videoUrl = `https://aniboom.one/embed/${aniBoomId}?episode=${targetEpisode.id}`;
                  console.log(`[getAnimeVideo] AniBoom найден: вариант='${variant}', id=${aniBoomId}, episodeId=${targetEpisode.id}`);
                  found = true;
                  break;
                }
              }
            }
          }
          if (found) break;
        }
        if (!videoUrl) {
          console.warn('[getAnimeVideo] AniBoom не найден по вариантам:', titleVariants, searchLog);
        }
      } catch (error) {
        console.error('[getAnimeVideo] Ошибка при поиске в AniBoom:', error);
        console.warn('[getAnimeVideo] URL не будет сформирован для Aniboom из-за ошибки.');
      }
    }
    
    // Если выбран Kodik ИЛИ (выбран Aniboom, но его URL не был получен)
    if (playerType === "kodik" || (playerType === "aniboom" && !videoUrl)) {
      if (playerType === "aniboom" && !videoUrl) {
        console.log('[getAnimeVideo] Aniboom URL не найден, пытаемся использовать Kodik как запасной вариант (если это разрешено логикой выше)');
        // Если мы хотим здесь явно переключиться на Kodik для URL, но сохранить playerType в ответе как aniboom (если он был запрошен)
        // или же, если мы хотим, чтобы VideoPlayer сам решал, что делать при пустом URL для aniboom
        // ТЕКУЩАЯ ЛОГИКА: если aniboom запрошен и не найден, videoUrl останется пустым, и VideoPlayer должен это обработать.
        // Если же мы хотим всегда возвращать Kodik URL как fallback, то нужно изменить finalPlayerType на "kodik"
        // Пока оставляем так, что если Aniboom не найден, videoUrl пустой, finalPlayerType = "aniboom"
      } 
      // Этот блок кода больше не нужен в таком виде, если мы не хотим автоматически переключаться на Kodik
      // Оставим его для Kodik или если мы решим явно использовать Kodik как fallback

      // Формируем URL для Kodik, только если playerType изначально был "kodik"
      // или если мы решим сделать его запасным вариантом и изменим finalPlayerType
      if (playerType === "kodik") { // Строго для Kodik
        videoUrl = episode.link || anime.link || "";
        finalPlayerType = "kodik"; // Убеждаемся, что тип плеера в ответе Kodik
        console.log('[getAnimeVideo] Исходный videoUrl Kodik:', videoUrl);

        // Добавляем номер эпизода в URL, если его там нет
        if (videoUrl && !/episode(=|%3D)\d+/i.test(videoUrl)) {
          if (videoUrl.includes('?')) {
            videoUrl += `&episode=${episode.number}`
          } else {
            videoUrl += `?episode=${episode.number}`
          }
          console.log(`[getAnimeVideo] Модифицированный videoUrl для эпизода ${episode.number}:`, videoUrl);
        } else if (videoUrl && /episode(=|%3D)\d+/i.test(videoUrl)) {
          // Если URL уже содержит параметр episode, заменяем его на текущий
          videoUrl = videoUrl.replace(/episode(=|%3D)\d+/i, `episode=${episode.number}`);
          console.log(`[getAnimeVideo] Обновлен параметр episode в URL для эпизода ${episode.number}:`, videoUrl);
        }

        // Fix common issues with Kodik URLs
        if (videoUrl && videoUrl.includes("kodik") && !videoUrl.includes("http")) {
          videoUrl = `https:${videoUrl}`
        }
        
        // Подготовка URL для поддержки высокого качества и апскейлинга
        if (videoUrl && videoUrl.includes("kodik")) {
          // Добавляем базовые параметры для улучшения качества и отключения рекламы
          const hasQueryParams = videoUrl.includes("?");
          const paramPrefix = hasQueryParams ? "&" : "?";
          
          // Добавляем параметры для максимального качества и поддержки апскейлинга
          videoUrl += `${paramPrefix}max_quality=true&force_hd=true`;
          
          // Добавляем параметры для поддержки ИИ-апскейлинга
          if (!videoUrl.includes("enable_ai_upscale")) {
            videoUrl += `&enable_ai_upscale=true&force_ai=true`;
          }
          
          console.log('[getAnimeVideo] Финальный URL с параметрами качества:', videoUrl);
        }
      }
    }

    return {
      url: videoUrl,
      totalSeasons: anime.seasons.length,
      totalEpisodes: season.episodes.length,
      currentSeason: season.number,
      currentEpisode: episode.number,
      seasons: anime.seasons,
      playerType: finalPlayerType // Возвращаем finalPlayerType
    }
  } catch (error) {
    console.error("Error fetching anime video:", error)
    throw error
  }
}

// Функция для проверки валидности id аниме
function isValidAnimeId(animeId: string): boolean {
  return typeof animeId === 'string' && (animeId.startsWith('serial-') || animeId.startsWith('movie-'));
}

// Function to get user collection
export async function getUserCollection(userId: string): Promise<Anime[]> {
  if (typeof window === 'undefined') {
    return [];
  }
  const collectionJson = localStorage.getItem(`user_${userId}_collection`)
  let collection = collectionJson ? (JSON.parse(collectionJson) as string[]) : []
  // Фильтруем только валидные id
  const validCollection = collection.filter(isValidAnimeId)
  // Если были невалидные id — обновляем localStorage
  if (validCollection.length !== collection.length) {
    localStorage.setItem(`user_${userId}_collection`, JSON.stringify(validCollection))
  }
  // Получаем аниме только по валидным id
  const animeList = await Promise.all(
    validCollection.map(async (animeId) => {
      try {
        return await getAnimeById(animeId)
      } catch {
        return null
      }
    })
  )
  return animeList.filter(Boolean) as Anime[]
}

// Function to add anime to collection
export async function addAnimeToCollection(userId: string, animeId: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    // Сохраняем только валидные id
    if (!isValidAnimeId(animeId)) {
      console.warn('[COLLECTION] Попытка добавить невалидный id:', animeId);
      return false;
    }
    const collectionJson = localStorage.getItem(`user_${userId}_collection`)
    const collection = collectionJson ? (JSON.parse(collectionJson) as string[]) : []
    if (!collection.includes(animeId)) {
      collection.push(animeId)
      localStorage.setItem(`user_${userId}_collection`, JSON.stringify(collection))
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Function to remove anime from collection
export async function removeAnimeFromCollection(userId: string, animeId: string): Promise<boolean> {
  try {
    // Проверка доступности localStorage
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Get current collection
    const collectionJson = localStorage.getItem(`user_${userId}_collection`)
    if (!collectionJson) return false

    const collection = JSON.parse(collectionJson) as string[]

    // Remove anime from collection
    const newCollection = collection.filter((id) => id !== animeId)
    localStorage.setItem(`user_${userId}_collection`, JSON.stringify(newCollection))

    return true
  } catch (error) {
    console.error("Error removing anime from collection:", error)
    return false
  }
}

// Function to check if anime is in collection
export async function isAnimeInCollection(userId: string, animeId: string): Promise<boolean> {
  try {
    // Проверка доступности localStorage
    if (typeof window === 'undefined') {
      return false;
    }
    
    const collectionJson = localStorage.getItem(`user_${userId}_collection`)
    if (!collectionJson) return false

    const collection = JSON.parse(collectionJson) as string[]
    return collection.includes(animeId)
  } catch (error) {
    console.error("Error checking anime in collection:", error)
    return false
  }
}

// Function to get watch history
export async function getWatchHistory(userId: string): Promise<Anime[]> {
  try {
    if (typeof window === 'undefined') {
      return [];
    }
    const historyJson = localStorage.getItem(`user_${userId}_history`)
    if (!historyJson) return []

    let historyItems = JSON.parse(historyJson) as { id: string; timestamp: number }[]
    // Сортируем по времени
    historyItems.sort((a, b) => b.timestamp - a.timestamp)

    // Получаем только существующие аниме
    const animeList = await Promise.all(
      historyItems.map(async (item) => {
        try {
          return await getAnimeById(item.id)
        } catch {
          return null
        }
      })
    )
    // Фильтруем только найденные аниме
    const validAnime = animeList.filter(Boolean) as Anime[]
    // Оставляем только id найденных аниме
    const validIds = validAnime.map((a) => a.id)
    const filteredHistory = historyItems.filter((item) => validIds.includes(item.id))
    // Если были невалидные id — обновляем localStorage
    if (filteredHistory.length !== historyItems.length) {
      localStorage.setItem(`user_${userId}_history`, JSON.stringify(filteredHistory))
    }
    return validAnime
  } catch (error) {
    console.error("Error fetching watch history:", error)
    return []
  }
}

// Function to add anime to watch history
export async function addToWatchHistory(
  userId: string,
  animeId: string,
  seasonNumber = 1,
  episodeNumber = 1,
): Promise<boolean> {
  try {
    // Проверка доступности localStorage
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Get current history
    const historyJson = localStorage.getItem(`user_${userId}_history`)
    const history = historyJson
      ? (JSON.parse(historyJson) as { id: string; timestamp: number; season?: number; episode?: number }[])
      : []

    // Remove if already exists
    const filteredHistory = history.filter((item) => item.id !== animeId)

    // Add to beginning with current timestamp
    filteredHistory.unshift({
      id: animeId,
      timestamp: Date.now(),
      season: seasonNumber,
      episode: episodeNumber,
    })

    // Keep only the most recent 20 items
    const trimmedHistory = filteredHistory.slice(0, 20)

    localStorage.setItem(`user_${userId}_history`, JSON.stringify(trimmedHistory))

    return true
  } catch (error) {
    console.error("Error adding to watch history:", error)
    return false
  }
}

// Function to get anime recommendations
export async function getAnimeRecommendations(animeId: string): Promise<Anime[]> {
  try {
    // Get the anime details to get genres
    const anime = await getAnimeById(animeId)

    // Use the first genre to find similar anime
    const genre = anime.genres && anime.genres.length > 0 ? anime.genres[0] : null

    if (!genre) {
      return []
    }

    // Get anime with the same genre
    const recommendations = await getAnimeList({
      genre: genre,
      limit: 10,
    })

    // Filter out the current anime
    return recommendations.filter((item) => item.id !== animeId)
  } catch (error) {
    console.error("Error getting anime recommendations:", error)
    return []
  }
}

// Function to get trending anime
export async function getTrendingAnime(): Promise<Anime[]> {
  try {
    return await getAnimeList({
      sort: "rating_desc",
      limit: 10,
    })
  } catch (error) {
    console.error("Error getting trending anime:", error)
    return []
  }
}

// Function to get latest anime
export async function getLatestAnime(): Promise<Anime[]> {
  try {
    return await getAnimeList({
      sort: "year_desc",
      limit: 10,
    })
  } catch (error) {
    console.error("Error getting latest anime:", error)
    return []
  }
}

// Function to get anime by genre
export async function getAnimeByGenre(genre: string): Promise<Anime[]> {
  try {
    return await getAnimeList({
      genre: genre,
      limit: 10,
    })
  } catch (error) {
    console.error(`Error getting anime by genre ${genre}:`, error)
    return []
  }
}

// Comment functions
export async function getComments(animeId: string): Promise<Comment[]> {
  try {
    // Проверка доступности localStorage
    if (typeof window === 'undefined') {
      return [];
    }
    
    const commentsJson = localStorage.getItem(`comments_${animeId}`)
    if (!commentsJson) return []

    return JSON.parse(commentsJson) as Comment[]
  } catch (error) {
    console.error("Error getting comments:", error)
    return []
  }
}

export async function addComment(animeId: string, comment: Omit<Comment, "id" | "createdAt">): Promise<Comment> {
  try {
    // Проверка доступности localStorage
    if (typeof window === 'undefined') {
      throw new Error("Cannot access localStorage on server side");
    }
    
    const comments = await getComments(animeId)

    const newComment: Comment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    }

    comments.unshift(newComment)
    localStorage.setItem(`comments_${animeId}`, JSON.stringify(comments))

    return newComment
  } catch (error) {
    console.error("Error adding comment:", error)
    throw error
  }
}

export async function addReply(
  animeId: string,
  commentId: string,
  reply: Omit<Comment, "id" | "createdAt" | "replies">,
): Promise<Comment> {
  try {
    // Проверка доступности localStorage
    if (typeof window === 'undefined') {
      throw new Error("Cannot access localStorage on server side");
    }
    
    const comments = await getComments(animeId)
    const commentIndex = comments.findIndex((c) => c.id === commentId)

    if (commentIndex === -1) {
      throw new Error("Comment not found")
    }

    const newReply: Comment = {
      ...reply,
      id: `${commentId}_reply_${Date.now()}`,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    }

    if (!comments[commentIndex].replies) {
      comments[commentIndex].replies = []
    }

    comments[commentIndex].replies!.push(newReply)
    localStorage.setItem(`comments_${animeId}`, JSON.stringify(comments))

    return newReply
  } catch (error) {
    console.error("Error adding reply:", error)
    throw error
  }
}

export async function likeComment(animeId: string, commentId: string, userId: string): Promise<boolean> {
  try {
    // Проверка доступности localStorage
    if (typeof window === 'undefined') {
      return false;
    }
    
    const comments = await getComments(animeId)

    // Find the comment (could be a top-level comment or a reply)
    let found = false

    // Check top-level comments
    for (const comment of comments) {
      if (comment.id === commentId) {
        comment.likes += 1
        found = true
        break
      }

      // Check replies
      if (comment.replies) {
        for (const reply of comment.replies) {
          if (reply.id === commentId) {
            reply.likes += 1
            found = true
            break
          }
        }
        if (found) break
      }
    }

    if (!found) {
      throw new Error("Comment not found")
    }

    localStorage.setItem(`comments_${animeId}`, JSON.stringify(comments))

    // Track which comments the user has liked
    const likedCommentsKey = `user_${userId}_liked_comments`
    const likedComments = JSON.parse(localStorage.getItem(likedCommentsKey) || "[]") as string[]

    if (!likedComments.includes(commentId)) {
      likedComments.push(commentId)
      localStorage.setItem(likedCommentsKey, JSON.stringify(likedComments))
    }

    return true
  } catch (error) {
    console.error("Error liking comment:", error)
    return false
  }
}

export async function hasLikedComment(commentId: string, userId: string): Promise<boolean> {
  try {
    // Проверка доступности localStorage
    if (typeof window === 'undefined') {
      return false;
    }
    
    const likedCommentsKey = `user_${userId}_liked_comments`
    const likedComments = JSON.parse(localStorage.getItem(likedCommentsKey) || "[]") as string[]

    return likedComments.includes(commentId)
  } catch (error) {
    console.error("Error checking if comment is liked:", error)
    return false
  }
}

// Функция для получения порядка просмотра аниме по франшизе
export async function getWatchOrder(title: string): Promise<Anime[]> {
  try {
    // Очищаем название от лишних символов и сезонов для поиска
    const cleanTitle = title
      .replace(/\([^)]*\)/g, '') // Удаляем текст в скобках
      .replace(/\[[^\]]*\]/g, '') // Удаляем текст в квадратных скобках (ТВ-1, ТВ-2)
      .replace(/сезон|season|\d+$/gi, '') // Удаляем упоминания сезонов
      .replace(/\s+/g, ' ') // Удаляем лишние пробелы
      .trim();
    
    // Извлекаем основное название франшизы (без указания сезона, фильма и т.д.)
    const franchiseTitle = cleanTitle
      .split(':')[0] // Берем основное название до двоеточия
      .split(' -')[0] // Удаляем части после дефиса (часто указывают подзаголовок)
      .trim();
    
    // Проверяем, есть ли в названии указание на сезон в формате [ТВ-N]
    const tvSeasonMatch = title.match(/\[ТВ-(\d+)\]|\[TV-(\d+)\]/i);
    let hasSeasonIndicator = false;
    let seasonNumber = 0;
    
    if (tvSeasonMatch) {
      hasSeasonIndicator = true;
      seasonNumber = parseInt(tvSeasonMatch[1] || tvSeasonMatch[2], 10);
      console.log(`[getWatchOrder] Обнаружен сезон ${seasonNumber} в названии "${title}"`);
    }
    
    console.log(`[getWatchOrder] Поиск аниме по франшизе: "${franchiseTitle}"`);
    
    // Делаем три запроса для максимального охвата
    
    // 1. Поиск по полному названию
    const fullTitleResults = await getAnimeList({
      search: cleanTitle,
      limit: 15,
    });
    
    // 2. Поиск по названию франшизы (более общий)
    const franchiseResults = await getAnimeList({
      search: franchiseTitle,
      limit: 20,
    });
    
    // 3. Специальный поиск для формата [ТВ-N]
    let tvFormatResults: Anime[] = [];
    if (hasSeasonIndicator) {
      // Ищем другие сезоны с тем же базовым названием
      const tvSearchTerm = `${franchiseTitle} ТВ`;
      console.log(`[getWatchOrder] Дополнительный поиск по формату ТВ: "${tvSearchTerm}"`);
      tvFormatResults = await getAnimeList({
        search: tvSearchTerm,
        limit: 10,
      });
    }
    
    // Объединяем результаты, избегая дубликатов по ID
    const existingIds = new Set<string>();
    const combinedResults: Anime[] = [];
    
    // Вспомогательная функция для добавления результатов без дубликатов
    const addUniqueResults = (results: Anime[]) => {
      results.forEach(anime => {
        if (!existingIds.has(anime.id)) {
          combinedResults.push(anime);
          existingIds.add(anime.id);
        }
      });
    };
    
    // Добавляем результаты из всех запросов
    addUniqueResults(fullTitleResults);
    addUniqueResults(franchiseResults);
    addUniqueResults(tvFormatResults);
    
    if (combinedResults.length === 0) {
      console.log(`[getWatchOrder] Не найдено аниме по запросам`);
      return [];
    }
    
    console.log(`[getWatchOrder] Найдено ${combinedResults.length} аниме (до фильтрации)`);
    
    // Создаем список ключевых слов для проверки релевантности
    const franchiseKeywords = franchiseTitle
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Функция для проверки релевантности названия
    const isRelevantTitle = (animeTitle: string): boolean => {
      if (!animeTitle) return false;
      
      const normalizedTitle = animeTitle.toLowerCase();
      
      // Проверяем наличие основного названия франшизы в названии аниме
      if (normalizedTitle.includes(franchiseTitle.toLowerCase())) {
        return true;
      }
      
      // Проверяем наличие ключевых слов
      const matchingWords = franchiseKeywords.filter(word => 
        normalizedTitle.includes(word)
      );
      
      // Если название франшизы короткое (1-2 слова), требуем совпадения всех слов
      if (franchiseKeywords.length <= 2) {
        return matchingWords.length === franchiseKeywords.length;
      }
      
      // Иначе требуем совпадения хотя бы половины слов
      return matchingWords.length >= Math.ceil(franchiseKeywords.length / 2);
    };
    
    // Функция для определения номера сезона из названия
    const extractSeasonNumber = (animeTitle: string): number => {
      // Проверяем формат [ТВ-N]
      const tvMatch = animeTitle.match(/\[ТВ-(\d+)\]|\[TV-(\d+)\]/i);
      if (tvMatch) {
        return parseInt(tvMatch[1] || tvMatch[2], 10);
      }
      
      // Проверяем формат "N сезон"
      const seasonMatch = animeTitle.match(/(\d+)\s*сезон/i);
      if (seasonMatch) {
        return parseInt(seasonMatch[1], 10);
      }
      
      // Проверяем формат "Season N"
      const engSeasonMatch = animeTitle.match(/Season\s*(\d+)/i);
      if (engSeasonMatch) {
        return parseInt(engSeasonMatch[1], 10);
      }
      
      // Проверяем формат с римскими цифрами
      const romanMatch = animeTitle.match(/\s(I{1,3}|IV|V|VI{1,3}|IX|X)$/i);
      if (romanMatch) {
        const roman = romanMatch[1].toUpperCase();
        const romanValues: {[key: string]: number} = {
          'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
          'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
        };
        return romanValues[roman] || 0;
      }
      
      return 0; // Не удалось определить номер сезона
    };
    
    // Функция для нормализации названия (для проверки дубликатов)
    const normalizeTitle = (animeTitle: string): string => {
      return animeTitle
        .toLowerCase()
        .replace(/\([^)]*\)/g, '') // Удаляем текст в скобках
        .replace(/\[[^\]]*\]/g, '') // Удаляем текст в квадратных скобках
        .replace(/сезон|season|\d+$/gi, '') // Удаляем упоминания сезонов
        .replace(/ova|ona|movie|special|film|фильм|спешл/gi, '') // Удаляем типы аниме
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    // Фильтруем результаты по релевантности
    const relevantAnime = combinedResults.filter(anime => 
      isRelevantTitle(anime.title) || isRelevantTitle(anime.titleOrig || '')
    );
    
    console.log(`[getWatchOrder] После фильтрации по релевантности осталось ${relevantAnime.length} аниме`);
    
    // Создаем карту для группировки аниме по нормализованному названию и номеру сезона
    const groupedAnime = new Map<string, Map<number, Anime>>();
    
    // Группируем аниме по нормализованному названию и номеру сезона
    relevantAnime.forEach(anime => {
      const normalizedTitle = normalizeTitle(anime.title);
      const seasonNum = extractSeasonNumber(anime.title);
      
      if (!groupedAnime.has(normalizedTitle)) {
        groupedAnime.set(normalizedTitle, new Map<number, Anime>());
      }
      
      const seasonMap = groupedAnime.get(normalizedTitle)!;
      
      // Если уже есть аниме с таким же номером сезона, выбираем лучшее
      if (seasonMap.has(seasonNum)) {
        const existingAnime = seasonMap.get(seasonNum)!;
        const existingYear = parseInt(existingAnime.year || '0', 10);
        const currentYear = parseInt(anime.year || '0', 10);
        const existingEpisodes = existingAnime.episodes || 0;
        const currentEpisodes = anime.episodes || 0;
        
        // Предпочитаем аниме с большим количеством эпизодов или более новое
        if (currentEpisodes > existingEpisodes || 
            (currentEpisodes === existingEpisodes && currentYear > existingYear)) {
          seasonMap.set(seasonNum, {
            ...anime,
            seasonNumber: seasonNum
          });
        }
      } else {
        // Если нет аниме с таким номером сезона, добавляем новое
        seasonMap.set(seasonNum, {
          ...anime,
          seasonNumber: seasonNum
        });
      }
    });
    
    // Собираем все уникальные аниме из групп
    const uniqueAnime: Anime[] = [];
    groupedAnime.forEach(seasonMap => {
      seasonMap.forEach(anime => {
        uniqueAnime.push(anime);
      });
    });
    
    // Сортируем сначала по номеру сезона, затем по году выпуска
    const sortedAnime = [...uniqueAnime].sort((a, b) => {
      const seasonA = a.seasonNumber || 0;
      const seasonB = b.seasonNumber || 0;
      
      // Если у обоих есть номер сезона, сортируем по нему
      if (seasonA > 0 && seasonB > 0) {
        return seasonA - seasonB;
      }
      
      // Если только у одного есть номер сезона
      if (seasonA > 0) return -1;
      if (seasonB > 0) return 1;
      
      // Иначе сортируем по году
      const yearA = parseInt(a.year || '0', 10);
      const yearB = parseInt(b.year || '0', 10);
      return yearA - yearB;
    });
    
    console.log(`[getWatchOrder] После удаления дубликатов осталось ${sortedAnime.length} аниме`);
    
    // Если осталось слишком много результатов, возможно это не связанные аниме
    // Ограничиваем до 15 результатов
    return sortedAnime.length > 15 ? sortedAnime.slice(0, 15) : sortedAnime;
  } catch (error) {
    console.error("Error getting watch order:", error);
    return [];
  }
}


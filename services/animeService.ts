import type { Anime, AnimeVideo, AnimeListParams, Season, Episode, Comment } from "@/types"

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
      throw new Error(`API error: ${response?.status || "Network error"}`)
    }

    const data = await response.json()

    if (!data.results || !data.results[0]) {
      throw new Error("Anime not found")
    }

    const item = data.results[0]

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
            title: `Эпизод 1`,
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
export async function getAnimeVideo(animeId: string, seasonNumber = 1, episodeNumber = 1): Promise<AnimeVideo> {
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

    // Find the requested episode
    const episode = season.episodes.find((e) => e.number === episodeNumber) || season.episodes[0]

    // Get the video URL from the episode
    let videoUrl = episode.link

    if (!videoUrl) {
      // If no specific episode link is available, try to use the anime's main link
      if (anime.link) {
        videoUrl = anime.link
      } else {
        throw new Error("No video URL available for this episode")
      }
    }

    // Fix common issues with Kodik URLs
    if (videoUrl && videoUrl.includes("kodik") && !videoUrl.includes("http")) {
      videoUrl = `https:${videoUrl}`
    }

    return {
      url: videoUrl,
      totalSeasons: anime.seasons.length,
      totalEpisodes: season.episodes.length,
      currentSeason: season.number,
      currentEpisode: episode.number,
      seasons: anime.seasons,
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

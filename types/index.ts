// User type
export interface User {
  id: string
  username: string
  email: string
  createdAt?: string
  avatar?: string | null
  bio?: string
  preferences?: UserPreferences
  stats?: UserStats
  role?: "user" | "moderator" | "admin" | "beta"
}

// User preferences
export interface UserPreferences {
  theme?: "dark" | "light" | "system"
  autoplay?: boolean
  notifications?: boolean
  quality?: "auto" | "360p" | "480p" | "720p" | "1080p"
  language?: string
}

// User statistics
export interface UserStats {
  animeWatched: number
  episodesWatched: number
  commentsPosted: number
  joinDate: string
}

// Anime type
export interface Anime {
  id: string
  title: string
  titleOrig?: string
  poster: string
  genres: string[]
  rating: number
  status: string
  description: string
  year?: string
  episodes?: number
  duration?: string
  studios?: string
  countries?: string
  link?: string
  shikimoriId?: string | null
  kinopoiskId?: string | null
  imdbId?: string | null
  worldArtId?: string | null
  type?: string
  seasons: Season[]
}

// Season type
export interface Season {
  id: string
  number: number
  title: string
  episodes: Episode[]
}

// Episode type
export interface Episode {
  id: string
  number: number
  title: string
  link: string
  screenshots?: string[]
}

// Anime video type
export interface AnimeVideo {
  url: string
  totalSeasons: number
  totalEpisodes: number
  currentSeason: number
  currentEpisode: number
  seasons: Season[]
}

// Parameters for anime list API
export interface AnimeListParams {
  page?: number
  search?: string
  genre?: string
  status?: string
  sort?: string
  limit?: number
  offset?: number
  next?: string // Pagination token для Kodik API
}

// Comment type
export interface Comment {
  id: string
  userId: string
  username: string
  avatar?: string
  content: string
  createdAt: string
  likes: number
  replies?: Comment[]
}

// Notification type
export interface Notification {
  id: string
  userId: string
  type: "comment" | "like" | "follow" | "system"
  content: string
  read: boolean
  createdAt: string
  link?: string
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import AnimeCard from "./AnimeCard"
import { getAnimeList } from "@/services/animeService"
import type { Anime } from "@/types"
import { useInView } from "react-intersection-observer"


declare global {
  interface Window {
    kodikPaginationToken?: string | null;
  }
}


export default function AnimeList() {
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() // Convert to string for stable dependency
  const router = useRouter()

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  })

// 👇 Добавляем сюда

  

  const isSearch = !!searchParams.get("search");


  function mergeAnimeLists(prev: Anime[], next: Anime[]): Anime[] {
    const normalize = (text: string | undefined | null): string => 
      (text || "").trim().toLowerCase().replace(/\s+/g, " ");

    // Создаем Map для уникальных новых аниме по ключу из названий
    const uniqueNextItemsMap = new Map<string, Anime>();
    next.forEach(anime => {
      const titleNorm = normalize(anime.title);
      // Используем titleOrig только если он реально отличается от title
      const titleOrigNorm = normalize(anime.titleOrig);
      const key = titleOrigNorm && titleOrigNorm !== titleNorm 
                  ? `${titleNorm}|${titleOrigNorm}` 
                  : titleNorm;
                
      if (key && !uniqueNextItemsMap.has(key)) { // Проверяем, что ключ не пустой
        uniqueNextItemsMap.set(key, anime);
      } else if (key) {
        // console.log(`[MERGE TITLE] Пропуск дубликата по ключу ${key}: ${anime.title}`);
      } else {
        // console.warn(`[MERGE TITLE] Пустой ключ для аниме с ID: ${anime.id}, Title: ${anime.title}`);
        // Если ключ пустой (например, нет title), добавляем по ID, чтобы не потерять
        const idKey = `id-${anime.id}`;
        if (!uniqueNextItemsMap.has(idKey)) {
          uniqueNextItemsMap.set(idKey, anime);
        }
      }
    });

    // Создаем Set ключей из существующего списка
    const existingKeys = new Set(
      prev.map(a => {
        const titleNorm = normalize(a.title);
        const titleOrigNorm = normalize(a.titleOrig);
        const key = titleOrigNorm && titleOrigNorm !== titleNorm 
                    ? `${titleNorm}|${titleOrigNorm}` 
                    : titleNorm;
        return key || `id-${a.id}`; // Используем ID если ключ пустой
      })
    );

    // Фильтруем уникальные новые аниме
    const trulyUniqueNewItems = Array.from(uniqueNextItemsMap.values())
                                   .filter(anime => {
                                      const titleNorm = normalize(anime.title);
                                      const titleOrigNorm = normalize(anime.titleOrig);
                                      const key = titleOrigNorm && titleOrigNorm !== titleNorm 
                                                  ? `${titleNorm}|${titleOrigNorm}` 
                                                  : titleNorm;
                                      return !existingKeys.has(key || `id-${anime.id}`); // Проверяем по ID если ключ пустой
                                   });

    console.log(`[MERGE BY TITLE] Existing: ${prev.length}, Received: ${next.length}, Added new unique: ${trulyUniqueNewItems.length}`);

    return [...prev, ...trulyUniqueNewItems];
  }
  
  
  
  

  

  // Функция для фильтрации уникальных аниме по id
  function filterUniqueAnime(animeList: Anime[]): Anime[] {
    const map = new Map<string, Anime>();
    animeList.forEach((anime: Anime) => {
      if (!map.has(anime.id)) {
        map.set(anime.id, anime);
      }
    });
    return Array.from(map.values());
  }

  const fetchAnime = useCallback(
    async (pageNum: number, append = false) => {
      if (loading) return;
  
      try {
        setLoading(true);
  
        const search = searchParams.get("search") || "";
        const genre = searchParams.get("genre") || "";
        const status = searchParams.get("status") || "";
        const sort = searchParams.get("sort") || "";
  
        const data = await getAnimeList({
          page: pageNum,
          search,
          genre,
          status,
          sort,
          next: append ? window.kodikPaginationToken || undefined : undefined,
        });
  
        console.log("[FETCH]", data.map((a) => `#${a.title}#`));
  
        if (data.length === 0) {
          setHasMore(false);
        } else {
          if (append) {
            setAnimeList((prev) => mergeAnimeLists(prev, data));
          } else {
            setAnimeList(mergeAnimeLists([], data));
          }
          setPage(pageNum);
        }
      } catch (err) {
        console.error(err);
        setError("Ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    },
    [searchParamsString, loading],
  );
  
  

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const genre = searchParams.get("genre") || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "";
  
    const hasFilters = search || genre || status || sort;
  
    if (hasFilters || animeList.length === 0) { // только если есть фильтры ИЛИ пустой список
      setAnimeList([])
      setPage(1)
      setHasMore(true)
      setError(null)
      fetchAnime(1, false)
    }
  }, [searchParamsString]);
  

  useEffect(() => {
    if (isSearch) return;
    if (inView && !loading && hasMore) {
      setLoading(true); // быстро блокируем двойной вызов
      fetchAnime(page + 1, true)
    }
  }, [inView, loading, hasMore, page, fetchAnime, isSearch])
  

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(10)
      .fill(0)
      .map((_, index) => (
        <div key={`skeleton-${index}`} className="bg-gray-800/50 rounded-xl overflow-hidden shadow-lg animate-pulse">
          <div className="h-64 bg-gray-700/50 shimmer"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2 shimmer"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/2 mb-4 shimmer"></div>
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-gray-700/50 rounded w-16 shimmer"></div>
              <div className="h-6 bg-gray-700/50 rounded w-16 shimmer"></div>
            </div>
            <div className="h-10 bg-gray-700/50 rounded shimmer"></div>
          </div>
        </div>
      ))
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-red-900/30 text-red-400 p-6 rounded-xl inline-block max-w-md">
          <h3 className="text-xl font-bold mb-2">Что-то пошло не так</h3>
          <p>{error}</p>
          <button
            onClick={() => fetchAnime(1, false)}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {animeList.length === 0 && !loading ? (
        <div className="text-center py-10">
          <div className="bg-gray-800/50 text-gray-300 p-6 rounded-xl inline-block max-w-md">
            <h3 className="text-xl font-bold mb-2">Ничего не найдено</h3>
            <p>Попробуйте изменить параметры поиска или фильтры</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
            {animeList.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
            {loading && renderSkeletons()}
          </div>

          {/* Load more trigger element */}
          {!isSearch && hasMore && !loading && <div ref={ref} className="h-10" />}

          {/* Loading indicator at the bottom when fetching more */}
          {loading && hasMore && (
            <div className="text-center py-8">
              <div className="loader mx-auto"></div>
            </div>
          )}

          {/* End of results message */}
          {!hasMore && animeList.length > 0 && (
            <div className="text-center py-8 text-gray-400">
              Вы дошли до конца списка
            </div>
          )}
        </>
      )}
    </div>
  )
}

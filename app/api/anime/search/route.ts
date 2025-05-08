import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface AnimeWithRelations {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  episodes: number;
  status: string;
  releaseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  genres: { id: string; name: string }[];
  ratings: { id: string; value: number; userId: string; animeId: string; createdAt: Date; updatedAt: Date }[];
}

type SortField = "title" | "rating" | "episodes" | "releaseDate" | "createdAt";
type SortOrder = "asc" | "desc";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const genre = searchParams.get("genre");
    const status = searchParams.get("status");
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const maxRating = parseFloat(searchParams.get("maxRating") || "5");
    const minEpisodes = parseInt(searchParams.get("minEpisodes") || "0");
    const maxEpisodes = parseInt(searchParams.get("maxEpisodes") || "9999");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = (searchParams.get("sortBy") || "createdAt") as SortField;
    const sortOrder = (searchParams.get("sortOrder") || "desc") as SortOrder;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Логируем параметры поиска
    console.log("Search query:", { query, genre, status, minRating, maxRating, minEpisodes, maxEpisodes, startDate, endDate, sortBy, sortOrder, page, limit });

    // Базовые условия поиска
    const where: any = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
      episodes: {
        gte: minEpisodes,
        lte: maxEpisodes,
      },
    };

    // Добавляем фильтр по жанру, если он указан
    if (genre) {
      where.genres = {
        some: {
          name: {
            equals: genre,
            mode: "insensitive",
          },
        },
      };
    }

    // Добавляем фильтр по статусу, если он указан
    if (status) {
      where.status = {
        equals: status,
        mode: "insensitive",
      };
    }

    // Добавляем фильтр по дате выхода, если указана
    if (startDate || endDate) {
      where.releaseDate = {};
      if (startDate) {
        where.releaseDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.releaseDate.lte = new Date(endDate);
      }
    }

    // Получаем аниме с учетом фильтров и пагинации
    const [anime, total] = await Promise.all([
      prisma.anime.findMany({
        where,
        include: {
          genres: true,
          ratings: true,
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.anime.count({ where }),
    ]);

    // Логируем условия поиска и количество найденных аниме
    console.log("Prisma where:", JSON.stringify(where, null, 2));
    console.log("Found anime count:", anime.length);

    // Вычисляем средний рейтинг для каждого аниме и фильтруем по рейтингу
    const animeWithRatings = anime
      .map((item: AnimeWithRelations) => {
        const averageRating = item.ratings.length > 0
          ? item.ratings.reduce((acc: number, curr) => acc + curr.value, 0) / item.ratings.length
          : 0;

        return {
          ...item,
          averageRating,
          ratings: undefined, // Удаляем массив рейтингов из ответа
        };
      })
      .filter((item: AnimeWithRelations & { averageRating: number }) => 
        item.averageRating >= minRating && item.averageRating <= maxRating
      );

    return NextResponse.json({
      anime: animeWithRatings,
      pagination: {
        total: animeWithRatings.length,
        pages: Math.ceil(animeWithRatings.length / limit),
        currentPage: page,
        limit,
      },
      filters: {
        query,
        genre,
        status,
        minRating,
        maxRating,
        minEpisodes,
        maxEpisodes,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Error searching anime:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/anime - получить список аниме
export async function GET() {
  try {
    const anime = await prisma.anime.findMany({
      include: {
        genres: true,
        ratings: true,
      },
    });

    return NextResponse.json(anime);
  } catch (error) {
    console.error("Error fetching anime:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/anime - создать новое аниме
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, imageUrl, episodes, status, releaseDate, genres } = body;

    if (!title || !description || !imageUrl || !episodes || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const anime = await prisma.anime.create({
      data: {
        title,
        description,
        imageUrl,
        episodes,
        status,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        genres: {
          connectOrCreate: genres?.map((genre: string) => ({
            where: { name: genre },
            create: { name: genre },
          })) || [],
        },
      },
      include: {
        genres: true,
      },
    });

    return NextResponse.json(anime, { status: 201 });
  } catch (error) {
    console.error("Error creating anime:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 
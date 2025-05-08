import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/favorites - получить избранное пользователя
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        anime: {
          include: {
            genres: true,
            ratings: true,
          },
        },
      },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/favorites - добавить аниме в избранное
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { animeId } = body;

    if (!animeId) {
      return NextResponse.json(
        { error: "Anime ID is required" },
        { status: 400 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        animeId,
        userId: session.user.id,
      },
      include: {
        anime: {
          include: {
            genres: true,
            ratings: true,
          },
        },
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - удалить аниме из избранного
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const animeId = searchParams.get("animeId");

    if (!animeId) {
      return NextResponse.json(
        { error: "Anime ID is required" },
        { status: 400 }
      );
    }

    await prisma.favorite.delete({
      where: {
        userId_animeId: {
          userId: session.user.id,
          animeId,
        },
      },
    });

    return NextResponse.json(
      { message: "Favorite removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/ratings?animeId=123 - получить рейтинги аниме
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const animeId = searchParams.get("animeId");

    if (!animeId) {
      return NextResponse.json(
        { error: "Anime ID is required" },
        { status: 400 }
      );
    }

    const ratings = await prisma.rating.findMany({
      where: {
        animeId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const averageRating = ratings.reduce((acc: number, curr: { value: number }) => acc + curr.value, 0) / ratings.length || 0;

    return NextResponse.json({
      ratings,
      averageRating,
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/ratings - добавить/обновить рейтинг
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
    const { animeId, value } = body;

    if (!animeId || !value || value < 1 || value > 5) {
      return NextResponse.json(
        { error: "Invalid rating value" },
        { status: 400 }
      );
    }

    const rating = await prisma.rating.upsert({
      where: {
        userId_animeId: {
          userId: session.user.id,
          animeId,
        },
      },
      update: {
        value,
      },
      create: {
        value,
        animeId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(rating, { status: 201 });
  } catch (error) {
    console.error("Error updating rating:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/ratings - удалить рейтинг
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

    await prisma.rating.delete({
      where: {
        userId_animeId: {
          userId: session.user.id,
          animeId,
        },
      },
    });

    return NextResponse.json(
      { message: "Rating removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing rating:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 
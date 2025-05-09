import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Получаем путь и query-параметры
  const { searchParams } = req.nextUrl;
  // Определяем endpoint
  const endpoint = searchParams.get("endpoint") || "search";
  // Собираем query string без endpoint
  const params = Array.from(searchParams.entries())
    .filter(([key]) => key !== "endpoint")
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  // Собираем финальный URL
  const url = `https://api.aniboom.one/${endpoint}?${params}`;

  try {
    const res = await fetch(url, { 
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
      }
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ANIBOOM_PROXY_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch from aniboom api" }, { status: 500 });
  }
} 
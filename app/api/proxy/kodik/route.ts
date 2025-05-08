import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Получаем путь и query-параметры
  const { searchParams } = req.nextUrl;
  // Определяем endpoint (list, search и т.д.)
  const endpoint = searchParams.get("endpoint") || "list";
  // Собираем query string без endpoint
  const params = Array.from(searchParams.entries())
    .filter(([key]) => key !== "endpoint")
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  // Собираем финальный URL
  const url = `https://kodikapi.com/${endpoint}?${params}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch from kodikapi" }, { status: 500 });
  }
} 
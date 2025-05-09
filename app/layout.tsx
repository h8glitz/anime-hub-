import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider } from "@/context/AuthContext"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata = {
  title: "Anime Hub - Смотреть аниме онлайн",
  description:
    "Anime Hub - лучший сайт для просмотра аниме онлайн. Огромная коллекция аниме-сериалов и фильмов с русской озвучкой и субтитрами.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen flex flex-col`}>
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

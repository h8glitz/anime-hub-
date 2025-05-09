import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16  flex flex-col items-center justify-center min-h-[70vh]">
      <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-white mb-6">Страница не найдена</h2>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Извините, страница, которую вы ищете, не существует или была перемещена.
      </p>
      <Link
        href="/"
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
      >
        Вернуться на главную
      </Link>
    </div>
  )
}

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-800 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center mb-4">
              <span className="text-2xl font-bold text-orange-500">Anime</span>
              <span className="text-2xl font-bold text-white">Hub</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Лучший сайт для просмотра аниме онлайн. Огромная коллекция аниме-сериалов и фильмов с русской озвучкой и
              субтитрами.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Навигация</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Главная
                </Link>
              </li>
              <li>
                <Link href="/collection" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Коллекция
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-orange-500 transition-colors">
                  О нас
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Категории</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/?genre=action" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Боевик
                </Link>
              </li>
              <li>
                <Link href="/?genre=comedy" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Комедия
                </Link>
              </li>
              <li>
                <Link href="/?genre=drama" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Драма
                </Link>
              </li>
              <li>
                <Link href="/?genre=fantasy" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Фэнтези
                </Link>
              </li>
              <li>
                <Link href="/?genre=romance" className="text-gray-400 hover:text-orange-500 transition-colors">
                  Романтика
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Контакты</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">Email: support@animehub.com</li>
              <li>
                <div className="flex space-x-4 mt-4">
                  <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                    Twitter
                  </a>
                  <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                    Instagram
                  </a>
                  <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                    Discord
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Anime Hub. Все права защищены.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/terms" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
              Условия использования
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">О проекте Anime Hub</h1>

      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg p-8 shadow-lg">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Наша миссия</h2>
          <p className="text-gray-300 leading-relaxed">
            Anime Hub создан для любителей аниме, чтобы обеспечить удобный доступ к огромной коллекции аниме-сериалов и
            фильмов. Наша цель — создать сообщество, где поклонники аниме могут находить, смотреть и обсуждать свои
            любимые произведения.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Особенности платформы</h2>
          <ul className="text-gray-300 space-y-2 list-disc pl-5">
            <li>Обширная библиотека аниме различных жанров и годов выпуска</li>
            <li>Удобный поиск и фильтрация по жанрам, рейтингу и статусу</li>
            <li>Персональные коллекции и история просмотров</li>
            <li>Возможность оставлять комментарии и обсуждать аниме</li>
            <li>Регулярные обновления и добавление новых релизов</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Правовая информация</h2>
          <p className="text-gray-300 leading-relaxed">
            Anime Hub не хранит видеофайлы на своих серверах. Мы используем API Kodik для получения информации об аниме
            и ссылок на видеоконтент. Все права на аниме принадлежат их законным правообладателям. Если вы являетесь
            правообладателем и считаете, что ваши права нарушены, пожалуйста, свяжитесь с нами.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Контакты</h2>
          <p className="text-gray-300 leading-relaxed">
            Если у вас есть вопросы, предложения или замечания, вы можете связаться с нами по электронной почте:{" "}
            <a href="mailto:support@animehub.com" className="text-orange-500 hover:underline">
              support@animehub.com
            </a>
          </p>
          <p className="text-gray-300 mt-4">Следите за нами в социальных сетях:</p>
          <div className="flex space-x-4 mt-2">
            <a href="#" className="text-orange-500 hover:text-orange-400">
              Twitter
            </a>
            <a href="#" className="text-orange-500 hover:text-orange-400">
              Instagram
            </a>
            <a href="#" className="text-orange-500 hover:text-orange-400">
              Discord
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}

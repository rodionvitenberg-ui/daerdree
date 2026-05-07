import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardGame } from "@/types/game";
import { getImageUrl } from "@/lib/utils";
import { API_ENDPOINTS } from "@/lib/constants";
import { getTranslations, getLocale } from "next-intl/server"; 

// Обновленная функция загрузки с передачей заголовка языка
async function getGame(id: string, locale: string): Promise<BoardGame> {
  const res = await fetch(`${API_ENDPOINTS.GAMES}/${id}/`, {
    cache: "no-store",
    headers: {
      'Accept-Language': locale,
    }
  });

  if (!res.ok) {
    return notFound();
  }

  return res.json();
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("GameDetails");
  const game = await getGame(id, locale);

  // Локализация основных полей игры
  const localizedTitle = locale === 'ru' ? (game.title_ru || game.title) : (game.title_en || game.title);
  const localizedDescription = locale === 'ru' ? (game.description_ru || game.description) : (game.description_en || game.description);

  const heroImage = game.setup_image || game.image;

  return (
    <main className="min-h-screen bg-background">
      {/* 1. HERO ИГРЫ (Фон) */}
      <div className="relative h-[60vh] w-full">
        {heroImage && (
          <Image
            src={getImageUrl(heroImage)}
            alt={localizedTitle}
            fill
            className="object-cover opacity-50"
            priority
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 lg:p-20">
          <div className="container mx-auto">
            <h1 className="font-serif text-5xl font-black uppercase tracking-widest text-white md:text-7xl lg:text-8xl">
              {localizedTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* 2. КОНТЕНТНАЯ ЧАСТЬ */}
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          
          {/* ЛЕВАЯ КОЛОНКА (Инфо и описание) */}
          <div className="lg:col-span-8">
            {/* Краткие метки */}
            <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Players */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-accent">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-widest text-white/40">{t("players")}</span>
                  <span className="text-lg font-bold text-white">
                    {t("playersRange", { min: game.min_players, max: game.max_players })}
                  </span>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-accent">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-widest text-white/40">{t("playTime")}</span>
                  <span className="text-lg font-bold text-white">{t("minutes", { time: game.play_time })}</span>
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-accent">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-widest text-white/40">{t("difficulty")}</span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div key={lvl} className={`h-2 w-4 rounded-sm ${lvl <= game.difficulty ? 'bg-accent' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Описание */}
            <div className="prose prose-invert max-w-none">
              <h2 className="mb-6 font-serif text-3xl font-bold uppercase tracking-widest text-accent">
                {t("description")}
              </h2>
              {/* Используем dangerouslySetInnerHTML для рендера HTML от CKEditor */}
              {localizedDescription ? (
                <div 
                  className="text-lg leading-relaxed text-white/70"
                  dangerouslySetInnerHTML={{ __html: localizedDescription }}
                />
              ) : (
                <div className="text-lg leading-relaxed text-white/70">
                  {t("noDescription")}
                </div>
              )}
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА (Мета-данные) */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              
              {/* Категории (теперь массив) */}
              {game.categories && game.categories.length > 0 && (
                <div className="mb-8">
                  <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("categories")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {game.categories.map(category => (
                      <div key={category.id} className="inline-block rounded-full border border-accent/30 px-4 py-2 text-sm font-bold text-accent">
                        {locale === 'ru' ? (category.name_ru || category.name) : (category.name_en || category.name)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Теги / Механики */}
              {game.tags && game.tags.length > 0 && (
                <div className="mb-8">
                  <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("mechanics")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {game.tags.map(tag => (
                      <span key={tag.id} className="rounded-md bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60">
                        {locale === 'ru' ? (tag.name_ru || tag.name) : (tag.name_en || tag.name)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Дополнения */}
              {game.expansions && game.expansions.length > 0 && (
                <div className="mb-8">
                  <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("expansions")}</h4>
                  <div className="space-y-3">
                    {game.expansions.map(exp => (
                      <div key={exp.id} className="rounded-lg bg-black/30 p-3 border border-white/5">
                        <p className="text-sm font-bold text-white">
                          {locale === 'ru' ? (exp.title_ru || exp.title) : (exp.title_en || exp.title)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Кнопка Booking */}
              <Link href="/#booking" className="mt-10 block w-full rounded-lg bg-accent py-4 text-center font-serif font-bold uppercase tracking-widest text-black transition-transform hover:scale-105 hover:bg-white">
                {t("bookButton")}
              </Link>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
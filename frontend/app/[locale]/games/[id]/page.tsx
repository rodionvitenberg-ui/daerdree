import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardGame } from "@/types/game";
import { getImageUrl } from "@/lib/utils";
import { API_ENDPOINTS } from "@/lib/constants";
import { getTranslations, getLocale } from "next-intl/server"; 

import ExpansionAccordion from "@/components/ExpansionAccordion"; 

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

  const localizedTitle = locale === 'ru' ? (game.title_ru || game.title) : (game.title_en || game.title);
  const localizedDescription = locale === 'ru' ? (game.description_ru || game.description) : (game.description_en || game.description);

  const heroImage = game.setup_image || game.image;

  return (
    <main className="min-h-screen bg-background">
      {/* 1. HERO ИГРЫ */}
      <div className="relative h-[45vh] md:h-[50vh] w-full">
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
        {/* Подняли заголовок: сменили bottom-0 на bottom-2 (примерно +8px вверх) */}
        <div className="absolute bottom-2 left-0 w-full px-6 lg:px-12 pb-6 lg:pb-10">
          <div className="container mx-auto">
            <h1 className="font-serif text-4xl font-black uppercase tracking-widest text-white md:text-6xl lg:text-7xl">
              {localizedTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* 2. КОНТЕНТНАЯ ЧАСТЬ */}
      {/* Подняли весь блок: pt-8 -> pt-5 (на мобилке) и lg:pt-12 -> lg:pt-9 (на десктопе) */}
      <div className="container mx-auto px-4 pt-5 pb-10 lg:pt-9 lg:pb-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          
          {/* ЛЕВАЯ КОЛОНКА */}
          <div className="lg:col-span-8">
            {/* Краткие метки - mb-8 -> mb-7 */}
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Players */}
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-accent">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-white/40">{t("players")}</span>
                  <span className="text-base font-bold text-white">
                    {t("playersRange", { min: game.min_players, max: game.max_players })}
                  </span>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-accent">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-white/40">{t("playTime")}</span>
                  <span className="text-base font-bold text-white">{t("minutes", { time: game.play_time })}</span>
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-accent">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-white/40">{t("difficulty")}</span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div key={lvl} className={`h-1.5 w-3.5 rounded-sm ${lvl <= game.difficulty ? 'bg-accent' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Описание - mb-10 -> mb-8 */}
            <div className="prose prose-invert max-w-none mb-8">
              <h2 className="mb-3 font-serif text-2xl font-bold uppercase tracking-widest text-accent">
                {t("description")}
              </h2>
              {localizedDescription ? (
                <div 
                  className="text-base leading-relaxed text-white/70"
                  dangerouslySetInnerHTML={{ __html: localizedDescription }}
                />
              ) : (
                <div className="text-base leading-relaxed text-white/70">
                  {t("noDescription")}
                </div>
              )}
            </div>

            {/* ДОПОЛНЕНИЯ */}
            {game.expansions && game.expansions.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-4 font-serif text-2xl font-bold uppercase tracking-widest text-accent">
                  {t("expansions")}
                </h2>
                <div className="flex flex-col gap-3">
                  {game.expansions.map(exp => {
                    const expTitle = locale === 'ru' ? (exp.title_ru || exp.title) : (exp.title_en || exp.title);
                    const expDesc = locale === 'ru' ? (exp.description_ru || exp.description) : (exp.description_en || exp.description);
                    
                    return (
                      <ExpansionAccordion 
                        key={exp.id} 
                        title={expTitle} 
                        description={expDesc} 
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ПРАВАЯ КОЛОНКА */}
          <div className="lg:col-span-4">
            {/* sticky top-20 -> top-16 (подняли плашку выше при скролле) */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sticky top-16">
              
              {/* Категории - mb-6 -> mb-5 */}
              {game.categories && game.categories.length > 0 && (
                <div className="mb-5">
                  <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("categories")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {game.categories.map(category => (
                      <div key={category.id} className="inline-block rounded-full border border-accent/30 px-3 py-1.5 text-xs font-bold text-accent">
                        {locale === 'ru' ? (category.name_ru || category.name) : (category.name_en || category.name)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Теги / Механики - mb-6 -> mb-5 */}
              {game.tags && game.tags.length > 0 && (
                <div className="mb-5">
                  <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("mechanics")}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {game.tags.map(tag => (
                      <span key={tag.id} className="rounded-md bg-white/5 px-2.5 py-1 text-xs font-medium text-white/60">
                        {locale === 'ru' ? (tag.name_ru || tag.name) : (tag.name_en || tag.name)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <Link href="/#booking" className="mt-4 block w-full rounded-lg bg-accent py-3 text-center font-serif text-sm font-bold uppercase tracking-widest text-black transition-transform hover:scale-105 hover:bg-white">
                {t("bookButton")}
              </Link>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
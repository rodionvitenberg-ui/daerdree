"use client";

import Image from "@/components/AppImage";
import Link from "next/link";
import { BoardGame } from "@/types/game";
import { getImageUrl } from "@/lib/utils";
import ExpansionAccordion from "@/components/ExpansionAccordion";
import GameJsonLd from "@/components/GameJsonLd";
import { useLocale, useTranslations } from "next-intl";

interface Props {
  game: BoardGame;
}

export default function GameDetailsClient({ game }: Props) {
  const locale = useLocale();
  const t = useTranslations("GameDetails");

  const localizedTitle = locale === 'ru' ? (game.title_ru || game.title) : (game.title_en || game.title);
  const localizedDescription = locale === 'ru' ? (game.description_ru || game.description) : (game.description_en || game.description);
  const heroImage = game.setup_image || game.image;

  return (
    <div className="min-h-dvh bg-background">
      <GameJsonLd game={game} locale={locale} baseUrl={process.env.NEXT_PUBLIC_SITE_URL || 'https://daerdree.bar'} />

      {/* 1. HERO (ФОН) */}
      <div className="relative h-[45dvh] md:h-[50dvh] w-full overflow-hidden z-0">
        {heroImage && (
          <Image
            src={getImageUrl(heroImage)}
            alt={localizedTitle}
            fill
            className="object-cover opacity-50"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="absolute bottom-[74px] lg:bottom-[106px] left-0 w-full">
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-4xl font-black uppercase tracking-widest text-white md:text-6xl lg:text-7xl drop-shadow-2xl">
              {localizedTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* 2. КОНТЕНТНАЯ ЧАСТЬ */}
      <div className="container mx-auto px-4 -mt-16 lg:-mt-24 pb-20 relative z-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">

          {/* ЛЕВАЯ КОЛОНКА */}
          <div className="lg:col-span-8">

            {/* ИНФО-БАР */}
            <div className="mb-2.5 grid grid-cols-1 gap-6 sm:grid-cols-3">

              <div className="flex items-start gap-4">
                <div className="mt-[3px] flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-accent shadow-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-white/40 leading-none">{t("players")}</span>
                  <div className="mt-1 flex h-5 items-center">
                    <span className="text-sm font-bold text-white leading-none tabular-nums">{t("playersRange", { min: game.min_players, max: game.max_players })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-[3px] flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-accent shadow-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-white/40 leading-none">{t("playTime")}</span>
                  <div className="mt-1 flex h-5 items-center">
                    <span className="text-sm font-bold text-white leading-none tabular-nums">{t("minutes", { time: game.play_time })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-[3px] flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-accent shadow-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-white/40 leading-none">{t("difficulty")}</span>
                  <div className="mt-1 flex h-5 items-center gap-1">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div key={lvl} className={`h-1.5 w-3.5 rounded-sm ${lvl <= game.difficulty ? 'bg-accent' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* ОПИСАНИЕ */}
            <div className="prose prose-invert max-w-none mb-10">
              <h2 className="mb-2.5 font-serif text-2xl font-bold uppercase tracking-widest text-accent">
                {t("description")}
              </h2>
              {localizedDescription ? (
                <div
                  className="text-base leading-relaxed text-white/80"
                  dangerouslySetInnerHTML={{ __html: localizedDescription }}
                />
              ) : (
                <p className="text-base text-white/50">{t("noDescription")}</p>
              )}
            </div>

            {/* ДОПОЛНЕНИЯ */}
            {game.expansions && game.expansions.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-2.5 font-serif text-2xl font-bold uppercase tracking-widest text-accent">
                  {t("expansions")}
                </h2>
                <div className="flex flex-col gap-3">
                  {game.expansions.map(exp => (
                    <ExpansionAccordion
                      key={exp.id}
                      title={locale === 'ru' ? (exp.title_ru || exp.title) : (exp.title_en || exp.title)}
                      description={locale === 'ru' ? (exp.description_ru || exp.description) : (exp.description_en || exp.description)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ПРАВАЯ КОЛОНКА (САЙДБАР) */}
          <div className="lg:col-span-4">
            <div className="relative sticky top-12">

              <div className="absolute -inset-4 lg:-inset-6 -top-8 -z-10 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl pointer-events-none" />

              {/* КАТЕГОРИИ */}
              {game.categories && game.categories.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 leading-none">
                    {t("categories")}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {game.categories.map(category => (
                      <div key={category.id} className="inline-block rounded-full border border-accent/30 px-3 py-1.5 text-xs font-bold text-accent bg-black/20">
                        {locale === 'ru' ? (category.name_ru || category.name) : (category.name_en || category.name)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* МЕХАНИКИ */}
              {game.tags && game.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 leading-none">
                    {t("mechanics")}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {game.tags.map(tag => (
                      <span key={tag.id} className="rounded-md bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80">
                        {locale === 'ru' ? (tag.name_ru || tag.name) : (tag.name_en || tag.name)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link href="/#booking" className="btn btn-primary mt-4 w-full">
                {t("bookButton")}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
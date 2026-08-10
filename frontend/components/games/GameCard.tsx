"use client";

import Image from "@/components/AppImage";
import Link from "next/link";
import { BoardGame } from "@/types/game";
import { getImageUrl } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

interface GameCardProps {
  game: BoardGame;
  contentLocale?: string; // Пропс для управления языком данных внутри карточки
}

export default function GameCard({ game, contentLocale }: GameCardProps) {
  const t = useTranslations("GameCard");
  const siteLocale = useLocale();
  
  // Определяем, какой язык использовать для данных (приоритет у переключателя контента)
  const activeLocale = contentLocale || siteLocale;

  // Локализация названия игры
  const localizedTitle = activeLocale === 'ru' 
    ? (game.title_ru || game.title) 
    : (game.title_en || game.title);

  // Хелпер для сложности
  const getDifficultyLabel = (level: number) => {
    const map = { 
      1: t("diffEasy"), 
      2: t("diffLight"), 
      3: t("diffMedium"), 
      4: t("diffHard"), 
      5: t("diffExpert") 
    };
    return map[level as keyof typeof map] || t("diffMedium");
  };

  return (
    <Link href={`/games/${game.id}`} className="group relative block h-full">
      <div className="img-card relative h-[400px] w-full rounded-xl bg-neutral-900">
        
        {/* КАРТИНКА */}
        <div className="absolute inset-0 h-full w-full">
          {game.image ? (
            <Image
              src={getImageUrl(game.image)}
              alt={localizedTitle}
              fill
              className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-800">
               <span className="text-white/10 font-serif uppercase tracking-tighter">No Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>

        {/* КОНТЕНТ */}
        <div className="absolute inset-x-0 bottom-0 p-6">
          <h3 className="mb-4 font-serif text-2xl font-bold leading-tight text-white transition-colors group-hover:text-accent">
            {localizedTitle}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-white/70">
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="tabular-nums">{t("playersRange", { min: game.min_players, max: game.max_players })}</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="tabular-nums">{t("minutes", { time: game.play_time })}</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>{getDifficultyLabel(game.difficulty)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
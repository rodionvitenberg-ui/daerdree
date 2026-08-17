"use client";

import { API_ENDPOINTS } from '@/lib/constants';
import { getImageUrl } from '@/lib/utils';
import Image from '@/components/AppImage';
import Link from 'next/link';
import AnimatedContent from '@/components/AnimatedContent'; 
import GameImagePlaceholder from '@/components/games/GameImagePlaceholder';
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { useTranslations, useLocale } from "next-intl";

interface GameMarqueeItem {
  id: number;
  title: string;
  title_ru?: string;
  title_en?: string;
  image: string;
  slug: string;
}

export default function GamesMarquee() {
  const t = useTranslations("GamesMarquee");
  const locale = useLocale();

  const { data: games, error, isLoading } = useSWR<GameMarqueeItem[]>(
    `${API_ENDPOINTS.MARQUEE}?lang=${locale}`,
    fetcher,
    {
      dedupingInterval: 300_000, // 5 min cache
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  if (!isLoading && games?.length === 0) return null;

  const safeGames = games || [];
  const duplicatedGames = [...safeGames, ...safeGames];

  return (
    <section className="relative w-full overflow-hidden bg-background py-20 lg:py-15">
      
      {/* ЗАГОЛОВОК И ПОДЗАГОЛОВОК */}
      <div className="relative z-20 mb-12 px-4 text-center">
        <AnimatedContent
          distance={150}
          direction="vertical"
          reverse={false}
          duration={0.9}
          ease="ease.out"
          initialOpacity={0.2}
          animateOpacity
          scale={1.1}
          threshold={0.01}
          delay={0.1}
        >
          <h2 className="font-serif text-3xl font-black uppercase tracking-widest text-foreground md:text-5xl drop-shadow-2xl">
            {t("title")}
          </h2>
        </AnimatedContent>

        <AnimatedContent
          distance={200}
          direction="vertical"
          reverse={false}
          duration={0.9}
          ease="ease.out"
          initialOpacity={0.2}
          animateOpacity
          scale={1.1}
          threshold={0.01}
          delay={0.1}
        >
          <p className="mt-4 font-sans text-gray-400 drop-shadow-lg">
            {t("subtitle")}
          </p>
        </AnimatedContent>
      </div>

      <div className="relative flex flex-col gap-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent md:w-40" />

        {/* --- РЯД 1 --- */}
        <div className="w-full overflow-hidden"> 
          <div className="animate-scroll-left flex gap-6 px-3 w-max">
            {duplicatedGames.map((game, index) => {
              const localizedTitle = locale === 'ru' ? (game.title_ru || game.title) : (game.title_en || game.title);

              return (
                <Link 
                  key={`row1-${game.id}-${index}`}
                  href={`/games/${game.id}`}
                  className="group relative block h-40 w-32 flex-shrink-0 overflow-hidden border border-white/10 img-card md:h-60 md:w-48"
                >
                  {game.image ? (
                    <Image
                      src={getImageUrl(game.image)}
                      alt={localizedTitle}
                      fill
                      className="object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                      sizes="(max-width: 768px) 130px, 200px"
                      loading="lazy"
                    />
                  ) : (
                    <GameImagePlaceholder iconSize={48} />
                  )}
                  <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:opacity-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* --- РЯД 2 --- */}
        <div className="w-full overflow-hidden">
          <div className="animate-scroll-right flex gap-6 px-3 w-max">
             {duplicatedGames.map((game, index) => {
              const localizedTitle = locale === 'ru' ? (game.title_ru || game.title) : (game.title_en || game.title);

              return (
                <Link 
                  key={`row2-${game.id}-${index}`}
                  href={`/games/${game.id}`} 
                  className="group relative block h-40 w-32 flex-shrink-0 overflow-hidden border border-white/10 img-card md:h-60 md:w-48"
                >
                  {game.image ? (
                    <Image
                      src={getImageUrl(game.image)}
                      alt={localizedTitle}
                      fill
                      className="object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                      sizes="(max-width: 768px) 130px, 200px"
                      loading="lazy"
                    />
                  ) : (
                    <GameImagePlaceholder iconSize={48} />
                  )}
                  <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:opacity-0" />
                </Link>
              );
            })}
          </div>
        </div>

      </div>

      <div className="mt-12 flex justify-center">
         <Link href="/games" className="btn btn-primary btn-sm">
          {t("buttonText")}
         </Link>
      </div>

    </section>
  );
}
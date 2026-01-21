"use client";

import { API_ENDPOINTS } from '@/lib/constants';
import { getImageUrl } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AnimatedContent from '@/components/AnimatedContent'; 
import { GAMES_CONTENT } from '@/content/home'; 

interface GameMarqueeItem {
  id: number;
  title: string;
  image: string;
  slug: string;
}

export default function GamesMarquee() {
  const [games, setGames] = useState<GameMarqueeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.MARQUEE);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        // ВРЕМЕННЫЙ ЛОГ: Посмотрим, что приходит в консоль браузера
        console.log("Marquee Data:", data); 
        
        setGames(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (!isLoading && games.length === 0) return null;

  const duplicatedGames = [...games, ...games];

  return (
    <section className="relative w-full overflow-hidden bg-background py-20 lg:py-15">
      
      {/* ЗАГОЛОВОК И ПОДЗАГОЛОВОК */}
      <div className="relative z-20 mb-12 px-4 text-center">
        <AnimatedContent
          distance={150}
          direction="vertical"
          reverse={false}
          duration={1.5}
          ease="ease.out"
          initialOpacity={0.2}
          animateOpacity
          scale={1.1}
          threshold={0.01}
          delay={0.1}
        >
          <h2 className="font-serif text-3xl font-black uppercase tracking-widest text-foreground md:text-5xl drop-shadow-2xl">
            {GAMES_CONTENT.title}
          </h2>
        </AnimatedContent>

        <AnimatedContent
          distance={200}
          direction="vertical"
          reverse={false}
          duration={1.5}
          ease="ease.out"
          initialOpacity={0.2}
          animateOpacity
          scale={1.1}
          threshold={0.01}
          delay={0.1}
        >
          <p className="mt-4 font-sans text-gray-400 drop-shadow-lg">
            {GAMES_CONTENT.subtitle}
          </p>
        </AnimatedContent>
      </div>

      <div className="relative flex flex-col gap-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent md:w-40" />

        {/* --- РЯД 1 --- */}
        <div className="flex overflow-hidden"> 
          <div className="animate-scroll-left flex gap-6 px-3">
            {duplicatedGames.map((game, index) => (
              <Link 
                key={`row1-${game.id}-${index}`}
                href={`/games/${game.id}`}
                className="group relative block h-40 w-32 flex-shrink-0 overflow-hidden border border-white/10 transition-all duration-300 hover:border-secondary hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] md:h-60 md:w-48"
              >
                {/* ИСПРАВЛЕНИЕ: Проверяем, есть ли картинка, как в GameCard */}
                {game.image ? (
                  <Image
                    src={getImageUrl(game.image)}
                    alt={game.title}
                    fill
                    className="object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                    sizes="(max-width: 768px) 130px, 200px"
                  />
                ) : (
                   /* Заглушка, если картинки нет */
                   <div className="flex h-full w-full items-center justify-center bg-white/5">
                     <span className="text-xs text-white/20">No Image</span>
                   </div>
                )}
                <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:opacity-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* --- РЯД 2 --- */}
        <div className="flex overflow-hidden">
          <div className="animate-scroll-right flex gap-6 px-3">
             {duplicatedGames.map((game, index) => (
              <Link 
                key={`row2-${game.id}-${index}`}
                href={`/games/${game.id}`} 
                className="group relative block h-40 w-32 flex-shrink-0 overflow-hidden border border-white/10 transition-all duration-300 hover:border-secondary hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] md:h-60 md:w-48"
              >
                {/* ИСПРАВЛЕНИЕ: То же самое для второго ряда */}
                {game.image ? (
                  <Image
                    src={getImageUrl(game.image)}
                    alt={game.title}
                    fill
                    className="object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                    sizes="(max-width: 768px) 130px, 200px"
                  />
                ) : (
                   <div className="flex h-full w-full items-center justify-center bg-white/5">
                     <span className="text-xs text-white/20">No Image</span>
                   </div>
                )}
                <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:opacity-0" />
              </Link>
            ))}
          </div>
        </div>

      </div>

      <div className="mt-12 flex justify-center">
         <Link href="/library">
          <button className="group relative overflow-hidden px-10 py-4 md:px-8 md:py-3 border border-accent transition-all duration-300">
           <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-600 to-accent-600 opacity-0 transition-opacity duration-500 group-hover:opacity-80 border border-accent/50 " />
            <div className="absolute inset-0 bg-accent transition-opacity duration-500 group-hover:opacity-0" />
            <span className="relative z-10 font-serif font-bold uppercase tracking-[0.2em] text-[#F7F0EA]">
             {GAMES_CONTENT.buttonText}
            </span>
          </button>
         </Link>
      </div>

    </section>
  );
}
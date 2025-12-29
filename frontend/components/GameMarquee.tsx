"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// Импортируем компонент анимации (проверь путь, если он лежит в другой папке)
import AnimatedContent from '@/components/AnimatedContent'; 
// Импортируем тексты
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
        const res = await fetch('http://localhost:8000/api/games/marquee/');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setGames(data);
      } catch (error) {
        console.error("Ошибка загрузки Marquee:", error);
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
      
      {/* ЗАГОЛОВОК И ПОДЗАГОЛОВОК С АНИМАЦИЕЙ */}
      <div className="relative z-20 mb-12 px-4 text-center">
        
        {/* Анимация заголовка */}
        <AnimatedContent
          distance={150}
          direction="vertical"
          reverse={false}
          duration={1.5}
          ease="ease.out"
          initialOpacity={0.2}
          animateOpacity
          scale={1.1}
          threshold={0.0}
          delay={0.1}
        >
          <h2 className="font-serif text-3xl font-black uppercase tracking-widest text-foreground md:text-5xl drop-shadow-2xl">
            {GAMES_CONTENT.title}
          </h2>
        </AnimatedContent>

        {/* Анимация подзаголовка */}
        <AnimatedContent
          distance={200}
          direction="vertical"
          reverse={false}
          duration={1.5}
          ease="ease.out"
          initialOpacity={0.0}
          animateOpacity
          scale={1.1}
          threshold={0.0}
          delay={0.3}
        >
          <p className="mt-4 font-sans text-gray-400 drop-shadow-lg">
            {GAMES_CONTENT.subtitle}
          </p>
        </AnimatedContent>
      </div>

      <div className="relative flex flex-col gap-8">
        {/* Виньетка (затемнение по краям) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent md:w-40" />

        {/* --- РЯД 1 --- */}
        <div className="group flex overflow-hidden">
          <div className="animate-scroll-left flex gap-6 px-3">
            {duplicatedGames.map((game, index) => (
              <Link 
                key={`row1-${game.id}-${index}`}
                href={`/games/${game.slug}`} 
                // Убрали grayscale. Добавили hover:border-accent и hover:shadow
                className="relative block h-40 w-32 flex-shrink-0 overflow-hidden border border-white/10 transition-all duration-300 hover:border-accent hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] md:h-60 md:w-48"
              >
                <Image
                  src={game.image.startsWith('http') ? game.image : `http://localhost:8000${game.image}`}
                  alt={game.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </Link>
            ))}
          </div>
        </div>

        {/* --- РЯД 2 --- */}
        <div className="group flex overflow-hidden">
          <div className="animate-scroll-right flex gap-6 px-3">
             {duplicatedGames.map((game, index) => (
              <Link 
                key={`row2-${game.id}-${index}`}
                href={`/games/${game.slug}`} 
                className="relative block h-40 w-32 flex-shrink-0 overflow-hidden border border-white/10 transition-all duration-300 hover:border-accent hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] md:h-60 md:w-48"
              >
                <Image
                  src={game.image.startsWith('http') ? game.image : `http://localhost:8000${game.image}`}
                  alt={game.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* КНОПКА View Full List */}
      <div className="mt-12 flex justify-center">
         <Link href="/library">
             <button className="border-b border-secondary pb-1 font-serif text-sm font-bold uppercase tracking-widest text-secondary transition-colors hover:text-accent hover:border-accent">
                {GAMES_CONTENT.buttonText}
             </button>
         </Link>
      </div>

    </section>
  );
}
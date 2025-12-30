"use client";

import Image from "next/image";
import Link from "next/link";
import { BoardGame } from "@/types/game";
import { getImageUrl } from "@/lib/utils";

interface GameCardProps {
  game: BoardGame;
}

export default function GameCard({ game }: GameCardProps) {
  // Хелпер для сложности
  const getDifficultyLabel = (level: number) => {
    const map = { 1: "Easy", 2: "Light", 3: "Medium", 4: "Hard", 5: "Expert" };
    return map[level as keyof typeof map] || "Medium";
  };

  return (
    <Link href={`/games/${game.id}`} className="group relative block h-full">
      <div className="relative h-[400px] w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-900 transition-all duration-300 group-hover:border-accent/50 group-hover:shadow-[0_0_30px_rgba(235,188,80,0.15)]">
        
        {/* КАРТИНКА */}
        <div className="absolute inset-0 h-full w-full">
          {game.image ? (
            <Image
              src={getImageUrl(game.image)}
              alt={game.title}
              fill
              className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
              unoptimized
            />
          ) : (
            // Заглушка, если картинки нет
            <div className="flex h-full w-full items-center justify-center bg-neutral-800">
              <span className="text-white/20">No Image</span>
            </div>
          )}
          {/* Градиент снизу, чтобы текст читался */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* ИНФО (Поверх картинки) */}
        <div className="absolute bottom-0 left-0 w-full p-6">
          
          {/* Категория */}
          {game.category && (
            <span className="mb-2 inline-block rounded-full bg-accent/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent backdrop-blur-md">
              {game.category.name}
            </span>
          )}

          <h3 className="mb-4 font-serif text-2xl font-bold leading-tight text-white group-hover:text-accent transition-colors">
            {game.title}
          </h3>

          {/* Иконки статов */}
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-white/70">
            
            {/* Игроки */}
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{game.min_players}-{game.max_players}</span>
            </div>

            {/* Время */}
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{game.play_time}m</span>
            </div>

            {/* Сложность */}
            <div className="flex items-center gap-1">
               <span className={`h-2 w-2 rounded-full ${game.difficulty >= 4 ? 'bg-red-500' : game.difficulty >= 3 ? 'bg-yellow-500' : 'bg-green-500'}`} />
               <span>{getDifficultyLabel(game.difficulty)}</span>
            </div>

          </div>
        </div>
      </div>
    </Link>
  );
}
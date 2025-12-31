import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardGame } from "@/types/game";
import { getImageUrl } from "@/lib/utils";
import { API_ENDPOINTS } from "@/lib/constants";

async function getGame(id: string): Promise<BoardGame> {
  const res = await fetch(`${API_ENDPOINTS.GAMES}${id}/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return notFound();
  }

  return res.json();
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; //
  const game = await getGame(id);

  return (
    <main className="min-h-screen bg-background">
      
      {/* 1. HERO ИГРЫ (Фон) */}
      <div className="relative h-[60vh] w-full">
        {game.image && (
          <Image
            src={getImageUrl(game.image)}
            alt={game.title}
            fill
            className="object-cover opacity-50"
            priority
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="container mx-auto">
             {/* Хлебные крошки */}
             <Link href="/games" className="mb-4 inline-block text-xs font-bold uppercase tracking-widest text-accent hover:text-white transition-colors">
                &larr; Back to Library
             </Link>

             <h1 className="font-serif text-5xl font-black uppercase tracking-widest text-white drop-shadow-2xl md:text-7xl">
               {game.title}
             </h1>
          </div>
        </div>
      </div>

      {/* 2. КОНТЕНТ */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
          
          {/* Левая колонка: Описание и Теги */}
          <div>
            <h2 className="mb-6 font-serif text-2xl font-bold uppercase tracking-wider text-white">
              About the Game
            </h2>
            <div className="prose prose-invert max-w-none text-lg text-gray-300 leading-relaxed whitespace-pre-line">
              {game.description}
            </div>

            {/* Теги */}
            {game.tags && game.tags.length > 0 && (
              <div className="mt-12">
                <h3 className="mb-4 font-serif text-sm font-bold uppercase tracking-widest text-white/50">
                  Mechanics & Tags
                </h3>
                <div className="flex flex-wrap gap-3">
                  {game.tags.map(tag => (
                    <span key={tag.id} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:border-accent hover:text-accent">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка: Характеристики (Сайдбар) */}
          <div className="h-fit rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-2xl">
             <div className="mb-8 border-b border-white/10 pb-4">
                <span className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Category</span>
                <span className="font-serif text-xl font-bold text-accent">
                  {game.category?.name || "Uncategorized"}
                </span>
             </div>

             <div className="space-y-6">
                
                {/* Players */}
                <div className="flex items-center gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-accent">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                   </div>
                   <div>
                      <span className="block text-xs font-bold uppercase tracking-widest text-white/40">Players</span>
                      <span className="text-lg font-bold text-white">{game.min_players} - {game.max_players}</span>
                   </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-accent">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <div>
                      <span className="block text-xs font-bold uppercase tracking-widest text-white/40">Play Time</span>
                      <span className="text-lg font-bold text-white">~ {game.play_time} min</span>
                   </div>
                </div>

                {/* Difficulty */}
                <div className="flex items-center gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-accent">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <div>
                      <span className="block text-xs font-bold uppercase tracking-widest text-white/40">Difficulty</span>
                      <div className="flex gap-1 mt-1">
                        {/* Рисуем 5 точек сложности */}
                        {[1, 2, 3, 4, 5].map(lvl => (
                           <div key={lvl} className={`h-2 w-4 rounded-sm ${lvl <= game.difficulty ? 'bg-accent' : 'bg-white/10'}`} />
                        ))}
                      </div>
                   </div>
                </div>

             </div>
             
             {/* Кнопка Booking (ведет на форму на главной) */}
             <Link href="/#booking" className="mt-10 block w-full rounded-lg bg-accent py-4 text-center font-serif font-bold uppercase tracking-widest text-black transition-transform hover:scale-105 hover:bg-white">
                Book a Table
             </Link>

          </div>

        </div>
      </div>

    </main>
  );
}
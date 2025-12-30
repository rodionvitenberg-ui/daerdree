"use client";

import { useState, useEffect } from "react";
import GameCard from "@/components/games/GameCard";
import { BoardGame } from "@/types/game";
import AnimatedContent from "@/components/AnimatedContent";

// Лучше вынести в .env, но пока оставим тут для простоты
const API_URL = "http://127.0.0.1:8000/api/games/";

export default function GamesLibrary() {
  const [games, setGames] = useState<BoardGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Функция загрузки игр
  const fetchGames = async (search = "") => {
    setLoading(true);
    try {
      // Твой ViewSet поддерживает ?search=... благодаря SearchFilter
      const res = await fetch(`${API_URL}?search=${search}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setGames(data); // Если у тебя пагинация, то data.results
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем при старте и при изменении поиска (с задержкой/debounce можно, но пока просто так)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGames(searchTerm);
    }, 500); // Ждем 500мс после ввода, чтобы не долбить API каждой буквой

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4">
        
        {/* ЗАГОЛОВОК И ПОИСК */}
        <div className="mb-16 flex flex-col items-center justify-between gap-8 md:flex-row">
          <AnimatedContent distance={20} direction="horizontal">
            <h1 className="font-serif text-4xl font-black uppercase tracking-widest text-white md:text-6xl">
              The Library
            </h1>
            <p className="mt-2 text-white/50">
              Explore our collection of legendary games
            </p>
          </AnimatedContent>

          {/* Поиск */}
          <AnimatedContent distance={20} direction="horizontal" delay={0.1}>
            <div className="relative w-full md:w-[300px]">
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-b border-white/20 bg-transparent py-2 pl-2 pr-10 text-white outline-none transition-colors focus:border-accent placeholder:text-white/20"
              />
              <svg className="absolute right-2 top-2 h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </AnimatedContent>
        </div>

        {/* СЕТКА ИГР */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-accent font-serif tracking-widest animate-pulse">
            LOADING SCROLLS...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((game, index) => (
              <AnimatedContent key={game.id} delay={index * 0.05} distance={20} direction="vertical">
                <GameCard game={game} />
              </AnimatedContent>
            ))}
          </div>
        )}

        {!loading && games.length === 0 && (
          <div className="text-center text-white/40 py-20">
            No games found matching your request.
          </div>
        )}

      </div>
    </main>
  );
}
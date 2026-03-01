"use client";

import { useState, useEffect } from "react";
import GameCard from "@/components/games/GameCard";
import { BoardGame } from "@/types/game";
import AnimatedContent from "@/components/AnimatedContent";
import { API_ENDPOINTS } from "@/lib/constants"; // <--- Возвращаем импорт констант
import { motion, AnimatePresence } from "framer-motion";

// Интерфейс для категории
interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function GamesLibrary() {
  const [games, setGames] = useState<BoardGame[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Основной поиск
  const [searchTerm, setSearchTerm] = useState("");

  // Состояние фильтров
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    players: "",
    time: "",
    difficulty: "",
    category: "",
  });

  // Загрузка категорий при старте
  // Используем API_ENDPOINTS.GAMES как базу, чтобы найти корень API, или хардкодим/добавляем в константы CATEGORIES
  // Для надежности предположим, что категории лежат рядом: /api/categories/
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Пытаемся вычислить базовый URL из константы GAMES, отрезая хвост, или используем относительный путь
        // Но лучше всего добавить CATEGORIES в constants.ts. Пока сделаем универсально:
        const baseUrl = API_ENDPOINTS.GAMES.replace(/\/games\/?$/, ''); 
        const res = await fetch(`${baseUrl}/categories/`);
        
        if (res.ok) {
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : data.results || []);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    fetchCategories();
  }, []);

  // Функция загрузки игр с учетом всех фильтров
  const fetchGames = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchTerm) params.append("search", searchTerm);
      if (filters.players) params.append("players_count", filters.players);
      if (filters.time) params.append("max_time", filters.time);
      if (filters.category) params.append("category", filters.category);
      
      if (filters.difficulty) {
        params.append("min_difficulty", filters.difficulty);
        params.append("max_difficulty", filters.difficulty);
      }

      // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
      // Используем константу. Добавляем слеш перед ?, если его нет, так как DRF любит слеши.
      const endpoint = API_ENDPOINTS.GAMES.endsWith('/') ? API_ENDPOINTS.GAMES : `${API_ENDPOINTS.GAMES}/`;
      const url = `${endpoint}?${params.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      
      const data = await res.json();
      setGames(data.results || data);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Дебаунс для поиска и авто-обновление при смене фильтров
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGames();
    }, 500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters]); 

  // Сброс фильтров
  const clearFilters = () => {
    setFilters({
      players: "",
      time: "",
      difficulty: "",
      category: "",
    });
    setSearchTerm("");
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== "") || searchTerm !== "";

  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4">
        
        {/* HEADER & SEARCH SECTION */}
        <div className="mb-12 flex flex-col items-center">
          <AnimatedContent delay={0.1} direction="vertical">
            <h1 className="mb-8 text-center font-serif text-5xl font-black uppercase tracking-widest text-accent md:text-7xl">
              Наша библиотека
            </h1>
          </AnimatedContent>

          <AnimatedContent delay={0.2} direction="vertical" className="w-full max-w-2xl">
            {/* SEARCH BAR */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Найти игру по названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-b border-white/20 bg-transparent py-3 pl-4 pr-12 text-lg text-white outline-none transition-colors focus:border-accent placeholder:text-white/20 font-serif"
              />
              <svg className="absolute right-2 top-3 h-6 w-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* FILTER TOGGLE BUTTON */}
            <div className="flex justify-between items-center px-2">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${showFilters ? 'text-accent' : 'text-white/50 hover:text-white'}`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    {showFilters ? 'Спрятать фильтры' : 'Фильтры'}
                </button>

                {hasActiveFilters && (
                    <button 
                        onClick={clearFilters}
                        className="text-xs font-bold uppercase tracking-widest text-red-400/70 hover:text-red-400 transition-colors"
                    >
                        Сбросить фильтры
                    </button>
                )}
            </div>

            {/* FILTER PANEL */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 bg-white/5 mt-4 px-6 rounded-sm border border-white/10">
                            
                            {/* 1. Players */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Players</label>
                                <input 
                                    type="number" 
                                    min="1" max="20"
                                    placeholder="Any"
                                    value={filters.players}
                                    onChange={(e) => setFilters({...filters, players: e.target.value})}
                                    className="bg-black/50 border border-white/10 p-2 text-sm text-white focus:border-accent outline-none rounded-sm"
                                />
                            </div>

                            {/* 2. Time */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Max Time (min)</label>
                                <select 
                                    value={filters.time}
                                    onChange={(e) => setFilters({...filters, time: e.target.value})}
                                    className="bg-black/50 border border-white/10 p-2 text-sm text-white focus:border-accent outline-none rounded-sm appearance-none"
                                >
                                    <option value="">Any Time</option>
                                    <option value="30">Up to 30m</option>
                                    <option value="60">Up to 1h</option>
                                    <option value="90">Up to 1.5h</option>
                                    <option value="120">Up to 2h</option>
                                    <option value="180">Long (3h+)</option>
                                </select>
                            </div>

                            {/* 3. Difficulty */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Difficulty</label>
                                <select 
                                    value={filters.difficulty}
                                    onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                                    className="bg-black/50 border border-white/10 p-2 text-sm text-white focus:border-accent outline-none rounded-sm appearance-none"
                                >
                                    <option value="">Any</option>
                                    <option value="1">🟢 Very Easy</option>
                                    <option value="2">🟢 Easy</option>
                                    <option value="3">🟡 Medium</option>
                                    <option value="4">🔴 Hard</option>
                                    <option value="5">💀 Hardcore</option>
                                </select>
                            </div>

                            {/* 4. Category */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Category</label>
                                <select 
                                    value={filters.category}
                                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                                    className="bg-black/50 border border-white/10 p-2 text-sm text-white focus:border-accent outline-none rounded-sm appearance-none"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

          </AnimatedContent>
        </div>

        {/* СЕТКА ИГР */}
        {loading ? (
          <div className="flex h-64 items-center justify-center flex-col gap-4">
             <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
             <span className="text-accent font-serif tracking-widest text-xs animate-pulse">SUMMONING GAMES...</span>
          </div>
        ) : games.length === 0 ? (
           <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
             <p className="font-serif text-2xl text-white/40 mb-2">No Tomes Found</p>
             <p className="text-white/20 text-sm">Try adjusting your filters or search criteria.</p>
             <button onClick={clearFilters} className="mt-4 text-accent text-xs font-bold uppercase tracking-widest hover:underline">Clear Filters</button>
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
      </div>
    </main>
  );
}
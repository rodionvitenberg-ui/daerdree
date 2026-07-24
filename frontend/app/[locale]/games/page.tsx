"use client";

import { useState, useEffect, useMemo } from "react";
import GameCard from "@/components/games/GameCard";
import { BoardGame, Category } from "@/types/game";
import api, { setApiLanguage } from "@/lib/api";
import AnimatedContent from "@/components/AnimatedContent";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { useTranslations, useLocale } from "next-intl";
import GamesSeoContent from "./seo-content";

export default function GamesLibrary() {
  const t = useTranslations("GamesLibrary");
  const locale = useLocale();

  const [contentLanguage, setContentLanguage] = useState(locale);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    players: "",
    time: "",
    difficulty: "",
    category: "",
  });

  useEffect(() => {
    setApiLanguage(locale);
  }, [locale]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build SWR key from all filter params
  const gamesKey = useMemo(() => {
    const params = new URLSearchParams({ lang: contentLanguage });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.players) params.set("players_count", filters.players);
    if (filters.time) params.set("max_time", filters.time);
    if (filters.category) params.set("category", filters.category);
    if (filters.difficulty) {
      params.set("min_difficulty", filters.difficulty);
      params.set("max_difficulty", filters.difficulty);
    }
    return `/games/?${params.toString()}`;
  }, [contentLanguage, debouncedSearch, filters]);

  const { data: gamesData, error: gamesError, isLoading: gamesLoading } = useSWR(gamesKey, fetcher, {
    dedupingInterval: 60_000,
    keepPreviousData: true,
  });

  const games: BoardGame[] = gamesData?.results || gamesData || [];

  const { data: categoriesData } = useSWR(
    `/categories/?lang=${contentLanguage}`,
    fetcher,
    { dedupingInterval: 300_000 }
  );

  const categories: Category[] = Array.isArray(categoriesData) 
    ? categoriesData 
    : categoriesData?.results || [];

  const clearFilters = () => {
    setFilters({ players: "", time: "", difficulty: "", category: "" });
    setSearchTerm("");
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== "") || searchTerm !== "";

  return (
    <div className="min-h-dvh bg-background pt-32 pb-20">
      <div className="container mx-auto px-4">
        
        <div className="mb-12 flex flex-col items-center">
          <AnimatedContent delay={0.1} direction="vertical">
            <h1 className="mb-4 text-center font-serif text-5xl font-black uppercase tracking-widest text-accent md:text-7xl">
              {locale === "ru" ? "Настольные игры на Кипре" : "Board Games in Cyprus"}
            </h1>
          </AnimatedContent>
          <AnimatedContent delay={0.15} direction="vertical" className="mb-6 max-w-3xl text-center">
            <p className="font-sans text-foreground/60 text-sm md:text-base leading-relaxed px-4">
              {locale === "ru"
                ? "Daerdree — первый бар настольных игр в Ларнаке. Более 50 настолок на любой вкус: от классических \"Монополии\" и \"Уно\" до современных хитов — \"Колонизаторов\", \"Каркассона\" и \"Эпических схваток\". Уютный зал, крафтовые коктейли и тёплая компания каждый вечер. Приходите с друзьями — мы подберём игру под вашу компанию."
                : "Daerdree — the first board game bar in Larnaca, Cyprus. Over 50 board games for every taste: from classics like Monopoly and Uno to modern hits — Settlers of Catan, Carcassonne, and epic battles. Cozy atmosphere, craft cocktails, and great company every evening. Bring your friends — we'll pick the perfect game for your group."
              }
            </p>
          </AnimatedContent>

          <AnimatedContent delay={0.15} direction="vertical" className="mb-8">
            <div className="flex items-center gap-4 bg-white/5 p-1 rounded-full border border-white/10">
              <button 
                onClick={() => setContentLanguage('ru')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${contentLanguage === 'ru' ? 'bg-accent text-black' : 'text-white/50 hover:text-white'}`}
              >
                {t("langRu")}
              </button>
              <button 
                onClick={() => setContentLanguage('en')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${contentLanguage === 'en' ? 'bg-accent text-black' : 'text-white/50 hover:text-white'}`}
              >
                {t("langEn")}
              </button>
            </div>
          </AnimatedContent>

          <AnimatedContent delay={0.2} direction="vertical" className="w-full max-w-2xl">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-b border-white/20 bg-transparent py-3 pl-4 pr-12 text-lg text-white outline-none transition-colors focus:border-accent placeholder:text-white/20 font-serif"
              />
              <svg className="absolute right-2 top-3 h-6 w-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex justify-between items-center px-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${showFilters ? 'text-accent' : 'text-white/50 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {showFilters ? t("hideFilters") : t("showFilters")}
              </button>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="text-xs font-bold uppercase tracking-widest text-red-400/70 hover:text-red-400 transition-colors"
                >
                  {t("resetFilters")}
                </button>
              )}
            </div>

            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${showFilters ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 bg-white/5 mt-4 px-6 rounded-sm border border-white/10">
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{t("players")}</label>
                    <input 
                      type="number" min="1" max="20"
                      placeholder={t("anyPlayers")}
                      value={filters.players}
                      onChange={(e) => setFilters({...filters, players: e.target.value})}
                      className="bg-black/50 border border-white/10 p-2 text-sm text-white focus:border-accent outline-none rounded-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{t("maxTime")}</label>
                    <select 
                      value={filters.time}
                      onChange={(e) => setFilters({...filters, time: e.target.value})}
                      className="bg-black/50 border border-white/10 p-2 text-sm text-white focus:border-accent outline-none rounded-sm appearance-none"
                    >
                      <option value="">{t("anyTime")}</option>
                      <option value="30">{t("upTo30m")}</option>
                      <option value="60">{t("upTo1h")}</option>
                      <option value="90">{t("upTo15h")}</option>
                      <option value="120">{t("upTo2h")}</option>
                      <option value="180">{t("longTime")}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{t("difficulty")}</label>
                    <select 
                      value={filters.difficulty}
                      onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                      className="bg-black/50 border border-white/10 p-2 text-sm text-white focus:border-accent outline-none rounded-sm appearance-none"
                    >
                      <option value="">{t("anyDifficulty")}</option>
                      <option value="1">{t("diffVeryEasy")}</option>
                      <option value="2">{t("diffEasy")}</option>
                      <option value="3">{t("diffMedium")}</option>
                      <option value="4">{t("diffHard")}</option>
                      <option value="5">{t("diffHardcore")}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{t("category")}</label>
                    <select 
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                      className="bg-black/50 border border-white/10 p-2 text-sm text-white focus:border-accent outline-none rounded-sm appearance-none"
                    >
                      <option value="">{t("allCategories")}</option>
                      {categories.map((cat) => {
                        const localizedName = contentLanguage === 'ru' 
                          ? (cat.name_ru || cat.name) 
                          : (cat.name_en || cat.name);
                        return (
                          <option key={cat.id} value={cat.slug}>
                            {localizedName}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                </div>
              </div>
            </div>
          </AnimatedContent>
        </div>

        {gamesLoading ? (
          <div className="flex h-64 items-center justify-center flex-col gap-4">
            <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <span className="text-accent font-serif tracking-widest text-xs animate-pulse">{t("loading")}</span>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
            <p className="font-serif text-2xl text-white/40 mb-2">{t("noGamesTitle")}</p>
            <p className="text-white/20 text-sm">{t("noGamesDesc")}</p>
            <button onClick={clearFilters} className="mt-4 text-accent text-xs font-bold uppercase tracking-widest hover:underline">{t("clearFilters")}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((game, index) => (
              <AnimatedContent key={game.id} delay={index * 0.05} distance={20} direction="vertical">
                <GameCard game={game} contentLocale={contentLanguage} />
              </AnimatedContent>
            ))}
          </div>
        )}

        <GamesSeoContent />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: locale === "ru" ? "Главная" : "Home", item: `/${locale}` },
                { "@type": "ListItem", position: 2, name: locale === "ru" ? "Настольные игры" : "Board Games", item: `/${locale}/games` },
              ],
            }),
          }}
        />
        {games.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                name: locale === "ru" ? "Настольные игры в Daerdree" : "Board Games at Daerdree",
                itemListElement: games.map((game: BoardGame, i: number) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  item: {
                    "@type": "Game",
                    name: locale === "ru" ? (game.title_ru || game.title) : (game.title_en || game.title),
                    url: `/${locale}/games/${game.id}`,
                    description: locale === "ru" ? (game.description_ru || game.description).slice(0, 300) : (game.description_en || game.description).slice(0, 300),
                  },
                })),
              }),
            }}
          />
        )}
      </div>
    </div>
  );
}
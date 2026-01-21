"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedContent from "@/components/AnimatedContent";
import { HIRE_PACKAGES } from "@/content/events";

// Интерфейс события
interface Event {
  id: number;
  title: string;
  description: string;
  image: string | null;
  event_date: string;
}

export default function EventsInterface() {
  const [activeTab, setActiveTab] = useState<"public" | "private">("public");
  
  // Состояния данных
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния пагинации
  const [nextPage, setNextPage] = useState<string | null>(null); // Ссылка на след. страницу
  const [loadingMore, setLoadingMore] = useState(false); // Спиннер кнопки "Load More"
  
  const isDev = process.env.NODE_ENV === 'development';

  // 1. Первичная загрузка (при открытии или смене таба)
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true); // Сбрасываем лоадер при смене таба
      try {
        const API_BASE = isDev ? 'http://127.0.0.1:8000' : 'https://daerdree.bar';
        
        const res = await fetch(`${API_BASE}/api/events/`);
        if (!res.ok) throw new Error('Failed to fetch events');
        
        const data = await res.json();
        
        setEvents(data.results || []); 
        setNextPage(data.next); // Сохраняем ссылку на следующую страницу (или null)
      } catch (error) {
        console.error("Ошибка загрузки событий:", error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "public") {
        fetchEvents();
    }
  }, [isDev, activeTab]);

  // 2. Функция подгрузки следующих событий
  const loadMoreEvents = async () => {
    if (!nextPage) return; // Если ссылки нет, ничего не делаем

    setLoadingMore(true);
    try {
        // Django отдает полный абсолютный URL в поле next, используем его напрямую
        // Но иногда бывает проблема с http/https при проксировании.
        // Если возникнет Mixed Content Error, нужно будет принудительно менять http на https
        const res = await fetch(nextPage);
        
        if (!res.ok) throw new Error('Failed to load more');
        
        const data = await res.json();

        // Добавляем новые события к старым
        setEvents((prev) => [...prev, ...data.results]);
        // Обновляем ссылку на следующую страницу
        setNextPage(data.next);
    } catch (error) {
        console.error("Ошибка подгрузки:", error);
    } finally {
        setLoadingMore(false);
    }
  };

  // Хелпер даты
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Nicosia' };

    const day = new Intl.DateTimeFormat('en-US', { ...options, day: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat('en-US', { ...options, month: 'short' }).format(date).toUpperCase();
    const time = new Intl.DateTimeFormat('en-US', { ...options, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);

    return { day, month, time };
  };

  return (
    <div className="container mx-auto px-4 pb-20"> {/* Добавил pb-20 для отступа снизу */}

      {/* 1. ЗАГОЛОВОК И ТАБЫ */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <AnimatedContent distance={20} direction="vertical">
            <h1 className="font-serif text-5xl md:text-7xl font-black uppercase tracking-widest text-accent mb-4">
              The Gathering
            </h1>
            <p className="font-sans text-white/50 text-lg md:text-xl max-w-2xl mx-auto">
              Join our legendary public assemblies or command the hall for your own private saga.
            </p>
          </AnimatedContent>
        </div>

        <AnimatedContent distance={20} direction="vertical" delay={0.1}>
          <div className="flex justify-center">
            <div className="relative flex p-1 bg-neutral-900 border border-white/10 rounded-full">
              <button
                onClick={() => setActiveTab("public")}
                className={`relative px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-colors z-10 ${
                  activeTab === "public" ? "text-black" : "text-white/50 hover:text-white"
                }`}
              >
                Public Events
                {activeTab === "public" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-accent rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab("private")}
                className={`relative px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-colors z-10 ${
                  activeTab === "private" ? "text-black" : "text-white/50 hover:text-white"
                }`}
              >
                Private Hire
                {activeTab === "private" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-accent rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>
        </AnimatedContent>
      </div>

      {/* 2. КОНТЕНТ */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* === PUBLIC EVENTS === */}
          {activeTab === "public" ? (
            <motion.div
              key="public"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* СЕТКА СОБЫТИЙ */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {loading ? (
                   [1, 2, 3].map((n) => (
                      <div key={n} className="h-96 bg-neutral-900/50 animate-pulse border border-white/5 rounded-sm" />
                   ))
                ) : events.length === 0 ? (
                   <div className="col-span-full text-center py-20 text-white/30">
                      <p>No upcoming events found.</p>
                   </div>
                ) : (
                  events.map((event) => {
                    const { day, month, time } = formatDate(event.event_date);
                    
                    return (
                      <Link href={`/events/${event.id}`} key={event.id} className="block h-full">
                          <div 
                            className="group relative bg-neutral-900 border border-white/10 overflow-hidden hover:border-accent/50 transition-colors flex flex-col h-full"
                          >
                            <div className="relative h-64 w-full bg-neutral-800">
                              {event.image ? (
                                  <Image 
                                      src={event.image} 
                                      alt={event.title} 
                                      fill 
                                      className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                                      unoptimized={true}
                                  />
                              ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 text-white/10 font-black text-4xl uppercase">
                                      No Image
                                  </div>
                              )}
                              
                              <div className="absolute top-4 left-4 bg-accent text-black font-bold font-serif px-3 py-2 text-center leading-none border border-black/10 shadow-lg z-10">
                                <span className="block text-sm">{day}</span>
                                <span className="block text-xs uppercase">{month}</span>
                              </div>
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                              <div className="flex justify-between items-start mb-4">
                                <span className="text-accent text-[10px] font-bold uppercase tracking-wider border border-accent/20 px-2 py-1 rounded">
                                  EVENT
                                </span>
                                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                                  {time}
                                </span>
                              </div>
                              
                              <h3 className="font-serif text-2xl font-bold text-white mb-2 group-hover:text-accent transition-colors line-clamp-2">
                                {event.title}
                              </h3>
                              <p className="text-gray-400 text-sm mb-6 line-clamp-3 whitespace-pre-line">
                                {event.description}
                              </p>

                              <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                                <span className="text-white font-bold text-sm">Read More</span>
                                <span className="text-xs font-bold uppercase tracking-widest text-accent group-hover:translate-x-1 transition-transform">
                                  &rarr;
                                </span>
                              </div>
                            </div>
                          </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* КНОПКА LOAD MORE (Показываем только если есть nextPage) */}
              {!loading && nextPage && (
                  <div className="flex justify-center pb-8">
                      <button 
                          onClick={loadMoreEvents}
                          disabled={loadingMore}
                          className="group relative px-8 py-3 bg-neutral-900 border border-white/20 hover:border-accent hover:bg-neutral-800 transition-all disabled:opacity-50"
                      >
                          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white group-hover:text-accent">
                              {loadingMore ? 'Loading...' : 'Load More Archives'}
                              {!loadingMore && <span>&darr;</span>}
                          </span>
                      </button>
                  </div>
              )}

            </motion.div>
          ) : (
            
            /* === PRIVATE HIRE (Без изменений) === */
            <motion.div
              key="private"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="text-center max-w-3xl mb-16">
                <h2 className="font-serif text-3xl text-white mb-4">
                  Your Event, <span className="text-accent italic">Your Rules</span>
                </h2>
                <p className="text-white/60 text-lg leading-relaxed">
                  Whether it is a birthday raid, a corporate dungeon crawl, or just a massive feast with your guild — we have the space and the supplies.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
                {HIRE_PACKAGES.map((pkg, idx) => (
                  <div key={idx} className="bg-neutral-900 border border-white/10 p-8 flex flex-col items-center text-center hover:border-accent/30 transition-colors">
                    <h3 className="font-serif text-2xl font-bold text-accent mb-2">{pkg.title}</h3>
                    <span className="text-white/50 text-xs font-bold uppercase tracking-widest mb-6">{pkg.subtitle}</span>
                    
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="text-gray-300 text-sm">
                          {feat}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-auto pt-4 border-t border-white/5 w-full">
                      <span className="text-white/20 text-xs uppercase">Contact for pricing</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/book">
                <button className="group relative overflow-hidden px-10 py-4 border border-accent bg-accent/10 hover:bg-accent transition-all duration-300">
                  <span className="relative z-10 font-serif font-bold uppercase tracking-[0.2em] text-accent group-hover:text-black transition-colors">
                    Start Your Booking
                  </span>
                </button>
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
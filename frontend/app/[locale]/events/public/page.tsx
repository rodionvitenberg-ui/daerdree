"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl"; // Подключили useLocale

// ОБНОВЛЕНО: Добавили поля *_en в типизацию
interface Event {
  id: number;
  title: string;
  title_en: string | null; 
  description: string;
  description_en: string | null;
  image: string | null;
  event_date: string;
}

export default function PublicEventsPage() {
  const t = useTranslations("PublicEvents");
  const locale = useLocale(); // Получаем текущий язык

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isDev = process.env.NODE_ENV === 'development';

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Nicosia' };
    
    // Форматирование зависит от локали
    const formatLocale = locale === 'ru' ? 'ru-RU' : 'en-US';
    
    const day = new Intl.DateTimeFormat(formatLocale, { ...options, day: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat(formatLocale, { ...options, month: 'short' }).format(date).toUpperCase();
    const time = new Intl.DateTimeFormat(formatLocale, { ...options, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    const weekday = new Intl.DateTimeFormat(formatLocale, { ...options, weekday: 'short' }).format(date).toUpperCase();
    
    const fullDate = date.toISOString().split('T')[0]; 
    
    return { day, month, time, weekday, fullDate };
  };

  const weekDays = useMemo(() => {
    const curr = new Date();
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(curr.setDate(diff));

    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      const { day: d, weekday: w, fullDate: fd } = formatDate(nextDay.toISOString());
      week.push({
        dateObj: nextDay,
        dayNum: d,
        weekday: w,
        fullDate: fd 
      });
    }
    return week;
  }, [locale]); // Добавили locale в зависимости useMemo

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const API_BASE = isDev ? 'http://127.0.0.1:8000' : 'https://daerdree.bar';
        const res = await fetch(`${API_BASE}/api/events/`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setEvents(data.results || []); 
        setNextPage(data.next);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [isDev]);

  const loadMoreEvents = async () => {
    if (!nextPage) return;
    setLoadingMore(true);
    try {
        const res = await fetch(nextPage);
        if (!res.ok) throw new Error('Failed to load more');
        const data = await res.json();
        setEvents((prev) => [...prev, ...data.results]);
        setNextPage(data.next);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        setLoadingMore(false);
    }
  };

  const filteredEvents = selectedDate 
    ? events.filter(e => e.event_date.startsWith(selectedDate))
    : events;

  return (
    <div className="min-h-dvh bg-background pt-32 pb-20 px-4 md:px-8">
      
      {/* --- HEADER BLOCK --- */}
      <div className="container mx-auto mb-16">
        
        {/* 1. Back Button */}
        <div className="text-center mb-8">
            <Link href="/events" className="inline-flex items-center gap-2 text-xs font-bold uppercase text-secondary/30 hover:text-secondary transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                <span>{t("back")}</span>
            </Link>
        </div>

        {/* 2. WEEKLY CALENDAR */}
        <div className="max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-7 border border-white/10 bg-neutral-900/50 backdrop-blur-sm overflow-hidden rounded-sm">
                {weekDays.map((dayItem, index) => {
                    const hasEvent = events.some(e => e.event_date.startsWith(dayItem.fullDate));
                    const isToday = dayItem.fullDate === new Date().toISOString().split('T')[0];
                    const isSelected = selectedDate === dayItem.fullDate;

                    return (
                        <button 
                            key={index}
                            onClick={() => setSelectedDate(isSelected ? null : dayItem.fullDate)}
                            className={`
                                relative flex flex-col items-center justify-center py-4 border-r border-white/5 last:border-r-0 transition-all duration-300 group
                                ${isSelected ? 'bg-accent text-black' : 'hover:bg-white/5'}
                                ${hasEvent && !isSelected ? 'cursor-pointer' : ''}
                            `}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-black/60' : 'text-white/30'}`}>
                                {dayItem.weekday}
                            </span>
                            
                            <span className={`font-serif text-xl font-bold ${isSelected ? 'text-black' : isToday ? 'text-accent' : 'text-white'}`}>
                                {dayItem.dayNum}
                            </span>

                            {hasEvent && (
                                <div className={`absolute bottom-2 w-1 h-1 rounded-full ${isSelected ? 'bg-black' : 'bg-accent shadow-[0_0_8px_rgba(255,215,0,0.8)]'}`} />
                            )}
                            
                            {!isSelected && hasEvent && (
                                <div className="absolute inset-0 border border-accent/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="text-center mt-4">
                 {selectedDate ? (
                     <button onClick={() => setSelectedDate(null)} className="text-xs text-accent hover:underline uppercase tracking-widest">
                         {t("showAll")}
                     </button>
                 ) : (
                     <p className="text-[10px] text-white/20 uppercase tracking-widest">{t("chooseDate")}</p>
                 )}
            </div>
        </div>

        {/* 3. Title */}
        <div className="text-center">
            <h1 className="font-serif text-5xl md:text-7xl font-black uppercase tracking-widest text-accent mb-4">
                {t("title")}
            </h1>
            <p className="font-sans text-white/50 text-lg max-w-2xl mx-auto">
                {t("subtitle")}
            </p>
        </div>
      </div>

      {/* --- EVENTS GRID --- */}
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {loading ? (
                [1, 2, 3].map((n) => <div key={n} className="h-96 bg-neutral-900/50 animate-pulse border border-white/5 rounded-sm" />)
            ) : filteredEvents.length === 0 ? (
                <div className="col-span-full text-center py-20 text-white/30 bg-neutral-900/20 border border-dashed border-white/10 rounded-lg">
                    <p className="font-serif text-2xl mb-2 text-white/50">{t("emptyTitle")}</p>
                    <p className="text-sm">{t("emptyDesc")}</p>
                </div>
            ) : (
                filteredEvents.map((event) => {
                const { day, month, time } = formatDate(event.event_date);
                
                // ОБНОВЛЕНО: Выбираем текст в зависимости от локали
                const displayTitle = locale === 'en' && event.title_en ? event.title_en : event.title;
                const displayDescription = locale === 'en' && event.description_en ? event.description_en : event.description;

                return (
                    <Link href={`/events/${event.id}`} key={event.id} className="block h-full group">
                        <div className="relative bg-neutral-900 border border-white/10 overflow-hidden hover:border-accent/50 transition-colors flex flex-col h-full">
                            <div className="relative h-64 w-full bg-neutral-800">
                                {event.image ? (
                                    <Image src={event.image} alt={displayTitle} fill className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                                ) : <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 text-white/10">{t("noImage")}</div>}
                                <div className="absolute top-4 left-4 bg-accent text-black font-bold font-serif px-3 py-2 text-center leading-none border border-black/10 shadow-lg z-10">
                                    <span className="block text-sm">{day}</span>
                                    <span className="block text-xs uppercase">{month}</span>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-accent text-[10px] font-bold uppercase tracking-wider border border-accent/20 px-2 py-1 rounded">{t("tagEvent")}</span>
                                    <span className="text-white/50 text-xs font-bold uppercase tracking-wider">{time}</span>
                                </div>
                                
                                {/* ОБНОВЛЕНО: Используем displayTitle */}
                                <h3 className="font-serif text-2xl font-bold text-white mb-2 group-hover:text-accent transition-colors line-clamp-2">
                                    {displayTitle}
                                </h3>
                                
                                {/* ОБНОВЛЕНО: Используем displayDescription */}
                                <p className="text-gray-400 text-sm mb-6 line-clamp-3 whitespace-pre-line">
                                    {displayDescription}
                                </p>
                                
                                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between">
                                    <span className="text-white text-sm font-bold">{t("details")}</span>
                                    <span className="text-accent">&rarr;</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
                })
            )}
        </div>

        {!selectedDate && !loading && nextPage && (
            <div className="flex justify-center pb-8">
                <button onClick={loadMoreEvents} disabled={loadingMore} className="px-8 py-3 bg-neutral-900 border border-white/20 hover:border-accent text-white hover:text-accent uppercase font-bold tracking-widest text-xs transition-colors">
                    {loadingMore ? t("loading") : t("loadMore")}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
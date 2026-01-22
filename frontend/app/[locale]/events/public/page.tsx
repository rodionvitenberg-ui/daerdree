"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedContent from "@/components/AnimatedContent";

interface Event {
  id: number;
  title: string;
  description: string;
  image: string | null;
  event_date: string;
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const isDev = process.env.NODE_ENV === 'development';

  // Хелпер даты
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Nicosia' };
    const day = new Intl.DateTimeFormat('en-US', { ...options, day: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat('en-US', { ...options, month: 'short' }).format(date).toUpperCase();
    const time = new Intl.DateTimeFormat('en-US', { ...options, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    return { day, month, time };
  };

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

  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-4 md:px-8">
      
      {/* HEADER */}
      <div className="text-center mb-16">
        <Link href="/events" className="inline-flex items-center gap-5 text-xs font-bold uppercase text-white/30 hover:text-accent transition-colors mb-4">&larr; Back to Hub</Link>
        <h1 className="font-serif text-5xl md:text-7xl font-black uppercase tracking-widest text-accent mb-4">
            Public Quests
        </h1>
        <p className="font-sans text-white/50 text-lg max-w-2xl mx-auto">
            Find your party. Join the raid. No experience required.
        </p>
      </div>

      {/* EVENTS GRID */}
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {loading ? (
                [1, 2, 3].map((n) => <div key={n} className="h-96 bg-neutral-900/50 animate-pulse border border-white/5 rounded-sm" />)
            ) : events.length === 0 ? (
                <div className="col-span-full text-center py-20 text-white/30">
                    <p>No upcoming quests found on the notice board.</p>
                </div>
            ) : (
                events.map((event) => {
                const { day, month, time } = formatDate(event.event_date);
                return (
                    <Link href={`/events/${event.id}`} key={event.id} className="block h-full group">
                        <div className="relative bg-neutral-900 border border-white/10 overflow-hidden hover:border-accent/50 transition-colors flex flex-col h-full">
                            <div className="relative h-64 w-full bg-neutral-800">
                                {event.image ? (
                                    <Image src={event.image} alt={event.title} fill className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" unoptimized />
                                ) : <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 text-white/10">No Image</div>}
                                <div className="absolute top-4 left-4 bg-accent text-black font-bold font-serif px-3 py-2 text-center leading-none border border-black/10 shadow-lg z-10">
                                    <span className="block text-sm">{day}</span>
                                    <span className="block text-xs uppercase">{month}</span>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-accent text-[10px] font-bold uppercase tracking-wider border border-accent/20 px-2 py-1 rounded">EVENT</span>
                                    <span className="text-white/50 text-xs font-bold uppercase tracking-wider">{time}</span>
                                </div>
                                <h3 className="font-serif text-2xl font-bold text-white mb-2 group-hover:text-accent transition-colors line-clamp-2">{event.title}</h3>
                                <p className="text-gray-400 text-sm mb-6 line-clamp-3 whitespace-pre-line">{event.description}</p>
                                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between">
                                    <span className="text-white text-sm font-bold">Details</span>
                                    <span className="text-accent">&rarr;</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
                })
            )}
        </div>

        {!loading && nextPage && (
            <div className="flex justify-center pb-8">
                <button onClick={loadMoreEvents} disabled={loadingMore} className="px-8 py-3 bg-neutral-900 border border-white/20 hover:border-accent text-white hover:text-accent uppercase font-bold tracking-widest text-xs transition-colors">
                    {loadingMore ? 'Loading...' : 'Load More'}
                </button>
            </div>
        )}
      </div>
    </main>
  );
}
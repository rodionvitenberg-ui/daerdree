"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedContent from "@/components/AnimatedContent";
import { EVENTS_DATA, HIRE_PACKAGES } from "@/content/events";

export default function EventsInterface() {
  const [activeTab, setActiveTab] = useState<"public" | "private">("public");
  
  // Трюк для картинок в dev-режиме, который мы обсуждали
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="container mx-auto px-4">

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
              
              {/* Tab: Public */}
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

              {/* Tab: Private */}
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

      {/* 2. КОНТЕНТ (СМЕНА ВКЛАДОК) */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* === ВАРИАНТ 1: ПУБЛИЧНЫЕ ИВЕНТЫ === */}
          {activeTab === "public" ? (
            <motion.div
              key="public"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {EVENTS_DATA.map((event) => (
                <div 
                  key={event.id} 
                  className="group relative bg-neutral-900 border border-white/10 overflow-hidden hover:border-accent/50 transition-colors flex flex-col h-full"
                >
                  {/* Изображение ивента */}
                  <div className="relative h-64 w-full bg-neutral-800">
                    {/* Если картинки нет, показываем заглушку */}
                    {event.image ? (
                        <Image 
                            src={event.image} 
                            alt={event.title} 
                            fill 
                            className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                            unoptimized={isDev}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/10 font-black text-4xl uppercase">
                            Event
                        </div>
                    )}
                    
                    {/* Дата */}
                    <div className="absolute top-4 left-4 bg-accent text-black font-bold font-serif px-3 py-2 text-center leading-none border border-black/10 shadow-lg z-10">
                      <span className="block text-sm">{event.date.split(' ')[0]}</span>
                      <span className="block text-xs uppercase">{event.date.split(' ')[1]}</span>
                    </div>
                  </div>

                  {/* Описание */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-accent text-[10px] font-bold uppercase tracking-wider border border-accent/20 px-2 py-1 rounded">
                        {event.category}
                      </span>
                      <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                        {event.time}
                      </span>
                    </div>
                    
                    <h3 className="font-serif text-2xl font-bold text-white mb-2 group-hover:text-accent transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                      <span className="text-white font-bold">{event.price}</span>
                      <button className="text-xs font-bold uppercase tracking-widest text-accent hover:text-white transition-colors">
                        Join &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            
            /* === ВАРИАНТ 2: АРЕНДА (PRIVATE HIRE) === */
            <motion.div
              key="private"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              {/* Интро */}
              <div className="text-center max-w-3xl mb-16">
                <h2 className="font-serif text-3xl text-white mb-4">
                  Your Event, <span className="text-accent italic">Your Rules</span>
                </h2>
                <p className="text-white/60 text-lg leading-relaxed">
                  Whether it is a birthday raid, a corporate dungeon crawl, or just a massive feast with your guild — we have the space and the supplies.
                </p>
              </div>

              {/* Сетка пакетов */}
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

              {/* Кнопка CTA */}
              <Link href="/book">
                <button className="group relative overflow-hidden px-10 py-4 border border-accent bg-accent/10 hover:bg-accent transition-all duration-300">
                  <span className="relative z-10 font-serif font-bold uppercase tracking-[0.2em] text-accent group-hover:text-black transition-colors">
                    Start Your Booking
                  </span>
                </button>
              </Link>

              {/* Скачать меню */}
              <div className="mt-8">
                 <a href="#" className="text-xs text-white/40 hover:text-white border-b border-white/20 pb-1 transition-colors uppercase tracking-widest">
                    Download Catering Menu (PDF)
                 </a>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
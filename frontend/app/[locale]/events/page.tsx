"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function EventsHub() {
  return (
    <main className="h-screen w-full flex flex-col lg:flex-row bg-black overflow-hidden">
      
      {/* === ЛЕВАЯ СТОРОНА: PUBLIC EVENTS === */}
      <Link href="/events/public" className="group relative flex-1 h-1/2 lg:h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
        {/* Фон */}
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
          <Image
            src="/images/hero/4.webp"
            alt="Public Events"
            fill
            className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Контент */}
        <div className="relative z-10 h-full flex flex-col justify-center p-8 lg:p-16 items-start">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-4"
          >
            Join the Guild
          </motion.span>
          <motion.h2 
            className="font-serif text-4xl lg:text-6xl font-black text-white uppercase tracking-widest mb-6 group-hover:text-accent transition-colors"
          >
            Public<br/>Quests
          </motion.h2>
          <p className="text-white max-w-md text-sm lg:text-lg mb-6 lg:mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
            Open gaming nights, mafia, tournaments, and lore evenings.
            Find your party and join the adventure.
          </p>

          {/* ГРАДИЕНТНАЯ КНОПКА (LEFT) */}
          <div className="relative overflow-hidden px-10 py-5 lg:px-8 lg:py-4 transition-all duration-300 flex-shrink-0 flex items-center justify-center">
            {/* 1. Градиент (На мобилке виден всегда, на десктопе при ховере) */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent to-accent opacity-100 lg:opacity-0 transition-opacity duration-500 lg:group-hover:opacity-100" />
            
            {/* 2. Бордер (На мобилке скрыт, на десктопе исчезает при ховере) */}
            <div className="absolute inset-0 border border-white/30 opacity-0 lg:opacity-100 transition-opacity duration-300 lg:group-hover:opacity-0" />
            
            {/* 3. Текст (Черный на мобилке, белый на десктопе и чернеет при ховере) */}
            <span className="relative z-10 font-serif text-xs font-bold uppercase tracking-widest text-black lg:text-white transition-colors duration-300 lg:group-hover:text-black">
              Check Calendar
            </span>
          </div>

        </div>
      </Link>

      {/* === ПРАВАЯ СТОРОНА: PRIVATE HIRE === */}
      <Link href="/events/private" className="group relative flex-1 h-1/2 lg:h-full overflow-hidden">
        {/* Фон */}
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
          <Image
            src="/images/hero/7.webp"
            alt="Private Hire"
            fill
            className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-l from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Контент */}
        <div className="relative z-10 h-full flex flex-col justify-center p-8 lg:p-16 items-end text-right">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-4"
          >
            All Inclusive
          </motion.span>
          <motion.h2 
            className="font-serif text-4xl lg:text-6xl font-black text-white uppercase tracking-widest mb-6 group-hover:text-accent transition-colors"
          >
            Private<br/>Saga
          </motion.h2>
          <p className="text-white max-w-md text-sm lg:text-lg mb-6 lg:mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
            Corporate events, birthdays, and closed gatherings. 
            <br/>Food, Game Master, and epic atmosphere included.
          </p>
          
          {/* ГРАДИЕНТНАЯ КНОПКА (RIGHT) */}
          <div className="relative overflow-hidden px-10 py-5 lg:px-8 lg:py-4 transition-all duration-300 flex-shrink-0 flex items-center justify-center">
            {/* 1. Градиент (На мобилке виден всегда, на десктопе при ховере) */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent to-accent opacity-100 lg:opacity-0 transition-opacity duration-500 lg:group-hover:opacity-100" />
            
            {/* 2. Бордер (На мобилке скрыт, на десктопе исчезает при ховере) */}
            <div className="absolute inset-0 border border-white/30 opacity-0 lg:opacity-100 transition-opacity duration-300 lg:group-hover:opacity-0" />
            
            {/* 3. Текст (Черный на мобилке, белый на десктопе и чернеет при ховере) */}
            <span className="relative z-10 font-serif text-xs font-bold uppercase tracking-widest text-black lg:text-white transition-colors duration-300 lg:group-hover:text-black">
              Explore Options
            </span>
          </div>

        </div>
      </Link>

    </main>
  );
}
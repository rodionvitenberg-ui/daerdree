"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function EventsHub() {
  return (
    <main className="h-screen w-full flex flex-col lg:flex-row bg-black pt-20 lg:pt-0 overflow-hidden">
      
      {/* === ЛЕВАЯ СТОРОНА: PUBLIC EVENTS (Теперь здесь) === */}
      <Link href="/events/public" className="group relative flex-1 h-1/2 lg:h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
        {/* Фон */}
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
          <Image
            src="/images/hero/4.webp" // Фото для паблик ивентов
            alt="Public Events"
            fill
            className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
          />
          {/* Градиент слева направо (для левой колонки) */}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Контент (Выравнивание влево - items-start) */}
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
          <p className="text-white/60 max-w-md text-sm lg:text-lg mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
            Open gaming nights, mafia, tournaments, and lore evenings.
            <br/>Find your party and join the adventure.
          </p>

          <span className="inline-block border border-white/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white group-hover:bg-accent group-hover:border-accent group-hover:text-black transition-all">
            Check Calendar &rarr;
          </span>
        </div>
      </Link>

      {/* === ПРАВАЯ СТОРОНА: PRIVATE HIRE (Теперь здесь) === */}
      <Link href="/events/private" className="group relative flex-1 h-1/2 lg:h-full overflow-hidden">
        {/* Фон */}
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
          <Image
            src="/images/hero/7.webp" // Фото стола/привата
            alt="Private Hire"
            fill
            className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
          />
          {/* Градиент справа налево (для правой колонки) */}
          <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-l from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Контент (Выравнивание вправо - items-end) */}
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
          <p className="text-white/60 max-w-md text-sm lg:text-lg mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
            Corporate events, birthdays, and closed gatherings. 
            <br/>Food, Game Master, and epic atmosphere included.
          </p>
          
          <span className="inline-block border border-white/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white group-hover:bg-accent group-hover:border-accent group-hover:text-black transition-all">
            Explore Options &rarr;
          </span>
        </div>
      </Link>

    </main>
  );
}
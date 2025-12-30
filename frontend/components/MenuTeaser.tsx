"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AnimatedContent from "./AnimatedContent";
import { MENU_CONTENT } from "@/content/home"; // <--- Импортируем данные

export default function MenuTeaser() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-background py-20 md:h-screen md:py-0 ">
      
      {/* ==============================
          1. ФОНОВЫЙ ДРАКОН (MOBILE)
         ============================== */}
      <div className="absolute inset-0 z-0 opacity-20 md:hidden">
        <Image
          src={MENU_CONTENT.imageMobile} // Берем из home.ts
          alt="Menu Background" 
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="container mx-auto flex h-full flex-col items-center md:flex-row md:justify-center md:gap-16">
        <div className="hidden md:block relative w-[400px] h-[500px] lg:w-[600px] lg:h-[750px] shrink-0 transition-transform duration-700">
          
          {/* Свечение за драконом (опционально) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600%] h-[20%] bg-accent/10 blur-[80px] rounded-full" />
          
          <Image
            src={MENU_CONTENT.imageDesktop} // Берем из home.ts
            alt="Dragon Tequila"
            fill // Растягивается на весь родительский блок (500x600)
            className="object-contain drop-shadow-2xl" // object-contain: покажет картинку целиком, не обрезая края
            priority // Грузим быстро, так как это важный элемент
          />
        </div>

        {/* ==============================
            3. ТЕКСТОВАЯ ЧАСТЬ
           ============================== */}
        <div className="relative z-10 flex h-full flex-col justify-center px-4 text-center md:max-w-xl">
          
          <div className="flex flex-col gap-6">
            
            {/* ЗАГОЛОВОК */}
            <AnimatedContent
              key={isMobile ? "mobile-title" : "desktop-title"}
              distance={150}
              direction={isMobile ? "vertical" : "vertical"}
              reverse={false}
              duration={1.0}
              ease="ease.out"
              initialOpacity={0}
              animateOpacity
              threshold={0.1}
            >
              <h2 className="font-serif text-4xl font-bold uppercase tracking-widest text-foreground md:text-6xl lg:text-7xl">
                {/* Разбиваем заголовок, чтобы выделить слово цветом, если нужно */}
                {MENU_CONTENT.title.replace(MENU_CONTENT.highlightWord, "")} 
                <span className="text-accent">{MENU_CONTENT.highlightWord}</span>
              </h2>
            </AnimatedContent>

            {/* ОПИСАНИЕ */}
            <AnimatedContent
              key={isMobile ? "mobile-desc" : "desktop-desc"}
              distance={200}
              direction={isMobile ? "vertical" : "vertical"}
              reverse={false}
              duration={1.2}
              delay={0.2}
              ease="ease.out"
              initialOpacity={0}
              animateOpacity
              threshold={0.1}
            >
              <p className="font-sans text-lg leading-relaxed text-foreground/80 md:text-xl">
                {MENU_CONTENT.description}
              </p>
            </AnimatedContent>

            {/* КНОПКА */}
            <div className="mt-8 flex justify-center w-full">
              <Link href="/menu">
          <button className="group relative overflow-hidden px-10 py-4 md:px-8 md:py-3 border border-accent transition-all duration-300">
           <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-600 to-accent-600 opacity-0 transition-opacity duration-500 group-hover:opacity-80" />
            <span className="relative z-10 font-serif font-bold uppercase tracking-[0.2em] text-secondary text-sm md:text-base">
             {MENU_CONTENT.buttonText}
            </span>
          </button>
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EVENTS_GALLERY } from "@/content/home"; // Оставили только галерею
import AnimatedContent from "./AnimatedContent"; 
import { useTranslations } from "next-intl"; // Подключили хук

gsap.registerPlugin(ScrollTrigger);

export default function EventsMasonry() {
  const t = useTranslations("EventsMasonry"); // Инициализировали переводы
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Анимируем внешний контейнер карточки
      const cards = gsap.utils.toArray(".masonry-card");
      
      gsap.fromTo(
        cards,
        { 
          y: 50, 
          opacity: 0,
          scale: 0.9 
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: {
            amount: 1.5,
            grid: "auto",
            from: "random"
          },
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-20 bg-background overflow-x-clip w-full max-w-full">
      <div className="container mx-auto px-4">
        
        {/* === ЗАГОЛОВОК === */}
        <div className="mb-10 text-center flex flex-col items-center">
          <AnimatedContent
            distance={100}
            direction="vertical"
            reverse={false}
            duration={1.0}
            ease="ease.out"
            initialOpacity={0}
            animateOpacity
            threshold={0.2}
          >
            <h2 className="font-serif text-3xl md:text-5xl font-bold uppercase tracking-widest text-secondary mb-2">
              {t("title")}
            </h2>
          </AnimatedContent>

          <AnimatedContent
            distance={100}
            direction="vertical"
            reverse={false}
            duration={1.0}
            delay={0.2} 
            ease="ease.out"
            initialOpacity={0}
            animateOpacity
            threshold={0.2}
          >
            <p className="text-white/50 font-sans text-sm md:text-base">
              {t("subtitle")}
            </p>
          </AnimatedContent>
        </div>

        {/* === СЕТКА === */}
        <div 
          ref={containerRef}
          className="columns-2 md:columns-4 lg:columns-6 gap-2 space-y-2"
        >
          {EVENTS_GALLERY.map((item, index) => (
            <div 
              key={index} 
              className="masonry-card break-inside-avoid relative mb-2"
            >
              <div className="relative w-full h-full overflow-hidden bg-neutral-800 group cursor-pointer">
                
                <div className={`relative w-full ${item.height === 'tall' ? 'aspect-[3/5]' : 'aspect-square'}`}>
                  <Image
                    src={item.src}
                    alt={t(`gallery.${item.id}`)} // Берем название из словаря для alt
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 16vw"
                  />
                </div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600%] h-[20%] bg-accent/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10 pointer-events-none">
                    <span className="font-serif text-white font-bold text-sm tracking-wider bg-black/50 px-2 py-1">
                      {t(`gallery.${item.id}`)} {/* Берем название из словаря для UI */}
                    </span>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}